// screen Dashboard "Overview of the sync's current setup" — wireframes.dsl.
// Two summary cards (GitHub connection, Chat destination), a primary
// "Connect GitHub" button, "Recent notifications" heading + table, and a
// link to the full log. All three GETs the screen needs.
import { useEffect, useState, type ReactElement } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Link,
  PageContent,
  PageTitle,
  Typography,
  Button,
  ListingTable,
} from "@wso2/oxygen-ui";
import { formatRelativeTime } from "@wso2/oxygen-ui";
import { githubSyncApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/github-sync-api";

type GithubConnection = components["schemas"]["GithubConnection"];
type ChatDestination = components["schemas"]["ChatDestination"];
type Notification = components["schemas"]["Notification"];

export function DashboardPage(): ReactElement {
  const [connection, setConnection] = useState<GithubConnection | null>(null);
  const [destination, setDestination] = useState<ChatDestination | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void Promise.all([
      githubSyncApi.GET("/github-connection"),
      githubSyncApi.GET("/chat-destination"),
      githubSyncApi.GET("/notifications", { params: { query: { limit: 5 } } }),
    ]).then(([conn, dest, notifs]) => {
      if (!live) return;
      setConnection(conn.data ?? null);
      setDestination(dest.data ?? null);
      setNotifications(notifs.data?.data ?? []);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Dashboard</PageTitle.Header>
      </PageTitle>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                GitHub connection
              </Typography>
              <Typography variant="h4">
                {loading
                  ? "…"
                  : connection?.connected
                    ? `Connected as ${connection.githubUsername ?? "unknown"}`
                    : "Not connected"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                authorize access to your repositories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Chat destination
              </Typography>
              <Typography variant="h4">{loading ? "…" : destination?.spaceName || "Not set"}</Typography>
              <Typography variant="caption" color="text.secondary">
                where notifications are posted
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Can op="POST /github-connection">
        <Box sx={{ mb: 3 }}>
          <Button variant="contained" component={RouterLink} to="/connect-github">
            Connect GitHub
          </Button>
        </Box>
      </Can>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Recent notifications
      </Typography>

      <ListingTable.Container disablePaper>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Repository</ListingTable.Cell>
              <ListingTable.Cell>Issue</ListingTable.Cell>
              <ListingTable.Cell>Sent at</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {notifications.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState title="No notifications yet" description="Nothing has been sent so far." />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              notifications.map((n) => (
                <ListingTable.Row key={n.id}>
                  <ListingTable.Cell>{n.repositoryFullName}</ListingTable.Cell>
                  <ListingTable.Cell>{n.issueTitle}</ListingTable.Cell>
                  <ListingTable.Cell>{formatRelativeTime(new Date(n.sentAt ?? Date.now()))}</ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>

      <Box sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/notifications">
          View full notification log
        </Link>
      </Box>
    </PageContent>
  );
}
