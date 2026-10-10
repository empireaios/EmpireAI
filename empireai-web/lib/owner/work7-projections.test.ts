import test from 'node:test';
import assert from 'node:assert/strict';
import {infrastructureSummary,providerCommand,archivedNote} from './cost-centre';
import {findingGroups,linkedOpportunities,intelligencePeriod} from './intelligence-view';
const now=new Date('2026-10-10T17:00:00Z');
const charge=(id:string,stage:string,amount:number,extra={})=>({id,sgdMicro:amount,data:{category:'TECHNOLOGY',authenticity:'REAL',stage,provider:'test',periodStart:'2026-10-01',periodEnd:'2026-11-01',...extra}});
test('Infrastructure separates stages and excludes unallocated team amounts',()=>{
 const costs=[charge('invoice','INVOICED',10),charge('paid','SETTLED',20),charge('usage','ACCRUED_UNBILLED',4),charge('estimate','ESTIMATED',7),charge('commit','COMMITTED',9),charge('fixture','INVOICED',999,{authenticity:'SYNTHETIC'})];
 const s=infrastructureSummary(costs,now);
 assert.deepEqual([s.mtd,s.ytd,s.payable,s.settled,s.accrued,s.estimated,s.committed],[30,30,10,20,4,7,9]);
 assert.equal(infrastructureSummary([...costs,charge('shared','INVOICED',100,{attribution:{project:'TEAM_SHARED_UNALLOCATED'}})],now).mtd,null);
 assert.equal(infrastructureSummary([],now).payable,null);
});
test('Renewals require recorded dates; directory changes preserve connection authority',()=>{
 const costs=[charge('paid','SETTLED',20,{dueDate:'2026-10-12'}),charge('invoice','INVOICED',10,{dueDate:'2026-10-13'}),charge('renew','SETTLED',30,{renewalDate:'2026-10-15'})];
 assert.deepEqual(infrastructureSummary(costs,now).future.map(c=>c.id),['invoice','renew']);
 const p={id:'test',name:'Test',category:'AI',commissioned:'YES',mandatory:true,billingAccess:'MANUAL',note:'source'};
 const c=providerCommand(p,{category:'Hosting',note:archivedNote+'source'},'stable-retry');
 assert.equal(c.data.commissioned,'YES');assert.equal(c.data.mandatory,true);assert.equal(c.data.billingAccess,'MANUAL');assert.equal(p.note,'source');
});
test('Grouping preserves distinct facts and all original evidence identities',()=>{
 const a={id:'a',eye:'SUPPLIER',provider:'CJ',subject:{id:'sku'},facts:{stock:1},observedAt:'2026-10-09'};
 const b={...a,id:'b',observedAt:'2026-10-10'},c={...a,id:'c',facts:{stock:0}};
 const groups=findingGroups([a,b,c]);assert.equal(groups.length,2);assert.deepEqual(groups[0].map(e=>e.id),['b','a']);
 assert.equal(linkedOpportunities(groups[0],[{evidenceRefs:['a']}]).length,1);assert.equal(linkedOpportunities(groups[1],[{evidenceRefs:['a']}]).length,0);
 assert.equal(new Date(intelligencePeriod('1',now.getTime()).start).toISOString(),'2026-10-10T16:00:00.000Z');
 assert.equal(new Date(intelligencePeriod('90',now.getTime()).start).toISOString(),'2026-09-30T16:00:00.000Z');
});
