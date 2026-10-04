import { COMMISSIONING_CEILING_MICRO_USD } from "./commissioning-inference-budget.js";
/** Operator-only receipts: no prompts, credentials, provider messages or authority. */
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
export interface ProviderFailureDetail { httpStatus:number; code?:string }
const allowedCodes=new Set(['RESOURCE_EXHAUSTED','UNAVAILABLE','INVALID_ARGUMENT','FAILED_PRECONDITION','PERMISSION_DENIED','UNAUTHENTICATED','NOT_FOUND','INTERNAL','DEADLINE_EXCEEDED','rate_limit_error','overloaded_error','authentication_error','permission_error','invalid_request_error','insufficient_quota']);
export async function readProviderFailure(response:Response):Promise<ProviderFailureDetail>{
 const result:ProviderFailureDetail={httpStatus:response.status};
 // The error message/body can echo secrets. Retain only an exact allowlisted code.
 const reader=response.body?.getReader();if(!reader)return result;
 let size=0;const chunks:Uint8Array[]=[];
 try{while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>16384){await reader.cancel();return result;}chunks.push(p.value);}const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));const code=data?.error?.status??data?.error?.type??data?.error?.code;if(typeof code==='string'&&allowedCodes.has(code))result.code=code;}catch{/* HTTP status remains useful without parsing untrusted text. */}
 return result;
}
/** Derived operator readback only. Accounting authority remains the existing SQLite ledger. */
export function writeInferenceReadback(filename:string,requestKey:string,capability:string,attempts:unknown[]):void{
 const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:3000});
 try{
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  const hasProviders=Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='call_providers'").get());
  const providerColumns=hasProviders?"COALESCE(p.provider,'openai') AS provider,p.request_key":"'openai' AS provider,NULL AS request_key";
  const providerJoin=hasProviders?'LEFT JOIN call_providers p ON p.call_id=c.id':'';
  const records=db.prepare(`SELECT c.id,c.timestamp,c.model,c.status,c.reserved_micro_usd,c.estimated_micro_usd,c.invoice_actual_micro_usd,c.provider_response_id,c.usage_json,${providerColumns} FROM calls c ${providerJoin} ORDER BY c.timestamp,c.id`).all().map(r=>{const {usage_json,...safe}=r;return {...safe,reserved_micro_usd:r.reserved_micro_usd,usage:typeof usage_json==='string'?JSON.parse(usage_json):null,reservationReleased:false};});
  const held=records.reduce((sum,r)=>sum+Number(r.reserved_micro_usd),0);
  if(!Number.isSafeInteger(held)||held<0)throw Error('Accounting readback refused');
  const report={schema:'locked-inference-operator-readback-v1',at:new Date().toISOString(),requestKey,capability,attempts,ceilingMicroUsd:COMMISSIONING_CEILING_MICRO_USD,heldMicroUsd:held,remainingMicroUsd:null,records,invoiceNote:'Estimates are not invoices; unknown invoice costs remain unknown; no reservation released.'};
  const content=JSON.stringify(report);if(Buffer.byteLength(content)>1024*1024)throw Error('Accounting readback exceeds bound');
  db.exec('COMMIT');
  const output=path.join(path.dirname(filename),'inference-operator-readback.json'),temp=output+'.tmp';
  const fd=fs.openSync(temp,'w',0o600);try{fs.writeFileSync(fd,content);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temp,output);
  if(/^[a-f0-9]{64}$/.test(requestKey)){
    const receipt=filename+'.route-'+requestKey+'.json',pending=receipt+'.tmp';
    const fd=fs.openSync(pending,'w',0o600);try{fs.writeFileSync(fd,JSON.stringify({...report,records:records.filter(r=>(r as Record<string,unknown>).request_key===requestKey)}));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(pending,receipt);
  }
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}
