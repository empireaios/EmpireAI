/** Brain-owned text inference policy. Does not execute tools or change authority. */
import { createHash } from 'node:crypto';
import type { LLMCompletionRequest, LLMCompletionResponse, LLMProviderName } from '../types.js';
import { completeLockedInference, inferenceLedger, inferenceLedgerPath, reserveInference,
  settleInference, InferenceFailure, lockedInferenceProfile } from './locked-inference.js';

export const LOCKED_PROVIDERS = {
  openai: { model:'gpt-6.1-sol', key:'OPENAI_API_KEY', ceiling:20_000_000 },
  anthropic: { model:'claude-sonnet-5-5', key:'ANTHROPIC_API_KEY', ceiling:5_000_000 },
  gemini: { model:'gemini-3.8-flash', key:'GOOGLE_AI_API_KEY', ceiling:5_000_000 },
} as const;
export type TextCapability = 'reasoning' | 'analysis' | 'summarization' | 'critique';
// Server policy, not prompt-selected destinations. Explicit provider selection is
// still supported by the existing authenticated Pillow API for controlled review.
const routes: Record<TextCapability, readonly LLMProviderName[]> = {
  reasoning:['openai','anthropic'], analysis:['openai','anthropic'],
  summarization:['gemini','openai'], critique:['anthropic','openai'],
};
export function configuredLockedProviders(): LLMProviderName[] {
  return (Object.keys(LOCKED_PROVIDERS) as LLMProviderName[]).filter(p=>Boolean(process.env[LOCKED_PROVIDERS[p].key]?.trim()));
}
const whole=(n:unknown):n is number=>Number.isSafeInteger(n)&&Number(n)>=0;
function tables(db: Parameters<Parameters<typeof inferenceLedger>[1]>[0]) {
  db.exec(`CREATE TABLE IF NOT EXISTS inference_requests (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS provider_health (provider TEXT PRIMARY KEY, updated_at TEXT NOT NULL, state TEXT NOT NULL, retry_after INTEGER NOT NULL) STRICT;`);
}
function health(provider:LLMProviderName,state:string,retryAfter:number) {
  inferenceLedger(inferenceLedgerPath(),db=>{tables(db);db.prepare('INSERT OR REPLACE INTO provider_health VALUES(?,?,?,?)').run(provider,new Date().toISOString(),state,retryAfter);});
}
function ready(provider:LLMProviderName):boolean {
  if(!configuredLockedProviders().includes(provider))return false;
  return inferenceLedger(inferenceLedgerPath(),db=>{tables(db);const row=db.prepare('SELECT retry_after FROM provider_health WHERE provider=?').get(provider);return !row || Number(row.retry_after)<=Date.now();});
}
export function providerHealthReadback() {
  return inferenceLedger(inferenceLedgerPath(),db=>{tables(db);return db.prepare('SELECT * FROM provider_health').all();});
}
async function responseJson(response:Response):Promise<any> {
  const reader=response.body?.getReader();if(!reader)throw Error('No response');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2*1024*1024){await reader.cancel();throw Error('Response bound');}chunks.push(part.value);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** Current first-party text adapters. Existing general adapters remain unchanged. */
export async function completeLockedAlternative(request:LLMCompletionRequest, provider:'anthropic'|'gemini'):Promise<LLMCompletionResponse> {
  const config=LOCKED_PROVIDERS[provider],key=process.env[config.key];
  if(!lockedInferenceProfile()||process.env.EMPIRE_ENGINEERING_TEST_MODE!=='true'||!key?.trim())throw Error('Inference profile/credential unavailable');
  if(request.tools?.length || (request.model && request.model!==config.model))throw Error('Inference model/tools not authorized');
  if(!request.messages.length||request.messages.length>64||request.messages.some(m=>!['system','user','assistant'].includes(m.role)||typeof m.content!=='string'))throw Error('Inference text input refused');
  const maxTokens=request.maxTokens??8192;
  if(!whole(maxTokens)||maxTokens<1||maxTokens>8192)throw Error('Inference output bound refused');
  const system=request.messages.filter(m=>m.role==='system').map(m=>m.content).join('\n\n');
  const turns=request.messages.filter(m=>m.role!=='system').map(m=>({role:m.role,content:m.content}));
  if(!turns.length)throw Error('Conversation required');
  const body=provider==='anthropic'?{
    model:config.model,max_tokens:maxTokens,system,messages:turns,
    thinking:{type:'adaptive'},output_config:{effort:'medium'},service_tier:'standard_only',
  }:{
    systemInstruction:{parts:[{text:system}]},
    contents:turns.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]})),
    generationConfig:{maxOutputTokens:maxTokens,candidateCount:1,thinkingConfig:{thinkingLevel:'MEDIUM'}},
    serviceTier:'standard',store:false,
  };
  const inputBound=Buffer.byteLength(JSON.stringify(body),'utf8')+4096+request.messages.length*512;
  if(inputBound>1_000_000)throw Error('Inference input exceeds priced bound');
  // Claude includes thinking in max_tokens. Reserve Gemini's entire documented
  // output capacity, not merely visible candidates, until usage is reconciled.
  const outputBound=provider==='gemini'?65536:maxTokens;
  // Claude: reserve 1h-cache-write + regional premium even without requesting it.
  // Gemini: standard text pricing through 2026-12-31; no tools/cache resources.
  const inputRate=provider==='anthropic'?4.4:0.75, outputRate=provider==='anthropic'?11:3.75;
  const reservation=Math.ceil(inputBound*inputRate+outputBound*outputRate);
  const filename=inferenceLedgerPath();request.signal?.throwIfAborted();
  const id=reserveInference(filename,reservation,Date.now(),{provider,model:config.model,ceiling:config.ceiling,requestKey:createHash('sha256').update(request.workspaceId+'\0'+request.correlationId).digest('hex')});
  let eligible=false;
  try {
    const signal=AbortSignal.any([AbortSignal.timeout(120000),...(request.signal?[request.signal]:[])]);
    const url=provider==='anthropic'?'https://api.anthropic.com/v1/messages':`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`;
    const headers:Record<string,string>={'Content-Type':'application/json',...(provider==='anthropic'?{'x-api-key':key,'anthropic-version':'2023-06-01'}:{'x-goog-api-key':key})};
    const response=await fetch(url,{method:'POST',redirect:'error',signal,headers,body:JSON.stringify(body)});
    if(!response.ok){eligible=[429,503,529].includes(response.status);await response.body?.cancel();throw Error('Provider refusal');}
    const data=await responseJson(response);
    let input:number,output:number,reasoning=0,cached=0,cacheWrite=0,content:string,completed:boolean;
    if(provider==='anthropic') {
      const u=data.usage;
      if(data.model!==config.model||!u||![u.input_tokens,u.output_tokens,u.cache_read_input_tokens??0,u.cache_creation_input_tokens??0].every(whole))throw Error('Usage/model unverifiable');
      cached=u.cache_read_input_tokens??0;cacheWrite=u.cache_creation_input_tokens??0;
      input=u.input_tokens+cached+cacheWrite;output=u.output_tokens;
      if(!Array.isArray(data.content)||data.content.some((b:any)=>!['text','thinking','redacted_thinking'].includes(b.type)))throw Error('Non-text response');
      content=data.content.filter((b:any)=>b.type==='text').map((b:any)=>b.text).join('\n');completed=data.stop_reason==='end_turn';
    }else{
      const u=data.usageMetadata;
      if(data.modelVersion!==config.model||!u||(u.serviceTier && u.serviceTier!=='standard')||![u.promptTokenCount,u.candidatesTokenCount,u.thoughtsTokenCount??0,u.cachedContentTokenCount??0,u.totalTokenCount].every(whole))throw Error('Usage/model unverifiable');
      input=u.promptTokenCount;reasoning=u.thoughtsTokenCount??0;cached=u.cachedContentTokenCount??0;output=u.candidatesTokenCount+reasoning;
      if(u.totalTokenCount!==input+output||u.toolUsePromptTokenCount)throw Error('Unexpected usage');
      if(data.candidates?.length!==1||!Array.isArray(data.candidates[0]?.content?.parts))throw Error('Candidates unverifiable');
      const parts=data.candidates[0].content.parts;
      if(parts.some((p:any)=>typeof p.text!=='string'||p.functionCall||p.executableCode))throw Error('Non-text response');
      content=parts.filter((p:any)=>!p.thought).map((p:any)=>p.text).join('\n');completed=data.candidates[0].finishReason==='STOP';
    }
    if(!whole(input)||!whole(output)||input>inputBound||output>outputBound||cached>input)throw Error('Usage bound exceeded');
    const cost=Math.ceil(input*inputRate+output*outputRate);
    const responseId=String(data.id??data.responseId??'');
    settleInference(filename,id,completed?'usage_recorded':'incomplete',{inputTokens:input,outputTokens:output,totalTokens:input+output,cachedInputTokens:cached,cacheWriteTokens:cacheWrite,reasoningTokens:reasoning},cost,/^[A-Za-z0-9_-]{1,200}$/.test(responseId)?responseId:null);
    if(!completed||!content.trim())throw Error('Incomplete answer');
    return {provider,model:config.model,content,usage:{promptTokens:input,completionTokens:output,totalTokens:input+output}};
  }catch{
    inferenceLedger(filename,db=>db.prepare("UPDATE calls SET status=CASE WHEN usage_json IS NULL THEN 'failed_uncertain' ELSE status END WHERE id=?").run(id));
    throw new InferenceFailure(eligible);
  }
}

export async function completeLockedRouted(request:LLMCompletionRequest):Promise<LLMCompletionResponse> {
  request={...request,signal:AbortSignal.any([AbortSignal.timeout(120000),...(request.signal?[request.signal]:[])])};
  const capability=request.capability??'reasoning';
  if(!Object.hasOwn(routes,capability))throw Error('Inference capability unavailable');
  if(request.provider && !Object.hasOwn(LOCKED_PROVIDERS,request.provider))throw Error('Inference provider unavailable');
  const selected=request.provider?[request.provider]:routes[capability];
  const candidates=selected.filter(ready);
  if(!candidates.length)throw Error('Inference credential or healthy provider unavailable');
  if(request.model && request.model!==LOCKED_PROVIDERS[candidates[0]!].model)throw Error('Inference model not authorized');
  if(!request.correlationId||!request.workspaceId)throw Error('Inference request identity required');
  // Persist before any provider call: replay/restart cannot launch another chain.
  // Failed uncertain requests need explicit new owner requests, never blind retry.
  const requestKey=createHash('sha256').update(request.workspaceId+'\0'+request.correlationId).digest('hex');
  inferenceLedger(inferenceLedgerPath(),db=>{tables(db);db.prepare('INSERT INTO inference_requests VALUES(?,?)').run(requestKey,new Date().toISOString());});
  const attempts:Array<{provider:LLMProviderName;outcome:string}>=[];
  for(const provider of candidates.slice(0,2)) {
    request.signal?.throwIfAborted();
    try {
      const routed={...request,provider,model:LOCKED_PROVIDERS[provider].model};
      const result=provider==='openai'?await completeLockedInference(routed):await completeLockedAlternative(routed,provider);
      health(provider,'success',0);attempts.push({provider,outcome:'success'});
      return {...result,provenance:{capability,requestKey,attempts}};
    }catch(error){
      const eligible=error instanceof InferenceFailure&&error.fallbackEligible;
      health(provider,eligible?'temporary_refusal':'failed_closed',Date.now()+60_000);
      attempts.push({provider,outcome:eligible?'temporary_refusal':'failed_closed'});
      if(!eligible)throw error;
    }
  }
  throw new InferenceFailure();
}
