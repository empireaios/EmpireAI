'use client';
import {readSourceProductContext} from '@/lib/pillow/product-context';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MessageCircle,Plus} from 'lucide-react';
import {useGlobalAiAssistant} from '@/lib/cockpit/global-assistant/GlobalAiAssistantProvider';
export function ProductChatActions({missionId,sourceCandidateId}:{missionId?:string;sourceCandidateId?:string}){
 const router=useRouter(),{attachProduct}=useGlobalAiAssistant();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const open=async(compare:boolean)=>{setBusy(true);setError('');try{
  if(sourceCandidateId){const source=await readSourceProductContext(sourceCandidateId);await attachProduct(source.reference,compare);router.push('/cockpit/development/pillow');return;}
  if(!missionId||!/^[A-Za-z0-9_.:-]{1,160}$/.test(missionId))throw Error('Product reference unavailable.');
  const response=await fetch('/api/owner/commerce?missionId='+encodeURIComponent(missionId),{cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw Error('Product evidence unavailable.');
  const value=await response.json(),record=Array.isArray(value.missions)?value.missions.find((m:{missionId?:string})=>m.missionId===missionId):undefined;
  if(!record||typeof record.digest!=='string')throw Error('Current product evidence unavailable.');
  await attachProduct({missionId,receiptDigest:record.digest},compare);
  router.push('/cockpit/development/pillow');
 }catch(e){setError(e instanceof Error?e.message:'Product context unavailable.');}finally{setBusy(false);}};
 return <span><button type="button" aria-label="Discuss product with Pillow" title="Discuss product" disabled={busy} onClick={()=>void open(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-amber-200"><MessageCircle aria-hidden="true" size={16}/></button><button type="button" aria-label="Add product to Pillow comparison" title="Add to comparison" disabled={busy} onClick={()=>void open(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded text-amber-200"><Plus aria-hidden="true" size={16}/></button>{error&&<span role="alert" className="block text-xs text-amber-200">{error}</span>}</span>;
}
