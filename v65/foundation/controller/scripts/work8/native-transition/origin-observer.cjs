'use strict';
// Non-production observer: intercept actual operand reads, never replace the guard.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createHash}=require('node:crypto'),{AsyncLocalStorage}=require('node:async_hooks');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const phase=process.env.WORK8_OBSERVER_PHASE;
if(process.version!=='v22.23.2'||!['NORMAL','RECOVERY','NORMAL_RETURN'].includes(phase))throw Error('ORIGIN_OBSERVER_CONTRACT_UNAVAILABLE');
const role=phase==='RECOVERY'?'recovery':'normal';
const policy=JSON.parse(fs.readFileSync(path.join(__dirname,'observer-packages.json'),'utf8')).packages[role];
const root=path.dirname(path.resolve(process.argv[1]||''));
if(path.basename(process.argv[1]||'')!=='server.js'||process.env.WORK8_OBSERVER_IMAGE!==policy.image)throw Error('ORIGIN_OBSERVER_PACKAGE_IDENTITY_REFUSED');
for(const [file,expected]of Object.entries(policy.files))if(sha(fs.readFileSync(path.join(root,file)))!==expected)throw Error('ORIGIN_OBSERVER_PACKAGE_BYTES_REFUSED');
const webpack=require(path.join(root,'.next/server/webpack-runtime.js'));
webpack.C(require(path.join(root,'.next/server/chunks',policy.webpackChunk)));
const ActualRequest=webpack(policy.webpackRequestModuleId).NextRequest;
const SeparateRequest=require(path.join(root,'node_modules/next/dist/server/web/spec-extension/request.js')).NextRequest;
const descriptor=Object.getOwnPropertyDescriptor(ActualRequest.prototype,'url');
if(ActualRequest===SeparateRequest||typeof descriptor?.get!=='function')throw Error('ORIGIN_OBSERVER_MODULE_IDENTITY_REFUSED');
const prefix='WORK8_ORIGIN_OBSERVER ',emit=value=>{try{process.stdout.write(prefix+JSON.stringify(value)+'\n');}catch{/* Missing evidence fails the external gate; application decisions remain unchanged. */}};
const identity={pid:process.pid,nodeVersion:process.version,role,frontendImage:policy.image,frontendCommit:policy.commit,frontendTree:policy.tree,buildId:policy.buildId,requestModuleId:policy.webpackRequestModuleId,adapterModuleId:policy.webpackAdapterModuleId,compiledGuardFile:policy.guard.file,compiledGuardSha256:policy.files[policy.guard.file]};
const storage=new AsyncLocalStorage();
let sequence=0;
function safeOrigin(value){return value===null?null:['http://localhost:43117','http://localhost:43119'].includes(value)?value:'[OMITTED]';}
const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const callerPattern=new RegExp('at '+escape(policy.guard.functionName)+' \\('+escape(path.join(root,policy.guard.file))+':1:(\\d+)\\)');
function actualGuardCaller(){
 const match=callerPattern.exec(new Error().stack||'');
 if(!match)return null;
 const column=Number(match[1]);
 return column>=policy.guard.columnStart&&column<=policy.guard.columnEnd?column:null;
}
const originalEmit=http.Server.prototype.emit;
Object.defineProperty(http.Server.prototype,'emit',{configurable:true,writable:true,value:function(event,...args){
 if(event!=='request')return Reflect.apply(originalEmit,this,[event,...args]);
 const [request,response]=args;
 if(request.method!=='POST'||typeof request.url!=='string'||request.url.split('?')[0]!=='/api/owner/advisor/memory'||sequence>=40)return Reflect.apply(originalEmit,this,[event,...args]);
 const context={sequence:++sequence,headerRead:null,operands:[]};
 response.once('finish',()=>{
  for(const row of context.operands)emit({...row,httpStatus:response.statusCode,responseFinished:true});
 });
 return storage.run(context,()=>Reflect.apply(originalEmit,this,[event,...args]));
}});
const headerDescriptor=Object.getOwnPropertyDescriptor(Headers.prototype,'get');
const originalHeaderGet=headerDescriptor.value;
Object.defineProperty(Headers.prototype,'get',{...headerDescriptor,value:function(name){
 const value=Reflect.apply(originalHeaderGet,this,[name]);
 // The original guard reads Origin before it reads request.url. No extra header read.
 try{const context=storage.getStore(),column=context&&name==='origin'&&actualGuardCaller();
  if(column)context.headerRead={headers:this,value,column};
 }catch{/* Observational failure cannot change the header value or security decision. */}
 return value;
}});
Object.defineProperty(ActualRequest.prototype,'url',{...descriptor,get:function(){
 const value=Reflect.apply(descriptor.get,this,[]);
 try{
  const context=storage.getStore(),column=context&&actualGuardCaller();
  if(column&&context.headerRead?.headers===this.headers&&context.operands.length<4){
   const url=new URL(value),origin=context.headerRead.value;
   if(this.method==='POST'&&url.pathname==='/api/owner/advisor/memory'){
    context.operands.push({schema:'work8-safe-origin-observation-v2',kind:'actual-guard-comparison-operands',phase,sequence:context.sequence,method:'POST',routeClass:'OWNER_ADVISOR_MEMORY',origin:safeOrigin(origin),requestUrlOrigin:safeOrigin(url.origin),originEqualsRequestUrlOrigin:origin===url.origin,guardWouldRefuse:origin!==url.origin,originReadColumn:context.headerRead.column,urlReadColumn:column,originalGetterResultUnchanged:true,originalHeaderResultUnchanged:true,...identity});
    context.headerRead=null;
   }
  }
 }catch{/* Observational failure cannot change the URL value or security decision. */}
 return value;
}});
emit({schema:'work8-safe-origin-observation-v2',kind:'observer-installed',phase,configuredHostname:process.env.HOSTNAME,requestedDnsResultOrder:'ipv4first',separatePrototypeProved:true,guardSourceUnchanged:true,...identity});
