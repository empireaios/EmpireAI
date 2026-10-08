import {financePost} from '@/lib/owner/finance-control';
import {proxyBrainRequest} from '@/lib/brain/server-proxy';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){const q=new URL(request.url).searchParams;if([...q.keys()].some(k=>!['from','to','provider'].includes(k)))return Response.json({error:'Unsupported filter'},{status:400});return proxyBrainRequest('/api/owner/finance?'+q,request,{method:'GET',cache:'no-store',upstreamTimeoutMs:15000});}
export async function POST(request:Request){return financePost(request,'/api/owner/finance');}
