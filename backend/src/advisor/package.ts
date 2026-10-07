import { createHash } from 'node:crypto';
import { z } from 'zod';
const identifier=z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
export const communicationSchema=z.object({
  schemaVersion:z.literal('1.0'),id:identifier,source:z.literal('KING_ADVISOR'),createdAt:z.string().datetime(),
  type:z.enum(['ANALYSIS','PRODUCT_REVISION','CREATIVE_REVISION','EXECUTIVE_CHALLENGE','EXECUTIVE_REVIEW_REQUEST','CALCULATION_REQUEST','EVIDENCE_REQUEST','STRATEGY_PROPOSAL','CONFIGURATION_PROPOSAL','PRODUCT_PROPOSAL','LISTING_PROPOSAL','CAPABILITY_REQUEST','OWNER_NOTE']),
  domain:z.string().min(1).max(80),targetId:z.string().min(1).max(180).nullable(),
  requestedOutcome:z.string().min(1).max(2000),requestedHandler:z.enum(['SOFTWARE','PILLOW','GRAND_KING','EXECUTION']),
  priority:z.enum(['NORMAL','HIGH']),rationale:z.string().max(12000),payload:z.object({text:z.string().max(32000)}).strict(),
  evidenceRefs:z.array(z.string().max(180)).max(20),assets:z.array(z.object({id:identifier,mediaType:z.literal('text/plain'),content:z.string().max(16000),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict()).max(4),
  expectedResult:z.string().max(2000),authorityClass:z.enum(['INFORMATION','CEO_JUDGMENT','OWNER_RESERVED']),
  effectIntent:z.enum(['NONE','EXTERNAL']),correlationId:identifier,parentId:identifier.nullable(),synthetic:z.boolean(),
}).strict();
export type Communication=z.infer<typeof communicationSchema>;
export const digest=(text:string)=>createHash('sha256').update(text).digest('hex');
export function parseCommunication(value:unknown):Communication {
  if(Buffer.byteLength(JSON.stringify(value))>96000)throw Error('INVALID_PACKAGE');
  const result=communicationSchema.safeParse(value);
  if(!result.success)throw Error('INVALID_PACKAGE');
  for(const asset of result.data.assets)if(digest(asset.content)!==asset.sha256)throw Error('INVALID_PACKAGE');
  return result.data;
}
export function routeCommunication(p:Communication){
  // Free text is evidence, never executable authority. No handler can issue external effects.
  if(p.effectIntent==='EXTERNAL'||p.requestedHandler==='EXECUTION'||p.type==='LISTING_PROPOSAL')return {handler:'BLOCKED',status:'BLOCKED',code:'BLOCKED_NOT_BORN'};
  if(p.authorityClass==='OWNER_RESERVED'||p.requestedHandler==='GRAND_KING'||p.type==='CONFIGURATION_PROPOSAL')return {handler:'GRAND_KING',status:'AWAITING_OWNER',code:'AUTHORITY_REQUIRED'};
  if(['EXECUTIVE_CHALLENGE','EXECUTIVE_REVIEW_REQUEST'].includes(p.type)&&p.requestedHandler==='PILLOW')return {handler:'PILLOW',status:'ROUTED',code:'CEO_REVIEW_REQUIRED'};
  if(['OWNER_NOTE','ANALYSIS'].includes(p.type)&&p.requestedHandler==='SOFTWARE')return {handler:'SOFTWARE',status:'COMPLETED',code:'RECORDED_UNTRUSTED_EVIDENCE'};
  if(p.type==='EVIDENCE_REQUEST'&&p.requestedHandler==='SOFTWARE'&&p.targetId)return {handler:'SOFTWARE',status:'ROUTED',code:'READ_STORED_EVIDENCE'};
  return {handler:'BLOCKED',status:'BLOCKED',code:'CAPABILITY_GAP'};
}
