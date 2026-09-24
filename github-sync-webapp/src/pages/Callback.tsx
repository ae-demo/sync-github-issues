// The ONE registered redirect URI, serving both the redirect leg and the
// silent-renew iframe leg (thunder-authentication). handleCallback() calls
// signinCallback(), which reads request_type off the stored state and
// dispatches to whichever leg landed here; it resolves with no value, so this
// page renders from the promise SETTLING, never from a value. Once it
// settles, the redirect leg has a session and lands on "/", which SignedIn()
// in App.tsx routes to the first reachable screen.
import { useEffect, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../authz/session";

export function CallbackPage(): ReactElement {
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    void handleCallback().finally(() => {
      if (live) navigate("/", { replace: true });
    });
    return () => {
      live = false;
    };
  }, [navigate]);

  return (
    <main>
      <p>Signing you in…</p>
    </main>
  );
}
