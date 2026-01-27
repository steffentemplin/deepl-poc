/**
 * Configuration loaded from environment variables
 */
export const config = {
  grpc: {
    host: process.env.GRPC_HOST ?? '0.0.0.0',
    port: parseInt(process.env.GRPC_PORT ?? '50051', 10),
  },
  deepl: {
    apiKey: process.env.DEEPL_API_KEY ?? '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    topic: process.env.KAFKA_TOPIC ?? 'translations',
    clientId: process.env.KAFKA_CLIENT_ID ?? 'translation-svc',
  },
} as const;

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  if (!config.deepl.apiKey) {
    throw new Error('DEEPL_API_KEY environment variable is required');
  }
}
