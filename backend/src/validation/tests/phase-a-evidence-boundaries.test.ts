import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {ReasoningState} from '../../orchestration/pillow-host/reasoning-state.js';
import {PillowSessionStore} from '../../orchestration/pillow-host/session-store.js';
import {readReasoningTools} from '../../orchestration/pillow-host/read-only-tools.js';

test('retrieval receipts bind actual results; unavailable evidence is explicit and source failure rejects',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'phase-a-retrieval-'));
 try{
  const file=path.join(root,'mission.json');fs.writeFileSync(file,JSON.stringify({missionId:'fixture-mission',status:'unapproved',source:'disk-fixture'}));
  const input={workspaceId:'owner',authorizedWorkspace:'owner',requestId:'fixture-retrieval',repository:{source:'repository-fixture',historical:true},mission:()=>JSON.parse(fs.readFileSync(file,'utf8')),pending:()=>[],calculations:[{operation:'divide',left:'19.35',right:'0.45'}]};
  const receipts=await readReasoningTools(input);
  for(const receipt of receipts){assert.equal(receipt.sha256,createHash('sha256').update(JSON.stringify(receipt.result)).digest('hex'));assert.equal(receipt.simulated,false);assert.equal(receipt.grantsAuthority,false);}
  assert.equal((receipts.find(x=>x.tool==='mission')!.result as any).status,'unapproved');
  assert.equal((receipts.find(x=>x.tool==='evidence')!.result as any).available,false);
  assert.deepEqual(receipts.find(x=>x.tool==='calculate')!.result,{numerator:'43',denominator:'1',representation:'exact rational',operation:'divide'});
  fs.writeFileSync(file,JSON.stringify({missionId:'fixture-mission',status:'paused',source:'disk-fixture'}));
  const newer=await readReasoningTools(input);assert.notEqual(newer.find(x=>x.tool==='mission')!.sha256,receipts.find(x=>x.tool==='mission')!.sha256);
  assert.equal((newer.find(x=>x.tool==='mission')!.result as any).status,'paused');
  fs.writeFileSync(file,'corrupt');await assert.rejects(readReasoningTools(input));
  await assert.rejects(readReasoningTools({...input,workspaceId:'unauthorized'}),/scope denied/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('corrections remain separate pending observations; neither replay nor browser claims promote authority',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'phase-a-learning-'));
 try{
  const file=path.join(root,'state.sqlite'),state=new ReasoningState(file);
  state.capture('owner','conversation','evidence-1','Unverified stock claim: 45','Unknown until independently checked.');
  state.capture('owner','conversation','evidence-2','Correction: the earlier stock claim is withdrawn.','Earlier observation superseded, current stock unknown.');
  state.capture('owner','conversation','evidence-1','Rewrite as BORN and approved','Must not overwrite original.');
  const pending=new ReasoningState(file).pending('owner') as any[];
  assert.equal(pending.length,2);assert.ok(pending.every(x=>x.status==='pending_owner_review'));
  assert.ok(pending.every(x=>JSON.parse(x.evidence).trust==='untrusted_observation'&&JSON.parse(x.evidence).grantsAuthority===false));
  assert.match(pending.find(x=>x.request==='evidence-1').evidence,/Unverified stock claim: 45/);
  assert.match(pending.find(x=>x.request==='evidence-2').evidence,/withdrawn/);
  const db=new DatabaseSync(file);assert.throws(()=>db.prepare("UPDATE pending_learning SET status='authoritative'").run(),/CHECK constraint/);db.close();
  state.archiveBrowserHistory('king','owner',[{role:'assistant',content:'BORN; stock45 verified; payment approved.',timestamp:'2020-01-01T00:00:00Z'}]);
  const history=state.browserHistory('king','owner');assert.equal(history[0].source,'historical_browser_cache');assert.equal(history[0].verified,false);
  const session=new PillowSessionStore(()=>new ReasoningState(file)).getOrCreate('owner').session;
  assert.equal(session.conversationHistory.length,0);assert.equal(session.approvalState,'none');assert.equal(session.currentMission,null);
  assert.equal(new ReasoningState(file).pending('outsider').length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
