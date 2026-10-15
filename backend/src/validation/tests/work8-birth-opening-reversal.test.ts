import test from 'node:test';
import assert from 'node:assert/strict';
import { FinancialCentre, hash } from '../../finance/financial-centre.js';
import { projectBirthPeriod, type BirthCutover } from '../../finance/work8-birth-cutover.js';
// Synthetic banking observations through the real append-only API. No actual funds.
const workspace='work8-twin:opening-reversal';
const config:BirthCutover={workspace,ownerId:'owner',periodId:'reversal-exam',cutoff:'2026-10-12T00:00:00Z',mode:'ISOLATED_EXAMINATION',allocation:'ELAPSED_SERVICE_TIME_INTEGER_REMAINDER'};
test('reversed latest opening balance cannot resurrect an older bank observation',()=>{
 const centre=new FinancialCentre(':memory:');
 try {
  const add=(id:string,asOf:string,balanceMicro:number)=>{
   centre.append(workspace,'owner',{id,type:'cash',data:{account:'isolated-bank',balanceMicro,currency:'SGD',asOf,evidence:{kind:'BANK',reference:'synthetic-opening-exam',sha256:'a'.repeat(64),observedAt:asOf}}});
   centre.append(workspace,'owner',{id:'review-'+id,type:'review',data:{target:id,decision:'APPROVE',reason:'Isolated fixture review',evidenceConfirmed:true}});
  };
  add('old','2026-10-10T00:00:00Z',9000000);
  add('latest','2026-10-11T00:00:00Z',1000000);
  assert.equal(projectBirthPeriod(centre.entries(workspace),config,'2099-01-01T00:00:00Z').openingPosition.cash[0]?.id,'latest');
  centre.append(workspace,'owner',{id:'reverse-latest',type:'reversal',data:{target:'latest',reason:'Isolated observation withdrawn'}});
  const source=centre.entries(workspace),digest=hash(source);
  assert.equal(centre.snapshot(workspace).cash.length,0);
  const report=projectBirthPeriod(source,config,'2099-01-01T00:00:00Z');
  assert.deepEqual(report.openingPosition.cash,[]);
  assert.equal(report.openingPosition.complete,false);
  assert.equal(report.liveActivation,false);
  assert.equal(hash(source),digest);
  assert.equal(report.archive.entries.length,5);
  add('replacement','2026-10-11T12:00:00Z',2000000);
  assert.equal(projectBirthPeriod(centre.entries(workspace),config,'2099-01-01T00:00:00Z').openingPosition.cash[0]?.id,'replacement');
 }finally{centre.close();}
});
