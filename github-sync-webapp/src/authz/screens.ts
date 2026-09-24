// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Adapted from
// thunder-authentication's screens.example.ts pattern for this app's own
// screens, in the order specs/design/components/github-sync-webapp/wireframes.dsl
// draws them — that order is the rail's order, and the first reachable row is
// the landing screen.
//
// ConnectGithub and AddRepository are drawn as detail/form screens reached by
// a button, not by the sidebar (the wireframe's `sidebar` line lists only
// Dashboard, Repositories, Chat Destination and Notification Log) — they are
// still routes here, gated the same way, just not rendered in the rail.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
  /** Rendered as a sidebar item. false for a screen reached only via a button. */
  readonly inRail: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", loads: "GET /github-connection", inRail: true },
  { key: "connect-github", label: "Connect GitHub", path: "/connect-github", loads: "POST /github-connection", inRail: false },
  { key: "repositories", label: "Repositories", path: "/repositories", loads: "GET /watched-repositories", inRail: true },
  { key: "add-repository", label: "Add repository", path: "/repositories/new", loads: "POST /watched-repositories", inRail: false },
  { key: "chat-destination", label: "Chat Destination", path: "/chat-destination", loads: "GET /chat-destination", inRail: true },
  { key: "notification-log", label: "Notification Log", path: "/notifications", loads: "GET /notifications", inRail: true },
];

// FAIL LOUDLY at module load — a committed table that outlived its contract
// must not become a screen nobody can reach and nobody notices.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
