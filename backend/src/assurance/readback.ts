import {reconciliationHash} from './evidence-reconciliation.js';
type Row=Record<string,any>;
const fields=['id','seq','at','type','mode','state','status','stage','revision','incidentId','recoveryId','monitorIncidentId','runbookId','actor','ownerApprovalActor','completed','verifiedAt','startedAt','completedAt','decision','consumed','summary','capability','observedAt','preservation'];
/** Projection only. Canonical evidence is neither pruned nor rewritten. */
export function recordSummary(kind:string,row:Row){
 const out:Row={recordId:kind+':'+String(row.id??row.seq),sha256:reconciliationHash(row)};
 for(const field of fields){const value=row[field];if(value!==undefined&&Buffer.byteLength(JSON.stringify(value))<=1200)out[field]=value;}
 return out;
}
export function assurancePage(snapshot:Row,after='',limit=20){
 const cp=snapshot.controlPlane;if(!cp)return snapshot;
 const kinds:Record<string,string>={incidents:'incident',recoveries:'recovery',approvals:'approval',commands:'command',checkpoints:'checkpoint',acceptances:'acceptance_history',events:'event'};
 const records=Object.entries(kinds).flatMap(([field,kind])=>(cp[field]??[]).map((r:Row)=>recordSummary(kind,r))).sort((a,b)=>a.recordId.localeCompare(b.recordId,'en'));
 const start=after?records.findIndex(r=>r.recordId===after)+1:0;
 if(after&&start===0)throw Error('UNKNOWN_CURSOR');
 const page=records.slice(start,start+Math.min(20,Math.max(1,limit)));
 return {schema:'assurance-readback-v2',controlPlane:{status:cp.status,revision:cp.revision,observedAt:cp.observedAt,summary:cp.summary,monitor:cp.monitor,paused:cp.paused,lease:cp.lease,activeAcceptance:cp.activeAcceptance,components:(cp.components??[]).map((r:Row)=>recordSummary('probe',r))},advisor:snapshot.advisor,authority:snapshot.authority,reconciliation:{schema:snapshot.reconciliation?.schema,indexStatus:snapshot.reconciliation?.indexStatus,sourceDigest:snapshot.reconciliation?.sourceDigest,derivedSha256:snapshot.reconciliation?.derivedSha256,conflicts:snapshot.reconciliation?.conflicts?.length,exactRead:'reconciliation'},records:page,pagination:{limit:page.length,totalInWindow:records.length,next:start+page.length<records.length?page.at(-1)?.recordId:null,coverage:'Retained snapshot window; exact durable record lookup also supported',exactRecordFormat:'assurance:<kind>:<id>; large records return lossless JSON chunks with after=next'}};
}
export function exactAssuranceRecord(kind:string,row:Row|null,after=''){
 if(!row)return undefined;
 const json=JSON.stringify(row),sha256=reconciliationHash(row);
 if(Buffer.byteLength(json)<=128000&&!after)return {recordId:kind+':'+String(row.id??row.seq),sha256,record:row,complete:true};
 const offset=after===''?0:Number(after);if(!Number.isSafeInteger(offset)||offset<0||offset>=json.length)throw Error('INVALID_CHUNK_CURSOR');
 const end=Math.min(json.length,offset+12000);
 return {recordId:kind+':'+String(row.id??row.seq),sha256,encoding:'JSON_UTF16_CHUNKS',offset,totalCharacters:json.length,jsonChunk:json.slice(offset,end),next:end<json.length?String(end):null,complete:end===json.length};
}
