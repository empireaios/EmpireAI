import {createPillowHostSession,fetchPillowHistory,PillowRequestError} from './client';

type BrowserTurn={role:'user'|'assistant';content:string;timestamp:string;requestId?:string};
type Input={ownerId:string;workspaceId:string;cachedSessionId?:string|null;historicalBrowserTurns?:BrowserTurn[]};
/** Cached IDs are hints only. Authenticated history is authoritative; navigation
 * and sends must not consume the session-creation admission budget. */
const verifiedHints=new Map<string,string>();
const inflight=new Map<string,Promise<Awaited<ReturnType<typeof fetchPillowHistory>>>>();
export function resolvePillowConversation(input:Input){
 const principal=JSON.stringify([input.ownerId,input.workspaceId]);
 const resolvedInput={...input,cachedSessionId:input.cachedSessionId??verifiedHints.get(principal)};
 const key=JSON.stringify([principal,resolvedInput.cachedSessionId??null,input.historicalBrowserTurns?.length?input.historicalBrowserTurns:null]);
 const existing=inflight.get(key);if(existing)return existing;
 // Retain only an authenticated ID hint even if the requesting UI route unmounts.
 // Every subsequent use still performs an authenticated history read.
 const pending=resolveConversation(resolvedInput).then(history=>{verifiedHints.set(principal,history.session.sessionId);return history;}).finally(()=>{if(inflight.get(key)===pending)inflight.delete(key);});
 inflight.set(key,pending);return pending;
}
async function resolveConversation(input:Input){
 const verify=(history:Awaited<ReturnType<typeof fetchPillowHistory>>)=>{
  if(history.session.workspaceId!==input.workspaceId)throw new Error('Server conversation workspace mismatch');
  return history;
 };
 const archive=input.historicalBrowserTurns?.length?input.historicalBrowserTurns:undefined;
 if(input.cachedSessionId&&!archive){
  try{return verify(await fetchPillowHistory(input.cachedSessionId));}
  catch(error){
   // A missing obsolete session can be resolved canonically. Permission,
   // availability and integrity failures never authorize a replacement.
   if(!(error instanceof PillowRequestError)||error.status!==404)throw error;
  }
 }
 const session=await createPillowHostSession(input.workspaceId,input.ownerId,archive);
 if(session.workspaceId!==input.workspaceId)throw new Error('Server conversation workspace mismatch');
 return verify(await fetchPillowHistory(session.sessionId));
}
