import {proxyBrainRequest} from '@/lib/brain/server-proxy';
import {ownerOverviewGET} from '@/lib/owner/route-handler';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const access=await ownerOverviewGET(request);
 if(!access.ok)return access;
 const response=await proxyBrainRequest('/commerce/amazon-us/orders/imported',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:10000});
 const headers=new Headers(response.headers);headers.set('cache-control','private, no-store');
 return new Response(response.body,{status:response.status,headers});
}
