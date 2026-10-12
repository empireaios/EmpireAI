import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
import {getGlobalNotificationRepository} from '../repositories/sqlite-global-notification-repository.js';
import type {GlobalNotification} from '../models/global-notification.js';import {priorityForType} from '../models/global-notification.js';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
/** Independent inspector findings have system scope, not a tenant column. Never expose them to another workspace. */
export function ingestInspectorNotifications(workspaceId:string,companyId:string,root=process.env.RAILWAY_VOLUME_MOUNT_PATH){
 if(!root||workspaceId!=='ws_empire_1')return [];
 if(!companyId||companyId.length>160)throw Error('ASSURANCE_NOTIFICATION_SCOPE');
 const repo=getGlobalNotificationRepository();
 const save=(sourceRef:string,title:string,body:string,type:GlobalNotification['type'],metadata:Record<string,unknown>)=>{const old=repo.getBySourceRef(workspaceId,companyId,sourceRef);return repo.upsert({notificationId:old?.notificationId??repo.createId(),workspaceId,companyId,source:'assurance',sourceRef,title,body,type,priority:priorityForType(type),deepLink:'/cockpit/assurance',readAt:old?.readAt??null,acknowledgedAt:old?.acknowledgedAt??null,createdAt:old?.createdAt??new Date().toISOString(),metadata:{...metadata,observerSource:'INDEPENDENT_INSPECTOR',sourceScope:'SYSTEM_BOUND_TO_WS_EMPIRE_1',deliveryScope:'AUTHENTICATED_SYSTEM_WORKSPACE_PULL_INBOX',independentPushDelivered:false,grantsAuthority:false,acknowledgementScope:'NOTICE_ONLY_NOT_INCIDENT_RESOLUTION'}});};
 try{
  const file=path.join(root,'commissioning','assurance.sqlite');if(!path.isAbsolute(root)||fs.realpathSync(root)!==root||fs.realpathSync(file)!==file||!fs.lstatSync(file).isFile())throw Error('SOURCE_PATH');
  const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:1000});let rows:Record<string,unknown>[];
  try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
   const sizes=db.prepare('SELECT length(CAST(detail AS BLOB)) bytes FROM assurance_findings ORDER BY last_at DESC,id LIMIT 101').all();if(sizes.some(r=>Number(r.bytes)>4096)||sizes.reduce((n,r)=>n+Number(r.bytes),0)>262144)throw Error('SOURCE_BOUND');
   rows=db.prepare('SELECT id,source,severity,status,first_at,last_at,resolved_at,detail FROM assurance_findings ORDER BY last_at DESC,id LIMIT 101').all();
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
  // Validate whole visible window before persisting any notice. Findings are evidence, never executable content.
  for(const r of rows)if(typeof r.id!=='string'||r.id.length>200||typeof r.source!=='string'||r.source.length>160||!['OPEN','RESOLVED'].includes(String(r.status))||!['CRITICAL','HIGH','WARNING','LOW','INFO'].includes(String(r.severity))||!Number.isSafeInteger(r.first_at)||!Number.isSafeInteger(r.last_at)||Number(r.last_at)<Number(r.first_at)||typeof r.detail!=='string'||(r.status==='RESOLVED'&&(!Number.isSafeInteger(r.resolved_at)||Number(r.resolved_at)<Number(r.last_at))))throw Error('SOURCE_INVALID');
  const notices=rows.slice(0,100).map(r=>save('assurance:inspector:'+hash({id:r.id,status:r.status,detail:r.detail,severity:r.severity,resolvedAt:r.resolved_at}),`Independent Assurance finding ${r.status}`,`${r.source}: ${r.detail}. Review the independent finding before acting.`,r.status==='RESOLVED'?'information':r.severity==='CRITICAL'?'critical':r.severity==='HIGH'?'error':'warning',{findingId:r.id,status:r.status,sourceDigest:hash(r),sourceObservedAt:r.last_at,firstObservedAt:r.first_at,resolvedAt:r.resolved_at,coverage:'LATEST_100_FINDINGS',findingSource:r.source}));
  if(rows.length>100)notices.push(save('assurance:inspector:coverage-bound','More independent Assurance findings exist','This inbox projection covers only the latest 100 findings. Inspect canonical Assurance evidence for older findings.','warning',{inspectorSourceStatus:'INCOMPLETE_WINDOW',coverage:'LATEST_100_FINDINGS'}));
  return notices;
 }catch{return [save('assurance:inspector:unavailable','Independent Assurance finding source unavailable','Independent finding coverage could not be verified. Existing notices remain; no recovery or independent push is inferred.','warning',{inspectorSourceStatus:'UNAVAILABLE_OR_BOUND'})];}
}
