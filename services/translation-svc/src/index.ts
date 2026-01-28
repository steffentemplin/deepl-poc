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

/**
 * Start the gRPC server
 */
async function startServer(): Promise<void> {
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

  server.bindAsync(
    address,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('Failed to bind server:', error);
        process.exit(1);
      }
      console.log(`Translation service listening on port ${port}`);
    }
  );

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    server.tryShutdown(async () => {
      await disconnectKafkaProducer();
      console.log('Server stopped');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
