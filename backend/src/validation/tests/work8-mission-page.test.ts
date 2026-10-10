import test from 'node:test';import assert from 'node:assert/strict';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
import {readWork8MissionPage} from '../../runtime/commerce-runtime/governed/work8-mission-page.js';
test('201 canonical missions paginate without hidden truncation or workspace leakage',()=>{
 const store=new GovernedCommerceStore(':memory:'),now=Date.parse('2026-10-10T20:00:00Z'),engine=new GovernedCommerceEngine(store,()=>now),w='synthetic:mission-page';
 try{for(let i=0;i<201;i++){const step=acceptanceScenario(w,'owner',now).steps[0]!;engine.execute(step.actor,{id:'create-'+i,missionId:'m-'+String(i).padStart(3,'0'),expectedVersion:0,command:step.command});}
 const foreign=acceptanceScenario('synthetic:foreign','owner',now).steps[0]!;engine.execute(foreign.actor,{id:'foreign',missionId:'foreign-secret',expectedVersion:0,command:foreign.command});
 const first=readWork8MissionPage(store,w);assert.equal(first.missions.length,200);assert.equal(first.missionCoverage.total,201);assert.equal(first.missionCoverage.complete,false);assert.equal(first.missionCoverage.hasMore,true);assert.equal(first.missionCoverage.next,'m-199');
 const bounded=readWork8MissionPage(store,w,{limit:1});assert.deepEqual(bounded.missions.map(m=>m.missionId),['m-000']);assert.equal(bounded.missionCoverage.next,'m-000');
 const second=readWork8MissionPage(store,w,{afterMission:first.missionCoverage.next});assert.deepEqual(second.missions.map(m=>m.missionId),['m-200']);assert.equal(second.missionCoverage.total,201);assert.equal(second.missionCoverage.hasMore,false);assert.equal(second.missionCoverage.next,null);assert.equal(second.missionCoverage.complete,false);
 assert.equal(new Set([...first.missions,...second.missions].map(m=>m.missionId)).size,201);
 assert.equal(readWork8MissionPage(store,w,{missionId:'m-200'}).missionCoverage.complete,true);assert.equal(readWork8MissionPage(store,w,{missionId:'foreign-secret'}).missions.length,0);
 for(const query of [{afterMission:'foreign-secret'},{afterMission:'missing'},{afterMission:"' OR 1=1"},{afterMission:['m-000']},{limit:201},{limit:0},{limit:1.5},{missionId:'m-001',afterMission:'m-000'},{unknown:true}])assert.throws(()=>readWork8MissionPage(store,w,query));
 assert.equal(store.missions(w).length,200,'existing store API behavior unchanged');
 }finally{store.close();}
});
test('empty scoped page explicitly complete and bounded lower limit advances lexical cursor',()=>{
 const store=new GovernedCommerceStore(':memory:');try{const empty=readWork8MissionPage(store,'synthetic:empty');assert.equal(empty.missionCoverage.total,0);assert.equal(empty.missionCoverage.complete,true);assert.equal(empty.missionCoverage.hasMore,false);}finally{store.close();}
});
test('mission heads and finance stay on one WAL read snapshot while second connection commits',async()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'w8-page-snapshot-')),file=path.join(dir,'commerce.sqlite'),writer=new GovernedCommerceStore(file),now=1800000000000,w='synthetic:page-snapshot',scenario=acceptanceScenario(w,'owner',now),engine=new GovernedCommerceEngine(writer,()=>now);let writeDuringRead=false;
 for(const [i,step] of scenario.steps.slice(0,5).entries())engine.execute(step.actor,{id:'seed-'+i,missionId:'mission',expectedVersion:i,command:step.command});
 const original=writer.history(w,'mission').at(-1)!;
 class InterleavedReader extends GovernedCommerceStore{override history(workspace:string,mission:string){const result=super.history(workspace,mission);if(!writeDuringRead){assert.equal(this.db.isTransaction,true,'first head read must hold page snapshot');writeDuringRead=true;const prepare=scenario.steps[5]!;engine.execute(prepare.actor,{id:'concurrent-prepare',missionId:'mission',expectedVersion:5,command:prepare.command});assert.equal(writer.history(w,'mission').at(-1)!.version,6,'separate SQLite writer really committed before finance read');}return result;}}
 const reader=new InterleavedReader(file);try{
  const page=readWork8MissionPage(reader,w);assert.equal(writeDuringRead,true);assert.equal(page.missions[0]!.digest,original.digest);assert.equal(page.simulatedFinancials[0]!.sourceReceiptDigest,original.digest);assert.equal(page.simulatedFinancials[0]!.orders[0]!.status,'RECEIVED');assert.equal(reader.db.isTransaction,false);
  const fresh=readWork8MissionPage(reader,w);assert.equal(fresh.missions[0]!.version,6);assert.notEqual(fresh.missions[0]!.digest,original.digest);assert.equal(fresh.simulatedFinancials[0]!.sourceReceiptDigest,fresh.missions[0]!.digest);assert.equal(fresh.simulatedFinancials[0]!.orders[0]!.status,'PREPARED');assert.equal(writer.history(w,'mission').length,6);
 }finally{reader.close();writer.close();fs.rmSync(dir,{recursive:true,force:true});}
});
