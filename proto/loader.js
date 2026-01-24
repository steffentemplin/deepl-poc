// @ts-check
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {protoLoader.Options} */
const PROTO_LOADER_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

/**
 * Load the translation.proto definition
 * @returns {import('./generated/translation.js').ProtoGrpcType}
 */
export function loadTranslationProto() {
  const packageDefinition = protoLoader.loadSync(
    join(__dirname, 'translation.proto'),
    PROTO_LOADER_OPTIONS
  );
  return /** @type {any} */ (grpc.loadPackageDefinition(packageDefinition));
}

/**
 * Load the history.proto definition
 * @returns {import('./generated/history.js').ProtoGrpcType}
 */
export function loadHistoryProto() {
  const packageDefinition = protoLoader.loadSync(
    join(__dirname, 'history.proto'),
    PROTO_LOADER_OPTIONS
  );
  return /** @type {any} */ (grpc.loadPackageDefinition(packageDefinition));
}

/**
 * Load all proto definitions
 */
export function loadProtos() {
  return {
    translation: loadTranslationProto(),
    history: loadHistoryProto(),
  };
}

// Re-export grpc for convenience
export { grpc };
