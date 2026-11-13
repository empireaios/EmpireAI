// Read through the authenticated browser's own cookie transport. No token copying.
import assert from 'node:assert/strict';

// Self-contained so Playwright serializes this exact function into the page.
export async function fetchNativeResponseInPage({route,method}){
  const origin='http://127.0.0.1:43117',maximumBytes=4194304;
  const allowed=[
    'GET /api/auth/me',
    'GET /api/owner/commerce/portfolio?classification=REAL_READ_ONLY&page=1&pageSize=10',
    'POST /api/auth/logout',
  ];
  if(location.origin!==origin)throw new Error('BROWSER_NATIVE_ORIGIN_MISMATCH');
  if(!allowed.includes(method+' '+route))throw new Error('BROWSER_NATIVE_ROUTE_REFUSED');
  const target=new URL(route,origin);
  if(target.origin!==origin||target.username||target.password||target.hash)throw new Error('BROWSER_NATIVE_TARGET_REFUSED');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),8000);
  let reader=null;
  try{
    const response=await fetch(target.href,{
      method,credentials:'same-origin',redirect:'error',cache:'no-store',signal:controller.signal,
      ...(method==='POST'?{headers:{'Content-Type':'application/json'},body:'{}'}:{}),
    });
    const chunks=[];let bytes=0;
    if(response.body){
      reader=response.body.getReader();
      while(true){
        const part=await reader.read();if(part.done)break;
        bytes+=part.value.byteLength;
        if(bytes>maximumBytes){controller.abort();await reader.cancel().catch(()=>{});throw new Error('BROWSER_NATIVE_READ_BOUND');}
        chunks.push(part.value);
      }
    }
    const raw=new Uint8Array(bytes);let offset=0;
    for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.byteLength;}
    return {status:response.status,bytes,text:new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(raw)};
  }finally{
    reader?.releaseLock();clearTimeout(timer);
  }
}

export async function readBrowserNativeResponse(page,route,method='GET'){
  const response=await page.evaluate(fetchNativeResponseInPage,{route,method});
  assert.ok(Number.isInteger(response.status)&&response.status>=100&&response.status<=599,'BROWSER_NATIVE_RESPONSE_STATUS');
  assert.ok(Number.isInteger(response.bytes)&&response.bytes>=0&&response.bytes<=4194304,'BROWSER_NATIVE_RESPONSE_BOUND');
  assert.equal(typeof response.text,'string','BROWSER_NATIVE_RESPONSE_TEXT');
  const raw=Buffer.from(response.text,'utf8');
  assert.equal(raw.length,response.bytes,'BROWSER_NATIVE_RESPONSE_UTF8_BYTES');
  return {status:response.status,raw};
}
