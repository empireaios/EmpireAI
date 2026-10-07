import path from 'node:path';
import type { DurableChatRequest } from '../runtime/pillow-chat-request-store.js';
import { AdvisorStore } from './store.js';
/** Copy only a successfully settled canonical terminal result. Never settles inference or grants authority. */
export function persistAdvisorCompletion(record:DurableChatRequest,provided?:AdvisorStore){
 if(!record.requestId.startsWith('pcr_adv_')||!record.sessionId.startsWith('advisor_')||!['COMPLETED','FAILED_FATAL'].includes(record.status))return;
 const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;if(!provided&&(!root||process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1'))return;
 const store=provided??new AdvisorStore(path.join(root!,'commissioning','communications.sqlite'));
 const id=record.sessionId.slice(8),workspace=record.workspaceId;if(!workspace)return;
 const item=store.get(workspace,id);
 if(!item||item.owner!==record.ownerId||item.handler!=='PILLOW'||item.request_id!==record.requestId)return;
 const completed=record.status==='COMPLETED'&&record.failureClass==='BRAIN_SUCCESS'&&record.finalResult!==null;
 store.result(workspace,id,completed?'COMPLETED':'FAILED',{source:'PILLOW',requestId:record.requestId,status:record.status,failureClass:record.failureClass,result:completed?record.finalResult:null,recordedAt:new Date().toISOString(),originalAdvisorArtifactPreserved:true,externalEffect:false,grantsAuthority:false},record.requestId);
}
