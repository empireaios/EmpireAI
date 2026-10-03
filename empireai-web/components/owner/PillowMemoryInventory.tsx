'use client';
import {useState} from 'react';
import type {MemoryInventory} from '@/lib/owner/memory-evidence';
export function PillowMemoryInventory(){
 const [data,setData]=useState<MemoryInventory|null>(null),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
 async function inspect(){
  setBusy(true);setFailed(false);setData(null);
  try{
   const response=await fetch('/api/owner/memory',{cache:'no-store',signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error();setData(await response.json() as MemoryInventory);
  }catch{setFailed(true);}finally{setBusy(false);}
 }
 return <section aria-label="Pillow memory inventory" className="mt-3 space-y-2 rounded-lg border border-gold/15 p-3 text-xs text-[#c8c0b0]">
  <h3 className="font-semibold text-[#f0d78c]">Memory &amp; learning</h3>
  <p>Screen context and conversation are temporary context. They do not establish durable learning or what was included in a particular model request.</p>
  <button type="button" disabled={busy} onClick={()=>void inspect()} className="min-h-11 rounded border border-gold/30 px-3 disabled:opacity-50">{busy?'Reading memory…':'Inspect stored strategic memory'}</button>
  <div aria-live="polite">{failed?<p role="alert">Memory inventory unavailable. Counts and learning state are unknown.</p>:data?<>
   <p>Stored strategic records: {data.total} · Active: {data.active} · Archived: {data.archived} · Superseded: {data.superseded}</p>
   <p>Source attribution recorded: {data.withSource} of {data.total}. Attribution alone does not verify the source or prove that Pillow learned from it.</p>
   <p>Latest record change: {data.latestChange??'No stored records'}. Read at: {data.checkedAt}.</p>
   <dl className="grid grid-cols-2 gap-1">{Object.entries(data.byCategory).map(([category,count])=><div key={category}><dt>{category.replace(/([A-Z])/g,' $1')}</dt><dd>{count}</dd></div>)}</dl>
  </>:<p>Stored inventory not yet checked.</p>}</div>
  <p>This is one strategic-memory store. A zero count does not mean no conversation history or no other memory. Promotion, retention, expiry, retrieval into a model request and restart durability are not verified by this view. Memory content and private metadata are withheld.</p>
 </section>;
}
