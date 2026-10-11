import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {FinancialCentre} from '../../finance/financial-centre.js';
import {Work8CostIntelligence, type ReadOnlyBillingPort} from '../../finance/work8-cost-intelligence.js';
const observedAt='2026-01-01T00:00:00Z',workspace='work8-twin:cost-exam';
const evidence=(kind:string)=>({kind,reference:'injected billing fixture',sha256:'a'.repeat(64),observedAt});
const resource={id:'service1',provider:'vercel',service:'fixture hosting',state:'ACTIVE',billingOwner:'team-fixture',fixedAmountMicro:20000000,currency:'USD',renewalAt:'2026-02-01T00:00:00Z',cancellationTerms:'Fixture monthly cancellation',sharedAllocationBps:null,evidenceRef:'fixture://service',observedAt};
function charge(id:string,patch:Record<string,unknown>={}){return {id,data:{entityId:'usage-1',provider:'vercel',service:'fixture',category:'TECHNOLOGY',classification:'VARIABLE',stage:'ACCRUED_UNBILLED',amountMicro:100,currency:'USD',periodStart:observedAt,periodEnd:'2026-01-02T00:00:00Z',authenticity:'SYNTHETIC',evidence:[evidence('USAGE')],sourceIds:['usage-source-1'],attribution:{project:'exam',environment:'isolated',workload:'fixture',purpose:'cost examination'},...patch}};}
const port=(value:unknown):ReadOnlyBillingPort=>({provider:'vercel',discover:async()=>['service1'],read:async()=>value});
test('autonomous discovery, fixed fee with zero usage, delayed invoices, spike, dedupe, renewal, cancellation and restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cost-intel-')),file=path.join(dir,'finance.sqlite');let centre=new FinancialCentre(file);
 try{
  let intel=new Work8CostIntelligence(centre,workspace,'owner',()=>Date.parse('2026-01-10T00:00:00Z'));
  await intel.examine('zero-usage',[port({resource,costs:[],complete:true,exceptions:[]})]);assert.equal(intel.projection().resources[0]!.fixedAmountMicro,20000000);assert.deepEqual(intel.projection().totalsByCurrencyStageAuthenticity,{});
  await intel.examine('first',[port({resource,costs:[charge('usage')],complete:true,exceptions:[]})]);
  let result=intel.projection();assert.equal(result.resources[0]!.fixedAmountMicro,20000000);assert.ok(result.alerts.some(a=>a.code==='FX_UNAVAILABLE'));assert.ok(result.alerts.some(a=>a.code==='DELAYED_INVOICE'));assert.ok(result.alerts.some(a=>a.code==='SHARED_ALLOCATION_UNKNOWN'));
  const invoice=charge('invoice',{stage:'INVOICED',amountMicro:300,replaces:'usage',invoiceNumber:'fixture-invoice',evidence:[evidence('INVOICE')]});
  await intel.examine('second',[port({resource:{...resource,renewalAt:'2026-02-05T00:00:00Z'},costs:[invoice],complete:true,exceptions:[]})]);
  result=intel.projection();assert.equal(result.totalsByCurrencyStageAuthenticity['USD:INVOICED:SYNTHETIC'],300);assert.equal(result.totalsByCurrencyStageAuthenticity['USD:ACCRUED_UNBILLED:SYNTHETIC'],undefined);assert.ok(result.alerts.some(a=>a.code==='VARIABLE_COST_SPIKE_REVIEW'));assert.ok(result.alerts.some(a=>a.code==='RENEWAL_CHANGED'));
  const paid=charge('paid',{stage:'SETTLED',amountMicro:300,replaces:'invoice',invoiceNumber:'fixture-invoice',paymentDate:observedAt,evidence:[evidence('INVOICE'),evidence('PAYMENT')]});
  await intel.examine('paid',[port({resource,costs:[paid],complete:true,exceptions:[]})]);
  assert.equal(intel.projection().totalsByCurrencyStageAuthenticity['USD:SETTLED:SYNTHETIC'],300);
  let reads=0;await intel.examine('paid',[{provider:'vercel',discover:async()=>{reads++;return [];},read:async()=>null}]);assert.equal(reads,0);await assert.rejects(()=>intel.examine('paid',[]),/IDENTITY_CONFLICT/);
  await intel.examine('duplicate',[port({resource,costs:[charge('duplicate',{entityId:'different',stage:'INVOICED',invoiceNumber:'fixture-invoice',evidence:[evidence('INVOICE')]})],complete:true,exceptions:[]})]);
  assert.ok(intel.projection().alerts.some(a=>a.code==='INVALID_OR_CONFLICTING_BILLING_EVIDENCE'));assert.equal(centre.entries(workspace).filter(e=>e.type==='cost').length,3);
  await intel.examine('cancel',[port({resource:{...resource,state:'CANCELLED'},costs:[],complete:true,exceptions:[]})]);
  const before=intel.projection();centre.close();centre=new FinancialCentre(file);intel=new Work8CostIntelligence(centre,workspace,'owner',()=>Date.parse('2026-01-10T00:00:00Z'));
  assert.deepEqual(intel.projection(),before);assert.equal(before.resources[0]!.state,'CANCELLED');assert.equal(before.continuousLiveActivation,false);
  assert.equal(centre.snapshot(workspace).costs.length,0,'discovered fixtures never become reviewed actuals');
 }finally{centre.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('outage, inactive provider, unknown subscription, cross-provider data and owner scope remain explicit',async()=>{
 const centre=new FinancialCentre(':memory:');try{
  const intel=new Work8CostIntelligence(centre,workspace,'owner',()=>Date.parse('2026-01-10T00:00:00Z'));
  await intel.examine('outage',[{provider:'railway',discover:async()=>{throw Error('provider down');},read:async()=>null}]);
  await intel.examine('unknown',[port({resource:{...resource,fixedAmountMicro:null,billingOwner:null},costs:[],complete:false,exceptions:['INVOICE_UNAVAILABLE']})]);
  const r=intel.projection();assert.ok(r.alerts.some(a=>a.code==='PROVIDER_UNAVAILABLE_OR_INVALID_DISCOVERY'));assert.ok(r.alerts.some(a=>a.code==='UNKNOWN_ACTIVE_COST_OR_OWNER'));assert.deepEqual(r.totalsByCurrencyStageAuthenticity,{});
  await intel.examine('inactive',[{provider:'keepa',discover:async()=>['future'],read:async()=>({resource:{...resource,id:'future',provider:'keepa',state:'INACTIVE',fixedAmountMicro:null},costs:[],complete:false,exceptions:[]})}]);
  assert.ok(!intel.projection().alerts.some(a=>a.provider==='keepa'&&a.code==='UNKNOWN_ACTIVE_COST_OR_OWNER'));
  await intel.examine('mismatch',[port({resource:{...resource,provider:'railway'},costs:[],complete:true,exceptions:[]})]);
  assert.ok(intel.projection().alerts.some(a=>a.code==='INVALID_OR_CONFLICTING_BILLING_EVIDENCE'));
  assert.throws(()=>new Work8CostIntelligence(centre,'ws_empire_1','owner'));
  assert.throws(()=>new Work8CostIntelligence(centre,workspace,'other').projection(),/INTEGRITY/);
  await intel.examine('restored-provider',[{provider:'railway',discover:async()=>['railway-service'],read:async()=>({resource:{...resource,id:'railway-service',provider:'railway',observedAt:'2026-01-10T00:00:00Z'},costs:[],complete:true,exceptions:[]})}]);
  const recovered=intel.projection();assert.ok(!recovered.alerts.some(a=>a.provider==='railway'&&a.code==='PROVIDER_UNAVAILABLE_OR_INVALID_DISCOVERY'));
  assert.ok(recovered.historicalExceptions.some(a=>a.provider==='railway'&&a.code==='PROVIDER_UNAVAILABLE_OR_INVALID_DISCOVERY'));
  await intel.examine('empty-provider',[{provider:'railway',discover:async()=>[],read:async()=>null}]);assert.ok(intel.projection().alerts.some(a=>a.provider==='railway'&&a.code==='NO_DISCOVERED_RESOURCES_COST_UNKNOWN'));
 }finally{centre.close();}
});

test('cached successful read cannot clear a newer outage; fresh read clears it after restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cost-freshness-')),file=path.join(dir,'finance.sqlite');
 let centre=new FinancialCentre(file),now=Date.parse('2026-01-10T00:00:00Z');
 const current=()=>new Work8CostIntelligence(centre,workspace,'owner',()=>now);
 const outage=()=>current().projection().alerts.some(a=>a.provider==='vercel'&&a.code==='PROVIDER_UNAVAILABLE_OR_INVALID_DISCOVERY');
 try{
  await current().examine('fresh-initial',[port({resource:{...resource,observedAt:new Date(now).toISOString()},costs:[],complete:true,exceptions:[]})]);
  now+=60000;
  await current().examine('new-outage',[{provider:'vercel',discover:async()=>{throw Error('offline');},read:async()=>null}]);
  assert.equal(outage(),true);
  now+=60000;
  await current().examine('cached-success',[port({resource:{...resource,observedAt:new Date(now-120000).toISOString()},costs:[],complete:true,exceptions:[]})]);
  assert.equal(outage(),true,'old readback must retain current outage');
  centre.close();centre=new FinancialCentre(file);assert.equal(outage(),true,'restart must retain unresolved outage');
  await current().examine('fresh-success',[port({resource:{...resource,observedAt:new Date(now).toISOString()},costs:[],complete:true,exceptions:[]})]);
  assert.equal(outage(),false);
  assert.ok(current().projection().historicalExceptions.some(a=>a.provider==='vercel'&&a.code==='PROVIDER_UNAVAILABLE_OR_INVALID_DISCOVERY'));
 }finally{centre.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('reversed discovery charges stay excluded through replacement and restart',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cost-reversal-')),file=path.join(dir,'finance.sqlite');let centre=new FinancialCentre(file);
 const intel=()=>new Work8CostIntelligence(centre,workspace,'owner',()=>Date.parse('2026-01-10T00:00:00Z'));
 try{
  await intel().examine('original',[port({resource,costs:[charge('first')],complete:true,exceptions:[]})]);
  centre.append(workspace,'owner',{id:'reverse-first',type:'reversal',data:{target:'first',reason:'Incorrect usage evidence'}});
  assert.deepEqual(intel().projection().totalsByCurrencyStageAuthenticity,{});
  assert.ok(!intel().projection().alerts.some(a=>['FX_UNAVAILABLE','DELAYED_INVOICE'].includes(a.code)));
  await intel().examine('replacement',[port({resource,costs:[charge('second',{replaces:'first',amountMicro:300})],complete:true,exceptions:[]})]);
  assert.equal(intel().projection().totalsByCurrencyStageAuthenticity['USD:ACCRUED_UNBILLED:SYNTHETIC'],300);
  centre.append(workspace,'owner',{id:'reverse-second',type:'reversal',data:{target:'second',reason:'Replacement also voided'}});
  centre.close();centre=new FinancialCentre(file);
  assert.deepEqual(intel().projection().totalsByCurrencyStageAuthenticity,{});
  assert.equal(centre.entries(workspace).length,4,'historical charges and reversals retained');
 }finally{centre.close();fs.rmSync(dir,{recursive:true,force:true});}
});

test('a rejected multi-charge observation cannot partially commit its journal or observation',async()=>{
 const centre=new FinancialCentre(':memory:');try{
  const intel=new Work8CostIntelligence(centre,workspace,'owner');
  const result=await intel.examine('bad-batch',[port({resource,costs:[charge('valid-first'),charge('invalid-second',{entityId:'second',provider:'railway',sourceIds:['second-source']})],complete:true,exceptions:[]})]);
  assert.ok(result.exceptions.some(e=>e.code==='INVALID_OR_CONFLICTING_BILLING_EVIDENCE'));
  assert.deepEqual(centre.entries(workspace),[]);
  assert.equal(intel.projection().resources.length,0);
  assert.deepEqual(intel.projection().totalsByCurrencyStageAuthenticity,{});
  const good=await intel.examine('good-batch',[port({resource,costs:[charge('valid-first'),charge('valid-second',{entityId:'second',sourceIds:['second-source']})],complete:true,exceptions:[]})]);
  assert.equal(good.observations.length,1);assert.equal(centre.entries(workspace).length,2);
  assert.equal(intel.projection().totalsByCurrencyStageAuthenticity['USD:ACCRUED_UNBILLED:SYNTHETIC'],200);
 }finally{centre.close();}
});
