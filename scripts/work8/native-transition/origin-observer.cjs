'use strict';
// Harness-only observation. The actual NextRequest URL getter result and all
// headers remain unchanged; this does not grant trust to forwarded headers.
const {NextRequest}=require('/frontend/node_modules/next/dist/server/web/spec-extension/request.js');
const descriptor=Object.getOwnPropertyDescriptor(NextRequest.prototype,'url');
if(process.version!=='v22.23.2'||typeof descriptor?.get!=='function')throw Error('ORIGIN_OBSERVER_CONTRACT_UNAVAILABLE');
const phase=process.env.WORK8_OBSERVER_PHASE;
if(!['NORMAL','RECOVERY','NORMAL_RETURN'].includes(phase))throw Error('ORIGIN_OBSERVER_PHASE_REFUSED');
const prefix='WORK8_ORIGIN_OBSERVER ';
const emit=value=>process.stdout.write(prefix+JSON.stringify(value)+'\n');
function safeOrigin(value){
 if(value===null||value==='null')return value;
 try{const url=new URL(value);if(url.username||url.password||url.origin!==value||!['http:','https:'].includes(url.protocol))return '[OMITTED]';return url.origin;}catch{return '[OMITTED]';}
}
function safeHost(value){return value===null?null:/^[A-Za-z0-9.[\]:-]{1,255}$/.test(value)?value:'[OMITTED]';}
function safeProtocol(value){return value===null?null:['http','https'].includes(value)?value:'[OMITTED]';}
function safePort(value){return value===null?null:/^\d{1,5}$/.test(value)&&Number(value)<=65535?value:'[OMITTED]';}
let sequence=0;
Object.defineProperty(NextRequest.prototype,'url',{...descriptor,get:function(){
 const value=Reflect.apply(descriptor.get,this,[]);
 try{
  const url=new URL(value);
  if(this.method==='POST'&&url.pathname==='/api/owner/advisor/memory'&&sequence<40){
   const origin=safeOrigin(this.headers.get('origin'));
   emit({schema:'work8-safe-origin-observation-v1',kind:'actual-next-request-url-getter',phase,sequence:++sequence,nodeVersion:process.version,origin,host:safeHost(this.headers.get('host')),protocol:url.protocol,port:url.port,requestUrlOrigin:safeOrigin(url.origin),originEqualsRequestUrlOrigin:origin===url.origin,forwardedMetadata:{trust:'OBSERVED_ONLY_NO_TRUST_ADDED',host:safeHost(this.headers.get('x-forwarded-host')),protocol:safeProtocol(this.headers.get('x-forwarded-proto')),port:safePort(this.headers.get('x-forwarded-port'))}});
  }
 }catch{/* Diagnostic failure never changes the application getter or guard. */}
 return value;
}});
emit({schema:'work8-safe-origin-observation-v1',kind:'observer-installed',phase,nodeVersion:process.version,configuredHostname:process.env.HOSTNAME,requestedDnsResultOrder:'ipv4first',getterResultUnchanged:true,headersUnchanged:true});
