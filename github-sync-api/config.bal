// All external configuration, read once, in one place. Every value has a safe
// fallback so the service starts with no environment variables set; a value
// that genuinely has no safe fallback (GitHub credentials, the Chat webhook)
// is simply empty, and only the specific operation that needs it fails.
import ballerina/os;

// sync-db (Postgres) — platform-resource `sync-db`.
configurable string syncDbHostEnv = os:getEnv("SYNC_DB_HOST");
configurable string syncDbPortEnv = os:getEnv("SYNC_DB_PORT");
configurable string syncDbNameEnv = os:getEnv("SYNC_DB_DBNAME");
configurable string syncDbUserEnv = os:getEnv("SYNC_DB_USER");
configurable string syncDbPasswordEnv = os:getEnv("SYNC_DB_PASSWORD");

final string syncDbHost = syncDbHostEnv == "" ? "localhost" : syncDbHostEnv;
final string syncDbName = syncDbNameEnv == "" ? "postgres" : syncDbNameEnv;
final string syncDbUser = syncDbUserEnv == "" ? "postgres" : syncDbUserEnv;
final string syncDbPassword = syncDbPasswordEnv;
final int syncDbPort = parsePort(syncDbPortEnv);

// github — external dependency `github`.
configurable string githubClientId = os:getEnv("GITHUB_CLIENT_ID");
configurable string githubClientSecret = os:getEnv("GITHUB_CLIENT_SECRET");
configurable string githubOauthRedirectUri = os:getEnv("GITHUB_OAUTH_REDIRECT_URI");

// google-chat — external dependency `google-chat`.
configurable string googleChatWebhookUrl = os:getEnv("GOOGLE_CHAT_WEBHOOK_URL");

// The poller's interval, in seconds. Not platform-injected — the PRD fixes it
// at 5 minutes.
final decimal pollerIntervalSeconds = 300;

function parsePort(string raw) returns int {
    int|error parsed = int:fromString(raw);
    if parsed is int {
        return parsed;
    }
    return 5432;
}
