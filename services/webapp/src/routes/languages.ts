import { Router } from 'express';
import { getSupportedLanguages } from '../grpc-clients/translation.js';

export const languagesRouter = Router();

languagesRouter.get('/api/languages', async (_req, res) => {
  try {
    const result = await getSupportedLanguages();
    res.json(result.languages);
  } catch (err) {
    console.error('Failed to get languages:', err);
    res.status(502).json({ error: 'Translation service unavailable' });
  }
});
