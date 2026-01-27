import { Kafka, Producer } from 'kafkajs';
import { config } from './config.js';

let producer: Producer | null = null;

/**
 * Initialize Kafka producer and connect
 */
export async function initKafkaProducer(): Promise<void> {
  const kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
  });

  producer = kafka.producer();
  await producer.connect();
  console.log('Kafka producer connected');
}

/**
 * Disconnect Kafka producer
 */
export async function disconnectKafkaProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  }
}

export interface TranslationEvent {
  user_id: string | null;
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  timestamp: string;
}

/**
 * Publish a translation event to Kafka
 */
export async function publishTranslation(
  event: TranslationEvent
): Promise<void> {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }

  const key = event.user_id ?? 'anonymous';

  await producer.send({
    topic: config.kafka.topic,
    messages: [
      {
        key,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log(`Published translation event for user: ${key}`);
}
