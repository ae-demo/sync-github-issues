// Calls to the two external dependencies this component consumes:
// `github` (specs/design/dependencies/github/openapi.yaml, client generated
// into modules/github) and `google-chat`
// (specs/design/dependencies/google-chat/openapi.yaml — its one operation is
// called directly against the Administrator's configured webhook URL, below,
// rather than through a generated client; see the note on postChatMessage).
import ballerina/http;
import ballerina/log;
import github_sync_api.github as githubapi;

final githubapi:Client githubClient = check new ();

// The JSON body Google Chat's incoming-webhook endpoint expects
// (specs/design/dependencies/google-chat/openapi.yaml's requestBody).
type ChatMessage record {|
    string text;
|};

# Exchanges the Administrator's OAuth authorization `code` for a GitHub
# access token, via `github`'s pinned `/login/oauth/access_token`.
#
# + code - the authorization code GitHub redirected back with
# + return - the access token, or an error when GitHub refused the exchange
#            (an invalid/expired code, or unset OAuth app credentials)
function exchangeGithubCode(string code) returns string|error {
    githubapi:oauth_access_token_body payload = {
        client_id: githubClientId,
        client_secret: githubClientSecret,
        code: code
    };
    if githubOauthRedirectUri != "" {
        payload.redirect_uri = githubOauthRedirectUri;
    }
    githubapi:inline_response_200 result = check githubClient->/login/oauth/access_token.post(
        payload, headers = {"Accept": "application/json"});
    string? token = result.access_token;
    if token is () || token.trim() == "" {
        return error("GitHub did not return an access token for this authorization code");
    }
    return token;
}

# The GitHub login of the account behind this access token.
#
# Not fatal when it cannot be resolved: the connection is still usable for
# polling even if the login itself is unknown, so a caller who cannot afford
# that gets `()` rather than an error.
#
# + accessToken - the token `exchangeGithubCode` returned
# + return - the GitHub login, or `()` when it could not be resolved
function fetchGithubUsername(string accessToken) returns string? {
    githubapi:User|error user = githubClient->/user.get(headers = {"Authorization": "Bearer " + accessToken});
    if user is error {
        log:printWarn("could not resolve the authorizing GitHub user", 'error = user);
        return ();
    }
    string? login = user.login;
    return login;
}

# Open issues labeled `critical` on one watched repository, using the stored
# connection's access token as Bearer.
#
# + accessToken - the stored GitHub connection's access token
# + owner - the repository owner
# + name - the repository name
# + return - the matching issues, or an error from the upstream call
function listCriticalIssues(string accessToken, string owner, string name) returns githubapi:Issue[]|error {
    return githubClient->/repos/[owner]/[name]/issues.get(
        headers = {"Authorization": "Bearer " + accessToken}, state = "open", labels = "critical");
}

# Posts a text notification to the Administrator's configured Google Chat
# incoming webhook.
#
# The generated `bal openapi --mode client` output for this dependency always
# posts to resource path "/" — correct for a fixed `serviceUrl`, but this
# webhook URL carries its own `key`/`token` query-string credentials as part
# of the configured address. Concatenating "/" onto that URL appends a
# trailing slash INSIDE the token value rather than after it (verified against
# a local capture server: `...&token=SECRET` became `...&token=SECRET/`),
# which corrupts every request. Posting with an EMPTY resource path against a
# plain `http:Client` keeps the configured query string intact, so this calls
# the webhook directly instead of through the generated client.
#
# + webhookUrl - the Administrator's configured Google Chat webhook URL
# + text - the message body
# + return - true when Google Chat accepted the message (2xx)
function postChatMessage(string webhookUrl, string text) returns boolean {
    http:Client|error chatClient = new (webhookUrl);
    if chatClient is error {
        log:printError("could not create a client for the configured Chat webhook", 'error = chatClient);
        return false;
    }
    ChatMessage message = {text: text};
    http:Request req = new;
    req.setPayload(message.toJson(), "application/json");
    http:Response|error resp = chatClient->post("", req);
    if resp is error {
        log:printError("Google Chat webhook post failed", 'error = resp);
        return false;
    }
    int statusCode = resp.statusCode;
    return statusCode >= 200 && statusCode < 300;
}
