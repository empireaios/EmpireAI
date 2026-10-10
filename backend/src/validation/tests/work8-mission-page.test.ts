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
