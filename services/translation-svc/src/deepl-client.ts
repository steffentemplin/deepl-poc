import * as deepl from 'deepl-node';
import { config } from './config.js';

let translator: deepl.Translator | null = null;

/**
 * Initialize the DeepL translator client
 */
export function initDeepLClient(): void {
  translator = new deepl.Translator(config.deepl.apiKey);
}

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage: string;
}

/**
 * Translate text using DeepL API
 */
export async function translateText(
  text: string,
  targetLanguage: string
): Promise<TranslationResult> {
  if (!translator) {
    throw new Error('DeepL client not initialized');
  }

  const result = await translator.translateText(
    text,
    null, // auto-detect source language
    targetLanguage as deepl.TargetLanguageCode
  );

  // Handle both single result and array (batch translation)
  const translationResult = Array.isArray(result) ? result[0] : result;

  return {
    translatedText: translationResult.text,
    detectedSourceLanguage: translationResult.detectedSourceLang,
  };
}
