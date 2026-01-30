import { Router } from 'express';
import { config } from '../config.js';

export const configRouter = Router();

/**
 * Public endpoint that exposes Keycloak settings to the frontend.
 * This avoids hardcoding URLs/client IDs in the browser bundle.
 */
configRouter.get('/api/config', (_req, res) => {
  res.json({
    keycloak: {
      url: config.keycloak.url,
      realm: config.keycloak.realm,
      clientId: config.keycloak.clientId,
    },
  });
});
