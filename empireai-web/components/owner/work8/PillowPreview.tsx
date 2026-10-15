'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
type Row=Record<string,unknown>;
/** Consumes saved Pillow work; neither button submits an inference request. */
export function PillowPreview({sessionId,authority,onPrepared}:{sessionId:string;authority:Row;onPrepared:(value:Row)=>void}){
 const [instruction,setInstruction]=useState(''),[chatSessionId,setChatSessionId]=useState(''),[requestId,setRequestId]=useState(''),[brief,setBrief]=useState(''),[proposal,setProposal]=useState<Row|null>(null),[inspection,setInspection]=useState<Row|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 async function send(consume:boolean){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{
  const grant=authority.grant as Row|undefined;
  const input=consume?proposal:{id:grant?.mode==='ONE_TASK'?grant.taskId:crypto.randomUUID(),sessionId,chatSessionId,instruction,grantDigest:grant?.digest};
  if(!input)throw Error('Prepare the bound brief first.');
  const response=await fetch('/api/owner/commerce',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({action:consume?'twin_pillow_preview_consume':'twin_pillow_preview_brief',proposal:{...input,...(consume?{requestId}:{})}})});
  const body=await response.json();if(!response.ok)throw Error('The saved proposal could not be verified. Check its session, permission and completed reply.');
  if(consume)onPrepared({...body.result,proposalDigest:body.digest});else{setProposal(input);setBrief(body.requestMessage);setInspection(body.inspection??null);}
 }catch(e){setError(e instanceof Error?e.message:'Proposal unavailable');}finally{lock.current=false;setBusy(false);}}
 return <section aria-label="Pillow preview proposal"><h3>Prepare a preview with Pillow</h3><p>Link a completed Pillow reply to this isolated preview. This does not run inference or deploy changes. Any new Pillow request needs its existing separate authorisation.</p>
 <label>Requested change <textarea value={instruction} maxLength={1000} onChange={e=>{setInstruction(e.target.value);setBrief('');setProposal(null);setInspection(null);}}/></label>
 {inspection&&<p>Inspected the server’s isolated colour-preview implementation. This inspection covers that preview only.</p>}
 <details><summary>Saved conversation details</summary><label>Pillow conversation reference <input value={chatSessionId} maxLength={100} onChange={e=>{setChatSessionId(e.target.value);setBrief('');setProposal(null);setInspection(null);}}/></label>
 {brief&&<><label>Conversation brief and exact preview context <textarea readOnly value={brief} rows={8}/></label><button onClick={()=>void navigator.clipboard.writeText(brief).catch(()=>setError('Copy unavailable; select the brief text above.'))}>Copy brief</button><label>Completed Pillow reply reference <input value={requestId} maxLength={100} onChange={e=>setRequestId(e.target.value)}/></label></>}
 </details>
 <button disabled={busy||authority.status!=='ACTIVE'||instruction.trim().length<3||!chatSessionId} onClick={()=>void send(false)}>Prepare bound conversation brief</button>
 {brief&&<><Link href="/cockpit/development/pillow" target="_blank" rel="noreferrer">Open existing Pillow Chat</Link><button disabled={busy||!requestId||authority.status!=='ACTIVE'} onClick={()=>void send(true)}>Use completed reply as preview</button></>}
 {error&&<p role="alert">{error}</p>}</section>;
}
