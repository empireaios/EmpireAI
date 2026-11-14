// Root-only fixed-file restoration before any native application starts.
// Imports have no I/O. Tests use synthetic keys/payloads through the exported API.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createHash,createPublicKey,generateKeyPairSync,randomBytes,verify,privateDecrypt,createDecipheriv,constants} from 'node:crypto';
import {gunzipSync} from 'node:zlib';

export const MAX_BYTES=2*1024*1024, MAX_KEY_BYTES=32768;
export const OPERATION='V133-A10-PRIVATE-REVIEW-A01-20261114';
export const ALGORITHM='Ed25519+RSA4096-OAEP-SHA256+AES256-GCM+gzip';
export const FILES=['connector-media-native-store.sqlite','connector-media-original.jpg','connector-media-revised.png','private/review-bootstrap.json'];
export const BINDING_FIELDS=['operationIdentity','provider','projectId','environmentId','serviceId','deploymentId','replicaId','origin','expiresAtMs','publicationCommit','sourceManifestSHA256','runtimeManifestSHA256','authoritySHA256','financialReservationSHA256'];
export const BASELINE_PINS={
 'connector-media-native-store.sqlite':{bytes:425984,sha256:'8097305c3253118be8bf41564184b9b6db78447894dc0b8a7a35b5a2b8510675'},
 'connector-media-original.jpg':{bytes:149719,sha256:'4fe19c2fbe0907474d053181a5568489d842421e0dbd2b627e487cca61511048'},
 'connector-media-revised.png':{bytes:599818,sha256:'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788'},
};
export const OWNER_EMAIL_SHA='a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267';
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function requireValue(ok,code){if(!ok)throw Error('A09_TRANSPORT_'+code);}
export function exact(value,keys){requireValue(value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype,'OBJECT');requireValue(Object.keys(value).sort().join('\0')===[...keys].sort().join('\0'),'FIELDS');}
export function canonical(value){
 if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
 if(typeof value==='number'){requireValue(Number.isSafeInteger(value),'INTEGER');return String(value);}
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 requireValue(value!==null&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype,'CANONICAL_OBJECT');
 return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
}
export function parseCanonical(bytes,max=MAX_BYTES){
 requireValue(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=max,'JSON_BOUND');
 const parsed=JSON.parse(bytes.toString('utf8'));
 requireValue(Buffer.from(canonical(parsed)).equals(bytes),'NONCANONICAL_OR_DUPLICATE_JSON');return parsed;
}
export function base64(value,max){
 requireValue(typeof value==='string'&&value.length<=Math.ceil(max/3)*4&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value),'BASE64');
 const bytes=Buffer.from(value,'base64');requireValue(bytes.length<=max&&bytes.toString('base64')===value,'BASE64_CANONICAL');return bytes;
}
export function spki(key){return createPublicKey(key).export({format:'der',type:'spki'});}
function hash(value){requireValue(typeof value==='string'&&/^[a-f0-9]{64}$/.test(value),'HASH');}
function uuid(value){requireValue(typeof value==='string'&&/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value),'PROVIDER_UUID');}
export function validateBinding(binding,now=Date.now()){
 exact(binding,BINDING_FIELDS);requireValue(binding.operationIdentity===OPERATION&&binding.provider==='RAILWAY','OPERATION');
 for(const field of ['projectId','environmentId','serviceId','deploymentId'])uuid(binding[field]);
 // Railway exposes replica identity but does not promise UUID syntax. Preserve
 // its bounded opaque value exactly in the signature and runtime-env comparison.
 requireValue(typeof binding.replicaId==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(binding.replicaId),'REPLICA_ID');
 requireValue(/^https:\/\/[a-z0-9][a-z0-9-]{1,61}\.up\.railway\.app$/.test(binding.origin)&&new URL(binding.origin).origin===binding.origin,'ORIGIN');
 requireValue(Number.isSafeInteger(binding.expiresAtMs)&&binding.expiresAtMs>now&&binding.expiresAtMs-now<=1200000,'EXPIRY');
 requireValue(/^[a-f0-9]{40}$/.test(binding.publicationCommit),'SOURCE_COMMIT');
 for(const field of ['sourceManifestSHA256','runtimeManifestSHA256','authoritySHA256','financialReservationSHA256'])hash(binding[field]);
 return binding;
}
export function validateKeyResponse(record,now=Date.now()){
 exact(record,['schema',...BINDING_FIELDS,'issuedAtMs','instanceNonce','publicKeyPEM','publicKeySHA256','controllerSigningPublicKeySHA256','algorithm']);
 requireValue(record.schema==='A09_INSTANCE_RESTORE_KEY_V1'&&record.algorithm===ALGORITHM,'KEY_SCHEMA');
 validateBinding(Object.fromEntries(BINDING_FIELDS.map(key=>[key,record[key]])),now);
 requireValue(Number.isSafeInteger(record.issuedAtMs)&&record.issuedAtMs<=now+5000&&record.issuedAtMs<record.expiresAtMs&&record.expiresAtMs-record.issuedAtMs<=1200000,'ISSUED_AT');
 hash(record.instanceNonce);hash(record.publicKeySHA256);hash(record.controllerSigningPublicKeySHA256);
 requireValue(typeof record.publicKeyPEM==='string'&&record.publicKeyPEM.length<2048,'PUBLIC_KEY_BOUND');
 const key=createPublicKey(record.publicKeyPEM);
 requireValue(key.asymmetricKeyType==='rsa'&&key.asymmetricKeyDetails.modulusLength===4096&&key.asymmetricKeyDetails.publicExponent===65537n,'RSA_PARAMETERS');
 requireValue(sha(key.export({format:'der',type:'spki'}))===record.publicKeySHA256,'RECIPIENT_KEY_HASH');
 requireValue(Buffer.byteLength(canonical(record))<=MAX_KEY_BYTES,'KEY_RESPONSE_BOUND');return key;
}
export function validateBootstrap(config,binding,{ownerEmailSHA=OWNER_EMAIL_SHA,now=Date.now()}={}){
 exact(config,['founderEmail','founderPassword','adminPassword','sessionSecret','exportToken','operationIdentity','provider','origin','expiresAtMs','reviewClosesAtMs','authoritySHA256','publicationCommit','sourceManifestSHA256','runtimeManifestSHA256','projectId','environmentId','serviceId','deploymentId','providerReadbackSHA256','mode','ownerActionObserved']);
 for(const field of ['operationIdentity','provider','origin','expiresAtMs','authoritySHA256','publicationCommit','sourceManifestSHA256','runtimeManifestSHA256','projectId','environmentId','serviceId','deploymentId'])requireValue(config[field]===binding[field],'BOOTSTRAP_BINDING');
 requireValue(config.mode==='ISOLATED_OWNER_REVIEW'&&config.ownerActionObserved===false,'BOOTSTRAP_SCOPE');
 requireValue(config.reviewClosesAtMs===binding.expiresAtMs-90000&&config.reviewClosesAtMs>now,'REVIEW_WINDOW');
 requireValue(typeof config.founderEmail==='string'&&config.founderEmail===config.founderEmail.trim().toLowerCase()&&sha(config.founderEmail)===ownerEmailSHA,'OWNER_IDENTITY');
 for(const key of ['founderPassword','adminPassword','sessionSecret','exportToken'])requireValue(typeof config[key]==='string'&&/^[A-Za-z0-9_-]{43,128}$/.test(config[key]),'FRESH_SECRET_FORMAT');
 requireValue(new Set(['founderPassword','adminPassword','sessionSecret','exportToken'].map(key=>config[key])).size===4,'DISTINCT_SECRETS');hash(config.providerReadbackSHA256);return config;
}
export function validatePayload(bytes,binding,{pins=BASELINE_PINS,ownerEmailSHA=OWNER_EMAIL_SHA,now=Date.now()}={}){
 const payload=parseCanonical(bytes);exact(payload,['schema','files']);requireValue(payload.schema==='A09_FIXED_RESTORE_PAYLOAD_V1'&&Array.isArray(payload.files)&&payload.files.length===4,'FIXED_FILES');
 const result=new Map();
 for(let index=0;index<4;index++){
  const record=payload.files[index];exact(record,['path','bytes','sha256','base64']);requireValue(record.path===FILES[index]&&!result.has(record.path),'FIXED_MEMBER_PATH');
  requireValue(Number.isSafeInteger(record.bytes)&&record.bytes>0&&record.bytes<=MAX_BYTES,'MEMBER_SIZE');hash(record.sha256);
  const data=base64(record.base64,MAX_BYTES);requireValue(data.length===record.bytes&&sha(data)===record.sha256,'MEMBER_INTEGRITY');
  if(index<3)requireValue(pins[record.path]?.bytes===data.length&&pins[record.path]?.sha256===record.sha256,'BASELINE_PIN');
  else{requireValue(data.length<=32768,'BOOTSTRAP_SIZE');validateBootstrap(JSON.parse(data.toString('utf8')),binding,{ownerEmailSHA,now});}
  result.set(record.path,data);
 }
 return result;
}
export function createReceiver({binding,controllerPublicKey,pins=BASELINE_PINS,ownerEmailSHA=OWNER_EMAIL_SHA,now=Date.now,keyPair,materialize}){
 validateBinding(binding,now());const signingKey=createPublicKey(controllerPublicKey);requireValue(signingKey.asymmetricKeyType==='ed25519','SIGNING_KEY_TYPE');
 const pair=keyPair??generateKeyPairSync('rsa',{modulusLength:4096,publicExponent:65537});
 const publicKeyPEM=pair.publicKey.export({format:'pem',type:'spki'}).toString();
 const keyResponse={schema:'A09_INSTANCE_RESTORE_KEY_V1',...binding,issuedAtMs:now(),instanceNonce:randomBytes(32).toString('hex'),publicKeyPEM,publicKeySHA256:sha(pair.publicKey.export({format:'der',type:'spki'})),controllerSigningPublicKeySHA256:sha(signingKey.export({format:'der',type:'spki'})),algorithm:ALGORITHM};
 validateKeyResponse(keyResponse,now());const keyBindingSHA256=sha(canonical(keyResponse));let attempts=0,consumed=false;
 function accept(raw){
  requireValue(!consumed,'ALREADY_CONSUMED');requireValue(++attempts<=2,'RESTORE_ATTEMPT_BOUND');validateBinding(binding,now());
  requireValue(Buffer.isBuffer(raw)&&raw.length<MAX_BYTES,'ENVELOPE_BOUND');
  const envelope=parseCanonical(raw);exact(envelope,['schema','algorithm','header','wrappedKey','iv','tag','ciphertext','signature']);
  requireValue(envelope.schema==='A09_SIGNED_RESTORE_ENVELOPE_V1'&&envelope.algorithm===ALGORITHM,'ENVELOPE_SCHEMA');
  const {signature,...unsigned}=envelope;const signedBytes=Buffer.from(canonical(unsigned));
  // No RSA operation, decompression or output write occurs before signature verification.
  const sig=base64(signature,64);requireValue(sig.length===64&&verify(null,signedBytes,signingKey,sig),'SIGNATURE');
  exact(envelope.header,['keyBindingSHA256','instanceNonce','encoding','compressedBytes','expandedBytes','compressedSHA256']);
  const header=envelope.header;requireValue(header.keyBindingSHA256===keyBindingSHA256&&header.instanceNonce===keyResponse.instanceNonce&&header.encoding==='gzip-json-fixed-files-v1','INSTANCE_BINDING');
  requireValue(Number.isSafeInteger(header.compressedBytes)&&header.compressedBytes>0&&header.compressedBytes<=MAX_BYTES&&Number.isSafeInteger(header.expandedBytes)&&header.expandedBytes>0&&header.expandedBytes<=MAX_BYTES,'PAYLOAD_BOUND');hash(header.compressedSHA256);
  const wrapped=base64(envelope.wrappedKey,512),iv=base64(envelope.iv,12),tag=base64(envelope.tag,16),ciphertext=base64(envelope.ciphertext,MAX_BYTES);
  requireValue(wrapped.length===512&&iv.length===12&&tag.length===16&&ciphertext.length===header.compressedBytes,'CRYPTO_LENGTH');
  let key,compressed,expanded;
  try{
   key=privateDecrypt({key:pair.privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256',oaepLabel:Buffer.from('EMPIREAI_A09_RESTORE_V1:'+keyBindingSHA256)},wrapped);requireValue(key.length===32,'AES_KEY_LENGTH');
   const decipher=createDecipheriv('aes-256-gcm',key,iv,{authTagLength:16});decipher.setAAD(Buffer.from(canonical(header)));decipher.setAuthTag(tag);
   compressed=Buffer.concat([decipher.update(ciphertext),decipher.final()]);requireValue(sha(compressed)===header.compressedSHA256,'COMPRESSED_HASH');
   expanded=gunzipSync(compressed,{maxOutputLength:MAX_BYTES});requireValue(expanded.length===header.expandedBytes,'EXPANDED_SIZE');
   const files=validatePayload(expanded,binding,{pins,ownerEmailSHA,now:now()});validateBinding(binding,now());
   consumed=true; // Any materialization failure is terminal; never overwrite/retry.
   const result=materialize(files,{keyResponse,keyBindingSHA256,envelopeSHA256:sha(raw)});
   requireValue(!result||typeof result.then!=='function','SYNCHRONOUS_MATERIALIZATION_REQUIRED');
   return result??{status:'RESTORED'};
  }finally{key?.fill(0);compressed?.fill(0);expanded?.fill(0);}
 }
 return {keyResponse,keyBindingSHA256,accept,get consumed(){return consumed;},get attempts(){return attempts;}};
}
function sameStat(a,b){return ['dev','ino','size','mtimeMs','ctimeMs','mode','uid','gid','nlink'].every(key=>a[key]===b[key]);}
export function readStable(file,max,{privateInput=false,rootFixed=false,fixedUID=0}={}){
 const absolute=path.resolve(file);requireValue(fs.realpathSync(absolute)===absolute,'INPUT_REALPATH');
 const fd=fs.openSync(absolute,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const before=fs.fstatSync(fd);requireValue(before.isFile()&&before.nlink===1&&before.size>0&&before.size<=max,'INPUT_FILE');
  if(privateInput)requireValue(before.uid===process.getuid()&&(before.mode&0o077)===0,'PRIVATE_INPUT_MODE');
  // Source/runtime files may be root-writable; app/group/other must never write.
  // Installed private inputs are separately verified as exactly 0440 below.
  if(rootFixed)requireValue(before.uid===fixedUID&&(before.mode&0o022)===0,'ROOT_FIXED_MODE');
  const bytes=fs.readFileSync(fd);requireValue(bytes.length===before.size&&sameStat(before,fs.fstatSync(fd))&&sameStat(before,fs.lstatSync(absolute)),'INPUT_CHANGED');return bytes;
 }finally{fs.closeSync(fd);}
}
export function directory(file,{uid=0,gid=1001,create=false}={}){
 let created=false;
 if(create&&!fs.existsSync(file)){
  fs.mkdirSync(file,{mode:0o750});
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
  try{
   fs.fchownSync(fd,uid,gid);
   // PID1 deliberately supplies umask0077. Restore exact group traversal after
   // creation so UID1001 can read the root-fixed0440 inputs, without write access.
   fs.fchmodSync(fd,0o750);
  }finally{fs.closeSync(fd);}
  created=true;
 }
 requireValue(fs.realpathSync(file)===file,'OUTPUT_DIRECTORY_REALPATH');const info=fs.lstatSync(file);requireValue(info.isDirectory()&&info.uid===uid&&(info.mode&0o022)===0,'OUTPUT_DIRECTORY_MODE');
 if(created)requireValue(info.gid===gid&&(info.mode&0o7777)===0o750,'OUTPUT_DIRECTORY_EXACT_MODE');
 // Existing root-owned parents remain unchanged, but must admit the app group.
 requireValue(info.gid===gid?(info.mode&0o050)===0o050:(info.mode&0o005)===0o005,'OUTPUT_DIRECTORY_NATIVE_TRAVERSAL');
}
function exists(file){try{fs.lstatSync(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
function syncDirectory(file){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
export function materializeFixed(files,context,{root='/',baseline,moduleSHA256,uid=0,gid=1001}={}){
 requireValue(process.getuid()===uid,'ROOT_WRITER_REQUIRED');hash(moduleSHA256);
 const binding=context.keyResponse,config=JSON.parse(files.get(FILES[3]).toString('utf8'));
 const policy={schema:1,mode:'RELEASED',approvalSha256:config.authoritySHA256,expiresAt:new Date(config.expiresAtMs).toISOString()};
 const media={schema:'WORK8_CONNECTOR_PRIVATE_MEDIA_BINDING_V1',workspace:baseline.workspace,owner:baseline.owner,candidateId:baseline.candidateId,candidateDigest:baseline.candidateDigest,rights:'PRIVATE_FACTUAL_PREPARATION_ONLY',publicPublicationAllowed:false,retainedReviewSHA256:'bd45ebfea787feef24dcd429044672c7aab4a76bd0176c0217070dc3432777d0',originalSHA256:BASELINE_PINS[FILES[1]].sha256,revisedSHA256:BASELINE_PINS[FILES[2]].sha256,authoritySHA256:config.authoritySHA256,expiresAtUTC:new Date(config.expiresAtMs).toISOString(),applicationCommit:'6c1e63ba20619ee480742fd87dc810ca93152e22',publicationCommit:config.publicationCommit,moduleSHA256};
 const joined=relative=>path.join(root,relative);const writes=[...FILES.slice(0,3).map(name=>['inputs/a08/'+name,files.get(name)]),['private/review-bootstrap.json',files.get(FILES[3])],['private/owner-policy.json',Buffer.from(canonical(policy))],['private/media/retained-original.jpg',files.get(FILES[1])],['private/media/retained-revised.png',files.get(FILES[2])],['private/media/private-media-binding.json',Buffer.from(canonical(media))]];
 for(const dir of ['inputs','inputs/a08','private','private/media','evidence'])directory(joined(dir),{uid,gid,create:true});
 for(const relative of [...writes.map(row=>row[0]),'evidence/transport-restoration.json'])requireValue(!exists(joined(relative))&&!fs.lstatSync(path.dirname(joined(relative))).isSymbolicLink(),'OUTPUT_ALREADY_EXISTS');
 const staging=joined('private/.transport-stage-'+binding.instanceNonce);requireValue(!fs.existsSync(staging),'STAGING_EXISTS');fs.mkdirSync(staging,{mode:0o700});
 const staged=[];
 for(let index=0;index<writes.length;index++){
  const [relative,bytes]=writes[index],temp=path.join(staging,String(index));const fd=fs.openSync(temp,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  try{fs.writeFileSync(fd,bytes);fs.fchownSync(fd,uid,gid);fs.fchmodSync(fd,0o440);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  requireValue(readStable(temp,MAX_BYTES,{rootFixed:true,fixedUID:uid}).equals(bytes),'STAGING_VERIFY');staged.push([temp,joined(relative),bytes]);
 }
 syncDirectory(staging);
 for(const [temp,destination,bytes]of staged){
  fs.linkSync(temp,destination);fs.unlinkSync(temp);syncDirectory(path.dirname(destination));const info=fs.lstatSync(destination);
  requireValue(info.uid===uid&&info.gid===gid&&(info.mode&0o777)===0o440&&readStable(destination,MAX_BYTES,{rootFixed:true,fixedUID:uid}).equals(bytes),'FINAL_FILE_VERIFY');
 }
 fs.rmdirSync(staging);syncDirectory(joined('private'));
 const receipt={schema:'A09_VERIFIED_TRANSPORT_RESTORATION_V1',operationIdentity:OPERATION,provider:'RAILWAY',projectId:binding.projectId,environmentId:binding.environmentId,serviceId:binding.serviceId,deploymentId:binding.deploymentId,replicaId:binding.replicaId,origin:binding.origin,expiresAtMs:binding.expiresAtMs,publicationCommit:binding.publicationCommit,sourceManifestSHA256:binding.sourceManifestSHA256,runtimeManifestSHA256:binding.runtimeManifestSHA256,keyBindingSHA256:context.keyBindingSHA256,instanceNonce:binding.instanceNonce,envelopeSHA256:context.envelopeSHA256,baselineFiles:FILES.slice(0,3).map(name=>({path:name,bytes:files.get(name).length,sha256:sha(files.get(name))})),filesInstalled:writes.length,allFilesReadBack:true,allFileModes:'0440',ownerUID:uid,groupGID:gid,originalSourceChanged:false,ownerActionObserved:false,ownerApproval:false,plaintextLogged:false};
 const receiptPath=joined('evidence/transport-restoration.json'),raw=Buffer.from(canonical(receipt));const fd=fs.openSync(receiptPath,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
 try{fs.writeFileSync(fd,raw);fs.fchownSync(fd,uid,gid);fs.fchmodSync(fd,0o440);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 syncDirectory(path.dirname(receiptPath));requireValue(readStable(receiptPath,32768,{rootFixed:true,fixedUID:uid}).equals(raw),'RECEIPT_VERIFY');return {status:'RESTORED',receiptSHA256:sha(raw),filesInstalled:writes.length};
}
async function main(){
 requireValue(process.getuid()===0,'ROOT_REQUIRED');
 const control='/control/owner_review',host=JSON.parse(readStable('/private/host-bootstrap.json',4*1024*1024,{rootFixed:true})),manifestBytes=readStable(control+'/runtime-manifest.json',32*1024*1024,{rootFixed:true}),manifest=JSON.parse(manifestBytes);
 const binding=Object.fromEntries(BINDING_FIELDS.map(key=>[key,host[key]]));validateBinding(binding);requireValue(sha(manifestBytes)===binding.runtimeManifestSHA256,'RUNTIME_MANIFEST');
 requireValue(sha(readStable(control+'/source-manifest.json',32*1024*1024,{rootFixed:true}))===binding.sourceManifestSHA256,'SOURCE_MANIFEST');
 for(const [field,env]of [['projectId','RAILWAY_PROJECT_ID'],['environmentId','RAILWAY_ENVIRONMENT_ID'],['serviceId','RAILWAY_SERVICE_ID'],['deploymentId','RAILWAY_DEPLOYMENT_ID'],['replicaId','RAILWAY_REPLICA_ID']])requireValue(binding[field]===process.env[env],'ACTUAL_PROVIDER_ID');
 requireValue(binding.origin===process.env.A09_REVIEW_ORIGIN&&String(binding.expiresAtMs)===process.env.A09_EXPIRES_AT_MS&&binding.publicationCommit===process.env.A09_SOURCE_COMMIT_SHA,'ACTUAL_RUNTIME_BINDING');
 const modulePath='/app/backend/dist/runtime/commerce-runtime/governed/work8-connector-media.js';const moduleRows=manifest.files.filter(item=>item.path===modulePath);requireValue(moduleRows.length===1,'MODULE_MANIFEST');const moduleBytes=readStable(modulePath,MAX_BYTES,{rootFixed:true});requireValue(moduleBytes.length===moduleRows[0].bytes&&sha(moduleBytes)===moduleRows[0].sha256,'MODULE_PIN');
 const baseline=JSON.parse(readStable(control+'/retained-a08-baseline.json',65536,{rootFixed:true}));requireValue(baseline.snapshot.bytes===BASELINE_PINS[FILES[0]].bytes&&baseline.snapshot.sha256===BASELINE_PINS[FILES[0]].sha256&&baseline.originalAssetSHA256===BASELINE_PINS[FILES[1]].sha256&&baseline.revisedAssetSHA256===BASELINE_PINS[FILES[2]].sha256,'SOURCE_BASELINE');
 const publicKey=readStable(control+'/controller-transport-public-key.pem',MAX_KEY_BYTES,{rootFixed:true});
 const receiver=createReceiver({binding,controllerPublicKey:publicKey,materialize:(files,context)=>materializeFixed(files,context,{baseline,moduleSHA256:moduleRows[0].sha256})});
 let finishing=false,active=0,restoreRequests=0;const server=http.createServer(async(req,res)=>{
  const send=(status,body)=>{const data=Buffer.from(canonical(body));res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','content-length':data.length,'connection':'close'});res.end(data);};
  if(finishing||Date.now()>=binding.expiresAtMs){send(410,{code:'TRANSPORT_CLOSED'});return;}
  if(req.url==='/__review_transport/key'&&req.method==='GET'){send(200,receiver.keyResponse);return;}
  if(req.url!=='/__review_transport/restore'||req.method!=='POST'){send(404,{code:'TRANSPORT_ROUTE'});return;}
  if(++restoreRequests>2){finishing=true;send(429,{code:'TRANSPORT_ATTEMPT_BOUND'});server.close();server.closeIdleConnections();setTimeout(()=>process.exit(78),50);return;}
  if(active++>0){active--;send(409,{code:'TRANSPORT_BUSY'});return;}
  try{
   requireValue(req.headers['content-type']==='application/json'&&!req.headers['content-encoding']&&!req.headers['transfer-encoding'],'REQUEST_ENCODING');
   requireValue(/^[1-9][0-9]{0,6}$/.test(req.headers['content-length']??'')&&Number(req.headers['content-length'])<=MAX_BYTES,'REQUEST_LENGTH');
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;requireValue(size<=MAX_BYTES,'REQUEST_BOUND');chunks.push(chunk);}requireValue(size===Number(req.headers['content-length']),'REQUEST_SIZE');
   const result=receiver.accept(Buffer.concat(chunks));finishing=true;send(200,result);server.close();server.closeIdleConnections();setTimeout(()=>process.exit(0),50);
  }catch{send(400,{code:'RESTORE_REFUSED'});if(receiver.consumed||receiver.attempts>=2){finishing=true;server.close();server.closeIdleConnections();setTimeout(()=>process.exit(78),50);}}
  finally{active--;}
 });
 server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1;server.maxConnections=2;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(47900,'127.0.0.1',resolve);});
 setTimeout(()=>{finishing=true;server.close();server.closeAllConnections();process.exit(78);},Math.max(1,binding.expiresAtMs-Date.now()));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(()=>{process.stderr.write('A09_TRANSPORT_REFUSED\n');process.exit(78);});
