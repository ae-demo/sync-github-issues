// screen ChatDestination "The Google Chat space notifications are posted to"
// — wireframes.dsl. Loads the current destination, saves in place; an
// invalid webhook URL surfaces the API's 400 in place and stays on the
// screen (per the DSL's own comment).
import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Box, Card, CardContent, CardHeader, Stack, TextField, Typography, Button } from "@wso2/oxygen-ui";
import { githubSyncApi } from "../api";
import { Can } from "../authz/gates";

export function ChatDestinationPage(): ReactElement {
  const [spaceName, setSpaceName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void githubSyncApi.GET("/chat-destination").then(({ data }) => {
      setSpaceName(data?.spaceName ?? "");
      setWebhookUrl(data?.webhookUrl ?? "");
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    void githubSyncApi
      .PUT("/chat-destination", { body: { spaceName, webhookUrl } })
      .then(({ data, error: apiError }) => {
        setSaving(false);
        if (data) {
          setSaved(true);
          return;
        }
        setError(apiError?.description ?? apiError?.message ?? "The webhook URL was invalid.");
      });
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Card>
        <CardHeader title="Chat destination" />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error ? (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              ) : null}
              {saved ? (
                <Typography color="success.main" variant="body2">
                  Chat destination saved.
                </Typography>
              ) : null}
              <TextField
                label="Space name (e.g. Engineering Alerts)"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                disabled={loading}
                fullWidth
              />
              <TextField
                label="Webhook URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                disabled={loading}
                fullWidth
              />
              <Can op="PUT /chat-destination">
                <Box>
                  <Button type="submit" variant="contained" disabled={loading || saving}>
                    Save
                  </Button>
                </Box>
              </Can>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
