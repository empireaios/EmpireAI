import { proxyBrainRequest } from '../brain/server-proxy';
import snapshot from './evidence.snapshot.json';
const headers = {'cache-control':'private, no-store'};
export async function ownerOverviewGET(request:Request):Promise<Response> {
  if(new URL(request.url).search) return Response.json({error:'Unsupported request'},{status:400,headers});
  if(!request.headers.get('cookie')) return Response.json({error:'Sign in to continue'},{status:401,headers});
  const auth=await proxyBrainRequest('/auth/me',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:10_000});
  if(!auth.ok) return Response.json({error:auth.status===401?'Sign in to continue':'Owner service unavailable'},{status:auth.status===401?401:503,headers});
  let user;try{user=(await auth.json()).user;}catch{return Response.json({error:'Owner session unavailable'},{status:503,headers});}
  if(user?.role!=='founder'||user.workspaceId!=='ws_empire_1') return Response.json({error:'King owner access required'},{status:403,headers});
  return Response.json({...snapshot,checkedAt:new Date().toISOString(),freshness:'HISTORICAL — refresh does not recheck providers'}, {headers});
}
