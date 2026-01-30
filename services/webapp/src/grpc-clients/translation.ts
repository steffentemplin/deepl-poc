import * as grpc from '@grpc/grpc-js';
import { loadTranslationProto } from '@deepl-poc/proto/loader';
import type { TranslationServiceClient } from '@deepl-poc/proto/translator/TranslationService';
import type { TranslateResponse } from '@deepl-poc/proto/translator/TranslateResponse';
import type { GetSupportedLanguagesResponse } from '@deepl-poc/proto/translator/GetSupportedLanguagesResponse';
import { config } from '../config.js';

let client: TranslationServiceClient;

export function initTranslationClient(): void {
  const proto = loadTranslationProto();
  client = new proto.translator.TranslationService(
    config.translationSvc.address,
    grpc.credentials.createInsecure()
  ) as unknown as TranslationServiceClient;
  console.log(`gRPC client connected to ${config.translationSvc.address}`);
}

export function translate(
  text: string,
  targetLanguage: string,
  userId: string
): Promise<TranslateResponse> {
  return new Promise((resolve, reject) => {
    client.Translate(
      { text, target_language: targetLanguage, user_id: userId },
      (err, response) => {
        if (err) return reject(err);
        resolve(response!);
      }
    );
  });
}

export function getSupportedLanguages(): Promise<GetSupportedLanguagesResponse> {
  return new Promise((resolve, reject) => {
    client.GetSupportedLanguages({}, (err, response) => {
      if (err) return reject(err);
      resolve(response!);
    });
  });
}
