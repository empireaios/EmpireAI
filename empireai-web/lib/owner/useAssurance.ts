'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {parseAssurance,isFresh,readReceipt,validateOwnerCommand,validateEngineeringCommand,type AssuranceEvidence,type AssuranceCommand,type OwnerCommand,type CommandReceipt} from './assurance-contract';
const pendingKey='empireai.assurance.pending-command.v1';
export function useAssurance(){
 const [data,setData]=useState<AssuranceEvidence|null>(null),[error,setError]=useState(false),[now,setNow]=useState(0);
 const [pending,setPending]=useState<AssuranceCommand|null>(null),[receipt,setReceipt]=useState<CommandReceipt|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const alive=useRef(false),inFlight=useRef(false),submitting=useRef(false),abort=useRef<AbortController|null>(null),pendingRef=useRef<AssuranceCommand|null>(null);
 const refresh=useCallback(async()=>{
  if(inFlight.current)return;inFlight.current=true;const controller=new AbortController();abort.current=controller;const timeout=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch('/api/owner/assurance',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error();const next=parseAssurance(await response.json());if(alive.current){setData(next);setError(false);setNow(Date.now());
   const command=pendingRef.current;const recorded=command&&next.controlPlane?.commands?.find(r=>r.id===command.id);
   if(recorded){const verified=readReceipt(recorded,command.id);setReceipt(verified);setPending(null);pendingRef.current=null;try{sessionStorage.removeItem(pendingKey);}catch{}setMessage(verified.status==='ACCEPTED'?'Action recorded. Recovery success requires a verified recovery receipt below.':`Action denied: ${verified.reason??'No authority granted'}.`);}
  }}catch{if(alive.current){setError(true);setNow(Date.now());}}finally{clearTimeout(timeout);inFlight.current=false;}
 },[]);
 useEffect(()=>{alive.current=true;queueMicrotask(()=>{if(!alive.current)return;try{const saved=sessionStorage.getItem(pendingKey);if(saved){const p:unknown=JSON.parse(saved);if(validateOwnerCommand(p)||validateEngineeringCommand(p)){pendingRef.current=p as AssuranceCommand;setPending(p as AssuranceCommand);setMessage('Checking the durable receipt for an earlier action.');}}}catch{}});
  queueMicrotask(()=>void refresh());const interval=setInterval(()=>void refresh(),15000),clock=setInterval(()=>setNow(Date.now()),1000);return()=>{alive.current=false;abort.current?.abort();clearInterval(interval);clearInterval(clock);};
 },[refresh]);
 const submit=useCallback(async(command:AssuranceCommand)=>{
  if(submitting.current)return;submitting.current=true;setBusy(true);setMessage('Submitting your scoped action…');setPending(command);pendingRef.current=command;try{sessionStorage.setItem(pendingKey,JSON.stringify(command));}catch{}
  try{const response=await fetch('/api/owner/assurance/control',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(20000)});const body=await response.json();
   if([400,401,403,404,409,413,415,422].includes(response.status)){
    if(alive.current){setPending(null);pendingRef.current=null;try{sessionStorage.removeItem(pendingKey);}catch{}setMessage(`Action rejected (${response.status}): ${typeof body.error==='string'?body.error:'No action receipt accepted'}. No successful recovery is claimed.`);}return;
   }
   if(!response.ok)throw Error(typeof body.error==='string'?body.error:'Action was not confirmed');const result=readReceipt(body,command.id);
   if(alive.current){setReceipt(result);setPending(null);pendingRef.current=null;try{sessionStorage.removeItem(pendingKey);}catch{}setMessage(result.status==='ACCEPTED'?'Action recorded. Recovery success requires a verified recovery receipt below.':`Action denied: ${result.reason??'No authority granted'}.`);}
  }catch{if(alive.current)setMessage('Outcome not confirmed. Automatic refresh is checking durable receipts. Reconcile this same action before starting another.');}
  finally{submitting.current=false;if(alive.current)setBusy(false);void refresh();}
 },[refresh]);
 const act=(type:OwnerCommand['type'],ids:Pick<OwnerCommand,'approvalId'|'incidentId'>={})=>{if(!pendingRef.current)void submit({id:'owner_'+crypto.randomUUID(),type,...ids});};
 const engineering=(command:EngineeringCommandWithoutId)=>{if(!pendingRef.current)void submit({...command,id:'owner_'+crypto.randomUUID()} as AssuranceCommand);};
 return {data,error,now,fresh:isFresh(data,now,error),refresh,act,engineering,busy,pending,receipt,message,reconcile:()=>pending&&void submit(pending)};
}
type EngineeringCommandWithoutId=AssuranceCommand extends infer C?C extends {id:string}?Omit<C,'id'>:never:never;
