import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FinancialCentre, hash, type Entry } from '../../finance/financial-centre.js';
import { configureIsolatedBirth, readIsolatedBirth, projectBirthPeriod, type BirthCutover } from '../../finance/work8-birth-cutover.js';
const workspace='work8-twin:birth-exam';
const config:BirthCutover={workspace,ownerId:'owner',periodId:'birth-1',cutoff:'2026-01-02T00:00:00Z',mode:'ISOLATED_EXAMINATION',allocation:'ELAPSED_SERVICE_TIME_INTEGER_REMAINDER'};
// Explicit injected accounting fixtures. No provider evidence or real launch is claimed.
function cost(id:string,start:string,end:string,amount:number,patch:Record<string,unknown>={}):Entry[]{
 const command={id,type:'cost' as const,data:{entityId:id,provider:'exam',service:'fixture',category:'TECHNOLOGY' as const,classification:'FIXED' as const,stage:'INVOICED' as const,amountMicro:amount,taxMicro:0,creditMicro:0,currency:'USD',periodStart:start,periodEnd:end,sourceIds:[],authenticity:'REAL' as const,evidence:[],attribution:{project:'exam',environment:'isolated',workload:'exam',purpose:'cutover',allocationBps:10000,allocationReason:'fixture'},...patch}};
 const e={...command,workspace,actor:'owner',at:'2026-01-01T00:00:00Z',digest:hash(command)} as Entry;
 return [e,{id:'review-'+id,type:'review',workspace,actor:'owner',at:e.at,digest:hash(id),data:{target:id,decision:'APPROVE',reason:'injected isolated fixture',evidenceConfirmed:true}}];
}
test('half-open cutover, fixed prepaid allocation, late bills/corrections and currency conservation',()=>{
 const before=cost('before','2026-01-01T23:59:59Z',config.cutoff,100);
 const after=cost('after',config.cutoff,'2026-01-02T00:00:01Z',200);
 const prepaid=cost('prepaid','2026-01-01T00:00:00Z','2026-01-03T00:00:00Z',301,{stage:'SETTLED'});
 const simulated=cost('twin',config.cutoff,'2026-01-03T00:00:00Z',999999,{authenticity:'SYNTHETIC'});
 const all=[...before,...after,...prepaid,...simulated];const original=hash(all);
 const zero=projectBirthPeriod(all,config,config.cutoff);assert.ok(zero.allocation.every(x=>x.liveMicro===0));
 const report=projectBirthPeriod(all,config,'2026-01-03T00:00:00Z');
 assert.equal(report.allocation.find(x=>x.id==='before')?.liveMicro,0);assert.equal(report.allocation.find(x=>x.id==='after')?.liveMicro,200);
 assert.deepEqual(report.allocation.filter(x=>x.id==='prepaid').map(x=>[x.preLaunchMicro,x.liveMicro,x.futureMicro]),[[150,151,0]]);
 assert.deepEqual(report.excludedSimulatedIds,['twin']);assert.equal(hash(all),original);assert.equal(report.archive.entries.length,all.length);
 assert.equal(report.openingPosition.obligationsReceivablesPrepayments.length,3);assert.ok(report.conservation);
 const late=cost('late','2026-01-01T00:00:00Z',config.cutoff,50).map(e=>({...e,at:'2026-01-02T01:00:00Z'}));
 const corrected=cost('corrected','2026-01-01T00:00:00Z',config.cutoff,70,{entityId:'late',replaces:'late'}).map(e=>({...e,at:'2026-01-02T02:00:00Z'}));
 const revised=projectBirthPeriod([...all,...late,...corrected],config,'2026-01-03T00:00:00Z');
 assert.equal(revised.allocation.find(x=>x.entityId==='late')?.preLaunchMicro,70);assert.equal(revised.allocation.filter(x=>x.entityId==='late').length,1);
 assert.equal(revised.archive.entries.length,all.length+4);assert.ok(revised.conservation);
 assert.throws(()=>projectBirthPeriod([{...before[0]!,workspace:'live'}],config,config.cutoff),/CROSS_WORKSPACE/);
});
test('persistent immutable cutover survives cold reopen and old journal writer; owner and live scope refused',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'birth-')),file=path.join(dir,'finance.sqlite');let centre=new FinancialCentre(file);
 try{
  const before=hash(centre.entries(workspace));const receipt=configureIsolatedBirth(centre,config);assert.equal(hash(centre.entries(workspace)),before);
  assert.deepEqual(configureIsolatedBirth(centre,config),receipt);
  assert.throws(()=>configureIsolatedBirth(centre,{...config,periodId:'other'}),/IMMUTABLE/);
  assert.throws(()=>configureIsolatedBirth(centre,{...config,workspace:'ws_empire_1'}));
  centre.close();centre=new FinancialCentre(file);assert.equal(readIsolatedBirth(centre,workspace,'owner',config.cutoff).configDigest,receipt.digest);
  centre.append(workspace,'owner',{id:'post-upgrade',type:'provider',data:{id:'exam',name:'exam',category:'test',commissioned:'NO',mandatory:false,billingAccess:'UNAVAILABLE',note:'fixture'}});
  const report=readIsolatedBirth(centre,workspace,'owner','2099-01-01T00:00:00Z');assert.equal(report.archive.entries.length,1);assert.equal(report.liveActivation,false);
  assert.throws(()=>readIsolatedBirth(centre,workspace,'other',config.cutoff),/OWNER_MISMATCH/);
 }finally{centre.close();fs.rmSync(dir,{recursive:true,force:true});}
});
