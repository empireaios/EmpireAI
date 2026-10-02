import assert from "node:assert/strict";
import { test } from "node:test";
import { commerceTransactionsGET } from "./route-handler";

test("owner transaction BFF forwards session once, preserves denial and prevents cached or foreign-workspace reads",async()=>{
  const originalFetch=globalThis.fetch,oldUrl=process.env.BRAIN_API_URL,oldVercel=process.env.VERCEL;
  process.env.BRAIN_API_URL="http://127.0.0.1:4444";delete process.env.VERCEL;
  let calls=0;
  globalThis.fetch=(async(input,init)=>{
    calls++;
    assert.equal(String(input),"http://127.0.0.1:4444/pillow-commerce-presale/transactions?limit=20");
    assert.equal(new Headers(init?.headers).get("cookie"),"empireai_session=offline-test");
    assert.equal(init?.cache,"no-store");
    assert.equal(init?.method,"GET");
    return Response.json({error:"Founder access required"},{status:403});
  }) as typeof fetch;
  try {
    const url="http://localhost/api/commerce/transactions";
    assert.equal((await commerceTransactionsGET(new Request(url))).status,401);
    const headers={cookie:"empireai_session=offline-test"};
    assert.equal((await commerceTransactionsGET(new Request(url+"?workspaceId=other",{headers}))).status,400);
    assert.equal((await commerceTransactionsGET(new Request(url+"?limit=51",{headers}))).status,400);
    assert.equal(calls,0);
    const denied=await commerceTransactionsGET(new Request(url,{headers}));
    assert.equal(denied.status,403);
    assert.match(denied.headers.get("cache-control")??"",/no-store/);
    assert.deepEqual(await denied.json(),{error:"Founder access required"});
    assert.equal(calls,1);
  } finally {
    globalThis.fetch=originalFetch;
    if(oldUrl===undefined)delete process.env.BRAIN_API_URL;else process.env.BRAIN_API_URL=oldUrl;
    if(oldVercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=oldVercel;
  }
});
