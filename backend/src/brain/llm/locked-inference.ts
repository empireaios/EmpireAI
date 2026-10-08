import { finalResponseText } from "./response-final-text.js";
import {readProviderFailure, type ProviderFailureDetail} from './inference-readback.js';
/** October commissioning inference only. No tool execution or authority transition. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type { LLMCompletionRequest, LLMCompletionResponse } from '../types.js';

export const LOCKED_MODEL = 'gpt-6.1-sol';
import { COMMISSIONING_CEILING_MICRO_USD } from "./commissioning-inference-budget.js";
export const CEILING_MICRO_USD = COMMISSIONING_CEILING_MICRO_USD;
// Official OpenAI pricing reverified 2026-10-08; see docs/candidate001/pricing-review.md.
// Other providers retain their existing review deadline. Renewal requires price review;
// neither renewal nor key/model changes reset the lifetime commissioning ledger.
const PRICE_EXPIRES = Date.parse('2026-10-08T00:00:00Z');
const OPENAI_PRICE_EXPIRES = Date.parse('2026-10-15T00:00:00Z');
const STARTS = Date.parse('2026-09-30T16:00:00Z');
const ENDS = Date.parse('2026-10-31T16:00:00Z');
export const lockedInferenceProfile = () => process.env.EMPIRE_RUNTIME_PROFILE === 'LOCKED_COMMISSIONING_V1';

export function inferenceLedger<T>(filename: string, action: (db: DatabaseSync) => T): T {
  if (!path.isAbsolute(filename) || path.resolve(filename) !== filename || fs.realpathSync(path.dirname(filename)) !== path.dirname(filename)) throw Error('Inference ledger path refused');
  const existed = fs.existsSync(filename);
  const marker=filename+'.initialized';
  if (!existed && fs.existsSync(marker)) throw Error('Inference ledger missing; reconciliation required');
  if (!existed) fs.closeSync(fs.openSync(filename, 'wx', 0o600));
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.nlink !== 1 || stat.size > 16*1024*1024 || fs.realpathSync(filename) !== filename) throw Error('Inference ledger refused');
  const db = new DatabaseSync(filename, { timeout: 0, allowExtension: false });
  try {
    db.exec('PRAGMA trusted_schema=OFF; PRAGMA synchronous=EXTRA; PRAGMA journal_mode=DELETE; BEGIN IMMEDIATE');
    if (!existed) db.exec(`CREATE TABLE calls (
      id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, model TEXT NOT NULL,
      reserved_micro_usd INTEGER NOT NULL CHECK(reserved_micro_usd>0),
      status TEXT NOT NULL, usage_json TEXT, estimated_micro_usd INTEGER,
      provider_response_id TEXT, invoice_actual_micro_usd INTEGER
    ) STRICT; PRAGMA application_id=1162430793; PRAGMA user_version=1;`);
    if (db.prepare('PRAGMA application_id').get()?.application_id !== 1162430793 || db.prepare('PRAGMA user_version').get()?.user_version !== 1 || db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw Error('Inference ledger integrity/schema refused');
    if (!fs.existsSync(marker)) {
      if (existed) throw Error('Inference ledger initialization marker missing');
      const seal=fs.openSync(marker,'wx',0o600);
      try { fs.writeSync(seal,'October 2026 cumulative guard; never reset\n'); fs.fsyncSync(seal); } finally { fs.closeSync(seal); }
    }
    const result = action(db);
    db.exec('COMMIT');
    const fd=fs.openSync(path.dirname(filename),'r');
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    return result;
  } finally { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
}
const ledger = inferenceLedger;
export function inferenceLedgerPath(): string {
  const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (!root || fs.realpathSync(root)!==root || process.env.DATABASE_PATH!==path.join(root,'commissioning','empireai-brain.db')) throw Error('Inference requires locked persistent volume');
  return path.join(root,'commissioning','openai-october-2026.sqlite');
}
export function reserveInference(filename: string, microUsd: number, now = Date.now(), policy: {provider:string;model:string;ceiling:number|null;requestKey?:string} = {provider:'openai',model:LOCKED_MODEL,ceiling:CEILING_MICRO_USD}): string {
  const priceExpires = policy.provider==='openai' && policy.model===LOCKED_MODEL ? OPENAI_PRICE_EXPIRES : PRICE_EXPIRES;
  if (!Number.isFinite(now) || now < STARTS || now >= ENDS || now >= priceExpires || !Number.isSafeInteger(microUsd) || microUsd<=0) throw Error('Inference pricing/window unavailable');
  return ledger(filename, db => {
    db.exec('CREATE TABLE IF NOT EXISTS call_providers (call_id TEXT PRIMARY KEY, provider TEXT NOT NULL, request_key TEXT) STRICT');
    // Global across accounts, workers, credentials, restarts and all outcomes.
    const used=db.prepare('SELECT COALESCE(SUM(reserved_micro_usd),0) AS n FROM calls').get()?.n;
    if (typeof used !== 'number' || !Number.isSafeInteger(used) || used<0 || !Number.isSafeInteger(used+microUsd)) throw Error('Inference accounting bound refused');
    const providerUsed=db.prepare("SELECT COALESCE(SUM(c.reserved_micro_usd),0) AS n FROM calls c LEFT JOIN call_providers p ON p.call_id=c.id WHERE COALESCE(p.provider,'openai')=?").get(policy.provider)?.n;
    if (typeof providerUsed!=='number'||!Number.isSafeInteger(providerUsed)||providerUsed<0||!Number.isSafeInteger(providerUsed+microUsd)||
      (policy.ceiling===null ? policy.provider!=='openai' : !Number.isSafeInteger(policy.ceiling)||policy.ceiling<1||providerUsed+microUsd>policy.ceiling)) throw Error('Inference provider budget exhausted');
    const id=randomUUID();
    db.prepare('INSERT INTO calls(id,timestamp,model,reserved_micro_usd,status) VALUES(?,?,?,?,?)').run(id,new Date(now).toISOString(),policy.model,microUsd,'reserved_uncertain');
    db.prepare('INSERT INTO call_providers VALUES(?,?,?)').run(id,policy.provider,policy.requestKey??null);
    return id;
  });
}
export function settleInference(filename:string,id:string,status:string,usage:object|null=null,cost:number|null=null,responseId:string|null=null):void {
  ledger(filename,db=>{ const result=db.prepare('UPDATE calls SET status=?,usage_json=?,estimated_micro_usd=?,provider_response_id=? WHERE id=?').run(status,usage?JSON.stringify(usage):null,cost,responseId,id); if(result.changes!==1)throw Error('Inference receipt persistence failed'); });
}
const settle = settleInference;
export class InferenceFailure extends Error {
  constructor(readonly fallbackEligible=false, readonly detail?:ProviderFailureDetail) { super('Bounded inference failed; reservation retained for reconciliation'); }
}
function integer(value:unknown):value is number { return Number.isSafeInteger(value) && Number(value)>=0; }
export async function completeLockedInference(request:LLMCompletionRequest):Promise<LLMCompletionResponse> {
  if (!lockedInferenceProfile() || process.env.EMPIRE_ENGINEERING_TEST_MODE!=='true') throw Error('Inference profile refused');
  const key=process.env.OPENAI_API_KEY;
  if (!key?.trim()) throw Error('Inference credential unavailable');
  if ((request.provider && request.provider!=='openai') || (request.model && request.model!==LOCKED_MODEL) || request.tools?.length) throw Error('Inference provider/model/tools not authorized');
  if (!request.messages.length || request.messages.length>64 || request.messages.some(m=>!['system','user','assistant'].includes(m.role)||typeof m.content!=='string')) throw Error('Inference text input refused');
  if(request.messages.some(m => m.phase != null && (m.role !== 'assistant' || !['commentary','final_answer'].includes(m.phase))))throw Error('Inference phase input refused');
  const input=request.messages.map(({role,content,phase})=>({role,content,...(role==='assistant'?{phase:phase??'final_answer'}:{})}));
  // Text-only UTF-8 bytes bound token count conservatively, plus framing. No
  // images, files, tools, stored conversation, implicit previous response or retries.
  const inputBound=Buffer.byteLength(JSON.stringify(input),'utf8')+4096+input.length*512;
  if(inputBound>1_000_000)throw Error('Inference input exceeds priced bound');
  // The legacy Pillow 2,000-token allocation is OpenAI reasoning headroom,
  // not a desired answer length. Other providers and explicit smaller bounds stay unchanged.
  const outputBound=request.maxTokens===2_000?10_000:request.maxTokens??8192;
  if(!Number.isSafeInteger(outputBound)||outputBound<1||outputBound>10_000)throw Error('Inference output bound refused');
  // All input reserved as cache writes, with regional 10% premium and long
  // context multiplier. Output includes hidden reasoning; standard tier only.
  const long=inputBound>272000;
  const reserved=Math.ceil(inputBound*(long?5.5:2.75)+outputBound*(long?16.5:11));
  const filename=inferenceLedgerPath();
  request.signal?.throwIfAborted();
  const id=reserveInference(filename,reserved,Date.now(),{provider:'openai',model:LOCKED_MODEL,ceiling:CEILING_MICRO_USD,requestKey:createHash('sha256').update(request.workspaceId+'\0'+request.correlationId).digest('hex')});
  const signal=AbortSignal.any([AbortSignal.timeout(120000),...(request.signal?[request.signal]:[])]);
  let fallbackEligible=false;
  let failureDetail:ProviderFailureDetail|undefined;
  try {
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',redirect:'error',signal,
      headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:LOCKED_MODEL,input,store:false,service_tier:'default',reasoning:{effort:'medium'},max_output_tokens:outputBound}),
    });
    if(!response.ok) { fallbackEligible=[429,503,529].includes(response.status); failureDetail=await readProviderFailure(response); throw Error('Inference HTTP refusal'); }
    const reader=response.body?.getReader(); if(!reader)throw Error('Inference response absent');
    const chunks:Uint8Array[]=[];let size=0;
    while(true){ const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2*1024*1024){await reader.cancel();throw Error('Inference response exceeds bound');}chunks.push(part.value); }
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const usage=data.usage;
    if(data.model!==LOCKED_MODEL || (data.service_tier && data.service_tier!=='default') || !usage || !integer(usage.input_tokens)||!integer(usage.output_tokens)||!integer(usage.total_tokens)||usage.total_tokens!==usage.input_tokens+usage.output_tokens||usage.input_tokens>inputBound||usage.output_tokens>outputBound)throw Error('Inference usage/model cannot be reconciled');
    const cached=usage.input_tokens_details?.cached_tokens??0;
    const reasoning=usage.output_tokens_details?.reasoning_tokens??0;
    if(!integer(cached)||cached>usage.input_tokens||!integer(reasoning)||reasoning>usage.output_tokens)throw Error('Inference usage cannot be reconciled');
    // Conservative estimate, not an invoice. Keep the original reservation.
    const cost=Math.ceil(usage.input_tokens*(long?5.5:2.75)+usage.output_tokens*(long?16.5:11));
    const safeUsage={providerStatus:['completed','incomplete','failed','cancelled'].includes(data.status)?data.status:'unknown',incompleteReason:['max_output_tokens','content_filter'].includes(data.incomplete_details?.reason)?data.incomplete_details.reason:null,configuredOutputTokens:outputBound,inputTokens:usage.input_tokens,outputTokens:usage.output_tokens,totalTokens:usage.total_tokens,cachedInputTokens:cached,reasoningTokens:reasoning,outputMessagePhases:Array.isArray(data.output)?data.output.filter((item:any)=>item.type==='message').map((item:any)=>['commentary','final_answer'].includes(item.phase)?item.phase:'unspecified'):[]};
    const responseId=typeof data.id==='string'&&/^resp_[A-Za-z0-9_-]{1,160}$/.test(data.id)?data.id:null;
    settle(filename,id,data.status==='completed'?'usage_recorded':'incomplete',safeUsage,cost,responseId);
    if(data.status!=='completed'||!Array.isArray(data.output)||data.output.some((item:any)=>!['message','reasoning'].includes(item.type)))throw Error('Inference not completed');
    const content=finalResponseText(data.output);
    if(typeof content!=='string'||!content.trim())throw Error('Inference answer absent');
    return {provider:'openai',model:LOCKED_MODEL,content,assistantPhase:data.output.some((item:any)=>item.type==='message'&&item.phase==='final_answer')?'final_answer':undefined,usage:{promptTokens:usage.input_tokens,completionTokens:usage.output_tokens,totalTokens:usage.total_tokens}};
  } catch {
    // Never log provider bodies, prompts, credentials or exception strings.
    // Keep any usage already saved and the reservation on every failure.
    ledger(filename,db=>db.prepare("UPDATE calls SET status=CASE WHEN usage_json IS NULL THEN 'failed_uncertain' ELSE status END WHERE id=?").run(id));
    throw new InferenceFailure(fallbackEligible,failureDetail);
  }
}
