import {createHash,createHmac} from 'node:crypto';
const hash=x=>createHash('sha256').update(x).digest('hex');
const hmac=(k,x)=>createHmac('sha256',k).update(x).digest();
const enc=x=>encodeURIComponent(x).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
// Immutable writes and bounded evidence listing; no overwrite, deletion or credential logging.
export class S3Store {
 constructor(env,request=fetch){this.e=env;this.request=request;}
 async call(method,key,value,query=null){
  const e=this.e, endpoint=new URL(e.O30_EVIDENCE_ENDPOINT);
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password)throw Error('Invalid storage endpoint');
  const url=new URL(endpoint);url.hostname=e.O30_EVIDENCE_BUCKET+'.'+url.hostname;url.pathname='/'+key.split('/').map(enc).join('/');
  const canonicalQuery=query?Object.entries(query).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>enc(k)+'='+enc(String(v))).join('&'):'';url.search=canonicalQuery;
  const body=value===undefined?'':JSON.stringify(value), date=new Date().toISOString().replace(/[:-]|\.\d{3}/g,''), day=date.slice(0,8);
  const headers={'host':url.host,'x-amz-content-sha256':hash(body),'x-amz-date':date};
  if(method==='PUT')headers['if-none-match']='*';
  const names=Object.keys(headers).sort(),signed=names.join(';'),canonical=names.map(n=>n+':'+headers[n]+'\n').join('');
  const scope=`${day}/${e.O30_EVIDENCE_REGION}/s3/aws4_request`;
  const canonicalRequest=[method,url.pathname,canonicalQuery,canonical,signed,hash(body)].join('\n');
  const signingKey=hmac(hmac(hmac(hmac('AWS4'+e.O30_EVIDENCE_SECRET_ACCESS_KEY,day),e.O30_EVIDENCE_REGION),'s3'),'aws4_request');
  headers.authorization=`AWS4-HMAC-SHA256 Credential=${e.O30_EVIDENCE_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signed}, Signature=${hmac(signingKey,'AWS4-HMAC-SHA256\n'+date+'\n'+scope+'\n'+hash(canonicalRequest)).toString('hex')}`;
  const r=await this.request(url,{method,headers,body:method==='PUT'?body:undefined,redirect:'error',signal:AbortSignal.timeout(10000)});
  if(method==='GET'&&r.status===404)return null;
  if(method==='PUT'&&r.status===412)return false;
  if(!r.ok)throw Error('Storage operation failed');
  if(method==='PUT')return true;
  const text=await boundedText(r,query?262144:65536);return query?text:JSON.parse(text);
 }
 get(k){return this.call('GET',k);}
 create(k,v){return this.call('PUT',k,v);}
 async list(prefix,maxKeys=128){
  if(typeof prefix!=='string'||!/^o30\/[a-f0-9]{64}\/events\/$/.test(prefix)||!Number.isSafeInteger(maxKeys)||maxKeys<1||maxKeys>999)throw Error('Invalid bounded listing');
  const xml=await this.call('GET','',undefined,{'list-type':'2','max-keys':maxKeys+1,prefix});
  return parseEventListing(xml,prefix,maxKeys);
 }
}
export const digest=x=>hash(JSON.stringify(x));
export async function immutable(store,key,value){
 if(await store.create(key,value))return true;
 const previous=await store.get(key);if(digest(previous)!==digest(value))throw Error('Evidence identity conflict');return false;
}

// Evidence keys are deliberately ASCII hex paths. Reject XML features we do not need.
export function parseEventListing(xml,prefix,maxKeys){
 if(typeof xml!=='string'||/<!|&|<NextContinuationToken>/.test(xml))throw Error('Unsafe or incomplete listing');
 const truncated=[...xml.matchAll(/<IsTruncated>(true|false)<\/IsTruncated>/g)];
 if(truncated.length!==1||truncated[0][1]!=='false')throw Error('Evidence scan exceeds bound');
 const keys=[...xml.matchAll(/<Key>([^<]*)<\/Key>/g)].map(m=>m[1]);
 const count=[...xml.matchAll(/<KeyCount>([0-9]+)<\/KeyCount>/g)];
 if(count.length!==1||Number(count[0][1])!==keys.length||keys.length>maxKeys||new Set(keys).size!==keys.length)throw Error('Invalid evidence listing');
 if(keys.some(k=>!k.startsWith(prefix)||! /^[a-f0-9]{64}$/.test(k.slice(prefix.length))))throw Error('Evidence prefix violation');
 return keys.sort();
}

async function boundedText(response,maxBytes){
 if(!response.body)throw Error('Empty storage response');
 const reader=response.body.getReader();const chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('Oversize evidence');}chunks.push(Buffer.from(value));}}
 finally{reader.releaseLock();}
 return Buffer.concat(chunks).toString('utf8');
}
