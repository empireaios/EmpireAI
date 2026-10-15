'use client';
import {useState} from 'react';
type Asset={id:string;url:string;kind:'IMAGE'|'VIDEO';sha256:string;sourceIdentity:string;rightsEvidence:string;rightsStatus:'UNVERIFIED'|'OWNER_REVIEWED';provenance:string};
export type MediaProposal={instructions:string;assets:Asset[];editingReceipt:string};
export function MediaImport({busy,onSave}:{busy:boolean;onSave:(proposal:MediaProposal)=>Promise<boolean>}){
 const [assets,setAssets]=useState<Asset[]>([]),[url,setUrl]=useState(''),[kind,setKind]=useState<'IMAGE'|'VIDEO'>('IMAGE'),[hash,setHash]=useState(''),[source,setSource]=useState(''),[rights,setRights]=useState(''),[reviewed,setReviewed]=useState(false),[provenance,setProvenance]=useState(''),[receipt,setReceipt]=useState(''),[instructions,setInstructions]=useState(''),[error,setError]=useState('');
 return <details><summary>Import revised images or videos</summary><p>Add existing edited assets and their source evidence. Saving creates a proposal; internal approval and simulated publication approval remain separate.</p>
 <form onSubmit={e=>{e.preventDefault();setError('');try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw Error('Use an HTTPS asset link without credentials.');if(assets.length>=20)throw Error('A batch can contain up to 20 assets.');if(assets.some(a=>a.url===url))throw Error('This asset link is already in the batch.');setAssets([...assets,{id:'asset-'+crypto.randomUUID(),url,kind,sha256:hash,sourceIdentity:source,rightsEvidence:rights,rightsStatus:reviewed?'OWNER_REVIEWED':'UNVERIFIED',provenance}]);setUrl('');setHash('');setReviewed(false);}catch(e){setError(e instanceof Error?e.message:'Check the asset details.');}}}>
 <label>Asset link <input type="url" required maxLength={2000} value={url} onChange={e=>setUrl(e.target.value)}/></label>
 <label>Media type <select value={kind} onChange={e=>setKind(e.target.value as 'IMAGE'|'VIDEO')}><option value="IMAGE">Image</option><option value="VIDEO">Video</option></select></label>
 <label>Source or editing provider <input required maxLength={300} value={source} onChange={e=>setSource(e.target.value)}/></label>
 <label>Usage-rights evidence <textarea required maxLength={500} value={rights} onChange={e=>setRights(e.target.value)}/></label>
 <label><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>I reviewed permission to use this exact asset.</label>
 <label>Origin and editing history <textarea required maxLength={1000} value={provenance} onChange={e=>setProvenance(e.target.value)}/></label>
 <label>Asset SHA-256 checksum <input required pattern="[a-f0-9]{64}" maxLength={64} value={hash} onChange={e=>setHash(e.target.value.trim().toLowerCase())}/></label><p>The link and checksum are recorded as submitted evidence; asset bytes have not been independently verified.</p>
 <button disabled={busy||assets.length>=20} type="submit">Add asset to proposed batch</button></form>
 {assets.length>0&&<><ol>{assets.map((a,i)=><li key={a.id}>{a.kind==='IMAGE'?'Image':'Video'} {i+1} · {a.sourceIdentity} · {a.rightsStatus==='OWNER_REVIEWED'?'Rights reviewed':'Rights need review'} <button disabled={busy} onClick={()=>setAssets(assets.filter(x=>x.id!==a.id))}>Remove</button></li>)}</ol>
 <form onSubmit={async e=>{e.preventDefault();if(await onSave({assets,instructions,editingReceipt:receipt})){setAssets([]);setReceipt('');setInstructions('');}}}>
 <label>Changes made <textarea required maxLength={3000} value={instructions} onChange={e=>setInstructions(e.target.value)}/></label>
 <label>Editing receipt or provenance reference <textarea required maxLength={1000} value={receipt} onChange={e=>setReceipt(e.target.value)}/></label>
 <button disabled={busy} type="submit">Save revised batch for review</button></form></>}
 {error&&<p role="alert">{error}</p>}
 </details>;
}
