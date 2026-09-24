// screen NotificationLog "Every critical-issue notification sent so far" —
// wireframes.dsl. Most-recent-first (the API already orders it), status
// badge Sent/Failed.
import { useEffect, useState, type ReactElement } from "react";
import { Chip, ListingTable, PageContent, PageTitle, formatRelativeTime } from "@wso2/oxygen-ui";
import { githubSyncApi } from "../api";
import type { components } from "../generated/github-sync-api";

type Notification = components["schemas"]["Notification"];

export function NotificationLogPage(): ReactElement {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void githubSyncApi.GET("/notifications", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setNotifications(data?.data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Notification log</PageTitle.Header>
      </PageTitle>

      <ListingTable.Container disablePaper>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Repository</ListingTable.Cell>
              <ListingTable.Cell>Issue</ListingTable.Cell>
              <ListingTable.Cell>Sent at</ListingTable.Cell>
              <ListingTable.Cell>Status</ListingTable.Cell>
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {notifications.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={4}>
                  <ListingTable.EmptyState title="No notifications yet" description="Nothing has been sent so far." />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              notifications.map((n) => (
                <ListingTable.Row key={n.id}>
                  <ListingTable.Cell>{n.repositoryFullName}</ListingTable.Cell>
                  <ListingTable.Cell>{n.issueTitle}</ListingTable.Cell>
                  <ListingTable.Cell>{formatRelativeTime(new Date(n.sentAt ?? Date.now()))}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Chip
                      label={n.status === "failed" ? "Failed" : "Sent"}
                      color={n.status === "failed" ? "error" : "success"}
                      size="small"
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ))
            )}
          </ListingTable.Body>
        </ListingTable>
      </ListingTable.Container>
    </PageContent>
  );
}
