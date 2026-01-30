import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';
import { config } from './config.js';
import { initTranslationClient } from './grpc-clients/translation.js';
import { configRouter } from './routes/config.js';
import { languagesRouter } from './routes/languages.js';
import { translateRouter } from './routes/translate.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function startServer(): Promise<void> {
  initTranslationClient();

  const app = express();
  app.use(express.json());

  // API routes
  app.use(configRouter);
  app.use(languagesRouter);
  app.use(translateRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Static files — prefer dist/public (production build), fall back to public/ (dev)
  const distPublic = resolve(__dirname, '../dist/public');
  const devPublic = resolve(__dirname, '../public');
  const staticDir = existsSync(distPublic) ? distPublic : devPublic;
  app.use(express.static(staticDir));

  // SPA fallback — serve index.html for non-API GET routes
  app.get('*', (_req, res) => {
    res.sendFile(join(staticDir, 'index.html'));
  });

  app.listen(config.port, () => {
    console.log(`Webapp listening on http://localhost:${config.port}`);
  });
}
