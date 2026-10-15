export type OwnerCommand = {id:string;type:'health_check'|'pause'|'resume'|'retry'|'approve'|'reject'|'defer';incidentId?:string;approvalId?:string};
export type ClosureEvidence={backendSha:string;frontendSha:string;backendDeploymentId:string;frontendDeploymentId:string;ciRunIds:string[];preservationDigest:string;readbackProof:string;desktopProof:string;mobileProof:string;collisionProof:string;selfFailureProof:string};
export type EngineeringCommand = {id:string;type:'record_handover'}|{id:string;type:'acceptance_admit';mode:'AUTOMATIC'|'API_ADVISOR'|'OWNER_APPROVAL'|'MONITOR_FAILURE'|'DEPLOYMENT_COLLISION';expectedRevision:string;expectedSha256:string}|{id:string;type:'lease_begin';expectedRevision:string;scope:string[];ttlMs:number}|{id:string;type:'lease_finish';leaseId:string;fence:number}|{id:string;type:'checkpoint';missionId:string;state:'IN_PROGRESS'|'BLOCKED'|'ACCEPTANCE_PENDING';evidence:string[]}|{id:string;type:'mission_close';missionId:string;state:'COMPLETE'|'INCOMPLETE'|'BLOCKED_EXTERNAL'|'OWNER_ACTION_REQUIRED';externalEvidence:ClosureEvidence};
export type AssuranceCommand=OwnerCommand|EngineeringCommand;
export type CommandReceipt = {id:string;type:string;status:string;reason?:string;at:number;revision:string};
export type Incident = {id:string;capability:string;classification:string;severity:string;summary:string;status:string;firstAt:number;lastAt:number;revision:string;runbookId:string|null;recurrence:number;attempts:number;limitation?:string;verifiedAt?:number};
export type Approval = {id:string;incidentId:string;runbookId:string;runbookVersion:string;revision:string;decision:string;createdAt:number;expiresAt:number;consumed:boolean;title?:string;proposedAction?:string;impact?:string;alreadyDone?:string;approvalReason?:string;consequences?:{approve:string;reject:string;defer:string;inaction:string}};
export type Recovery = {id:string;incidentId:string;runbookId:string;status:string;actor:string;startedAt:number;completedAt?:number;error?:string;verification?:unknown};
export type ControlPlane = {
 schema:'assurance-control-plane-v1';observedAt:number;revision:string;status:string;
 summary:{activeIncidents:number;automaticallyRecovered:number;ownerActionRequired:number};paused:{paused:boolean};
 monitor:{fresh:boolean;heartbeat:{at:number;revision:string}|null};
 components:{id:string;capability:string;status:string;summary:string;observedAt:number}[];
 incidents:Incident[];recoveries:Recovery[];approvals:Approval[];
 lease:null|{id:string;ownerId:string;revision:string;status:string;scope:string[];expiresAt:number;fence:number};
 events:{seq:number;at:number;type:string;body:unknown}[];commands?:CommandReceipt[];
 acceptances?:{id:string;mode:string;completed:boolean;incidentId?:string;recoveryId?:string;monitorIncidentId?:string;pauseUntil?:number;preservation?:{verified:boolean;originalCount:number;currentCount:number;addedCount:number;manifestSha256:string};preservationManifestSha256?:string;preservationOriginalCount?:number}[];activeAcceptance?:string|null;
 checkpoints:{id:string;state:string;at:number}[];
};
export type AssuranceEvidence = {
 observedAt:number;status:string;scope?:string;controlPlane?:ControlPlane;
 coverage?:{source:string;status:string;reason?:string;evidenceReference?:string|null}[];
 accounting?:{heldMicroUsd:number;recordedEstimateMicroUsd:number;invoiceActualMicroUsd:number|null;invoiceUnknownCount:number};
 advisor?:Record<string,unknown>;reconciliation?:Record<string,unknown>;
};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function parseAssurance(value:unknown):AssuranceEvidence {
 if(!record(value)||typeof value.observedAt!=='number'||!Number.isFinite(value.observedAt)||typeof value.status!=='string')throw Error('Invalid Assurance evidence');
 const c=value.controlPlane;
 if(c!==undefined){
  if(!record(c)||c.schema!=='assurance-control-plane-v1'||typeof c.observedAt!=='number'||typeof c.revision!=='string'||typeof c.status!=='string'||!record(c.summary)||!record(c.paused)||typeof c.paused.paused!=='boolean'||!record(c.monitor)||typeof c.monitor.fresh!=='boolean')throw Error('Invalid control plane');
  for(const k of ['components','incidents','recoveries','approvals','events','checkpoints'])if(!Array.isArray(c[k])||(c[k] as unknown[]).some(x=>!record(x)))throw Error('Invalid control plane records');
  for(const k of ['activeIncidents','automaticallyRecovered','ownerActionRequired'])if(typeof c.summary[k]!=='number')throw Error('Invalid summary');
  const fields:Record<string,string[]>={components:['id','capability','status','summary'],incidents:['id','capability','classification','severity','summary','status','revision'],recoveries:['id','incidentId','runbookId','status','actor'],approvals:['id','incidentId','runbookId','runbookVersion','revision','decision'],checkpoints:['id','state'],events:['type']};
  for(const [kind,keys] of Object.entries(fields))for(const row of c[kind] as Record<string,unknown>[])for(const key of keys)if(typeof row[key]!=='string')throw Error('Invalid record fields');
  for(const row of c.approvals as Record<string,unknown>[]){for(const k of ['title','proposedAction','impact','alreadyDone','approvalReason'])if(row[k]!==undefined&&typeof row[k]!=='string')throw Error('Invalid proposal');if(row.consequences!==undefined&&(!record(row.consequences)||['approve','reject','defer','inaction'].some(k=>typeof row.consequences==='object'&&typeof (row.consequences as Record<string,unknown>)[k]!=='string')))throw Error('Invalid consequences');}
  if(c.lease!==null&&(!record(c.lease)||typeof c.lease.status!=='string'||typeof c.lease.ownerId!=='string'||!Array.isArray(c.lease.scope)||c.lease.scope.some(s=>typeof s!=='string')))throw Error('Invalid lease');
 }
 return value as AssuranceEvidence;
}
export function isFresh(data:AssuranceEvidence|null,now:number,error:boolean){
 return !!data&&!error&&now>0&&data.observedAt<=now&&now-data.observedAt<=90000&&!!data.controlPlane&&data.controlPlane.observedAt<=now&&now-data.controlPlane.observedAt<=90000&&data.controlPlane.monitor.fresh;
}
export const activeIncident=(i:Incident)=>!['CLOSED','RECOVERED'].includes(i.status);
export function readReceipt(value:unknown,id:string):CommandReceipt{
 if(!record(value)||value.id!==id||typeof value.status!=='string'||!['ACCEPTED','ACTION_DENIED'].includes(value.status)||typeof value.at!=='number'||typeof value.revision!=='string')throw Error('No matching durable receipt returned');
 return value as CommandReceipt;
}
export function validateOwnerCommand(value:unknown):value is OwnerCommand{
 if(!record(value)||typeof value.id!=='string'||!/^owner_[a-zA-Z0-9_-]{1,100}$/.test(value.id)||typeof value.type!=='string')return false;
 if(!['health_check','pause','resume','retry','approve','reject','defer'].includes(value.type))return false;
 const allowed=['id','type',...(value.type==='retry'?['incidentId']:['approve','reject','defer'].includes(value.type)?['approvalId']:[])];
 if(Object.keys(value).some(k=>!allowed.includes(k)))return false;
 const field=value.type==='retry'?'incidentId':['approve','reject','defer'].includes(value.type)?'approvalId':null;
 return !field||(typeof value[field]==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(value[field]));
}

/** Engineering commands remain authenticated, scoped and fenced by the backend. */
export function validateEngineeringCommand(value:unknown):boolean{
 if(!record(value)||typeof value.id!=='string'||!/^owner_[a-zA-Z0-9_-]{1,100}$/.test(value.id))return false;
 const key=(v:unknown)=>typeof v==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(v);
 if(value.type==='record_handover')return Object.keys(value).sort().join(',')==='id,type';
 if(value.type==='mission_close'){
  const e=value.externalEvidence;if(!Object.keys(value).every(k=>['id','type','missionId','state','externalEvidence'].includes(k))||!key(value.missionId)||!['COMPLETE','INCOMPLETE','BLOCKED_EXTERNAL','OWNER_ACTION_REQUIRED'].includes(String(value.state))||!record(e))return false;
  if(Object.keys(e).sort().join(',')!==['backendSha','frontendSha','backendDeploymentId','frontendDeploymentId','ciRunIds','preservationDigest','readbackProof','desktopProof','mobileProof','collisionProof','selfFailureProof'].sort().join(','))return false;
  if(!['backendSha','frontendSha'].every(k=>typeof e[k]==='string'&&/^[a-f0-9]{40}$/.test(e[k] as string))||!key(e.backendDeploymentId)||!key(e.frontendDeploymentId)||typeof e.preservationDigest!=='string'||!/^[a-f0-9]{64}$/.test(e.preservationDigest))return false;
  return Array.isArray(e.ciRunIds)&&e.ciRunIds.length>=2&&e.ciRunIds.length<=10&&e.ciRunIds.every(key)&&['readbackProof','desktopProof','mobileProof','collisionProof','selfFailureProof'].every(k=>typeof e[k]==='string'&&(e[k] as string).length>=10&&(e[k] as string).length<=2000);
 }
 if(value.type==='acceptance_admit')return Object.keys(value).every(k=>['id','type','mode','expectedRevision','expectedSha256'].includes(k))&&['AUTOMATIC','API_ADVISOR','OWNER_APPROVAL','MONITOR_FAILURE','DEPLOYMENT_COLLISION'].includes(String(value.mode))&&key(value.expectedRevision)&&typeof value.expectedSha256==='string'&&/^[a-f0-9]{64}$/.test(value.expectedSha256);
 if(value.type==='lease_begin')return Object.keys(value).every(k=>['id','type','expectedRevision','scope','ttlMs'].includes(k))&&key(value.expectedRevision)&&Array.isArray(value.scope)&&value.scope.length>0&&value.scope.length<=20&&value.scope.every(key)&&Number.isInteger(value.ttlMs)&&Number(value.ttlMs)>=1000&&Number(value.ttlMs)<=3600000;
 if(value.type==='lease_finish')return Object.keys(value).every(k=>['id','type','leaseId','fence'].includes(k))&&key(value.leaseId)&&Number.isInteger(value.fence)&&Number(value.fence)>0;
 if(value.type==='checkpoint')return Object.keys(value).every(k=>['id','type','missionId','state','evidence'].includes(k))&&key(value.missionId)&&['IN_PROGRESS','BLOCKED','ACCEPTANCE_PENDING'].includes(String(value.state))&&Array.isArray(value.evidence)&&value.evidence.length<=30&&value.evidence.every(e=>typeof e==='string'&&e.length<=500);
 return false;
}
