// The periodic job that realizes specs/design/flows/critical-issue-notification.md:
// for each watched repository, list open issues labeled `critical`, skip any
// already recorded in SyncedIssue, and for each new one post a Chat
// notification and record it — exactly once per issue.
import ballerina/log;
import ballerina/task;
import ballerina/time;
import ballerina/uuid;
import github_sync_api.github as githubapi;

class PollerJob {
    *task:Job;

    public function execute() {
        error? result = pollOnce();
        if result is error {
            log:printError("critical-issue poll failed", 'error = result);
        }
    }
}

final task:JobId pollerJobId = check task:scheduleJobRecurByFrequency(new PollerJob(), pollerIntervalSeconds);

function pollOnce() returns error? {
    GithubConnectionRow? connection = check getGithubConnectionRow();
    if connection is () {
        log:printInfo("skipping poll: no GitHub connection configured");
        return;
    }
    string? accessToken = connection.accessToken;
    if accessToken is () || accessToken.trim() == "" {
        log:printInfo("skipping poll: GitHub connection has no access token");
        return;
    }

    ChatDestinationRow? destination = check getChatDestinationRow();
    string? webhookUrl = destination is ChatDestinationRow ? destination.webhookUrl : ();
    if webhookUrl is () || webhookUrl.trim() == "" {
        log:printInfo("skipping poll: no Chat destination configured");
        return;
    }

    WatchedRepositoryRow[] repositories = check listAllWatchedRepositories();
    foreach WatchedRepositoryRow repository in repositories {
        check pollRepository(repository, accessToken, webhookUrl);
    }
    return;
}

function pollRepository(WatchedRepositoryRow repository, string accessToken, string webhookUrl) returns error? {
    githubapi:Issue[]|error issues = listCriticalIssues(accessToken, repository.owner, repository.name);
    if issues is error {
        log:printError("could not list issues for a watched repository",
            'error = issues, owner = repository.owner, name = repository.name);
        return;
    }

    foreach githubapi:Issue issue in issues {
        int? issueNumber = issue.number;
        if issueNumber is () {
            continue;
        }
        boolean alreadySynced = check isIssueAlreadySynced(repository.id, issueNumber);
        if alreadySynced {
            continue;
        }
        check notifyNewCriticalIssue(repository, issue, issueNumber, webhookUrl);
    }
    return;
}

function notifyNewCriticalIssue(WatchedRepositoryRow repository, githubapi:Issue issue, int issueNumber, string webhookUrl) returns error? {
    string title = issue.title ?: "(untitled issue)";
    string url = issue.html_url ?: "";
    string repositoryFullName = repository.owner + "/" + repository.name;
    string text = string `Critical issue in ${repositoryFullName}: ${title} ${url}`;

    boolean sent = postChatMessage(webhookUrl, text);
    time:Utc notifiedAt = time:utcNow();
    SyncedIssueRow row = {
        id: uuid:createRandomUuid(),
        repositoryId: repository.id,
        githubIssueNumber: issueNumber,
        title: title,
        url: url,
        notifiedAt: notifiedAt,
        status: sent ? "sent" : "failed"
    };
    check insertSyncedIssue(row);
    return;
}
