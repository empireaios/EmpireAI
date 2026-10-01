import type { BrainLLMCompleteRequest, BrainLLMProviderName } from './brain-adapter.js';
import type { ContextTask } from '../context/types.js';
export type ReasoningCapability = NonNullable<BrainLLMCompleteRequest['capability']>;
export interface ReasoningPlan {
  message:string;
  calculations?:Record<string,unknown>[];
  capability:ReasoningCapability;
  consultation?: {providers:[BrainLLMProviderName,BrainLLMProviderName]; justification:string};
}
/** Explicit owner envelope; source text and model output cannot activate it. */
export function resolveReasoningPlan(message:string,task:ContextTask):ReasoningPlan {
  const defaults:Partial<Record<ContextTask,ReasoningCapability>>={
    review_executive_audit:'critique',architecture:'analysis',repository_intelligence:'analysis',
    technical_chief:'analysis',commerce_intelligence:'analysis',empire_progress:'summarization',journey_question:'summarization',
  };
  if (!message.startsWith('/pillow-request ')) return {message,capability:defaults[task]??'reasoning'};
  const value=JSON.parse(message.slice('/pillow-request '.length));
  if (!value || typeof value.message!=='string' || !value.message.trim() || value.message.length>16000 || !['reasoning','analysis','summarization','critique'].includes(value.capability)) throw Error('Invalid explicit reasoning request');
  if(Object.keys(value).some(key=>!['message','capability','consultation','calculations'].includes(key))) throw Error('Unknown reasoning request option');
  let consultation:ReasoningPlan['consultation'];
  if(value.consultation){
    const c=value.consultation;
    if(!Array.isArray(c.providers)||c.providers.length!==2||c.providers[0]===c.providers[1]||c.providers.some((p:unknown)=>!['openai','anthropic','gemini'].includes(String(p)))||typeof c.justification!=='string'||c.justification.trim().length<10||c.justification.length>500) throw Error('Explicit two-provider consultation and justification required');
    consultation={providers:c.providers,justification:c.justification};
  }
  if(value.calculations && (!Array.isArray(value.calculations)||value.calculations.length>3||value.calculations.some((x:unknown)=>!x||typeof x!=="object"))) throw Error("At most three calculations allowed");
  return {message:value.message,capability:value.capability,consultation,calculations:value.calculations};
}
