import * as grpc from '@grpc/grpc-js';
import { loadTranslationProto } from '@deepl-poc/proto/loader';
import type { TranslationServiceHandlers } from '@deepl-poc/proto/translator/TranslationService';
import { config, validateConfig } from './config.js';
import { initDeepLClient } from './deepl-client.js';
import {
  initKafkaProducer,
  disconnectKafkaProducer,
} from './kafka-producer.js';
import { handleTranslate } from './handlers/translate.js';
import { handleGetSupportedLanguages } from './handlers/get-supported-languages.js';

export interface ServerHandle {
  server: grpc.Server;
  shutdown: () => Promise<void>;
}

/**
 * Start the gRPC server
 */
export async function startServer(): Promise<ServerHandle> {
  // Validate configuration
  validateConfig();

  // Initialize clients
  initDeepLClient();
  await initKafkaProducer();

  // Load proto definition
  const proto = loadTranslationProto();

  // Create gRPC server
  const server = new grpc.Server();

  // Register service handlers
  const handlers: TranslationServiceHandlers = {
    Translate: handleTranslate,
    GetSupportedLanguages: handleGetSupportedLanguages,
  };

  server.addService(proto.translator.TranslationService.service, handlers);

  // Start server
  const address = `${config.grpc.host}:${config.grpc.port}`;

  await new Promise<void>((resolve, reject) => {
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          reject(error);
          return;
        }
        console.log(`Translation service listening on port ${port}`);
        resolve();
      }
    );
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await new Promise<void>((resolve) => {
      server.tryShutdown(() => resolve());
    });
    await disconnectKafkaProducer();
    console.log('Server stopped');
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { server, shutdown };
}
