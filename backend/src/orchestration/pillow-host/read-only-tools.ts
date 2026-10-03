import { getDatabase } from "../../brain/database.js";
import { createHash } from 'node:crypto';
import { ToolRegistry } from '../../brain/tools/tool-registry.js';
import type { ToolContext } from '../../brain/types.js';
export interface ReadReceipt {tool:string; workspaceId:string; requestId:string; at:string; source:string; sha256:string; result:unknown; simulated:false; grantsAuthority:false}
export function exactCalculation(args:Record<string,unknown>):unknown {
  const parse=(v:unknown):[bigint,bigint]=>{
    if(typeof v!=='string'||!/^[-+]?\d{1,12}(?:\.\d{1,6})?$/.test(v)) throw Error('Bounded decimal strings required');
    const places=v.split('.')[1]?.length??0;return [BigInt(v.replace('.','')),10n**BigInt(places)];
  };
  const [a,b]=parse(args.left),[c,d]=parse(args.right);let n:bigint,q:bigint;
  switch(args.operation){case 'add':n=a*d+c*b;q=b*d;break;case 'subtract':n=a*d-c*b;q=b*d;break;case 'multiply':n=a*c;q=b*d;break;case 'divide':if(c===0n)throw Error('Division by zero');n=a*d;q=b*c;break;default:throw Error('Calculation operation denied');}
  if(q<0n){n=-n;q=-q;}const gcd=(x:bigint,y:bigint):bigint=>y?gcd(y,x%y):x;
  const g=gcd(n<0n?-n:n,q);return {numerator:String(n/g),denominator:String(q/g),representation:'exact rational',operation:args.operation};
}
/** Closed registry: never delegates arbitrary names to operational tools. */
export async function readReasoningTools(input:{workspaceId:string;requestId:string;authorizedWorkspace:string;repository:unknown;mission:()=>unknown;pending:()=>unknown;evidence?:()=>unknown;currentTruth?:()=>unknown;calculations?:Record<string,unknown>[]; calculationsOnly?:boolean}):Promise<ReadReceipt[]> {
  if(!input.workspaceId||input.workspaceId!==input.authorizedWorkspace) throw Error('Read tool scope denied');
  if((input.calculations?.length??0)>3)throw Error('Read tool budget exceeded');
  const registry=new ToolRegistry();
  const handlers:Record<string,()=>unknown>={repository:()=>input.repository,mission:input.mission,pending_learning:input.pending,evidence:input.evidence??(()=>({available:false,reason:'No evidence reader supplied'}))};
  if(input.currentTruth)handlers.current_operational_truth=input.currentTruth;
  for(const [name,handler]of Object.entries(handlers)) registry.register({name,description:'Bounded owner-scoped read',parameters:{},module:'locked-reasoning',authorityLevel:'L0',handler:async()=>handler()});
  registry.register({name:'calculate',description:'Exact rational arithmetic; no code execution',parameters:{},module:'locked-reasoning',authorityLevel:'L0',handler:async args=>exactCalculation(args)});
  const ctx:ToolContext={workspaceId:input.workspaceId,agentId:'pillow',correlationId:input.requestId};
  const requests=[...(input.calculationsOnly?[]:Object.keys(handlers)).map(name=>({name,args:{}})),...(input.calculations??[]).map(args=>({name:'calculate',args}))];
  const receipts:ReadReceipt[]=[];
  for(const r of requests){const result=await registry.require(r.name).handler(r.args,ctx);const encoded=JSON.stringify(result);if(encoded.length>48000)throw Error('Read receipt exceeds context bound: '+r.name+' bytes='+encoded.length);receipts.push({tool:r.name,workspaceId:input.workspaceId,requestId:input.requestId,at:new Date().toISOString(),source:`locked:${r.name}`,sha256:createHash('sha256').update(encoded).digest('hex'),result,simulated:false,grantsAuthority:false});}
  return receipts;
}

/** SELECT-only view: never restore a mirror, reselect a product or import approval. */
export function readStoredCommissioningEvidence(workspaceId:string):unknown {
  const db=getDatabase();
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='pillow_one_product_commissioning'").get()) return {available:false,reason:'No commissioning evidence table'};
  const row=db.prepare('SELECT record_json,updated_at FROM pillow_one_product_commissioning WHERE workspace_id=@workspaceId AND length(record_json)<=64000').get({workspaceId}) as {record_json:string;updated_at:string}|undefined;
  if(!row)return {available:false,reason:'No bounded persisted commissioning evidence for this workspace'};
  const value=JSON.parse(row.record_json);
  const evidence:Record<string,unknown>={available:true,source:'pillow_one_product_commissioning',recordedAt:row.updated_at,trust:'historical stored evidence; current supplier facts unverified',authority:'none'};
  for(const key of ['commissioningId','opportunityId','productName','asin','cjPid','supplierCost','freight','deliveryPromise','offerPrice','competingOffers','expectedProfit','expectedMargin','riskReasons','stage']) {
    if(typeof value[key]==='string')evidence[key]=value[key].slice(0,2000);
    else if(key==='riskReasons'&&Array.isArray(value[key]))evidence[key]=value[key].filter((x:unknown)=>typeof x==='string').slice(0,8).map((x:string)=>x.slice(0,500));
  }
  return evidence;
}
