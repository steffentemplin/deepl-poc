import { Router } from 'express';
import { optionalAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { translate } from '../grpc-clients/translation.js';

export const translateRouter = Router();

translateRouter.post('/api/translate', optionalAuth, async (req: AuthenticatedRequest, res) => {
  const { text, targetLanguage } = req.body;

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  if (!targetLanguage || typeof targetLanguage !== 'string') {
    res.status(400).json({ error: 'targetLanguage is required' });
    return;
  }

  try {
    const result = await translate(text, targetLanguage, req.userId ?? '');
    res.json({
      translatedText: result.translated_text,
      detectedSourceLanguage: result.detected_source_language,
      targetLanguage: result.target_language,
    });
  } catch (err) {
    console.error('Translation failed:', err);
    res.status(502).json({ error: 'Translation service unavailable' });
  }
});
