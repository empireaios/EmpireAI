import { proxyBrainRequest } from "../brain/server-proxy";

export async function commerceTransactionsGET(request:Request):Promise<Response> {
  const query = new URL(request.url).searchParams;
  const limit = query.get("limit") ?? "20";
  if ([...query.keys()].some(key=>key!=="limit") || query.getAll("limit").length>1 ||
      !/^[1-9][0-9]?$/.test(limit) || Number(limit)>50) {
    return Response.json({error:"Invalid transaction query"},{status:400,headers:{"cache-control":"no-store"}});
  }
  if (!request.headers.get("cookie")) {
    return Response.json({error:"Sign in to view transactions"},{status:401,headers:{"cache-control":"no-store"}});
  }
  const upstream = await proxyBrainRequest("/pillow-commerce-presale/transactions?limit="+limit,request,
    {method:"GET",cache:"no-store",upstreamTimeoutMs:10_000});
  const headers = new Headers(upstream.headers);
  headers.set("cache-control","private, no-store");
  return new Response(upstream.body,{status:upstream.status,headers});
}
