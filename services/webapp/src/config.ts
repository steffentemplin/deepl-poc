export const config = {
  port: parseInt(process.env.PORT ?? '8080', 10),
  translationSvc: {
    address: process.env.TRANSLATION_SVC_ADDRESS ?? 'localhost:50051',
  },
  keycloak: {
    url: process.env.KEYCLOAK_URL ?? 'http://localhost:8180',
    realm: process.env.KEYCLOAK_REALM ?? 'translator-app',
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'translator-frontend',
    issuer:
      process.env.KEYCLOAK_ISSUER ??
      'http://localhost:8180/realms/translator',
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ??
      'http://localhost:8180/realms/translator/protocol/openid-connect/certs',
  },
} as const;
