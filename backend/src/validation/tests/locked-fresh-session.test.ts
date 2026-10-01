import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../../app.js';
import { env } from '../../config/env.js';
import { configureValidationEnvironment } from '../harness.js';

test('fresh authenticated conversation is allowed while Birth and commerce stay locked', async () => {
  configureValidationEnvironment();
  const previous = process.env.EMPIRE_RUNTIME_PROFILE;
  process.env.EMPIRE_RUNTIME_PROFILE = 'LOCKED_COMMISSIONING_V1';
  process.env.EMPIRE_ENGINEERING_TEST_MODE = 'true';
  const empire = await buildApp({ startWorkers: false, startScheduler: false, pillowEnabled: true, earlyListen: true });
  try {
    const create = (cookie?: string, workspaceId?: string) => empire.app.inject({
      method: 'POST', url: '/api/pillow/session',
      headers: cookie ? { cookie } : {}, payload: { forceNew: true, ...(workspaceId ? { workspaceId } : {}) },
    });
    assert.equal((await create()).statusCode, 401);
    const login = await empire.app.inject({ method: 'POST', url: '/auth/login',
      payload: { email: env.FOUNDER_EMAIL, password: env.FOUNDER_PASSWORD } });
    assert.equal(login.statusCode, 200);
    const cookie = String(login.headers['set-cookie']);
    assert.equal((await create(cookie, 'unauthorized-workspace')).statusCode, 403);
    const session = await create(cookie);
    assert.equal(session.statusCode, 201, session.body);
    const sessionId = session.json().session.sessionId;
    assert.ok(sessionId);
    const history = await empire.app.inject({ method: 'GET', url: `/api/pillow/history?sessionId=${encodeURIComponent(sessionId)}`, headers: { cookie } });
    assert.equal(history.statusCode, 200, history.body);
    for (const url of ['/pillow-commissioning/birth/authorise', '/api/pillow/mission-runtime/execute', '/brain/dispatch', '/marketplace-publishing/execute', '/amazon/inventory', '/amazon/price', '/live-cj-fulfillment/submit-live', '/payments', '/fulfilment', '/providers/write']) {
      const denied = await empire.app.inject({ method: 'POST', url, headers: { cookie }, payload: { approved: true, force: true } });
      assert.equal(denied.statusCode, 423, url);
      assert.equal(denied.json().birth, 'NOT_BORN');
      assert.equal(denied.json().commerce, 'LOCKED');
    }
    assert.equal((await empire.app.inject({ method: 'DELETE', url: `/api/pillow/session?sessionId=${encodeURIComponent(sessionId)}`, headers: { cookie } })).statusCode, 423);
  } finally {
    await empire.shutdown();
    if (previous === undefined) delete process.env.EMPIRE_RUNTIME_PROFILE;
    else process.env.EMPIRE_RUNTIME_PROFILE = previous;
  }
});
