'use client';
import {useEffect,useState} from 'react';
import {useAuth} from '@/lib/auth/context';
import {readTwinChatContext,setTwinChatContext,twinContextEvent} from '@/lib/owner/twin-chat-context';
export function TwinChatContext(){
 const {user}=useAuth(),[label,setLabel]=useState(''),[invalid,setInvalid]=useState(false);
 useEffect(()=>{let controller:AbortController|undefined;const update=async()=>{controller?.abort();controller=new AbortController();const signal=controller.signal,ref=user?readTwinChatContext(user.id):null;if(!ref){setLabel('');setInvalid(false);return;}try{const res=await fetch('/api/owner/commerce/twin/context?'+new URLSearchParams({...ref} as Record<string,string>),{cache:'no-store',credentials:'include',signal}),body=await res.json();if(!res.ok)throw Error('Product context needs refresh');if(!signal.aborted){setLabel((ref.sessionId?'DIGITAL TWIN · ':body.sourceClassification==='REAL_READ_ONLY'?'RESEARCH · ':'TEST EXAMPLE · ')+body.label);setInvalid(false);}}catch{if(!signal.aborted){setLabel('Product context is stale or unavailable — reopen it from the product');setInvalid(true);}}};void update();window.addEventListener(twinContextEvent,update);return()=>{controller?.abort();window.removeEventListener(twinContextEvent,update);};},[user]);
 return label?<div role={invalid?'alert':'status'} aria-label="Selected product context" style={{display:'flex',gap:8,alignItems:'center',padding:'6px 12px',fontSize:12,background:'#e5f3ff',borderRadius:12}}><span>{label}</span><button aria-label="Remove product context" onClick={()=>{if(user)setTwinChatContext(user.id,null);}}>×</button></div>:null;
}
