// /oauth/github/callback — NOT one of the six wireframe screens. This is
// where GitHub's OAuth redirect (a real integration would need to send the
// user here, which needs a browser-facing client id nowhere in this design —
// see ConnectGithub.tsx) would land with a `code` query param. It reads that
// param, calls POST /github-connection with it (per github-sync-api's
// openapi.yaml), and on success routes to Dashboard — exactly per this
// component's dispatch. A 400 (invalid/expired code) surfaces the API's
// error in place with a way back to Connect GitHub.
import { useEffect, useState, type ReactElement } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Card, CardContent, CardHeader, Typography } from "@wso2/oxygen-ui";
import { githubSyncApi } from "../api";

type Status = "pending" | "no-code" | "error";

export function GithubOauthCallbackPage(): ReactElement {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setStatus("no-code");
      return;
    }
    let live = true;
    void githubSyncApi.POST("/github-connection", { body: { code } }).then(({ data, error }) => {
      if (!live) return;
      if (data) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setStatus("error");
      setMessage(error?.description ?? error?.message ?? "The authorization code was invalid or expired.");
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "pending") {
    return (
      <main>
        <p>Connecting your GitHub account…</p>
      </main>
    );
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Card>
        <CardHeader title="Couldn't connect GitHub" />
        <CardContent>
          <Typography sx={{ mb: 3 }} color="error">
            {status === "no-code"
              ? "No authorization code was received from GitHub."
              : message}
          </Typography>
          <Button variant="contained" component={RouterLink} to="/connect-github">
            Back to Connect GitHub
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
