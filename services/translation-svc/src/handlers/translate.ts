import * as grpc from '@grpc/grpc-js';
import type { TranslateRequest__Output } from '@deepl-poc/proto/translator/TranslateRequest';
import type { TranslateResponse } from '@deepl-poc/proto/translator/TranslateResponse';
import { translateText } from '../deepl-client.js';
import { publishTranslation } from '../kafka-producer.js';

/**
 * gRPC handler for Translate RPC
 */
export async function handleTranslate(
  call: grpc.ServerUnaryCall<TranslateRequest__Output, TranslateResponse>,
  callback: grpc.sendUnaryData<TranslateResponse>
): Promise<void> {
  const { text, target_language, user_id } = call.request;

  console.log(
    `Translate request: text="${text.substring(0, 50)}...", target=${target_language}, user=${user_id || 'anonymous'}`
  );

  try {
    // Validate request
    if (!text || text.trim() === '') {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Text is required',
      });
      return;
    }

    if (!target_language || target_language.trim() === '') {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Target language is required',
      });
      return;
    }

    // Call DeepL API
    const result = await translateText(text, target_language);

    // Publish to Kafka (fire and forget, don't block response)
    publishTranslation({
      user_id: user_id || null,
      source_text: text,
      translated_text: result.translatedText,
      source_language: result.detectedSourceLanguage,
      target_language,
      timestamp: new Date().toISOString(),
    }).catch((error) => {
      console.error('Failed to publish translation to Kafka:', error);
    });

    // Return response
    callback(null, {
      translated_text: result.translatedText,
      detected_source_language: result.detectedSourceLanguage,
      target_language,
    });
  } catch (error) {
    console.error('Translation failed:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : 'Translation failed',
    });
  }
}
