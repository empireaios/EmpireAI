import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
const require=createRequire(import.meta.url),repo=path.resolve(import.meta.dirname,'../..');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const api=relative=>import(new URL('../../backend/dist/'+relative,import.meta.url));

/** Run actual Fastify readiness hooks before inspecting the application-owned
 * lazy execution store. No alternate store or seeded execution receipts. */
export async function readyActualExecutionStore(application,host,primary,deadline){
 const remaining=deadline-Date.now();assert.ok(remaining>0,'HH4_ACTUAL_EXECUTION_DEADLINE');
 let timer;
 try{await Promise.race([application.app.ready(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('HH4_ACTUAL_EXECUTION_DEADLINE')),remaining);})]);}
 finally{clearTimeout(timer);}
 const file=primary+'.mission-execution.sqlite';
 for(;;){
  assert.ok(Date.now()<deadline,'HH4_ACTUAL_EXECUTION_DEADLINE');
  const diagnostics=host.getMissionAuthorityExecutionDiagnostics();
  assert.equal(diagnostics.enabled,true,'HH4_ACTUAL_EXECUTION_ADAPTER_REQUIRED');
  assert.equal(diagnostics.running,true,'HH4_ACTUAL_EXECUTION_RUNNER_REQUIRED');
  assert.equal(diagnostics.paused,false,'HH4_ACTUAL_EXECUTION_RUNNER_PAUSED');
  assert.equal(diagnostics.lastError,null,'HH4_ACTUAL_EXECUTION_STORAGE_FAILURE');
  assert.equal(diagnostics.recoveryError,null,'HH4_ACTUAL_EXECUTION_RECOVERY_FAILURE');
  if(fs.existsSync(file))return file;
  await new Promise(resolve=>setTimeout(resolve,Math.min(25,Math.max(1,deadline-Date.now()))));
 }
}

/** Only the new examination worker calls this, before final runtime readiness.
 * Writes use the real domain adapters. All new records are explicitly synthetic;
 * no provider call, live grant, commerce execution or claimed owner action occurs.
 * This inventory is an initialization oracle, not restoration/replay acceptance.
 */
export async function initializeActualGeneratedDomains(application,root,source){
 assert.equal(process.env.NODE_ENV,'test');assert.equal(process.env.EMPIRE_ENGINEERING_TEST_MODE,'true');
 assert.equal(process.env.EMPIRE_RUNTIME_PROFILE,'LOCKED_COMMISSIONING_V1');
 assert.equal(process.env.RAILWAY_VOLUME_MOUNT_PATH,root);assert.equal(fs.realpathSync(root),root);
 const generated=path.dirname(root);assert.match(path.basename(generated),/^work8-generated-capture-/);
 assert.equal(path.basename(root),'volume');assert.equal(fs.statSync(generated).mode&0o777,0o700);
 assert.equal(fs.statSync(generated).uid,process.getuid());
 assert.equal(process.env.DATABASE_PATH,path.join(root,'commissioning','empireai-brain.db'));
 assert.equal(process.env.SHADOW_CEO_DATA_DIR,path.join(root,'shadow'));
 assert.match(source,/^[a-f0-9]{40}$/);
 assert.equal(require(path.join(repo,'deployment/runtime-revision.cjs')).resolveRuntimeRevision(repo,undefined),source);
 for(const name of ['RAILWAY_DEPLOYMENT_ID','RAILWAY_ENVIRONMENT','RAILWAY_ENVIRONMENT_NAME','VERCEL'])assert.ok(!process.env[name]);
 for(const [name,value]of Object.entries(process.env))if(value&&/(?:API_KEY|ACCESS_TOKEN|SECRET_ACCESS_KEY|PROXY)$/i.test(name))throw Error('HH4_EXTERNAL_CREDENTIAL');
 assert.equal(fs.readFileSync('/proc/net/route','utf8').trim().split('\n').length,1);
 assert.ok(fs.readFileSync('/proc/net/ipv6_route','utf8').trim().split('\n').every(row=>!row||row.trim().endsWith('lo')));
 const now=Date.now(),at=new Date(now).toISOString(),workspace='synthetic:hh4',id='hh4_'+path.basename(generated).replace(/[^a-zA-Z0-9_-]/g,'_');
 const inventory={classification:'LABELLED_SYNTHETIC_INITIALIZATION',source,root,workspace,at,domains:{},paidInference:0,externalEffects:0,restorationAccepted:false,replayAccepted:false};
 const c=relative=>path.join(root,'commissioning',relative);
 const record=(name,value)=>{inventory.domains[name]={publicReadback:value,sha256:hash(value)};};

 const {IntelligenceStore}=await api('intelligence/store.js');
 const intelligence=new IntelligenceStore(c('intelligence.sqlite'));
 const observation={id,source:'HH4_SYNTHETIC_RECOVERY_EXAMINATION',classification:'SYNTHETIC',grantsAuthority:false};
 intelligence.put(workspace,'recovery_observations',id,observation);assert.deepEqual(intelligence.get(workspace,'recovery_observations',id),observation);record('intelligence',observation);

 const {InstitutionalMemory}=await api('institutional-memory/store.js');
 const memory=new InstitutionalMemory(c('pillow-institutional.sqlite'));
 const decision=memory.captureDecision(workspace,{request:id,session:id,question:'[SYNTHETIC_MEMORY_TEST] Preserve this recovery examination observation.',answer:'Synthetic recovery observation only; no commercial decision or execution.',influences:[]});
 const remembered=memory.get(workspace,decision.id);assert.equal(remembered.origin.authenticity,'SYNTHETIC');record('institutional',remembered);

 const client=await application.brain.taskQueue.queue.client;
 const requests=await api('runtime/pillow-chat-request-store.js');
 requests.configureChatRequestStore(client,{requireRedisDurability:true});
 const accepted=await requests.acceptDurableChatRequestClaim({requestId:id,sessionId:id,idempotencyKey:id,message:'Synthetic recovery record; do not execute inference.',ownerId:'hh4-examination',workspaceId:workspace});
 await requests.completeChatRequest(accepted.request.requestId,{kind:'HH4_SYNTHETIC',text:'Generated recovery record',paidInference:0,externalEffects:0});
 const request=await requests.getChatRequest(accepted.request.requestId);assert.equal(request.status,'COMPLETED');assert.notEqual(request.queued,true);record('requests',request);
 const {archivePillowRequest}=await api('runtime/pillow-request-receipts.js');archivePillowRequest(request);
 const receiptDb=new DatabaseSync(c('pillow-request-receipts.sqlite'),{readOnly:true,allowExtension:false});
 try{const row=receiptDb.prepare('SELECT body FROM receipts WHERE workspace=? AND request=?').get(workspace,id);assert.ok(row);const receipt=JSON.parse(row.body);assert.equal(receipt.status,request.status);assert.deepEqual(receipt.finalResult,request.finalResult);assert.equal(receipt.requestId,id);inventory.domains.requests.sqliteReceipt={publicReadback:receipt,sha256:hash(receipt)};}finally{receiptDb.close();}

 const {ReasoningState}=await api('orchestration/pillow-host/reasoning-state.js');
 const reasoning=new ReasoningState(c('pillow-reasoning.sqlite'));
 const turns=[{role:'user',content:'[SYNTHETIC] Recovery examination record.',timestamp:at,requestId:id},{role:'assistant',content:'[SYNTHETIC] Stored without paid inference.',timestamp:at,requestId:id}];
 reasoning.save({workspaceId:workspace,sessionId:id,conversationHistory:turns});assert.deepEqual(reasoning.load(workspace,id),turns);record('reasoning',reasoning.load(workspace,id));

 const {AdvisorStore}=await api('advisor/store.js');const {packageFormat}=await api('advisor/package.js');
 const advisor=new AdvisorStore(c('communications.sqlite'));
 advisor.import(workspace,'hh4-examination',{...packageFormat.example,id,createdAt:at,correlationId:id,payload:{text:'Synthetic HH4 recovery record; no external delivery or owner endorsement.'}});
 const communication=advisor.get(workspace,id);assert.equal(communication.status,'COMPLETED');assert.equal(JSON.parse(communication.result).externalEffect,false);record('communications',communication);

 const {inferenceLedger}=await api('brain/llm/locked-inference.js');
 const calls=inferenceLedger(c('openai-october-2026.sqlite'),db=>db.prepare('SELECT * FROM calls ORDER BY id').all());
 assert.equal(calls.length,0,'A generated HH4 root must contain no provider calls');record('liveCostCentre',calls);

 const {FinancialCentre}=await api('finance/financial-centre.js');
 const finance=new FinancialCentre(path.join(root,'finance/evidence.sqlite'));
 try{finance.append(workspace,'hh4-examination',{id,type:'cost',data:{entityId:id,provider:'hh4-synthetic',service:'Recovery record',category:'TECHNOLOGY',classification:'FIXED',stage:'ESTIMATED',amountMicro:1,currency:'SGD',taxMicro:0,creditMicro:0,periodStart:new Date(now-1000).toISOString(),periodEnd:at,sourceIds:[],authenticity:'SYNTHETIC',evidence:[{kind:'OTHER',reference:'synthetic:hh4',sha256:hash(id),observedAt:at}],attribution:{project:'HH4',environment:'isolated',workload:'recovery',purpose:'Synthetic state retention',allocationBps:10000,allocationReason:'Synthetic examination'}}});const entries=finance.entries(workspace);assert.ok(entries.every(e=>e.type==='cost'&&e.data.authenticity==='SYNTHETIC'));record('financialEvidence',entries);}finally{finance.close();}

 const {GovernedCommerceStore}=await api('runtime/commerce-runtime/governed/store.js');
 const {GovernedCommerceEngine}=await api('runtime/commerce-runtime/governed/engine.js');
 const {acceptanceScenario}=await api('runtime/commerce-runtime/governed/scenario.js');
 const commerce=new GovernedCommerceStore(path.join(root,'commerce/runtime.sqlite'));
 try{const scenario=acceptanceScenario(workspace,'hh4-examination',now);const first=scenario.steps[0];assert.equal(first.command.type,'research');new GovernedCommerceEngine(commerce,()=>now).execute(first.actor,{id,missionId:id,expectedVersion:0,command:first.command});const history=commerce.history(workspace,id);assert.equal(history.length,1);assert.equal(history[0].classification,'SYNTHETIC');assert.equal(history[0].externalEffects,0);assert.equal(history[0].state.approval,undefined);record('commerce',history);}finally{commerce.close();}

 const {AssuranceControlPlane}=await import('../../backend/src/assurance/control-plane.mjs');
 const control=new AssuranceControlPlane({root:c(''),revision:source});
 try{control.observe(workspace,{id,capability:'hh4_initialization',status:'NOT_CHECKED',summary:'Synthetic initialization; independent runtime examination remains pending.',synthetic:true,evidence:{source}});record('assurance',control.get(workspace,'probe',id));}finally{control.close();}
 // Do not forge independent inspector freshness inside the tested worker.
 inventory.externalInspectorRequiredBeforeCapture=true;

 const {openShadowCeoRepository}=await api('orchestration/shadow-ceo/repository.js');
 const {buildObjective}=await api('orchestration/shadow-ceo/control-plane.js');
 const shadow=openShadowCeoRepository({dbPath:path.join(root,'shadow/shadow-ceo.db')});
 try{const objective=buildObjective({workspaceId:workspace,title:'Synthetic recovery objective',statement:'Preserve state without executing commerce.',idempotencyKey:id,source:'synthetic',economicClaim:'none'});shadow.save(objective);shadow.persist();record('shadow',shadow.getById(objective.id));}finally{shadow.close();}
 const authority=await api('orchestration/shadow-ceo-authority/repository/json-authority-store.js');
 const prior=authority.loadAuthorityStore();assert.equal(prior.approvals.length,0);
 // The canonical new loop is running in SYNTHETIC mode; running is not a live grant.
 // Preserve that actual state and prove denial, rather than inventing an owner stop.
 const {createInitialLoopState,attemptExternalAction}=await api('orchestration/shadow-ceo-authority/gate.js');
 const {LIVE_SIDE_EFFECT_KINDS}=await api('orchestration/shadow-ceo-authority/types.js');
 assert.deepEqual(prior.loop,createInitialLoopState('SYNTHETIC'));
 for(const kind of LIVE_SIDE_EFFECT_KINDS){const denied=attemptExternalAction({kind,mode:prior.loop.mode,loopRunning:prior.loop.running,approvalStatus:'none',approvalSource:'deterministic_store',authorized:false});assert.equal(denied.decision,'BLOCKED');assert.equal(denied.reason,'LIVE_SIDE_EFFECT_FORBIDDEN');}
 authority.saveAuthorityStore(prior);record('authority',authority.loadAuthorityStore());
 const owners=await api('orchestration/shadow-ceo-integration/request-owner.js');
 const instruction='Synthetic HH4 state preservation; no live effects.';
 owners.persistRequestOwner({requestId:id,runId:id,correlationId:id,completeInstruction:instruction,suppliedProducts:[],eligibilityRules:{synthetic:true},requestedBusinessOperation:'NONE',permittedActions:[],prohibitedActions:[],requestedAnswerFormat:{expectedLineCount:null,fieldNames:[],requiredToken:null,prohibitsExtraProse:false,template:'unspecified'},operatingMode:'SYNTHETIC',birthStatus:'NOT_BORN',realCommerceAuthority:'unauthorized',createdAt:at,workspaceId:workspace,instructionDigest:owners.instructionDigest(workspace,instruction)});record('requestOwners',owners.getRequestOwner(id));

 // Use the application's single already scheduled Pillow host. A second mission
 // runtime over the same snapshot would be a stale competing writer.
 const {getPillowHost}=await api('orchestration/pillow-host/pillow-host.js');
 const host=getPillowHost(),primary=process.env.DATABASE_PATH,hostDeadline=Date.now()+120000;
 while(host.getStatus().lifecycle!=='running'){
  assert.ok(Date.now()<hostDeadline,'HH4_ACTUAL_HOST_NOT_READY');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 // These optional observers are not scheduled in a headless worker. Their
 // initialized empty stores must not silently grow outside the capture inventory.
 assert.equal(process.env.PILLOW_HEADLESS_OBSERVERS_ENABLED??'', '');
 assert.deepEqual(fs.readdirSync(path.join(root,'pillow-visual-memory')).sort(),['records']);
 assert.deepEqual(fs.readdirSync(path.join(root,'pillow-visual-memory/records')),[]);
 assert.deepEqual(fs.readdirSync(path.join(root,'pillow-session-continuity')),[]);
 inventory.emptyInitializedStores=['pillow-visual-memory/records','pillow-session-continuity'];
 host.createMissionRuntimeMission({missionName:'Synthetic HH4 unapproved recovery mission',workers:[],pillowConfirmed:false,grandKingApproved:false,highRisk:false});record('missions',host.getMissionRuntimeHistory());
 const executionFile=await readyActualExecutionStore(application,host,primary,hostDeadline);
 const executionDb=new DatabaseSync(executionFile,{readOnly:true,allowExtension:false});
 try{record('execution',{scope:executionDb.prepare('SELECT * FROM execution_meta ORDER BY id').all(),jobs:executionDb.prepare('SELECT * FROM execution_jobs ORDER BY job_id').all(),events:executionDb.prepare('SELECT * FROM execution_events ORDER BY seq').all(),note:'Actual application-owned execution store; authorized pending replay remains a separate mandatory examination.'});}finally{executionDb.close();}
 const {getDatabase}=await api('brain/database.js');
 const brain=getDatabase(),tableNames=brain.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(row=>row.name);
 const canonicalTables=Object.fromEntries(tableNames.map(name=>[name,brain.prepare('SELECT * FROM "'+String(name).replaceAll('"','""')+'"').all().map(row=>({...row})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]));
 record('brain',{canonicalTables,path:primary,scope:'Actual initialized in-memory SQL.js state; held-epoch disk equality remains required.'});
 inventory.lifecycleMarkers=['commissioning/openai-october-2026.sqlite.initialized','finance/evidence.sqlite.initialized','commerce/runtime.sqlite.initialized'];
 for(const marker of inventory.lifecycleMarkers)assert.ok(fs.statSync(path.join(root,marker)).isFile());
 inventory.captureInventoryRequiresCommerceMarker=true;
 inventory.completeOperationalRecovery=false;
 return inventory;
}
