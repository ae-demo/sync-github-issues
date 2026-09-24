// screen ConnectGithub "Authorize the product to read the Administrator's
// repositories" — wireframes.dsl. ONE authorization button, never a token
// field (acceptance story 9).
//
// JUDGMENT CALL: a real GitHub OAuth redirect needs a client id in the
// authorize URL, and design.json declares no browser-facing GitHub OAuth
// client — only github-sync-api (which owns the server-side code exchange)
// and user-auth (Thunder SSO, unrelated to GitHub). Rather than invent a
// client id, this button takes the caller straight to this app's own
// /oauth/github/callback route — the same route a real GitHub redirect would
// land on with a `code` query param. See GithubOauthCallback.tsx.
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, CardHeader, Typography } from "@wso2/oxygen-ui";
import { Can } from "../authz/gates";

export function ConnectGithubPage(): ReactElement {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Card>
        <CardHeader title="Connect your GitHub account" />
        <CardContent>
          <Typography sx={{ mb: 3 }}>
            You will be redirected to GitHub to authorize read access to your repositories.
          </Typography>
          <Can op="POST /github-connection">
            <Button variant="contained" onClick={() => navigate("/oauth/github/callback")}>
              Continue with GitHub
            </Button>
          </Can>
        </CardContent>
      </Card>
    </Box>
  );
}
