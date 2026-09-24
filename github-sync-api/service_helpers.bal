// Small helpers shared by every resource in openapi_service.bal: resolving
// the gateway-verified caller (see gateway_assertion.bal / the `ballerina`
// skill's "Who the caller is"), and building the pagination envelope every
// collection GET returns.
import ballerina/http;
import ballerina/time;

# The verified caller, or the contract's own `ErrorUnauthorized` shape
# (`{code, message}`, matching the Error schema) when the request carried no
# verifiable gateway assertion. Every resource in this service needs a
# caller — there is no `security: []` operation here.
#
# + ctx - the request context the gateway-assertion interceptor wrote to
# + return - the verified caller, or the 401 to return as-is
function authenticate(http:RequestContext ctx) returns GatewayCaller|ErrorUnauthorized {
    GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
    if caller is GatewayCaller {
        return caller;
    }
    return {body: {code: 401, message: "Not signed in"}};
}

# An RFC3339 string for a `date-time` field, or `()` when the row carried no
# timestamp.
#
# + instant - the stored instant, or `()`
# + return - the RFC3339 rendering, or `()`
function toRfc3339(time:Utc? instant) returns string? {
    if instant is () {
        return ();
    }
    return time:utcToString(instant);
}

# The `next`/`previous` relative-URI pair a paginated collection GET returns,
# per openapi-conventions' envelope.
#
# + basePath - the collection's own path, e.g. "/watched-repositories"
# + 'limit - the page size requested
# + offset - the offset requested
# + total - the total matching row count
# + return - `[next, previous]`, each `()` when there is no such page
function paginationLinks(string basePath, int 'limit, int offset, int total) returns [string?, string?] {
    string? next = ();
    if offset + 'limit < total {
        next = string `${basePath}?limit=${'limit}&offset=${offset + 'limit}`;
    }
    string? previous = ();
    if offset > 0 {
        int previousOffset = offset - 'limit;
        if previousOffset < 0 {
            previousOffset = 0;
        }
        previous = string `${basePath}?limit=${'limit}&offset=${previousOffset}`;
    }
    return [next, previous];
}
