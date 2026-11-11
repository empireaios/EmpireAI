import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** The native derived payable is -(supplierPayable ?? 0), so an empty payable
 * is IEEE negative zero. JSON transports it as positive zero. Normalize only
 * that computed presentation field; persisted events, rows and receipts stay exact. */
export function copyRecordsWithCanonicalLiabilityZero(records){
 const canonical=structuredClone(records);
 for(const record of canonical)for(const order of record.finance.financial.orders){
  if(Object.is(order.liabilityMinor,-0))order.liabilityMinor=0;
 }
 return canonical;
}
/** V112's independently reviewed source-defined clock distinction, scoped only to
 * business records: all persisted records/amounts remain exact. Validate the two
 * computed presentation fields before omitting them from cross-time equality. */
export function canonicalBusinessRecords(records,plans,observation){
 const {startedAtMs:start,completedAtMs:end}=observation;assert.ok(Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&end>=start&&end-start<=60000);assert.equal(records.length,plans.length);const observations=[];
 for(const record of records){const f=record.finance,p=plans.find(x=>x.missionId===record.missionId);assert.ok(p?.plan);const plan=p.plan,n=p.events.length,cutoff=Date.parse(f.financial.cutoffAt),next=plan.events[n],threshold=next?Date.parse(next.at):null;
  assert.equal(plan.mission,record.missionId);assert.equal(plan.sourceDigest,f.sourceReceiptDigest);assert.equal(digest(plan),p.planDigest);assert.equal(p.planDigest,f.planDigest);assert.deepEqual(f.events,p.events);assert.deepEqual(f.assumptions,plan.assumptions);assert.deepEqual(p.events,plan.events.slice(0,n));assert.equal(f.recordedEvents,n);assert.equal(f.totalEvents,plan.events.length);assert.equal(f.lifecycleComplete,n===plan.events.length);assert.ok(Number.isFinite(cutoff)&&cutoff>=start&&cutoff<=end);assert.ok(p.events.every(e=>Date.parse(e.at)<=cutoff));assert.deepEqual(f.financial.pending,[]);
  const projected=p.events.map(e=>({id:e.id,orderId:e.orderId,sourceReceiptDigest:e.sourceReceiptDigest,kind:e.kind,currency:e.currency,minor:e.minor,at:e.at,classification:e.classification,...(e.assumptionRef===undefined?{}:{assumptionRef:e.assumptionRef})}));assert.equal(digest(projected),f.financial.eventDigest);
  const status=n===plan.events.length?'COMPLETE_SIMULATION':threshold<=cutoff?'IN_PROGRESS':threshold>end?'WAITING_SIMULATED_PAYOUT_OR_EVENT':null;assert.ok(status,'AMBIGUOUS_STATUS_READ_INTERVAL');assert.equal(f.status,status);observations.push({missionId:record.missionId,cutoffAt:f.financial.cutoffAt,status,startedAtMs:start,completedAtMs:end,planDigest:p.planDigest,eventsDigest:digest(p.events)});
 }
 const canonical=copyRecordsWithCanonicalLiabilityZero(records);for(const r of canonical){delete r.finance.status;delete r.finance.financial.cutoffAt;}return {canonical,observations};
}
export function checkpointPlans(pack){return pack.tables.work8_sim_finance_plans.map(row=>({missionId:row.mission,plan:JSON.parse(row.record),planDigest:row.digest,events:pack.tables.work8_sim_finance_events.filter(e=>e.workspace===row.workspace&&e.mission===row.mission).sort((a,b)=>a.sequence-b.sequence).map(e=>JSON.parse(e.record))}));}
