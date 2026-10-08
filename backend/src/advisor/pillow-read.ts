import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {getChatRequest} from '../runtime/pillow-chat-request-store.js';

type Row=Record<string,any>;
function read<T>(file:string,fn:(db:DatabaseSync)=>T):T {
  if(!fs.lstatSync(file).isFile()||fs.realpathSync(file)!==file)throw Error('READ_PATH');
  const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:1000});
  try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');return fn(db);}finally{db.close();}
}
const order=(a:Row,b:Row)=>String(a.timestamp??'').localeCompare(String(b.timestamp??''));
const fingerprint=(text:string)=>({characters:text.length,sha256:createHash('sha256').update(text).digest('hex'),truncated:false});
function transcripts(root:string,w:string):Row[]{
  return read(path.join(root,'commissioning','pillow-reasoning.sqlite'),db=>db.prepare('SELECT session,updated,turns FROM transcripts WHERE workspace=? ORDER BY updated DESC,session DESC').all(w).map(r=>({...r,turns:JSON.parse(String(r.turns)).sort(order)})));
}
function receipts(root:string,w:string):Row[]{
  const file=path.join(root,'commissioning','pillow-request-receipts.sqlite');
  return fs.existsSync(file)?read(file,db=>db.prepare('SELECT body FROM receipts WHERE workspace=? ORDER BY updated DESC,request DESC').all(w).map(r=>JSON.parse(String(r.body)))):[];
}
function associations(root:string,w:string,ids:string[],text:string){
  const file=path.join(root,'commissioning','intelligence.sqlite');
  if(!fs.existsSync(file))return {status:'SOURCE_UNAVAILABLE',jobs:[],opportunities:[]};
  return read(file,db=>{
    const jobs=(db.prepare('SELECT body FROM jobs WHERE workspace=?').all(w).map(r=>JSON.parse(String(r.body))) as Row[]).filter(j=>ids.some(id=>j.requester==='PILLOW:'+id));
    const evidence=new Set(jobs.flatMap(j=>j.evidence??[]));
    const opportunities=(db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='opportunities'").all(w).map(r=>JSON.parse(String(r.body))) as Row[])
      .filter(o=>text.includes(o.id)||(o.evidenceRefs??[]).some((e:string)=>evidence.has(e)))
      .map(o=>({id:o.id,fetchId:'opportunities:'+o.id,basis:text.includes(o.id)?'EXPLICIT_TEXT_REFERENCE':'SHARED_JOB_EVIDENCE',status:o.status}));
    return {status:jobs.length||opportunities.length?'STORED_LINKS_FOUND':'NO_STORED_LINK',jobs:jobs.map(j=>({id:j.id,fetchId:'intelligence_jobs:'+j.id,status:j.status,requester:j.requester,evidenceRefs:j.evidence})),opportunities,meaning:'Evidence association only; not proof of a completed CEO investigation'};
  });
}

/** All discovery is workspace scoped. No source writes, provider calls or replay. */
export async function readPillow(root:string,w:string,id?:string,after='',limit=20,since?:string){
  const rows=transcripts(root,w),saved=receipts(root,w);
  const coverage:Row={order:'updated DESC, session DESC',since:since??null,complete:true,nextAfter:null,history:'Retained transcript window only; older turns may have been pruned by existing storage policy',inferenceCalls:0};
  if(!id){
    const sessions=new Map(rows.map(r=>[r.session,{...r}]));
    for(const r of saved){const s=sessions.get(r.sessionId);if(!s)sessions.set(r.sessionId,{session:r.sessionId,updated:r.updatedAt,turns:[]});else if(r.updatedAt>s.updated)s.updated=r.updatedAt;}
    let all=[...sessions.values()].sort((a,b)=>String(b.updated).localeCompare(String(a.updated))||String(b.session).localeCompare(String(a.session))).filter(r=>!since||r.updated>since);
    if(after){const pos=all.findIndex(r=>r.session===after);if(pos<0)throw Error('UNKNOWN_SESSION_CURSOR');all=all.slice(pos+1);}
    coverage.complete=all.length<=limit;const page=all.slice(0,limit);coverage.nextAfter=coverage.complete?null:page.at(-1)?.session;
    return {data:page.map(r=>({session:r.session,id:r.session,fetchId:'pillow:'+r.session,updated:r.updated,latestRequestId:r.turns.at(-1)?.requestId??saved.find(p=>p.sessionId===r.session)?.requestId??null,latestRole:r.turns.at(-1)?.role??null,preview:r.turns.at(-1)?.content?.slice(0,240)??null,retainedTurns:r.turns.length})),coverage};
  }
  const requestId=id.startsWith('request:')?id.slice(8):id.startsWith('pcr_')?id:null;
  const sessionId=id.startsWith('session:')?id.slice(8):id;
  let live:Row|null=null,liveAvailable=true;
  if(requestId){try{live=await getChatRequest(requestId);}catch{liveAvailable=false;}if(live?.workspaceId!==w)live=null;}
  const receipt=requestId?(live??saved.find(r=>r.requestId===requestId)):null;
  const session=requestId?rows.find(r=>r.turns.some((t:Row)=>t.requestId===requestId))??rows.find(r=>r.session===receipt?.sessionId):rows.find(r=>r.session===sessionId);
  const turns:Row[]=requestId?(session?.turns??[]).filter((t:Row)=>t.requestId===requestId):(session?.turns??[]);
  const ids:string[]=requestId?[requestId]:[...new Set<string>([...turns.map(t=>t.requestId).filter(Boolean),...saved.filter(r=>r.sessionId===sessionId).map(r=>r.requestId)])];
  const requests:Row[]=[];
  for(const rid of ids){
    let r:Row|undefined=rid===requestId?receipt??undefined:undefined;
    if(!requestId){try{const current=await getChatRequest(rid);if(current?.workspaceId===w)r=current;}catch{liveAvailable=false;}r??=saved.find(p=>p.requestId===rid);}
    const rt=turns.filter(t=>t.requestId===rid),answer=rt.filter(t=>t.role==='assistant').at(-1);
    const result=r?.finalResult??null;
    requests.push({requestId:rid,fetchId:'pillow:request:'+rid,sessionId:session?.session??r?.sessionId??null,status:r?.status??'UNKNOWN_REQUEST_STATE',failureClass:r?.failureClass??null,
      completionState:r?.status==='COMPLETED'&&result?'COMPLETED':r?.status==='FAILED_FATAL'||r?.status==='FAILED'?'INCOMPLETE_FAILED':r?'INCOMPLETE_PENDING':answer?'TRANSCRIPT_ONLY_COMPLETION_UNVERIFIED':'MISSING',
      createdAt:r?.createdAt??rt[0]?.timestamp??null,updatedAt:r?.updatedAt??rt.at(-1)?.timestamp??null,deliveryState:r?.deliveryState??'UNKNOWN',observability:r?.observability??null,
      requestText:rt.find(t=>t.role==='user')?.content??null,requestTextState:rt.some(t=>t.role==='user')?'COMPLETE_STORED_TURN':'NOT_RETAINED',
      responseText:answer?.content??(typeof result?.message==='string'?result.message:null),responseKind:r?.status==='FAILED_FATAL'?'FAILURE_NOTICE':r?.status==='COMPLETED'?'COMPLETED_RESPONSE':'STORED_TEXT_COMPLETION_UNVERIFIED',
      finalResult:result,responseIntegrity:answer?fingerprint(answer.content):typeof result?.message==='string'?fingerprint(result.message):null,
      provenance:{requestState:r?(live?.requestId===rid?'LIVE_DURABLE_REQUEST':'DURABLE_REQUEST_RECEIPT_OR_LIVE_STATE'):'NOT_RETAINED',transcript:answer?'pillow-reasoning.sqlite':null,provider:answer?.provider??null}});
  }
  requests.sort((a,b)=>String(a.createdAt??'').localeCompare(String(b.createdAt??''))||a.requestId.localeCompare(b.requestId));
  const found=Boolean(session||receipt||saved.some(r=>r.sessionId===sessionId));
  coverage.order='timestamp ASC; requests createdAt ASC';coverage.liveRequestStoreAvailable=liveAvailable;
  return {data:found?{session:session?.session??receipt?.sessionId??sessionId,updated:session?.updated??receipt?.updatedAt??null,requestId:requestId??null,turns,requests,
    associations:associations(root,w,ids,turns.map(t=>t.content).join('\n')),textCompleteForRetainedTurns:true}:null,
    status:found?'AVAILABLE':'UNAVAILABLE',reason:found?undefined:'EXACT_SESSION_OR_REQUEST_NOT_FOUND',coverage};
}

export function searchPillow(root:string,w:string,query:string){
  const q=query.toLowerCase().replace(/^pillow\s*:?\s*/,'').trim();
  const result:Row[]=[];
  for(const row of transcripts(root,w)){
    for(const t of [...row.turns].reverse()){
      if(t.requestId&&(String(t.content).toLowerCase().includes(q)||t.requestId.toLowerCase()===q||row.session.toLowerCase()===q)){
        if(result.some(r=>r.id==='pillow:request:'+t.requestId))continue;
        result.push({id:'pillow:request:'+t.requestId,title:'Pillow request '+t.requestId,sessionId:row.session,timestamp:t.timestamp,preview:t.content.slice(0,200),url:'https://empire-ai.co/cockpit/advisor?record='+encodeURIComponent('pillow:request:'+t.requestId)});
      }
    }
  }
  result.sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp)));
  return {results:result.slice(0,20),complete:result.length<=20,scope:'Retained transcript text and exact identifiers; no inference'};
}
