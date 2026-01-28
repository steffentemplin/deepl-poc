import * as grpc from '@grpc/grpc-js';
import type { GetSupportedLanguagesRequest__Output } from '@deepl-poc/proto/translator/GetSupportedLanguagesRequest';
import type { GetSupportedLanguagesResponse } from '@deepl-poc/proto/translator/GetSupportedLanguagesResponse';
import { getTargetLanguages } from '../deepl-client.js';

/**
 * gRPC handler for GetSupportedLanguages RPC
 */
export async function handleGetSupportedLanguages(
  call: grpc.ServerUnaryCall<GetSupportedLanguagesRequest__Output, GetSupportedLanguagesResponse>,
  callback: grpc.sendUnaryData<GetSupportedLanguagesResponse>
): Promise<void> {
  console.log('GetSupportedLanguages request');

  try {
    const languages = await getTargetLanguages();

    callback(null, { languages });
  } catch (error) {
    console.error('GetSupportedLanguages failed:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : 'Failed to get supported languages',
    });
  }
}
