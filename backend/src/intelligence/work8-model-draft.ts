import {z} from 'zod';
import {digest} from './model.js';
import type {Row} from './store.js';

const ref=z.string().min(1).max(160);
const amount=z.number().finite().nonnegative().max(1e9).nullable();
const schema=z.object({
 candidateId:ref, snapshotDigest:z.string().regex(/^[a-f0-9]{64}$/),
 recommendation:z.enum(['RECOMMEND','DEFER','REJECT']),
 rationale:z.string().min(1).max(3000),
 findings:z.array(z.object({kind:z.enum(['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE']),value:z.number().finite().min(0).max(100).nullable(),reason:z.string().min(1).max(1000),sourceIds:z.array(ref).min(1).max(12)}).strict()).max(7),
 economics:z.object({sellingPrice:amount,feePercent:z.number().finite().min(0).max(100).nullable(),paymentPercent:z.number().finite().min(0).max(100).nullable(),fulfilment:amount,duties:amount,advertising:amount,refundRate:z.number().finite().min(0).max(1).nullable(),refundLoss:amount,tax:amount,overhead:amount,sourceIds:z.array(ref).max(12)}).strict(),
}).strict();

export const modelDraftContract={
 tag:'work8-proposal',classification:'MODEL_PROPOSED_UNREVIEWED',
 instruction:'Optionally append one <work8-proposal>JSON</work8-proposal> object with the exact candidateId and snapshotDigest. recommendation is RECOMMEND, DEFER or REJECT, with rationale. findings contain kind, nullable value, reason and sourceIds. economics contains nullable sellingPrice, feePercent, paymentPercent, fulfilment, duties, advertising, refundRate, refundLoss, tax, overhead and sourceIds. Cite only supplied source IDs; use null for unknown numbers. These are unverified proposals, not facts, qualification or authority. Do not include payment, source price, FX, cash, budget, verified flags or approval.',
} as const;

/** Called only after the existing completed-request/owner/source linkage succeeds.
 * A source citation proves delivery, not semantic support for a model claim. */
export function projectWork8ModelDraft(assessment:Row,binding:Row){
 const absent={status:'NOT_PROVIDED',classification:'MODEL_PROPOSED_UNREVIEWED',verified:false,qualification:false,grantsAuthority:false} as const;
 if(typeof assessment.answer!=='string'||!assessment.answer.includes('<work8-proposal>'))return absent;
 try{
  if(Buffer.byteLength(assessment.answer,'utf8')>131072)throw Error('PROPOSAL_RESPONSE_BOUND');
  const starts=assessment.answer.split('<work8-proposal>');
  if(starts.length!==2||assessment.answer.split('</work8-proposal>').length!==2)throw Error('PROPOSAL_AMBIGUOUS');
  const payload=starts[1]!.split('</work8-proposal>');
  if(payload.length!==2||Buffer.byteLength(payload[0]!,'utf8')>16384)throw Error('PROPOSAL_PAYLOAD_BOUND');
  const proposal=schema.parse(JSON.parse(payload[0]!));
  if(proposal.candidateId!==binding.candidateId||proposal.snapshotDigest!==binding.snapshotDigest)throw Error('PROPOSAL_CONTEXT_MISMATCH');
  if(new Set(proposal.findings.map(f=>f.kind)).size!==proposal.findings.length)throw Error('PROPOSAL_DUPLICATE_FINDING');
  const delivered=new Set<string>([...(binding.evidence??[]).map((e:Row)=>e.id),...(assessment.evidenceIds??[])]);
  if([...proposal.findings.flatMap(f=>f.sourceIds),...proposal.economics.sourceIds].some(id=>!delivered.has(id)))throw Error('PROPOSAL_UNDELIVERED_CITATION');
  if(Object.entries(proposal.economics).some(([key,value])=>key!=='sourceIds'&&value!==null)&&!proposal.economics.sourceIds.length)throw Error('PROPOSAL_ECONOMICS_UNCITED');
  return {...absent,status:'AVAILABLE_UNREVIEWED',assessmentHash:assessment.sha256,proposalDigest:digest(proposal),proposal,
   findings:proposal.findings.map(f=>({...f,verified:false})),
   limitations:['Citations identify delivered records, not verified support for these claims.','Unknown numbers remain null. Source prices, FX, cash and budget are never replaced.','No qualification, payment, owner decision or commerce authority is created.']};
 }catch(error){return {...absent,status:'REJECTED_UNVERIFIED_PROPOSAL',reason:error instanceof Error&&/^PROPOSAL_[A-Z_]+$/.test(error.message)?error.message:'PROPOSAL_SCHEMA_INVALID'};}
}
