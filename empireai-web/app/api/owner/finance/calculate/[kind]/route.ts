import {financePost} from '@/lib/owner/finance-control';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{kind:string}>}){const {kind}=await params;if(!['economics','forecast'].includes(kind))return Response.json({error:'Unknown calculation'},{status:404});return financePost(request,'/api/owner/finance/calculate/'+kind);}
