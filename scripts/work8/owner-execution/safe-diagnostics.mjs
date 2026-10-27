// Allowlisted schema information only. Never serialize upstream bodies, exception
// messages, request bodies, credentials, cookies, headers, browser state or URLs.
const errorKinds = new Map([
  ['Same-origin request required', 'BFF_ORIGIN_REJECTED'],
  ['Sign in to continue', 'BFF_SESSION_MISSING'],
  ['Owner access required', 'OWNER_GATE_REJECTED'],
  ['Authenticated owner request required', 'OWNER_BEARER_REQUIRED'],
  ['Origin denied', 'BACKEND_ORIGIN_REJECTED'],
  ['Rate limit', 'RATE_LIMIT'],
  ['Institutional memory unavailable', 'MEMORY_UNAVAILABLE'],
  ['Memory command refused: schema, provenance, reference or version conflict', 'MEMORY_COMMAND_REFUSED'],
  ['Memory record persisted but audit confirmation unavailable; reconcile the same command', 'MEMORY_AUDIT_UNAVAILABLE_AFTER_PERSIST'],
  ['Advisor service unavailable. No completion is confirmed.', 'BFF_UPSTREAM_UNAVAILABLE'],
]);
const codes = new Set([
  'READINESS_DEADLINE', 'BROWSER_ORIGIN_MISMATCH', 'HTTP_STATUS_MISMATCH', 'JSON_RESPONSE_REQUIRED',
  'MEMORY_UNAVAILABLE', 'LOGIN_IDENTITY', 'SECURE_HTTPONLY_SESSION_REQUIRED',
  'SESSION_IDENTITY', 'LOCKED_RUNTIME_IDENTITY', 'NEW_FIXTURE_REQUIRED',
  'FRESH_ZERO_VERSION_REQUIRED', 'NATIVE_COMMAND_MISMATCH', 'NATIVE_DEFER_HTTP',
  'NATIVE_DURABLE_RECEIPT', 'REPLAY_CREATED_MUTATION', 'REPLAY_MUTATED_HISTORY',
  'INITIAL_RECEIPT_REQUIRED', 'RESTART_HISTORY_MISMATCH', 'UI_VERSION_MISMATCH',
  'UI_DEFER_NOT_DISABLED', 'UI_RELOAD_VERSION_MISMATCH', 'UI_RELOAD_DEFER_NOT_DISABLED',
  'UI_DECISION_HISTORY_MISMATCH', 'UI_HORIZONTAL_OVERFLOW', 'DESKTOP_MOBILE_HISTORY_MISMATCH',
  'SYNTHETIC_RECORD_IDENTITY', 'ONE_DURABLE_TRANSITION_REQUIRED',
  'DECISION_HISTORY_MISMATCH', 'AUTHENTICATED_SYNTHETIC_ORIGIN_REQUIRED',
  'AUTHORITY_BOUNDARY', 'LOCKED_EXECUTIVE_BOUNDARY', 'EXECUTIVE_DEFER_READBACK',
]);
const type = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
const boundedType = v => ['null','array','object','boolean','number','string','undefined'].includes(type(v)) ? type(v) : 'other';
const integer = v => Number.isSafeInteger(v) && v >= 0 && v <= 10000 ? v : null;
export function operationFor(route, body) {
  if (route === '/api/auth/login') return 'AUTH_LOGIN';
  if (route === '/api/auth/me') return 'AUTH_ME';
  if (route === '/api/owner/advisor/executive') return 'EXECUTIVE_READ';
  if (route.startsWith('/api/owner/advisor/read?domain=state')) return 'STATE_READ';
  if (route.startsWith('/api/owner/advisor/read?domain=memory')) return 'MEMORY_READ';
  if (route === '/api/owner/advisor/memory') return body?.action === 'synthetic_experience' ? 'FIXTURE_WRITE' : body?.action === 'owner_decision' ? 'OWNER_DECISION_WRITE' : 'OTHER_MEMORY_WRITE';
  return 'OTHER';
}
export function summarizeResponse(operation, status, body, jsonParsed=true) {
  const permitted = new Set(['AUTH_LOGIN','AUTH_ME','EXECUTIVE_READ','STATE_READ','MEMORY_READ','FIXTURE_WRITE','OWNER_DECISION_WRITE','NATIVE_DEFER_WRITE','OTHER_MEMORY_WRITE','OTHER']);
  return {
    operation:permitted.has(operation) ? operation : 'OTHER',
    status:Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    jsonParsed:jsonParsed === true,
    bodyType:boundedType(body),
    errorKind:body?.error === undefined ? 'NONE' : errorKinds.get(body.error) || 'UNRECOGNIZED_UPSTREAM_ERROR',
    resultType:boundedType(body?.result), resultIdType:boundedType(body?.result?.id),
    created:typeof body?.result?.created === 'boolean' ? body.result.created : null,
    grantsAuthority:typeof body?.grantsAuthority === 'boolean' ? body.grantsAuthority : null,
    dataType:boundedType(body?.data), dataIdType:boundedType(body?.data?.id),
    recordVersion:integer(body?.data?.version),
    eventCount:Array.isArray(body?.data?.events) ? integer(body.data.events.length) : null,
    readStatus:['AVAILABLE','UNAVAILABLE','DEGRADED','STALE'].includes(body?.status) ? body.status : null,
  };
}
export function summarizeFailure(error) {
  return {code:codes.has(error?.message) ? error.message : 'UNCLASSIFIED_EXCEPTION', exceptionType:['Error','TimeoutError','SyntaxError','AssertionError'].includes(error?.name) ? error.name : 'OTHER'};
}
