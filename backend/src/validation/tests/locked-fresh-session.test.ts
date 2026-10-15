import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getPillowHost } from '../../orchestration/pillow-host/index.js';
import { PillowSessionStore } from '../../orchestration/pillow-host/session-store.js';
import { IntelligenceStore } from '../../intelligence/store.js';
import { digest } from '../../intelligence/model.js';
import { sourceProductContext } from '../../intelligence/work8-product-context.js';
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
      // Exercise the existing host, actual SQLite persistence and authenticated history route.
      // Only provider transport is intercepted. The source is a retained genuine observation
      // replayed at its observation-era clock, never represented as current supplier evidence.
      const retained=JSON.parse(fs.readFileSync(new URL('../../../../docs/work8/source-authentic-readback.json',import.meta.url),'utf8'));
      const evidence=retained[0].data,observedAt=Date.parse('2026-10-10T18:40:00Z');
      const intelligence=new IntelligenceStore(path.join(root,'history-source.sqlite'),()=>observedAt);
      const principal={workspace:session.json().session.workspaceId,owner:login.json().user.id};
      assert.equal(typeof principal.owner,'string');
      intelligence.evidence(principal.workspace,evidence);
      const sources=[{id:evidence.id,envelopeDigest:digest(evidence)}];
      const sourceState={id:'cj:history-retained-variant',productId:evidence.subject.id,subject:{...evidence.subject,variant:evidence.facts.response.variants[0].vid,destination:'US'},status:'DEFERRED',sources,evidenceSnapshotDigest:digest(sources),jobs:[]};
      const body={id:'enrichment:00000001',sequence:1,previous:null,state:sourceState,at:observedAt},receipt={...body,digest:digest(body)};
      intelligence.put(principal.workspace,'work8_enrichment',sourceState.id,sourceState);
      intelligence.put(principal.workspace,'work8_enrichment_receipt',body.id,receipt);
      intelligence.put(principal.workspace,'work8_enrichment_head','head',{sequence:1,digest:receipt.digest});
      const bound=sourceProductContext(intelligence,principal,{kind:'SOURCE_DOSSIER',candidateId:sourceState.id},true);
      const expected=structuredClone(bound),productRequest='pcr_a8a8a8a8a8a8a8a8';
      captured=undefined;
      await host.routePrompt({workspaceId:principal.workspace,sessionId,message:'Explain this historical product and its unknown stock and freight.',reasoningOnly:true,actor:env.FOUNDER_EMAIL,correlationId:productRequest,workspaceContext:{screenPath:'/cockpit/products',screenId:'products',screenTitle:'Products',productContext:bound}});
      assert.ok(captured,'actual host product request reached intercepted inference');
      assert.ok(JSON.stringify(captured).includes(expected.reference.contextDigest),'original source pin reached inference input');
      const originalStore=host.sessionStore;
      try {
        // Force actual history route through a fresh store reading persisted bytes.
        host.sessionStore=new PillowSessionStore(()=>new ReasoningState(path.join(root,'commissioning','pillow-reasoning.sqlite')));
        intelligence.put(principal.workspace,'evidence',evidence.id,{...evidence,subject:{...evidence.subject,id:'later-changed-source'}});
        assert.throws(()=>sourceProductContext(intelligence,principal,expected.reference));
        const restored=await empire.app.inject({method:'GET',url:`/api/pillow/history?sessionId=${encodeURIComponent(sessionId)}`,headers:{cookie}});
        assert.equal(restored.statusCode,200,restored.body);
        const turn=restored.json().history.find((item:any)=>item.requestId===productRequest&&item.role==='user');
        assert.ok(turn,'original source-bound request retained after durable reload');
        assert.deepEqual(turn.productContext,expected);
        assert.equal(turn.productContext.qualification.supplier.stock,null);
        assert.equal(turn.productContext.qualification.supplier.freight.amount,null);
        assert.equal(turn.productContext.grantsAuthority,false);
        assert.equal(restored.json().approvalState,'none');
        assert.equal((await empire.app.inject({method:'GET',url:`/api/pillow/history?sessionId=${encodeURIComponent(sessionId)}`})).statusCode,401);
        assert.equal((await empire.app.inject({method:'GET',url:`/api/pillow/history?sessionId=${encodeURIComponent(sessionId)}&workspaceId=foreign`,headers:{cookie}})).statusCode,403);
      } finally { host.sessionStore=originalStore; }
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
