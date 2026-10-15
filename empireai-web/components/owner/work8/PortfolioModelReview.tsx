'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
type Row=Record<string,unknown>;
export function PortfolioModelReview({sessionId,product,authority}:{sessionId:string;product:Row;authority:Row}){
 const [chat,setChat]=useState(''),[request,setRequest]=useState(''),[fingerprint,setFingerprint]=useState(''),[brief,setBrief]=useState(''),[input,setInput]=useState<Row|null>(null),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 async function send(consume:boolean){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{
  const grant=authority.grant as Row|undefined;
  const proposal=consume?input:{id:grant?.mode==='ONE_TASK'?grant.taskId:crypto.randomUUID(),reference:{sessionId,missionId:product.missionId,receiptDigest:product.receiptDigest},chatSessionId:chat,grantDigest:grant?.digest};
  if(!proposal)throw Error('Prepare the portfolio brief first.');
  const response=await fetch('/api/owner/commerce',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({action:consume?'twin_portfolio_consume':'twin_portfolio_brief',proposal:{...proposal,...(consume?{requestId:request,responseDigest:fingerprint}:{})}})});
  const body=await response.json();if(!response.ok)throw Error('Saved reply could not be verified. Refresh the product and its preparation permission before retrying.');
  if(consume){setDraft(body.result?.modelProposal?.rationale??'Saved portfolio review recorded.');setInput(null);setBrief('');}else{setInput(proposal);setBrief(body.requestMessage);}
 }catch(e){setError(e instanceof Error?e.message:'Draft unavailable');}finally{lock.current=false;setBusy(false);}}
 return <section aria-label="Saved Pillow portfolio review"><h4>Review portfolio with a saved Pillow reply</h4><p>Uses existing research reasoning permission. This prepares a portfolio recommendation for owner review; no product or financial change occurs and no inference is run.</p>
 <details><summary>Advanced: link saved reply evidence</summary><p>Optional evidence tools for an existing saved reply. Normal portfolio history and owner review remain available without these references.</p>
 <label>Pillow conversation reference <input value={chat} maxLength={100} onChange={e=>{setChat(e.target.value);setBrief('');setInput(null);}}/></label>
 <button disabled={busy||authority.status!=='ACTIVE'||!chat} onClick={()=>void send(false)}>Prepare portfolio brief</button>
 {brief&&<><details><summary>Bound portfolio brief</summary><textarea readOnly value={brief} rows={8}/></details><Link href="/cockpit/development/pillow" target="_blank" rel="noreferrer">Open existing Pillow Chat</Link><p>New model work requires its existing separate authorisation.</p><label>Completed reply reference <input value={request} maxLength={100} onChange={e=>setRequest(e.target.value)}/></label><label>Saved reply fingerprint <input value={fingerprint} maxLength={64} onChange={e=>setFingerprint(e.target.value)}/></label><p>The fingerprint pins the exact saved reply being reviewed.</p><button disabled={busy||!request||!/^([a-f0-9]{64})$/.test(fingerprint)||authority.status!=='ACTIVE'} onClick={()=>void send(true)}>Save verified portfolio review</button></>}
 </details>
 {draft&&<><p>Saved model reply consumed. Owner review remains required.</p><blockquote>{draft}</blockquote></>}{error&&<p role="alert">{error}</p>}
 </section>;
}
