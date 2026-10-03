import {proxyBrainRequest} from '@/lib/brain/server-proxy';
import {ownerOverviewGET} from '@/lib/owner/route-handler';
import {memoryReadPreservingRevision,summarizeMemoryEvidence} from '@/lib/owner/memory-evidence';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'cache-control':'private, no-store'};
export async function GET(request:Request){
 const access=await ownerOverviewGET(request);if(!access.ok)return access;
 try{
  // Older GET handlers seeded persistent records. Never inspect through them.
  const live=await proxyBrainRequest('/health/live',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:10000});
  if(!live.ok||(await live.json()).deploy?.gitCommitSha!==memoryReadPreservingRevision)throw Error();
  const records=await proxyBrainRequest('/strategic-memory/memories',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:10000});
  if(!records.ok)throw Error();
  return Response.json(summarizeMemoryEvidence(await records.json()),{headers});
 }catch{return Response.json({error:'Memory inventory unavailable; retained records and learning state are unknown.'},{status:503,headers});}
}
