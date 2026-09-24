// screen AddRepository "Add a repository to the watch list" — wireframes.dsl.
// POST /watched-repositories with owner/name; a duplicate add surfaces the
// API's 400 in place (story: repository already watched).
import { useState, type FormEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, CardHeader, Stack, TextField, Typography } from "@wso2/oxygen-ui";
import { githubSyncApi } from "../api";

export function AddRepositoryPage(): ReactElement {
  const navigate = useNavigate();
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    void githubSyncApi
      .POST("/watched-repositories", { body: { owner, name } })
      .then(({ data, error: apiError }) => {
        setSubmitting(false);
        if (data) {
          navigate("/repositories");
          return;
        }
        setError(apiError?.description ?? apiError?.message ?? "The repository is already watched or invalid.");
      });
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Card>
        <CardHeader title="Add repository" />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error ? (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              ) : null}
              <TextField
                label="Owner (e.g. acme)"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
                fullWidth
              />
              <TextField
                label="Repository name (e.g. widgets)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
              />
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Button variant="outlined" onClick={() => navigate("/repositories")}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  Add
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
