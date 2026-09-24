// screen Repositories "The repositories currently being watched for critical
// issues" — wireframes.dsl. Heading + "Add repository" primary button at the
// top, a "Repository | Added" table whose rows the DSL points at
// AddRepository (`table "Repository | Added" -> AddRepository`) — kept as
// drawn even though a delete-only row action would read more naturally; the
// wireframe's own arrow wins. Deleting is the RowActions control the issue's
// Scope requires ("removing an entry calls the API's delete endpoint"),
// which is not itself a screen so it is not one of the "no invented screens"
// concerns.
import { useCallback, useEffect, useState, type MouseEvent, type ReactElement } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Button, IconButton, ListingTable, PageContent, PageTitle, Tooltip, formatRelativeTime } from "@wso2/oxygen-ui";
import { Trash2 } from "@wso2/oxygen-ui-icons-react";
import { githubSyncApi } from "../api";
import { Can } from "../authz/gates";
import type { components } from "../generated/github-sync-api";

type WatchedRepository = components["schemas"]["WatchedRepository"];

export function RepositoriesPage(): ReactElement {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<WatchedRepository[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void githubSyncApi.GET("/watched-repositories", { params: { query: { limit: 100 } } }).then(({ data }) => {
      setRepos(data?.data ?? []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(
    (id: string | undefined, e: MouseEvent) => {
      e.stopPropagation();
      if (!id) return;
      void githubSyncApi.DELETE("/watched-repositories/{repositoryId}", { params: { path: { repositoryId: id } } }).then(() => {
        load();
      });
    },
    [load],
  );

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Watched repositories</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /watched-repositories">
            <Button variant="contained" component={RouterLink} to="/repositories/new">
              Add repository
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      <ListingTable.Container disablePaper>
        <ListingTable>
          <ListingTable.Head>
            <ListingTable.Row>
              <ListingTable.Cell>Repository</ListingTable.Cell>
              <ListingTable.Cell>Added</ListingTable.Cell>
              <ListingTable.Cell />
            </ListingTable.Row>
          </ListingTable.Head>
          <ListingTable.Body>
            {repos.length === 0 && !loading ? (
              <ListingTable.Row>
                <ListingTable.Cell colSpan={3}>
                  <ListingTable.EmptyState
                    title="No watched repositories"
                    description="Add a repository to start watching it for critical issues."
                  />
                </ListingTable.Cell>
              </ListingTable.Row>
            ) : (
              repos.map((repo) => (
                <ListingTable.Row key={repo.id} clickable onClick={() => navigate("/repositories/new")}>
                  <ListingTable.Cell>
                    {repo.owner}/{repo.name}
                  </ListingTable.Cell>
                  <ListingTable.Cell>{formatRelativeTime(new Date(repo.addedAt ?? Date.now()))}</ListingTable.Cell>
                  <ListingTable.Cell>
                    <Can op="DELETE /watched-repositories/{repositoryId}">
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={(e) => handleDelete(repo.id, e)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Can>
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
