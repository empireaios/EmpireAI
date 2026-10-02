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
  const historyRoot=fs.mkdtempSync(path.join(os.tmpdir(),'authenticated-history-'));
  fs.mkdirSync(path.join(historyRoot,'commissioning'));
  const originalMount=process.env.RAILWAY_VOLUME_MOUNT_PATH,originalPath=process.env.DATABASE_PATH;
  process.env.RAILWAY_VOLUME_MOUNT_PATH=historyRoot;
  process.env.DATABASE_PATH=path.join(historyRoot,'commissioning','empireai-brain.db');
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
    const phone = await empire.app.inject({method:'POST',url:'/api/pillow/session',headers:{cookie},payload:{historicalBrowserTurns:[{role:'assistant',content:'Historical device statement, not verified inference',timestamp:'2026-01-01T00:00:00.000Z'}]}});
    assert.equal(phone.statusCode,201,phone.body);assert.equal(phone.json().historicalArchiveAccepted,true);
    const desktopLogin=await empire.app.inject({method:'POST',url:'/auth/login',payload:{email:env.FOUNDER_EMAIL,password:env.FOUNDER_PASSWORD}});
    const desktopCookie=String(desktopLogin.headers['set-cookie']);
    const desktop=await empire.app.inject({method:'POST',url:'/api/pillow/session',headers:{cookie:desktopCookie},payload:{}});
    assert.equal(desktop.statusCode,201,desktop.body);assert.equal(desktop.json().session.sessionId,phone.json().session.sessionId);
    const shared=await empire.app.inject({method:'GET',url:`/api/pillow/history?sessionId=${desktop.json().session.sessionId}`,headers:{cookie:desktopCookie}});
    assert.equal(shared.statusCode,200);assert.equal(shared.json().historicalArchive.length,1);assert.equal(shared.json().historicalArchive[0].verified,false);assert.equal(shared.json().history.length,0);
    assert.equal((await empire.app.inject({method:'GET',url:`/api/pillow/history?sessionId=${desktop.json().session.sessionId}`})).statusCode,401);
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
      const intent='Compare two maintenance windows and identify unknowns.';
      const options={message:intent,capability:'critique',consultation:{providers:['anthropic','gemini'],justification:'Independent review of maintenance uncertainty'},calculations:[{operation:'multiply',left:'9.75',right:'4'}]};
      await host.routePrompt({workspaceId:session.json().session.workspaceId,sessionId,message:'/pillow-request '+JSON.stringify(options),reasoningOnly:true,actor:env.FOUNDER_EMAIL,correlationId:'envelope-general-fixture'});
      assert.equal(captured.reasoningPlan.message,intent);
      assert.deepEqual(captured.reasoningPlan.consultation,options.consultation);
      assert.ok(!captured.userMessage.includes('/pillow-request'));
      let failedAttempts=0;
      host.llmLayer={listAvailableProviders:()=>['anthropic'],complete:async()=>{failedAttempts++;throw Error('synthetic provider failure');}};
      const failed=await host.routePrompt({workspaceId:session.json().session.workspaceId,sessionId,message:intent,reasoningOnly:true,actor:env.FOUNDER_EMAIL,correlationId:'failed-inference-fixture'});
      assert.equal(failedAttempts,1);
      assert.deepEqual(failed.reasoningFailure,{code:'INFERENCE_FAILED',retryable:false});
      assert.equal(failed.degradedUsed,true);
      assert.match(failed.message,/could not complete this inference/);
      assert.doesNotMatch(failed.message,/Recommended first moves|Unsupported as established fact|synthetic provider failure/);

      // Exercise router -> real host -> durable transport as one failure path.
      // Only external provider HTTP is replaced; no paid inference is possible.
      const {LLMRouter}=await import('../../brain/llm/llm-router.js');
      const {createBrainLLMAdapter}=await import('../../orchestration/pillow-host/brain-llm-adapter.js');
      const {OpenAIIntegrationLayer}=await import('@empireai/pillow');
      const {executeReasoningProxy}=await import('../../runtime/pillow-durable-reasoning-worker.js');
      const {policyForFailure}=await import('../../runtime/pillow-chat-request-store.js');
      const {DatabaseSync}=await import('node:sqlite');
      const savedFetch=globalThis.fetch;
      const priorKeys=[process.env.OPENAI_API_KEY,process.env.ANTHROPIC_API_KEY];
      try {
        process.env.OPENAI_API_KEY='offline-only';process.env.ANTHROPIC_API_KEY='offline-only';
        const calls:string[]=[];
        globalThis.fetch=async(url)=>{calls.push(String(url));return Response.json({error:{status:'UNAVAILABLE'}},{status:503});};
        host.llmLayer=new OpenAIIntegrationLayer(createBrainLLMAdapter(new LLMRouter()));
        const input={workspaceId:session.json().session.workspaceId,sessionId,message:'/pillow-request '+JSON.stringify({message:'Explain why an observation is not approval.',capability:'reasoning'}),reasoningOnly:true,actor:env.FOUNDER_EMAIL,correlationId:'all-provider-terminal-fixture'};
        const terminal=await host.routePrompt(input);
        assert.equal(calls.length,2);assert.ok(calls[0].includes('openai'));assert.ok(calls[1].includes('anthropic'));
        assert.deepEqual(terminal.reasoningFailure,{code:'INFERENCE_FAILED',retryable:false});
        assert.doesNotMatch(terminal.message,/Recommended first moves|Unsupported as established fact/);
        const db=new DatabaseSync(path.join(root,'commissioning','openai-october-2026.sqlite'),{readOnly:true});
        const before=db.prepare('SELECT * FROM calls ORDER BY id').all();db.close();
        assert.equal(before.length,2);assert.ok(before.every((r:any)=>r.status==='failed_uncertain'&&r.reserved_micro_usd>0));
        let proxyCalls=0;
        globalThis.fetch=async()=>{proxyCalls++;return Response.json({result:terminal});};
        const proxy=await executeReasoningProxy({input:{kind:'reasoning',sessionToken:'offline-only',bodyText:'{}'},request:{requestId:'all-provider-terminal-fixture',leaseToken:1}} as any,9999);
        assert.equal(proxyCalls,1);assert.equal(proxy.ok,false);
        if(!proxy.ok){assert.equal(proxy.failureClass,'BRAIN_FATAL');assert.equal(policyForFailure(proxy.failureClass),'FAIL');}
        globalThis.fetch=async()=>{throw Error('Replay must never reach provider HTTP');};
        const replay=await host.routePrompt(input);
        assert.equal(replay.reasoningFailure.code,'INFERENCE_FAILED');
        const reopened=new DatabaseSync(path.join(root,'commissioning','openai-october-2026.sqlite'),{readOnly:true});
        assert.deepEqual(reopened.prepare('SELECT * FROM calls ORDER BY id').all(),before);reopened.close();
      } finally {
        globalThis.fetch=savedFetch;
        for(const [index,key]of ['OPENAI_API_KEY','ANTHROPIC_API_KEY'].entries()) {if(priorKeys[index]===undefined)delete process.env[key];else process.env[key]=priorKeys[index];}
      }

    } finally {
      host.llmLayer=savedLayer;
      if(savedPath===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=savedPath;
      if(savedMount===undefined)delete process.env.RAILWAY_VOLUME_MOUNT_PATH;else process.env.RAILWAY_VOLUME_MOUNT_PATH=savedMount;
      fs.rmSync(root,{recursive:true,force:true});
    }

  } finally {
    await empire.shutdown();
    if(originalPath===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=originalPath;
    if(originalMount===undefined)delete process.env.RAILWAY_VOLUME_MOUNT_PATH;else process.env.RAILWAY_VOLUME_MOUNT_PATH=originalMount;
    fs.rmSync(historyRoot,{recursive:true,force:true});
    if (previous === undefined) delete process.env.EMPIRE_RUNTIME_PROFILE;
    else process.env.EMPIRE_RUNTIME_PROFILE = previous;
  }
});
