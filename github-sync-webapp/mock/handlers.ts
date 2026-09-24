// One handler per operation in specs/design/components/github-sync-api/openapi.yaml,
// the same contract src/generated/github-sync-api.ts came from. State lives in
// module scope, reset on every full page load — a create shows up in the next
// list, a delete removes it, an edit persists, but only across IN-APP
// navigation (setupWorker resolves every request in the page's own JS
// context). Seeded to match the wireframe's own example rows so the running
// screen agrees with the rendered wireframe.
//
// NO scope check here — mock/authz/gateway.ts already answered "may this
// caller call this operation at all", read from the same contract, before a
// request reaches these handlers. What a handler owes is its path's reach:
// none of this API's paths sit under /me/, so every handler answers every row.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/github-sync-api";

type GithubConnection = components["schemas"]["GithubConnection"];
type WatchedRepository = components["schemas"]["WatchedRepository"];
type ChatDestination = components["schemas"]["ChatDestination"];
type Notification = components["schemas"]["Notification"];

const now = Date.now();
const minutes = (n: number) => new Date(now - n * 60_000).toISOString();
const hours = (n: number) => new Date(now - n * 60 * 60_000).toISOString();
const days = (n: number) => new Date(now - n * 24 * 60 * 60_000).toISOString();

let connection: GithubConnection = {
  connected: false,
  githubUsername: null,
  connectedAt: null,
};

let repositories: WatchedRepository[] = [
  { id: "repo-1", owner: "acme", name: "widgets", addedAt: days(3) },
  { id: "repo-2", owner: "acme", name: "billing", addedAt: days(1) },
];
let nextRepoId = 3;

let destination: ChatDestination = {
  spaceName: null,
  webhookUrl: null,
  updatedAt: null,
};

const notifications: Notification[] = [
  {
    id: "notif-1",
    repositoryFullName: "acme/widgets",
    issueTitle: "Payment webhook failing",
    issueUrl: "https://github.com/acme/widgets/issues/101",
    sentAt: minutes(2),
    status: "sent",
  },
  {
    id: "notif-2",
    repositoryFullName: "acme/widgets",
    issueTitle: "Checkout returns 500",
    issueUrl: "https://github.com/acme/widgets/issues/102",
    sentAt: hours(1),
    status: "sent",
  },
  {
    id: "notif-3",
    repositoryFullName: "acme/billing",
    issueTitle: "Invoice generation crashing",
    issueUrl: "https://github.com/acme/billing/issues/45",
    sentAt: days(1),
    status: "failed",
  },
];

function paginated<T>(items: T[], url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const data = items.slice(offset, offset + limit);
  return {
    count: items.length,
    next: offset + limit < items.length ? `?limit=${limit}&offset=${offset + limit}` : null,
    previous: offset > 0 ? `?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null,
    data,
  };
}

export const handlers = [
  http.get("/api/github-connection", () => HttpResponse.json(connection)),

  http.post("/api/github-connection", async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (!body?.code) {
      return HttpResponse.json(
        { code: 400, message: "Invalid code", description: "The authorization code was invalid or expired." },
        { status: 400 },
      );
    }
    connection = {
      connected: true,
      githubUsername: "octocat",
      connectedAt: new Date().toISOString(),
    };
    return HttpResponse.json(connection, { status: 201 });
  }),

  http.delete("/api/github-connection", () => {
    connection = { connected: false, githubUsername: null, connectedAt: null };
    return new HttpResponse(null, { status: 204 });
  }),

  // Most specific first: the literal collection path before the :id param.
  http.get("/api/watched-repositories", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginated(repositories, url));
  }),

  http.post("/api/watched-repositories", async ({ request }) => {
    const body = (await request.json()) as { owner?: string; name?: string };
    if (!body?.owner || !body?.name) {
      return HttpResponse.json(
        { code: 400, message: "Invalid repository", description: "owner and name are required." },
        { status: 400 },
      );
    }
    const duplicate = repositories.some(
      (r) => r.owner === body.owner && r.name === body.name,
    );
    if (duplicate) {
      return HttpResponse.json(
        {
          code: 400,
          message: "Already watched",
          description: `${body.owner}/${body.name} is already on the watch list.`,
        },
        { status: 400 },
      );
    }
    const created: WatchedRepository = {
      id: `repo-${nextRepoId++}`,
      owner: body.owner,
      name: body.name,
      addedAt: new Date().toISOString(),
    };
    repositories = [created, ...repositories];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.delete("/api/watched-repositories/:id", ({ params }) => {
    const before = repositories.length;
    repositories = repositories.filter((r) => r.id !== params.id);
    return before === repositories.length
      ? HttpResponse.json({ code: 404, message: "Not found", description: "No watched repository with this id." }, { status: 404 })
      : new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/chat-destination", () => HttpResponse.json(destination)),

  http.put("/api/chat-destination", async ({ request }) => {
    const body = (await request.json()) as { spaceName?: string; webhookUrl?: string };
    if (!body?.webhookUrl || !/^https:\/\/chat\.googleapis\.com\//.test(body.webhookUrl)) {
      return HttpResponse.json(
        {
          code: 400,
          message: "Invalid webhook URL",
          description: "The webhook URL must be a Google Chat webhook (https://chat.googleapis.com/...).",
        },
        { status: 400 },
      );
    }
    destination = {
      spaceName: body.spaceName ?? null,
      webhookUrl: body.webhookUrl,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(destination);
  }),

  http.get("/api/notifications", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginated(notifications, url));
  }),
];
