import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {collectDurableOmissions} from '../../assurance/live-sources.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');

test('only exact independently bound successor closure resolves retained operational failure',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'resolution-')),now=20000000,w='ws_empire_1';
 const failed={requestId:'failed',workspaceId:w,sessionId:'session',status:'FAILED_FATAL',failureClass:'APPLICATION_FAILURE',updatedAt:new Date(now-7200000).toISOString(),finalResult:{message:'Failed'}};
 const successor={requestId:'successor',workspaceId:w,sessionId:'session',status:'COMPLETED',finalResult:{message:'Answer'}};
 const mission={id:'followup',status:'COMPLETE',requestId:'successor',predecessors:['failed'],predecessorProof:[{id:'failed',hash:hash({status:failed.status,failureClass:failed.failureClass,finalResult:failed.finalResult,responseText:'Failed'})}],assessment:{requestId:'successor',answer:'Answer',sha256:hash('Answer'),at:new Date(now-3600000).toISOString()},closure:{at:new Date(now-3000000).toISOString(),owner:'owner',predecessorsPreserved:true,advisorReadback:{requestId:'successor',assessmentHash:hash('Answer'),attestedBy:'AUTHENTICATED_OWNER'}}};
 const reason=path.join(dir,'reasoning.sqlite'),requests=path.join(dir,'pillow-request-receipts.sqlite'),intelligence=path.join(dir,'intelligence.sqlite');
 let db=new DatabaseSync(reason);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');db.close();
 db=new DatabaseSync(requests);db.exec('CREATE TABLE receipts(workspace TEXT,body TEXT)');for(const r of [failed,successor])db.prepare('INSERT INTO receipts VALUES(?,?)').run(w,JSON.stringify(r));db.close();
 db=new DatabaseSync(intelligence);db.exec('CREATE TABLE objects(workspace TEXT,kind TEXT,body TEXT)');db.close();
 const save=()=>{const d=new DatabaseSync(intelligence);d.exec('DELETE FROM objects');d.prepare('INSERT INTO objects VALUES(?,?,?)').run(w,'investigations',JSON.stringify(mission));d.close();};
 const redis={scan:async()=>['0',['pillow:chatreq:v2:failed']],get:async()=>JSON.stringify(failed)};
 const check=async()=>reconcileSnapshot(await collectDurableOmissions({redis,filename:reason,resolutionDirectory:dir,now}),now,120000);
 try{
  save();const before=fs.readFileSync(requests);let verdict=await check();assert.equal(verdict.status,'PASS');assert.equal(verdict.historicalFailuresResolved,1);assert.deepEqual(fs.readFileSync(requests),before);assert.equal(failed.status,'FAILED_FATAL');
  const original=structuredClone(mission);
  for(const mutate of [m=>m.status='FAILED',m=>m.predecessorProof[0].hash='0'.repeat(64),m=>m.closure.advisorReadback.requestId='other',m=>m.assessment.answer='corrupt',m=>m.closure.at=new Date(now+1).toISOString(),m=>m.predecessors=[],m=>m.closure.predecessorsPreserved=false]){
   Object.assign(mission,structuredClone(original));mutate(mission);save();assert.equal((await check()).status,'FAIL');
  }
  Object.assign(mission,original);save();failed.finalResult.message='Changed';assert.equal((await check()).status,'FAIL');
  fs.unlinkSync(intelligence);await assert.rejects(check());
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
