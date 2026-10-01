import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getPillowHost } from '../../orchestration/pillow-host/index.js';
import { ReasoningState } from '../../orchestration/pillow-host/reasoning-state.js';
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
    // Exercise the actual host glue, substituting only paid inference transport.
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'host-reasoning-'));
    fs.mkdirSync(path.join(root,'commissioning'));
    const savedPath=process.env.DATABASE_PATH,savedMount=process.env.RAILWAY_VOLUME_MOUNT_PATH;
    const host:any=getPillowHost(),savedLayer=host.llmLayer;
    try {
      process.env.RAILWAY_VOLUME_MOUNT_PATH=root;
      process.env.DATABASE_PATH=path.join(root,'commissioning','empireai-brain.db');
      let captured:any;
      host.llmLayer={listAvailableProviders:()=>['openai'],complete:async(input:any)=>{
        captured=input;return {content:'The repository excerpt is historical evidence, not permission.',provider:'openai',model:'offline-fixture',mode:'general_intelligence',usage:{promptTokens:1,completionTokens:1,totalTokens:2}};
      }};
      const result=await host.routePrompt({workspaceId:session.json().session.workspaceId,sessionId,message:'Explain the repository architecture.',reasoningOnly:true,actor:env.FOUNDER_EMAIL,correlationId:'host-integration-fixture'});
      assert.ok(captured,'actual host reached inference boundary');
      assert.ok(captured.operationalContext.slices.length>0,'repository reads reached inference');
      assert.match(captured.operationalContext.repositoryKnowledgeAnswer,/mission-runtime/);
      assert.equal(typeof captured.executeReadOnlyCalls,'function');
      assert.ok(result.readOnlyReceipts.length>=3);
      const state=new ReasoningState(path.join(root,'commissioning','pillow-reasoning.sqlite'));
      assert.equal(state.pending(session.json().session.workspaceId).length,1);
      assert.ok(state.load(session.json().session.workspaceId,sessionId)?.some(t=>t.role==='assistant'));
    } finally {
      host.llmLayer=savedLayer;
      if(savedPath===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=savedPath;
      if(savedMount===undefined)delete process.env.RAILWAY_VOLUME_MOUNT_PATH;else process.env.RAILWAY_VOLUME_MOUNT_PATH=savedMount;
      fs.rmSync(root,{recursive:true,force:true});
    }

  } finally {
    await empire.shutdown();
    if (previous === undefined) delete process.env.EMPIRE_RUNTIME_PROFILE;
    else process.env.EMPIRE_RUNTIME_PROFILE = previous;
  }
});
