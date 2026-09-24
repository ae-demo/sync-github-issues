// Internal row shapes for the four domain-model entities
// (specs/design/domain-model.md). These are the database's view of each
// entity; the OpenAPI-generated records in openapi_service.bal are the API's
// view, and the two are mapped explicitly at the resource boundary.
import ballerina/time;

// GithubConnection — kept as a single row (id = SINGLETON_ID): this app has
// one Administrator persona and one GitHub authorization.
public type GithubConnectionRow record {|
    string id;
    string adminUserId;
    string? githubUsername;
    string? accessToken;
    time:Utc? connectedAt;
|};

public type WatchedRepositoryRow record {|
    string id;
    string owner;
    string name;
    time:Utc addedAt;
|};

// ChatDestination — also a single row (id = SINGLETON_ID).
public type ChatDestinationRow record {|
    string id;
    string? spaceName;
    string? webhookUrl;
    time:Utc? updatedAt;
|};

public type SyncedIssueRow record {|
    string id;
    string repositoryId;
    int githubIssueNumber;
    string title;
    string url;
    time:Utc notifiedAt;
    string status;
|};

// The notification log's row shape (a SyncedIssue joined with the
// WatchedRepository it belongs to, for the repository's owner/name). The
// domain model keeps no separate Notification table — SyncedIssue already
// carries notifiedAt/status/title/url, so the /notifications log is a
// read-only projection of it.
public type NotificationRow record {|
    string id;
    string repositoryFullName;
    string issueTitle;
    string issueUrl;
    time:Utc sentAt;
    string status;
|};

// The fixed id used for the two single-row tables.
public const string SINGLETON_ID = "singleton";
