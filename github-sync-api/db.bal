// Persistence for the four domain-model entities, in `sync-db` (Postgres).
// One client, module-level, and a startup DDL block that creates the tables
// if they are not already there — bootstrapping schema, not a migration
// framework.
import ballerina/sql;
import ballerina/time;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

final postgresql:Client dbClient = check new (
    host = syncDbHost,
    username = syncDbUser,
    password = syncDbPassword,
    database = syncDbName,
    port = syncDbPort
);

final () dbReady = check initDb();

function initDb() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS github_connection (
            id TEXT PRIMARY KEY,
            admin_user_id TEXT NOT NULL,
            github_username TEXT,
            access_token TEXT,
            connected_at TIMESTAMPTZ
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS watched_repository (
            id TEXT PRIMARY KEY,
            owner TEXT NOT NULL,
            name TEXT NOT NULL,
            added_at TIMESTAMPTZ NOT NULL,
            UNIQUE (owner, name)
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS chat_destination (
            id TEXT PRIMARY KEY,
            space_name TEXT,
            webhook_url TEXT,
            updated_at TIMESTAMPTZ
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS synced_issue (
            id TEXT PRIMARY KEY,
            repository_id TEXT NOT NULL REFERENCES watched_repository(id) ON DELETE CASCADE,
            github_issue_number INT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            notified_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL,
            UNIQUE (repository_id, github_issue_number)
        )
    `);
    return;
}

// ---- GithubConnection --------------------------------------------------

function getGithubConnectionRow() returns GithubConnectionRow?|error {
    stream<GithubConnectionRow, sql:Error?> rows = dbClient->query(
        `SELECT id, admin_user_id AS "adminUserId", github_username AS "githubUsername",
                access_token AS "accessToken", connected_at AS "connectedAt"
         FROM github_connection WHERE id = ${SINGLETON_ID}`
    );
    GithubConnectionRow[]|error result = from GithubConnectionRow row in rows select row;
    check rows.close();
    if result is error {
        return result;
    }
    if result.length() == 0 {
        return ();
    }
    return result[0];
}

function upsertGithubConnection(string adminUserId, string? githubUsername, string accessToken, time:Utc connectedAt) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO github_connection (id, admin_user_id, github_username, access_token, connected_at)
        VALUES (${SINGLETON_ID}, ${adminUserId}, ${githubUsername}, ${accessToken}, ${connectedAt})
        ON CONFLICT (id) DO UPDATE SET
            admin_user_id = EXCLUDED.admin_user_id,
            github_username = EXCLUDED.github_username,
            access_token = EXCLUDED.access_token,
            connected_at = EXCLUDED.connected_at
    `);
    return;
}

function deleteGithubConnectionRow() returns error? {
    _ = check dbClient->execute(`DELETE FROM github_connection WHERE id = ${SINGLETON_ID}`);
    return;
}

// ---- WatchedRepository --------------------------------------------------

function listWatchedRepositories(int 'limit, int offset) returns [WatchedRepositoryRow[], int]|error {
    stream<WatchedRepositoryRow, sql:Error?> rows = dbClient->query(
        `SELECT id, owner, name, added_at AS "addedAt" FROM watched_repository
         ORDER BY added_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    WatchedRepositoryRow[]|error result = from WatchedRepositoryRow row in rows select row;
    check rows.close();
    if result is error {
        return result;
    }
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM watched_repository`);
    return [result, total];
}

function listAllWatchedRepositories() returns WatchedRepositoryRow[]|error {
    stream<WatchedRepositoryRow, sql:Error?> rows = dbClient->query(
        `SELECT id, owner, name, added_at AS "addedAt" FROM watched_repository`
    );
    WatchedRepositoryRow[]|error result = from WatchedRepositoryRow row in rows select row;
    check rows.close();
    return result;
}

function findWatchedRepositoryByOwnerName(string owner, string name) returns WatchedRepositoryRow?|error {
    stream<WatchedRepositoryRow, sql:Error?> rows = dbClient->query(
        `SELECT id, owner, name, added_at AS "addedAt" FROM watched_repository
         WHERE owner = ${owner} AND name = ${name}`
    );
    WatchedRepositoryRow[]|error result = from WatchedRepositoryRow row in rows select row;
    check rows.close();
    if result is error {
        return result;
    }
    if result.length() == 0 {
        return ();
    }
    return result[0];
}

function insertWatchedRepository(WatchedRepositoryRow row) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO watched_repository (id, owner, name, added_at)
        VALUES (${row.id}, ${row.owner}, ${row.name}, ${row.addedAt})
    `);
    return;
}

function deleteWatchedRepositoryById(string id) returns boolean|error {
    sql:ExecutionResult result = check dbClient->execute(
        `DELETE FROM watched_repository WHERE id = ${id}`
    );
    int? affected = result.affectedRowCount;
    return affected is int && affected > 0;
}

// ---- ChatDestination -----------------------------------------------------

function getChatDestinationRow() returns ChatDestinationRow?|error {
    stream<ChatDestinationRow, sql:Error?> rows = dbClient->query(
        `SELECT id, space_name AS "spaceName", webhook_url AS "webhookUrl", updated_at AS "updatedAt"
         FROM chat_destination WHERE id = ${SINGLETON_ID}`
    );
    ChatDestinationRow[]|error result = from ChatDestinationRow row in rows select row;
    check rows.close();
    if result is error {
        return result;
    }
    if result.length() == 0 {
        return ();
    }
    return result[0];
}

function upsertChatDestination(string spaceName, string webhookUrl, time:Utc updatedAt) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO chat_destination (id, space_name, webhook_url, updated_at)
        VALUES (${SINGLETON_ID}, ${spaceName}, ${webhookUrl}, ${updatedAt})
        ON CONFLICT (id) DO UPDATE SET
            space_name = EXCLUDED.space_name,
            webhook_url = EXCLUDED.webhook_url,
            updated_at = EXCLUDED.updated_at
    `);
    return;
}

// ---- SyncedIssue / notification log ---------------------------------------

function isIssueAlreadySynced(string repositoryId, int githubIssueNumber) returns boolean|error {
    int count = check dbClient->queryRow(
        `SELECT COUNT(*) FROM synced_issue WHERE repository_id = ${repositoryId} AND github_issue_number = ${githubIssueNumber}`
    );
    return count > 0;
}

function insertSyncedIssue(SyncedIssueRow row) returns error? {
    _ = check dbClient->execute(`
        INSERT INTO synced_issue (id, repository_id, github_issue_number, title, url, notified_at, status)
        VALUES (${row.id}, ${row.repositoryId}, ${row.githubIssueNumber}, ${row.title}, ${row.url}, ${row.notifiedAt}, ${row.status})
        ON CONFLICT (repository_id, github_issue_number) DO NOTHING
    `);
    return;
}

function listNotifications(int 'limit, int offset) returns [NotificationRow[], int]|error {
    stream<NotificationRow, sql:Error?> rows = dbClient->query(
        `SELECT si.id AS id, (wr.owner || '/' || wr.name) AS "repositoryFullName",
                si.title AS "issueTitle", si.url AS "issueUrl",
                si.notified_at AS "sentAt", si.status AS status
         FROM synced_issue si JOIN watched_repository wr ON wr.id = si.repository_id
         ORDER BY si.notified_at DESC LIMIT ${'limit} OFFSET ${offset}`
    );
    NotificationRow[]|error result = from NotificationRow row in rows select row;
    check rows.close();
    if result is error {
        return result;
    }
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM synced_issue`);
    return [result, total];
}
