// window._env_ for mock mode — exactly the keys the platform actually emits
// for this component: this app's own USER_AUTH_* OIDC keys. No sibling API
// URL (same-origin /api, resolved by MSW) and no USER_AUTH_JWKS_URL (the
// browser never validates a token; src/env.ts does not declare it either).
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  USER_AUTH_SCOPES:
    "openid profile email group ou " +
    "github-connection:read github-connection:manage " +
    "watched-repositories:read watched-repositories:manage " +
    "chat-destination:read chat-destination:manage " +
    "notifications:read",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/sync-github-issues",
};
