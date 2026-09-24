// The typed client for github-sync-api, this app's one dependency for every
// screen's data. Same-origin `/api`: nginx (production) or MSW (mock mode)
// resolves it from there — never a window._env_ URL, which the platform does
// not emit for a sibling component-kind service.
//
// Authorization is entirely src/authz/client.ts's: this middleware only calls
// authorizationHeader() / classifyResponse() and adds nothing of its own.
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/github-sync-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const githubSyncApi = createClient<paths>({ baseUrl: "/api" });
githubSyncApi.use(authMiddleware);
