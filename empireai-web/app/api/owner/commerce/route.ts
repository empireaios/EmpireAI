import {financePost} from '@/lib/owner/finance-control';
import {proxyBrainRequest} from '@/lib/brain/server-proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return proxyBrainRequest('/api/owner/commerce',request,{method:'GET',cache:'no-store',upstreamTimeoutMs:15000});}
export async function POST(request:Request){return financePost(request,'/api/owner/commerce');}
