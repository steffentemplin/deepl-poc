import * as grpc from '@grpc/grpc-js';
import type { ProtoGrpcType as TranslationProtoType } from './generated/translation.js';
import type { ProtoGrpcType as HistoryProtoType } from './generated/history.js';

/**
 * Load the translation.proto definition
 */
export function loadTranslationProto(): TranslationProtoType;

/**
 * Load the history.proto definition
 */
export function loadHistoryProto(): HistoryProtoType;

/**
 * Load all proto definitions
 */
export function loadProtos(): {
  translation: TranslationProtoType;
  history: HistoryProtoType;
};

export { grpc };
export type { TranslationProtoType, HistoryProtoType };
