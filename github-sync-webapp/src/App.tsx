// Adapted from thunder-authentication's App.example.tsx pattern for this
// app's screens. The ROUTING STRUCTURE is prescribed there and kept exactly:
//   - NoAccess sits ABOVE the shell route and REPLACES it.
//   - Forbidden sits INSIDE the shell, at /forbidden.
//   - /forbidden is wired into authz/client once, from the router root.
//   - Every gated route is wrapped in <RequireOperation op={screen.loads}>.
//   - /callback is routed OUTSIDE the provider — no session to read yet.
// One difference from the example: main.tsx already wraps <BrowserRouter>
// (react-webapp + oxygen-ui-design-system's own Setup), so this file does not
// nest a second one.
//
// /oauth/github/callback is NOT one of the six wireframe screens — it is the
// functional landing point GitHub's OAuth redirect would use, added per this
// component's dispatch since no browser-facing GitHub client id exists in
// this design (see src/pages/GithubOauthCallback.tsx for the judgment call).
// It sits inside the signed-in shell, like /forbidden, with no rail entry.
import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthzProvider, Forbidden, NoAccess, RequireOperation, useAuthz, useScopes } from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { DashboardPage } from "./pages/Dashboard";
import { ConnectGithubPage } from "./pages/ConnectGithub";
import { RepositoriesPage } from "./pages/Repositories";
import { AddRepositoryPage } from "./pages/AddRepository";
import { ChatDestinationPage } from "./pages/ChatDestination";
import { NotificationLogPage } from "./pages/NotificationLog";
import { GithubOauthCallbackPage } from "./pages/GithubOauthCallback";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  dashboard: <DashboardPage />,
  "connect-github": <ConnectGithubPage />,
  repositories: <RepositoriesPage />,
  "add-repository": <AddRepositoryPage />,
  "chat-destination": <ChatDestinationPage />,
  "notification-log": <NotificationLogPage />,
};

export default function App(): ReactElement {
  return (
    <>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </>
  );
}

function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // Load-time guard: only a MISSING session starts a sign-in. currentUser()
  // already tried a silent renew, so signing in on a merely expired token
  // would re-log the user in on every visit.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);
  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route key={screen.key} element={<RequireOperation op={screen.loads} screen={screen.label} />}>
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        <Route path="/oauth/github/callback" element={<GithubOauthCallbackPage />} />
        {/* Forbidden is INSIDE the shell: the rail the caller can use stays. */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
