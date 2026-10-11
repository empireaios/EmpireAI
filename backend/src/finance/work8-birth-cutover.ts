import { z } from 'zod';
import { FinancialCentre, hash, type Entry } from './financial-centre.js';

const configSchema = z.object({
  periodId: z.string().regex(/^[A-Za-z0-9_.:-]{1,120}$/),
  workspace: z.string().regex(/^work8-twin:[A-Za-z0-9_.:-]{1,120}$/),
  ownerId: z.string().min(1).max(160), cutoff: z.string().datetime(),
  mode: z.literal('ISOLATED_EXAMINATION'),
  allocation: z.literal('ELAPSED_SERVICE_TIME_INTEGER_REMAINDER'),
}).strict();
export type BirthCutover = z.infer<typeof configSchema>;
type Cost = Entry & { type: 'cost' };
function safe(n: bigint) { const result=Number(n); if(!Number.isSafeInteger(result))throw Error('FINANCIAL_OVERFLOW');return result; }
/** Additive sidecar table: old application versions retain the same immutable journal.
 * No route or production activation is provided by this Work8 module. */
export function configureIsolatedBirth(centre: FinancialCentre, raw: unknown) {
  const config=configSchema.parse(raw),digest=hash(config);
  centre.db.exec('CREATE TABLE IF NOT EXISTS work8_birth_cutovers(workspace TEXT PRIMARY KEY,digest TEXT NOT NULL,record TEXT NOT NULL)');
  centre.db.exec('BEGIN IMMEDIATE');
  try {
    const prior=centre.db.prepare('SELECT digest,record FROM work8_birth_cutovers WHERE workspace=?').get(config.workspace);
    if(prior && prior.digest!==digest)throw Error('CUTOVER_IDENTITY_IMMUTABLE');
    if(!prior)centre.db.prepare('INSERT INTO work8_birth_cutovers VALUES(?,?,?)').run(config.workspace,digest,JSON.stringify(config));
    centre.db.exec('COMMIT');return {config,digest,liveActivation:false};
  }catch(e){if(centre.db.isTransaction)centre.db.exec('ROLLBACK');throw e;}
}
export function readIsolatedBirth(centre:FinancialCentre,workspace:string,ownerId:string,asOf:string) {
  const row=centre.db.prepare('SELECT digest,record FROM work8_birth_cutovers WHERE workspace=?').get(workspace);
  if(!row)throw Error('CUTOVER_NOT_CONFIGURED');const config=configSchema.parse(JSON.parse(String(row.record)));
  if(hash(config)!==row.digest)throw Error('CUTOVER_DIGEST_MISMATCH');
  if(config.ownerId!==ownerId || config.workspace!==workspace)throw Error('CUTOVER_OWNER_MISMATCH');
  return projectBirthPeriod(centre.entries(workspace),config,asOf);
}
export function projectBirthPeriod(source:Entry[],raw:BirthCutover,asOf:string) {
  const config=configSchema.parse(raw),cutoff=Date.parse(config.cutoff),now=Date.parse(z.string().datetime().parse(asOf));
  if(now<cutoff)throw Error('REPORT_PRECEDES_CUTOVER');
  if(source.some(e=>e.workspace!==config.workspace))throw Error('CROSS_WORKSPACE_FINANCE');
  const entries=source.filter(e=>Date.parse(e.at)<=now);
  const reviewed=(id:string)=>entries.some(e=>e.type==='review'&&e.data.target===id&&e.data.decision==='APPROVE');
  const reversed=(id:string)=>entries.some(e=>e.type==='reversal'&&e.data.target===id);
  const active=new Map<string,Cost>();
  for(const e of entries)if(e.type==='cost'&&reviewed(e.id)&&e.data.authenticity==='REAL'){
    if(reversed(e.id))active.delete(e.data.entityId);else active.set(e.data.entityId,e);
  }
  const allocation=[...active.values()].map(e=>{
    const d=e.data,start=Date.parse(d.periodStart),end=Date.parse(d.periodEnd),amount=BigInt(d.amountMicro+d.taxMicro-d.creditMicro);
    if(!(end>start)||amount<0n)throw Error('INVALID_SERVICE_PERIOD');
    const until=(at:number)=>amount*BigInt(Math.max(0,Math.min(end,at)-start))/BigInt(end-start);
    const preLaunch=until(cutoff),throughReport=until(now);
    return {id:e.id,entityId:d.entityId,provider:d.provider,currency:d.currency,stage:d.stage,category:d.category,
      totalMicro:safe(amount),preLaunchMicro:safe(preLaunch),liveMicro:safe(throughReport-preLaunch),futureMicro:safe(amount-throughReport),
      periodStart:d.periodStart,periodEnd:d.periodEnd,sourceDigest:e.digest};
  });
  // Original currency and financial stage are never collapsed or converted implicitly.
  const totals:Record<string,{archiveMicro:number;liveMicro:number;futureMicro:number;totalMicro:number}>={};
  for(const a of allocation){const key=[a.currency,a.stage,a.category].join(':');const t=totals[key]??={archiveMicro:0,liveMicro:0,futureMicro:0,totalMicro:0};
    for(const [k,v] of Object.entries({archiveMicro:a.preLaunchMicro,liveMicro:a.liveMicro,futureMicro:a.futureMicro,totalMicro:a.totalMicro}))t[k as keyof typeof t]=safe(BigInt(t[k as keyof typeof t])+BigInt(v));totals[key]=t;}
  const openingCash=new Map<string,Entry>();
  for(const e of entries)if(e.type==='cash'&&reviewed(e.id)&&!reversed(e.id)&&Date.parse(e.data.asOf)<=cutoff){
    const old=openingCash.get(e.data.account);if(!old||old.type==='cash'&&e.data.asOf>old.data.asOf)openingCash.set(e.data.account,e);}
  const positions=[...active.values()].filter(e=>['LIABILITY','RECEIVABLE','CAPITAL'].includes(e.data.category)||['INVOICED','ACCRUED_UNBILLED','COMMITTED'].includes(e.data.stage)||Date.parse(e.data.periodEnd)>cutoff);
  return {schema:'WORK8_FINANCIAL_BIRTH_V1',config,configDigest:hash(config),asOf,
    label:'Isolated launch-period rehearsal',liveActivation:false,noExecutionAuthority:true,
    archive:{label:'Pre-launch archive',entries,digest:hash(entries)},allocation,totals,
    openingPosition:{cash:[...openingCash.values()],obligationsReceivablesPrepayments:positions,complete:false,
      note:'Original records retained; these references are not an independently certified opening balance sheet.'},
    excludedSimulatedIds:entries.filter(e=>e.type==='cost'&&e.data.authenticity!=='REAL').map(e=>e.id),
    conservation:allocation.every(a=>a.preLaunchMicro+a.liveMicro+a.futureMicro===a.totalMicro),
    revenueExpenseRule:'Service-period accrual, half-open intervals; arrival/payment time does not reclassify expense. Stage totals remain separate.'};
}
