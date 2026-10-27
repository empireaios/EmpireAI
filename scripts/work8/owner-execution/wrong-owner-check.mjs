import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Exact immutable backend requires the named founder, not any authenticated admin. */
export function verifyWrongOwnerEvidence(evidence) {
  const {authenticated, ownerEmail, forbidden, beforeDigest, afterDigest} = evidence;
  assert.equal(authenticated.role, 'admin', 'WRONG_OWNER_ROLE_NOT_ESTABLISHED');
  assert.equal(authenticated.workspaceId, 'ws_empire_1', 'WRONG_OWNER_WORKSPACE_NOT_ESTABLISHED');
  assert.notEqual(authenticated.email, ownerEmail, 'WRONG_OWNER_MUST_BE_DISTINCT');
  assert.equal(authenticated.email, 'admin@work8.invalid', 'SYNTHETIC_ADMIN_REQUIRED');
  assert.equal(forbidden.length, 3, 'THREE_BOUNDARY_PROBES_REQUIRED');
  assert.deepEqual(forbidden.map(item => item.action), ['executive_read', 'memory_read', 'defer_write']);
  for (const item of forbidden) {
    assert.equal(item.status, 403, 'AUTHENTICATION_FAILURE_IS_NOT_OWNER_REJECTION');
    assert.equal(item.error, 'Owner access required', 'OWNER_GATE_REJECTION_REQUIRED');
  }
  assert.match(beforeDigest, /^[a-f0-9]{64}$/);
  assert.equal(afterDigest, beforeDigest, 'WRONG_OWNER_MUTATED_HISTORY');
  return {status:'PASS', scope:'AUTHENTICATED_SAME_WORKSPACE_ADMIN_IS_NOT_NAMED_FOUNDER', authenticatedRole:'admin', authenticationVerified:true, executiveRead:403, memoryRead:403, deferWrite:403, exactOwnerGateError:true, historyUnchanged:true, historyDigest:afterDigest, otherWorkspaceOrOtherFounderTested:false};
}

export async function examineWrongOwner({browser, frontend, target, ownerEmail, adminEmail, adminPassword, request, readOwnerRecord}) {
  assert.equal(frontend, 'http://localhost:43117');
  assert.equal(adminEmail, 'admin@work8.invalid');
  assert.ok(adminPassword && adminPassword.length >= 32, 'SYNTHETIC_ADMIN_CREDENTIAL_REQUIRED');
  const before = await readOwnerRecord();
  assert.equal(before.id, target);
  assert.equal(before.version, 1);
  const context = await browser.newContext({serviceWorkers:'block'});
  try {
    await context.route('**/*', route => new URL(route.request().url()).origin === frontend ? route.continue() : route.abort('blockedbyclient'));
    const login = await request(context, '/api/auth/login', {email:adminEmail, password:adminPassword});
    const me = await request(context, '/api/auth/me');
    assert.equal(login.user?.id, me.user?.id, 'ADMIN_SESSION_IDENTITY_MISMATCH');
    assert.equal(me.user?.email, adminEmail, 'ADMIN_SESSION_EMAIL_MISMATCH');
    const forbidden = [];
    for (const [action, route, body] of [
      ['executive_read', '/api/owner/advisor/executive', undefined],
      ['memory_read', '/api/owner/advisor/read?domain=memory&id='+target, undefined],
      ['defer_write', '/api/owner/advisor/memory', {action:'owner_decision', id:'work8-unauthorized-admin-defer', target, expectedVersion:1, decision:'DEFER', note:'Synthetic unauthorized admin attempt; must be rejected before any durable mutation.'}],
    ]) {
      // request checks the real HTTP status; exact error separates owner rejection
      // from CSRF, rate-limit, missing-session or other incidental refusals.
      const result = await request(context, route, body, 403);
      forbidden.push({action, status:403, error:result.error});
    }
    const after = await readOwnerRecord();
    return verifyWrongOwnerEvidence({authenticated:me.user, ownerEmail, forbidden, beforeDigest:digest(before), afterDigest:digest(after)});
  } finally {
    await context.close();
  }
}
