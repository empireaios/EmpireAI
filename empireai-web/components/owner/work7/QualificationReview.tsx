'use client';
import {useRef,useState} from 'react';
type Row=Record<string,unknown>;
const kinds=['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE'];
const row=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
export function QualificationReview({dossier}:{dossier:Row}){
 const supplier=row(dossier.supplier),freight=row(supplier.freight),binding=row(dossier.sourceBinding),financial=row(dossier.financialInputs);
 const options=Array.isArray(freight.options)?freight.options.map(row):[];
 const [choice,setChoice]=useState(''),[budget,setBudget]=useState(''),[days,setDays]=useState(''),[processing,setProcessing]=useState(''),[restricted,setRestricted]=useState(false),[attested,setAttested]=useState(false),[findings,setFindings]=useState(kinds.map(kind=>({kind,value:'',sourceId:'',rationale:''}))),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false),attempt=useRef<{signature:string;id:string}|null>(null);
 async function submit(){if(lock.current||!attested)return;lock.current=true;setBusy(true);setMessage('');try{
  if(!financial.financialDigest||!budget.trim()||!days.trim()||findings.some(f=>!f.value.trim()))throw Error('Complete the financial snapshot and review fields first.');
  const selected=choice===''?undefined:options[Number(choice)];
  const review={candidateId:dossier.candidateId,sourceSnapshotDigest:binding.snapshotDigest,financialDigest:financial.financialDigest,restricted,budgetSgd:Number(budget),processingDays:Number(days),processingSourceId:processing.trim(),findings:findings.map(f=>({...f,value:Number(f.value),sourceId:f.sourceId.trim(),rationale:f.rationale.trim()})),...(selected?{freightSelection:{evidenceId:selected.evidenceId,rowDigest:selected.rowDigest}}:{}),attestation:'I_REVIEWED_THE_CITED_EVIDENCE_NOT_JUST_MODEL_OUTPUT'};
  const signature=JSON.stringify(review);if(attempt.current?.signature!==signature)attempt.current={signature,id:'qualification-'+crypto.randomUUID()};
  const response=await fetch('/api/owner/advisor/intelligence',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({action:'qualification_review',review:{...review,id:attempt.current.id}})});
  const body=await response.json(),saved=row(body.result);
  if(!response.ok||saved.id!==attempt.current.id||saved.candidateId!==dossier.candidateId||saved.attestedBy!=='AUTHENTICATED_OWNER'||saved.grantsAuthority!==false)throw Error('Review not confirmed. Refresh the source and financial evidence before retrying.');
  setMessage('Evidence review saved. Refresh this dossier to see its evaluated outcome. No assessment, simulation or spending was authorised.');
 }catch(e){setMessage(e instanceof Error?e.message:'Review not confirmed.');}finally{lock.current=false;setBusy(false);}}
 return <details><summary>Review evidence and select a freight quote</summary><p>Use retained source references and the current reviewed financial snapshot. Scores are your interpretation, not new supplier facts. Seven supported findings are required; a review may still leave the candidate deferred or rejected.</p>
 {!financial.financialDigest&&<p>A canonical financial snapshot is required before this review can be saved.</p>}
 <form onSubmit={e=>{e.preventDefault();void submit();}}><fieldset disabled={busy}>
 <label>Freight service<select value={choice} onChange={e=>setChoice(e.target.value)} required={options.length>1}><option value="">{options.length===1?'Use the sole observed quote':'Select an exact observed quote'}</option>{options.map((o,i)=><option key={i} value={i} disabled={o.currencyContradiction===true||o.amount===null||!o.service}>{String(o.service??'Unnamed service')} · {String(o.amount??'Unknown')} {String(o.currency??'Unknown currency')} · {String(o.leadTime??'Unknown timing')}</option>)}</select></label>
 {choice!==''&&options[Number(choice)]&&<p>Evidence: {String(options[Number(choice)].evidenceId)}. Shipping times are provider estimates.</p>}
 <label>Scenario exposure budget (SGD)<input type="number" min="0" max="1000000000" step="0.01" value={budget} required onChange={e=>setBudget(e.target.value)}/></label>
 <label>Reviewed processing days<input type="number" min="0" max="180" step="1" value={days} required onChange={e=>setDays(e.target.value)}/></label>
 <label>Processing evidence reference<input value={processing} maxLength={160} required onChange={e=>setProcessing(e.target.value)}/></label>
 {findings.map((f,i)=><fieldset key={f.kind}><legend>{f.kind.toLowerCase()}</legend><label>Reviewed score (0–100)<input type="number" min="0" max="100" step="any" required value={f.value} onChange={e=>setFindings(v=>v.map((x,j)=>j===i?{...x,value:e.target.value}:x))}/></label><label>Evidence reference<input required maxLength={160} value={f.sourceId} onChange={e=>setFindings(v=>v.map((x,j)=>j===i?{...x,sourceId:e.target.value}:x))}/></label><label>Reason based on that evidence<textarea required minLength={10} maxLength={1000} value={f.rationale} onChange={e=>setFindings(v=>v.map((x,j)=>j===i?{...x,rationale:e.target.value}:x))}/></label></fieldset>)}
 <label><input type="checkbox" checked={restricted} onChange={e=>setRestricted(e.target.checked)}/>Evidence shows this product is restricted</label>
 <label><input type="checkbox" required checked={attested} onChange={e=>setAttested(e.target.checked)}/>I reviewed the cited evidence, not just model output</label>
 <button type="submit" disabled={!financial.financialDigest||!attested||busy}>Save evidence review</button></fieldset></form>{message&&<p role="status">{message}</p>}</details>;
}
