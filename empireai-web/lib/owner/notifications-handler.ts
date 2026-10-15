import {proxyBrainRequest} from '../brain/server-proxy';
const companyId='co-grand-king';
const key=(v:unknown):v is string=>typeof v==='string'&&v!=='.'&&v!=='..'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(v);
export async function ownerNotifications(request:Request):Promise<Response>{
 const deny=(error:string,status:number)=>Response.json({error},{status,headers:{'cache-control':'private, no-store'}});
 const url=new URL(request.url);
 const privateResponse=async(pending:Promise<Response>)=>{const response=await pending;response.headers.set('cache-control','private, no-store');return response;};
 if(!request.headers.get('cookie')?.split(';').some(c=>/^empireai_session=.+/.test(c.trim())))return deny('Sign in to read notifications',401);
 try{
  if(request.method==='GET'){
   if([...url.searchParams.keys()].some(k=>k!=='after')||url.searchParams.getAll('after').length>1)return deny('Unsupported query',400);
   const after=url.searchParams.get('after');if(after!==null&&!key(after))return deny('Invalid page',400);
   const query=new URLSearchParams({companyId,source:'assurance',limit:'25'});if(after)query.set('after',after);
   return await privateResponse(proxyBrainRequest('/global-notifications?'+query,request,{method:'GET',cache:'no-store',upstreamTimeoutMs:10000}));
  }
  if(request.method!=='POST'||url.search)return deny('Unsupported request',400);
  if(request.headers.get('origin')!==url.origin)return deny('Same-origin request required',403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return deny('JSON required',415);
  const reader=request.body?.getReader(),parts:Uint8Array[]=[];let size=0;
  if(reader)while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>4096){await reader.cancel();return deny('Request too large',413);}parts.push(chunk.value);}
  const value=JSON.parse(Buffer.concat(parts).toString('utf8'));
  if(!value||typeof value!=='object'||Array.isArray(value))return deny('Invalid action',400);
  let endpoint:string;const body:Record<string,string>={companyId};
  if(value.action==='sync'&&Object.keys(value).every(k=>['action','assuranceAfter'].includes(k))&&(value.assuranceAfter===undefined||key(value.assuranceAfter))){endpoint='/global-notifications/sync';if(value.assuranceAfter)body.assuranceAfter=value.assuranceAfter;}
  else if(value.action==='acknowledge'&&Object.keys(value).every(k=>['action','notificationId'].includes(k))&&key(value.notificationId)){endpoint='/global-notifications/'+value.notificationId+'/acknowledge';}
  else return deny('Invalid action',400);
  return await privateResponse(proxyBrainRequest(endpoint,request,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),upstreamTimeoutMs:10000}));
 }catch{return deny('Notification request failed. Saved evidence is unchanged; refresh before retrying.',503);}
}
