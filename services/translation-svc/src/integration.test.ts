import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

// --- Constants ---
const KAFKA_CONTAINER_NAME = 'translation-svc-test-kafka';
const KAFKA_PORT = 19092;
const GRPC_PORT = 50199;
const KAFKA_TOPIC = 'translations';

// --- Mock deepl-node before any service imports ---
const mockTranslateText = mock.fn(async () => ({
  text: 'Hallo',
  detectedSourceLang: 'EN',
}));

const mockGetTargetLanguages = mock.fn(async () => [
  { code: 'DE', name: 'German' },
  { code: 'FR', name: 'French' },
  { code: 'ES', name: 'Spanish' },
]);

mock.module('deepl-node', {
  namedExports: {
    Translator: class MockTranslator {
      translateText = mockTranslateText;
      getTargetLanguages = mockGetTargetLanguages;
    },
  },
  defaultExport: {
    Translator: class MockTranslator {
      translateText = mockTranslateText;
      getTargetLanguages = mockGetTargetLanguages;
    },
  },
});

// --- Set env vars before importing service modules ---
process.env.DEEPL_API_KEY = 'mock-key';
process.env.KAFKA_BROKERS = `localhost:${KAFKA_PORT}`;
process.env.GRPC_PORT = String(GRPC_PORT);
process.env.KAFKA_TOPIC = KAFKA_TOPIC;

// --- Lazy imports (loaded after mock is set up) ---
let grpc: typeof import('@grpc/grpc-js');
let loadTranslationProto: typeof import('@deepl-poc/proto/loader').loadTranslationProto;
let startServer: typeof import('./server.js').startServer;
let serverHandle: import('./server.js').ServerHandle;

let client: any;
let kafka: any; // KafkaJS instance for consuming

// --- Helpers ---

function startKafkaContainer(): void {
  // Remove any leftover container
  try {
    execSync(`podman rm -f ${KAFKA_CONTAINER_NAME}`, { stdio: 'ignore' });
  } catch {
    // ignore
  }

  execSync(
    `podman run -d --name ${KAFKA_CONTAINER_NAME} ` +
      `-p ${KAFKA_PORT}:${KAFKA_PORT} ` +
      `-e KAFKA_NODE_ID=1 ` +
      `-e KAFKA_PROCESS_ROLES=broker,controller ` +
      `-e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 ` +
      `-e KAFKA_LISTENERS=PLAINTEXT://:${KAFKA_PORT},CONTROLLER://:9093 ` +
      `-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:${KAFKA_PORT} ` +
      `-e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT ` +
      `-e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER ` +
      `-e KAFKA_INTER_BROKER_LISTENER_NAME=PLAINTEXT ` +
      `-e CLUSTER_ID=test-cluster-id-12345 ` +
      `-e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 ` +
      `-e KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0 ` +
      `docker.io/apache/kafka:3.7.0`,
    { stdio: 'ignore' }
  );
}

function stopKafkaContainer(): void {
  try {
    execSync(`podman rm -f ${KAFKA_CONTAINER_NAME}`, { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

async function waitForKafka(maxRetries = 30, delayMs = 2000): Promise<void> {
  const { Kafka } = await import('kafkajs');
  const k = new Kafka({ clientId: 'test-wait', brokers: [`localhost:${KAFKA_PORT}`] });
  const admin = k.admin();

  for (let i = 0; i < maxRetries; i++) {
    try {
      await admin.connect();
      await admin.listTopics();
      // Pre-create the translations topic
      await admin.createTopics({
        topics: [{ topic: KAFKA_TOPIC, numPartitions: 1, replicationFactor: 1 }],
      });
      // Wait for group coordinator to become available by polling
      let coordinatorReady = false;
      for (let j = 0; j < 20; j++) {
        try {
          await admin.describeGroups(['test-warmup']);
          coordinatorReady = true;
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      await admin.disconnect();
      if (!coordinatorReady) {
        throw new Error('Group coordinator not ready');
      }
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Kafka did not become ready');
}

function makeUnaryCall<Req, Res>(method: string, request: Req): Promise<Res> {
  return new Promise((resolve, reject) => {
    client[method](request, (err: any, response: Res) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

// --- Test Suite ---

describe('Translation Service Integration', { timeout: 120_000 }, () => {
  before(async () => {
    // 1. Start Kafka
    startKafkaContainer();
    await waitForKafka();

    // 2. Import modules (after mock & env setup)
    grpc = await import('@grpc/grpc-js');
    const protoLoader = await import('@deepl-poc/proto/loader');
    loadTranslationProto = protoLoader.loadTranslationProto;

    const serverModule = await import('./server.js');
    startServer = serverModule.startServer;

    // 3. Start the server (initializes DeepL client, Kafka producer, gRPC server)
    serverHandle = await startServer();

    // 4. Create gRPC client
    const proto = loadTranslationProto();
    const ServiceClient = proto.translator.TranslationService;
    client = new ServiceClient(
      `localhost:${GRPC_PORT}`,
      grpc.credentials.createInsecure()
    );

    // 5. Set up Kafka consumer for verification
    const { Kafka } = await import('kafkajs');
    kafka = new Kafka({ clientId: 'test-consumer', brokers: [`localhost:${KAFKA_PORT}`] });
  });

  after(async () => {
    // Close client
    if (client) {
      client.close();
    }

    // Shutdown server (stops gRPC server + disconnects Kafka producer)
    if (serverHandle) {
      await serverHandle.shutdown();
    }

    // Stop Kafka container
    stopKafkaContainer();
  });

  it('Translate RPC returns translated text', async () => {
    const response = await makeUnaryCall('Translate', {
      text: 'Hello',
      target_language: 'DE',
      user_id: 'test-user',
    });

    assert.deepStrictEqual(response, {
      translated_text: 'Hallo',
      detected_source_language: 'EN',
      target_language: 'DE',
    });
  });

  it('Translate RPC publishes Kafka event', async () => {
    // Wait for the topic to exist
    const admin = kafka.admin();
    await admin.connect();

    let topicExists = false;
    for (let i = 0; i < 15; i++) {
      const topics = await admin.listTopics();
      if (topics.includes(KAFKA_TOPIC)) {
        topicExists = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    assert.ok(topicExists, 'Topic should exist');

    // Also wait for __consumer_offsets to be ready by checking offsets
    let latestOffset = 0;
    for (let i = 0; i < 10; i++) {
      try {
        const offsets = await admin.fetchTopicOffsets(KAFKA_TOPIC);
        latestOffset = parseInt(offsets[0].offset, 10);
        if (latestOffset > 0) break;
      } catch {
        // topic metadata not ready yet
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    assert.ok(latestOffset > 0, 'Expected at least one message in topic');

    // Wait for group coordinator to become available
    // by creating __consumer_offsets topic via a dummy consumer group join attempt
    for (let i = 0; i < 10; i++) {
      try {
        const topics = await admin.listTopics();
        if (topics.includes('__consumer_offsets')) break;
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    await admin.disconnect();

    // Read messages using a consumer with retry
    const groupId = 'test-verify-' + Date.now();
    const consumer = kafka.consumer({
      groupId,
      retry: { retries: 10, initialRetryTime: 1000 },
    });
    await consumer.connect();
    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });

    const messages: any[] = [];
    const consumePromise = new Promise<void>((resolve) => {
      consumer.run({
        eachMessage: async ({ message }: any) => {
          messages.push(JSON.parse(message.value!.toString()));
          if (messages.length >= latestOffset) resolve();
        },
      });
    });

    await Promise.race([
      consumePromise,
      new Promise<void>((r) => setTimeout(r, 30000)),
    ]);
    await consumer.disconnect();

    assert.ok(messages.length > 0, 'Expected at least one Kafka message');
    const event = messages[0];
    assert.equal(event.source_text, 'Hello');
    assert.equal(event.translated_text, 'Hallo');
    assert.equal(event.source_language, 'EN');
    assert.equal(event.target_language, 'DE');
    assert.equal(event.user_id, 'test-user');
    assert.ok(event.timestamp);
  });

  it('Translate RPC rejects empty text', async () => {
    await assert.rejects(
      () => makeUnaryCall('Translate', { text: '', target_language: 'DE' }),
      (err: any) => {
        assert.equal(err.code, 3); // INVALID_ARGUMENT
        assert.match(err.details, /Text is required/);
        return true;
      }
    );
  });

  it('Translate RPC rejects empty target_language', async () => {
    await assert.rejects(
      () => makeUnaryCall('Translate', { text: 'Hello', target_language: '' }),
      (err: any) => {
        assert.equal(err.code, 3); // INVALID_ARGUMENT
        assert.match(err.details, /Target language is required/);
        return true;
      }
    );
  });

  it('GetSupportedLanguages RPC returns language list', async () => {
    const response: any = await makeUnaryCall('GetSupportedLanguages', {});

    assert.equal(response.languages.length, 3);
    assert.deepStrictEqual(response.languages[0], { code: 'DE', name: 'German' });
    assert.deepStrictEqual(response.languages[1], { code: 'FR', name: 'French' });
    assert.deepStrictEqual(response.languages[2], { code: 'ES', name: 'Spanish' });
  });
});
