import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import type {FastifyInstance,FastifyReply,FastifyRequest} from 'fastify';
import type {createAuthMiddleware} from '../../../auth/middleware.js';

type RecordValue=Record<string,any>;
type Principal={workspace:string;owner:string};
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const key=(value:unknown,max=100):value is string=>typeof value==='string'&&new RegExp('^[A-Za-z0-9_.:-]{1,'+max+'}$').test(value);
const fail=():never=>{throw Error('RECOVERY_HISTORY_UNVERIFIED');};
const check=(condition:unknown):void=>{if(!condition)fail();};
const time=(value:unknown)=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const integer=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0;
const label=(value:unknown)=>typeof value==='string'&&/^[A-Z_]{1,48}$/.test(value);
const kinds=new Set(['SALE','DISCOUNT','COGS','FREIGHT','FEE','DUTY','REFUND','CHARGEBACK','SUPPLIER_CREDIT','SETTLEMENT','PAYOUT_HOLD','PAYOUT_RELEASE','BANK_RECEIPT','SUPPLIER_PAYMENT']);

/** Exactly one selected session. No caller-supplied owner, workspace or database path. */
export function recoverySessionQuery(raw:unknown):string {
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).join(',')!=='sessionId'||!key((raw as RecordValue).sessionId))throw Error('INVALID_RECOVERY_QUERY');
 return (raw as {sessionId:string}).sessionId;
}

/** Dedicated canonical reader: never constructs the writable commerce runtime. */
export function readRecoveryCommerce(principal:Principal,rawQuery:unknown) {
 const sessionId=recoverySessionQuery(rawQuery);
 check(key(principal.owner)&&key(principal.workspace));
 const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
 if(!root||!path.isAbsolute(root)||fs.realpathSync(root)!==root)throw Error('RECOVERY_HISTORY_UNAVAILABLE');
 const directory=path.join(root,'commerce'),filename=path.join(directory,'runtime.sqlite');
 if(fs.realpathSync(directory)!==directory||fs.realpathSync(filename)!==filename||!fs.lstatSync(filename).isFile()||!fs.lstatSync(filename+'.initialized').isFile())throw Error('RECOVERY_HISTORY_UNAVAILABLE');
 const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});
 let bytes=0;
 const rows=(sql:string,...bindings:string[])=>db.prepare(sql).all(...bindings) as RecordValue[];
 // All SQL identifiers and predicates below are source constants, never request input.
 const bounded=(columns:string,table:string,where:string,order:string,limit:number,...bindings:string[])=>{
  const size=db.prepare(`SELECT count(*) AS n, coalesce(sum(length(CAST(record AS BLOB))),0) AS bytes FROM ${table} WHERE ${where}`).get(...bindings)!;
  check(Number(size.n)<=limit&&Number(size.bytes)+bytes<=2097152);bytes+=Number(size.bytes);
  return rows(`SELECT ${columns} FROM ${table} WHERE ${where} ORDER BY ${order} LIMIT ${limit+1}`,...bindings);
 };
 const parse=(row:RecordValue)=>{
  check(typeof row.record==='string');
  const record=JSON.parse(row.record);check(record&&typeof record==='object'&&!Array.isArray(record));return record as RecordValue;
 };
 const chain=(input:RecordValue[],scope:RecordValue)=>{
  check(input.length<=512);let previous='',version=0;
  return input.map(row=>{const record=parse(row),{digest,...body}=record;check(hash(body)===digest&&record.previous===previous&&record.version===++version&&row.version===record.version);
   for(const [field,value]of Object.entries(scope))check(record[field]===value);
   if('id'in row)check(record.id===row.id);if('request'in row)check(record.id===row.request);
   previous=digest;return record;});
 };
 try{
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  check(db.prepare('PRAGMA application_id').get()?.application_id===1162038605&&db.prepare('PRAGMA user_version').get()?.user_version===1);
  const namespace='twin_'+hash({workspace:principal.workspace,owner:principal.owner,sessionId}).slice(0,48);
  const sessionRows=bounded('version,request,record','work8_twin_events','workspace=? AND session=?','version',512,principal.workspace,sessionId);
  if(!sessionRows.length)throw Error('RECOVERY_HISTORY_NOT_FOUND');
  // Owner checking precedes namespace traversal; a guessed session reveals no records.
  if(sessionRows.some(row=>JSON.parse(String(row.record)).owner!==principal.owner))throw Error('RECOVERY_HISTORY_NOT_FOUND');
  const sessions=chain(sessionRows,{workspace:principal.workspace,owner:principal.owner,sessionId,twinWorkspace:namespace,schema:'WORK8_TWIN_V1',classification:'SIMULATED_OPERATIONS',externalEffects:0});
  const session=sessions.at(-1)!;check(['PAUSED','ARCHIVED'].includes(session.status));
  const authorities=chain(bounded('version,request,record','work8_twin_authority','workspace=? AND session=?','version',512,principal.workspace,sessionId),{workspace:principal.workspace,owner:principal.owner,sessionId,scope:'TWIN_SCHEDULER_ONLY'});
  const authority=authorities.at(-1);check(!authority||authority.action==='REVOKE');
  const missions=rows('SELECT DISTINCT mission FROM commerce_runtime_receipts WHERE workspace=? ORDER BY mission LIMIT 11',namespace);check(missions.length<=10);
  const records=missions.map(({mission})=>{
   check(key(mission,160));
   const history=chain(bounded('version,id,record','commerce_runtime_receipts','workspace=? AND mission=?','version',512,namespace,mission),{workspace:namespace,missionId:mission,classification:'SYNTHETIC',externalEffects:0});
   const latest=history.at(-1)!;check(latest&&history.every(r=>time(r.at)&&r.state?.externalEffects===0&&r.state?.paidInference===0));
   const state=latest.state;check(state.orders&&typeof state.orders==='object'&&!Array.isArray(state.orders)&&key(state.candidate?.productId,160)&&key(state.candidate?.offer?.variantId,160));
   check(history.every(r=>key(r.id,160)&&key(r.command?.type,48)&&/^[a-f0-9]{64}$/.test(r.requestDigest)));
   const orderEntries=Object.entries(state.orders) as [string,RecordValue][];check(orderEntries.length<=32);
   const orders=orderEntries.map(([id,value])=>{
    const order=value.order;check(key(id,160)&&order?.orderId===id&&order.workspaceId===namespace&&order.integrationMode==='SANDBOX'&&time(order.createdAt)&&time(order.updatedAt));
    check(/^[A-Z]{3}$/.test(order.currency)&&Array.isArray(order.items)&&order.items.length<=32&&label(order.status)&&label(order.fulfillmentStatus)&&label(value.outcome)&&integer(value.accepted)&&integer(value.shipped)&&integer(value.delivered));
    const items=order.items.map((item:RecordValue)=>{check(key(item.itemId,160)&&key(item.supplierProductId,160)&&key(item.supplierSku,160)&&integer(item.quantity)&&Number.isFinite(item.unitCost)&&item.unitCost>=0&&item.currency===order.currency);return {itemId:item.itemId,supplierProductId:item.supplierProductId,supplierSku:item.supplierSku,quantity:item.quantity,unitCost:item.unitCost,currency:item.currency};});
    return {orderId:id,status:order.status,fulfillmentStatus:order.fulfillmentStatus,integrationMode:'SANDBOX',outcome:value.outcome,accepted:value.accepted,shipped:value.shipped,delivered:value.delivered,currency:order.currency,createdAt:order.createdAt,updatedAt:order.updatedAt,items};
   });
   const planRows=bounded('record,digest','work8_sim_finance_plans','workspace=? AND mission=?','mission',1,namespace,mission);
   const eventRows=bounded('sequence,record,digest','work8_sim_finance_events','workspace=? AND mission=?','sequence',384,namespace,mission);
   let finance:RecordValue={status:'NOT_STARTED',recordedEvents:0,events:[],classification:'SIMULATION_EXCLUDED_FROM_ACTUALS',actualCashMovement:0};
   if(!planRows.length)check(!eventRows.length);
   else{
    const plan=parse(planRows[0]!);check(hash(plan)===planRows[0]!.digest&&plan.workspace===namespace&&plan.mission===mission&&plan.version==='SIM_FINANCE_V1'&&integer(plan.createdAt)&&plan.assumptions?.actualCashMovement===0&&Array.isArray(plan.events)&&plan.events.length<=384&&eventRows.length<=plan.events.length);
    // Same canonical source rule as work8-finance.ts, without constructing its writable store.
    let source=latest;
    if(latest.command.type==='retire'){
     const prior=history.at(-2);check(prior);const {retirement,...priorState}=latest.state,reviewDecisionId=latest.command.reviewDecisionId;
     const expected={actor:latest.actor.id,at:latest.at,reason:latest.command.reason,...(reviewDecisionId?{reviewDecisionId}:{})};
     check(latest.actor.role==='OWNER'&&prior!.state.approval?.actor===latest.actor.id&&(!reviewDecisionId||prior!.state.decisions.some((d:RecordValue)=>d.id===reviewDecisionId))&&hash(retirement)===hash(expected)&&hash(priorState)===hash(prior!.state));source=prior!;
    }
    check(source.digest===plan.sourceDigest&&plan.assumptions.classification==='SIMULATION_ASSUMPTIONS_NOT_ACTUAL_CHARGES');
    const ids=new Set<string>();
    const events=eventRows.map((row,index)=>{const event=parse(row);check(row.sequence===index&&hash(event)===row.digest&&hash(event)===hash(plan.events[index])&&event.sourceReceiptDigest===source.digest&&event.classification==='SIMULATION'&&key(event.id,160)&&key(event.orderId,160)&&!ids.has(event.id)&&time(event.at)&&integer(event.minor)&&/^[A-Z]{3}$/.test(event.currency)&&kinds.has(event.kind)&&/^synthetic:SIM_FINANCE_V1:[a-f0-9]{64}$/.test(event.assumptionRef));
     check(source.state.orders[event.orderId]?.order.integrationMode==='SANDBOX'&&source.state.orders[event.orderId]?.order.currency===event.currency&&state.orders[event.orderId]&&Date.parse(event.at)>=Date.parse(source.state.orders[event.orderId].order.createdAt));ids.add(event.id);
     return {id:event.id,orderId:event.orderId,sourceReceiptDigest:event.sourceReceiptDigest,kind:event.kind,minor:event.minor,currency:event.currency,classification:'SIMULATION',assumptionRef:event.assumptionRef,at:event.at};
    });
    finance={status:events.length===plan.events.length?'COMPLETE_SIMULATION':'INCOMPLETE_SIMULATION',recordedEvents:events.length,totalPlannedEvents:plan.events.length,sourceReceiptDigest:plan.sourceDigest,planDigest:planRows[0]!.digest,eventDigest:hash(events),events,classification:'SIMULATION_EXCLUDED_FROM_ACTUALS',actualCashMovement:0};
   }
   return {missionId:mission,productId:state.candidate?.productId,variantId:state.candidate?.offer?.variantId,receiptDigest:latest.digest,version:latest.version,classification:'SIMULATED_OPERATIONS',orders,history:history.map(r=>({id:r.id,missionId:r.missionId,version:r.version,at:r.at,commandType:r.command?.type,previous:r.previous,digest:r.digest,requestDigest:r.requestDigest,classification:'SYNTHETIC'})),finance};
  });
  const result={schema:'WORK8_RECOVERY_COMMERCE_V1',classification:'HISTORICAL_SIMULATED_OPERATIONS',notice:'Historical simulation only. No actual money or goods moved. Planned financial events are not reported as committed.',session:{sessionId,version:session.version,status:session.status,digest:session.digest,twinWorkspace:namespace},authority:{status:authority?'REVOKED':'NOT_GRANTED',version:authority?.version??0,digest:authority?.digest??null,grantsAuthority:false},records,coverage:'COMPLETE_SELECTED_SESSION_WITHIN_BOUNDS',readOnly:true,actualCashMovement:0,externalEffects:0,paidInference:0,liveCommerce:'LOCKED',birth:'NOT_BORN'};
  check(Buffer.byteLength(JSON.stringify(result))<=1048576);return result;
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}

export function registerRecoveryCommerce(app:FastifyInstance,authenticate:ReturnType<typeof createAuthMiddleware>,owner:(request:FastifyRequest,reply:FastifyReply)=>Promise<unknown>){
 app.get('/api/owner/recovery/commerce',{preHandler:[authenticate,owner]},async(request,reply)=>{
  reply.header('cache-control','private, no-store');
  if(request.method!=='GET')return reply.code(405).send({error:'METHOD_NOT_ALLOWED'});
  try{return readRecoveryCommerce({workspace:request.user!.workspaceId,owner:request.user!.id},request.query);}
  catch(error){const code=error instanceof Error?error.message:'';return reply.code(code==='INVALID_RECOVERY_QUERY'?400:code==='RECOVERY_HISTORY_NOT_FOUND'?404:503).send({error:['INVALID_RECOVERY_QUERY','RECOVERY_HISTORY_NOT_FOUND'].includes(code)?code:'RECOVERY_HISTORY_UNAVAILABLE'});}
 });
}
