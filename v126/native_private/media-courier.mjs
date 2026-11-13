// Dedicated one-use media courier. Node built-ins; no network or code execution.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,generateKeyPairSync,createPublicKey,createPrivateKey,publicEncrypt,privateDecrypt,createCipheriv,createDecipheriv,randomBytes,constants} from 'node:crypto';

export const ASSET={name:'retained-revised.png',mime:'image/png',bytes:599818,sha256:'69f1f95ab622041332d5e5e1ee43a59a2c34bd017151a6bb45e260f69e035788'};
export const REPO='empireaios/EmpireAI';
export const MAX_ENVELOPE=805000;
const KEY_SCHEMA='EMPIREAI_EPHEMERAL_MEDIA_PUBLIC_KEY_V1';
const ENVELOPE_SCHEMA='EMPIREAI_EPHEMERAL_MEDIA_ENVELOPE_V1';
const h64=/^[a-f0-9]{64}$/,h40=/^[a-f0-9]{40}$/;
export class CourierError extends Error {constructor(code){super(code);this.code=code;}}
export function need(x,c){if(!x)throw new CourierError(c);}
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const encode=v=>Buffer.from(JSON.stringify(v,null,2)+'\n');
export function exact(v,keys,c='FIELDS'){need(v&&typeof v==='object'&&!Array.isArray(v),c);need(Object.keys(v).sort().join('\0')===[...keys].sort().join('\0'),c);return v;}
export function parse(raw,max){need(Buffer.isBuffer(raw)&&raw.length<=max,'JSON_SIZE');let v;try{v=JSON.parse(raw.toString('utf8'));}catch{throw new CourierError('JSON_INVALID');}need(encode(v).equals(raw),'JSON_NONCANONICAL_OR_DUPLICATE');return v;}
export function binding(v){
 exact(v,['repository','operationIdentity','runId','attempt','publicationCommit','sourceManifestSHA256','asset'],'BINDING_FIELDS');
 need(v.repository===REPO,'REPOSITORY');need(typeof v.operationIdentity==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(v.operationIdentity),'OPERATION');
 need(typeof v.runId==='string'&&/^[1-9][0-9]{0,23}$/.test(v.runId)&&v.attempt===1,'RUN_ATTEMPT');need(h40.test(v.publicationCommit)&&h64.test(v.sourceManifestSHA256),'SOURCE_IDENTITY');
 exact(v.asset,Object.keys(ASSET),'ASSET_FIELDS');need(JSON.stringify(v.asset)===JSON.stringify(ASSET),'FIXED_ASSET');return v;
}
export const handoffBranch=b=>'work8/v128-a10-handoff-'+b.runId+'-'+b.attempt;
export const artifactName=b=>'v128-a10-courier-key-'+b.runId+'-'+b.attempt;
function keyIdentity(key){need(key.asymmetricKeyType==='rsa'&&key.asymmetricKeyDetails?.modulusLength===4096&&key.asymmetricKeyDetails?.publicExponent===65537n,'RSA4096_REQUIRED');const pub=key.type==='private'?createPublicKey(key):key;return {pub,fingerprint:sha(pub.export({type:'spki',format:'der'}))};}
export function publicReady(v,wanted){
 exact(v,['schema','binding','handoffBranch','artifactName','keyAlgorithm','publicKeySPKISHA256','publicKeyPEM','publicKeyPEMSHA256'],'KEY_READY_FIELDS');
 need(v.schema===KEY_SCHEMA&&v.keyAlgorithm==='RSA-4096-OAEP-SHA256','KEY_SCHEMA_ALGORITHM');binding(v.binding);binding(wanted);need(encode(v.binding).equals(encode(wanted)),'EXPECTED_BINDING_MISMATCH');
 need(v.handoffBranch===handoffBranch(wanted)&&v.artifactName===artifactName(wanted),'HANDOFF_IDENTITY');
 need(typeof v.publicKeyPEM==='string'&&v.publicKeyPEM.length<10000&&v.publicKeyPEM.startsWith('-----BEGIN PUBLIC KEY-----\n'),'PUBLIC_PEM_ONLY');
 need(sha(Buffer.from(v.publicKeyPEM))===v.publicKeyPEMSHA256,'PUBLIC_KEY_PEM_HASH');const k=keyIdentity(createPublicKey(v.publicKeyPEM));need(k.fingerprint===v.publicKeySPKISHA256&&h64.test(v.publicKeySPKISHA256),'PUBLIC_KEY_FINGERPRINT');return k;
}
export function makeKey(wanted){binding(wanted);const {publicKey,privateKey}=generateKeyPairSync('rsa',{modulusLength:4096,publicExponent:65537});const k=keyIdentity(publicKey),pem=publicKey.export({type:'spki',format:'pem'});return {privatePEM:Buffer.from(privateKey.export({type:'pkcs8',format:'pem'})),ready:{schema:KEY_SCHEMA,binding:wanted,handoffBranch:handoffBranch(wanted),artifactName:artifactName(wanted),keyAlgorithm:'RSA-4096-OAEP-SHA256',publicKeySPKISHA256:k.fingerprint,publicKeyPEM:pem,publicKeyPEMSHA256:sha(Buffer.from(pem))}};}
function aad(ready){return encode({schema:ENVELOPE_SCHEMA,contentAlgorithm:'AES-256-GCM',keyWrapAlgorithm:'RSA-OAEP-SHA256',binding:ready.binding,publicKeySPKISHA256:ready.publicKeySPKISHA256,keyReadySHA256:sha(encode(ready))});}
function base64(s,n,c){need(typeof s==='string'&&s.length===4*Math.ceil(n/3),c);const b=Buffer.from(s,'base64');need(b.length===n&&b.toString('base64')===s,c);return b;}
export function encrypt(plain,ready,wanted){
 const k=publicReady(ready,wanted);need(Buffer.isBuffer(plain)&&plain.length===ASSET.bytes&&sha(plain)===ASSET.sha256,'FIXED_ASSET_BYTES');
 const auth=aad(ready),key=randomBytes(32),nonce=randomBytes(12);
 try{const cipher=createCipheriv('aes-256-gcm',key,nonce,{authTagLength:16});cipher.setAAD(auth,{plaintextLength:ASSET.bytes});const ct=Buffer.concat([cipher.update(plain),cipher.final()]);
 const wrapped=publicEncrypt({key:k.pub,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256',oaepLabel:Buffer.from(sha(auth),'hex')},key);
 const env={schema:ENVELOPE_SCHEMA,contentAlgorithm:'AES-256-GCM',keyWrapAlgorithm:'RSA-OAEP-SHA256',binding:wanted,publicKeySPKISHA256:k.fingerprint,keyReadySHA256:sha(encode(ready)),aadSHA256:sha(auth),nonceBase64:nonce.toString('base64'),tagBase64:cipher.getAuthTag().toString('base64'),wrappedKeyBase64:wrapped.toString('base64'),ciphertextBytes:ct.length,ciphertextSHA256:sha(ct),ciphertextBase64:ct.toString('base64')};need(encode(env).length<=MAX_ENVELOPE,'ENVELOPE_SIZE');return env;
 }finally{key.fill(0);}
}
export function decrypt(env,ready,wanted,privatePEM){
 publicReady(ready,wanted);exact(env,['schema','contentAlgorithm','keyWrapAlgorithm','binding','publicKeySPKISHA256','keyReadySHA256','aadSHA256','nonceBase64','tagBase64','wrappedKeyBase64','ciphertextBytes','ciphertextSHA256','ciphertextBase64'],'ENVELOPE_FIELDS');
 need(env.schema===ENVELOPE_SCHEMA&&env.contentAlgorithm==='AES-256-GCM'&&env.keyWrapAlgorithm==='RSA-OAEP-SHA256','ENVELOPE_ALGORITHM');binding(env.binding);need(encode(env.binding).equals(encode(wanted)),'EXPECTED_BINDING_MISMATCH');
 need(env.publicKeySPKISHA256===ready.publicKeySPKISHA256&&env.keyReadySHA256===sha(encode(ready)),'KEY_READY_BINDING');const auth=aad(ready);need(env.aadSHA256===sha(auth),'AAD_BINDING');
 need(env.ciphertextBytes===ASSET.bytes&&h64.test(env.ciphertextSHA256),'CIPHERTEXT_IDENTITY');const ct=base64(env.ciphertextBase64,ASSET.bytes,'CIPHERTEXT_SIZE'),nonce=base64(env.nonceBase64,12,'NONCE'),tag=base64(env.tagBase64,16,'TAG'),wrapped=base64(env.wrappedKeyBase64,512,'WRAPPED_KEY');need(sha(ct)===env.ciphertextSHA256,'CIPHERTEXT_HASH');
 need(Buffer.isBuffer(privatePEM)&&privatePEM.toString('ascii').startsWith('-----BEGIN PRIVATE KEY-----\n'),'PRIVATE_KEY_FORMAT');const privateKey=createPrivateKey(privatePEM);need(keyIdentity(privateKey).fingerprint===ready.publicKeySPKISHA256,'PRIVATE_KEY_BINDING');let key,plain;
 try{try{key=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256',oaepLabel:Buffer.from(sha(auth),'hex')},wrapped);}catch{throw new CourierError('OAEP_AUTHENTICATION');}need(key.length===32,'AES_KEY_SIZE');const dc=createDecipheriv('aes-256-gcm',key,nonce,{authTagLength:16});dc.setAAD(auth,{plaintextLength:ASSET.bytes});dc.setAuthTag(tag);try{plain=Buffer.concat([dc.update(ct),dc.final()]);}catch{throw new CourierError('GCM_AUTHENTICATION');}need(plain.length===ASSET.bytes&&sha(plain)===ASSET.sha256,'DECRYPTED_ASSET_IDENTITY');return plain;
 }catch(e){if(plain)plain.fill(0);throw e;}finally{if(key)key.fill(0);}
}
function read(filename,max,privateOnly=false){
 need(path.isAbsolute(filename)&&fs.realpathSync(filename)===filename,'ABSOLUTE_NONLINK_PATH');const s=fs.lstatSync(filename,{bigint:true});
 const check=x=>{need(x.isFile()&&x.nlink===1n&&x.size<=BigInt(max),'REGULAR_SINGLELINK_BOUNDED');if(privateOnly)need(x.uid===BigInt(process.getuid())&&(x.mode&0o077n)===0n,'PRIVATE_MODE_OWNER');};check(s);
 const fd=fs.openSync(filename,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const a=fs.fstatSync(fd,{bigint:true});check(a);need(a.dev===s.dev&&a.ino===s.ino,'OPEN_IDENTITY_CHANGED');const chunks=[];let count=0;
 while(count<=max){const block=Buffer.alloc(Math.min(65536,max+1-count));if(block.length===0)break;const n=fs.readSync(fd,block,0,block.length,null);if(n===0)break;chunks.push(block.subarray(0,n));count+=n;}
 const z=fs.fstatSync(fd,{bigint:true});check(z);need(count<=max&&['dev','ino','size','mtimeNs','ctimeNs'].every(k=>a[k]===z[k])&&BigInt(count)===a.size,'READ_CHANGED');return Buffer.concat(chunks,count);
 }finally{fs.closeSync(fd);}
}
function write(filename,b,mode=0o600){need(path.isAbsolute(filename)&&fs.realpathSync(path.dirname(filename))===path.dirname(filename),'OUTPUT_PARENT');const fd=fs.openSync(filename,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,mode);try{fs.writeFileSync(fd,b);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
export function main(args){
 need(process.execArgv.length===0&&!['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH'].some(k=>process.env[k]),'UNTRUSTED_RUNTIME_PRELOAD');const mode=args.shift();
 if(mode==='keygen'){need(args.length===3,'CLI_FIELDS');const [bp,priv,pub]=args,b=binding(parse(read(bp,16384),16384)),k=makeKey(b);try{write(priv,k.privatePEM,0o600);write(pub,encode(k.ready),0o644);return {status:'PUBLIC_EPHEMERAL_KEY_READY',keyReadySHA256:sha(encode(k.ready)),publicKeySPKISHA256:k.ready.publicKeySPKISHA256};}finally{k.privatePEM.fill(0);}}
 if(mode==='encrypt'){need(args.length===4,'CLI_FIELDS');const [bp,kp,asset,out]=args,b=binding(parse(read(bp,16384),16384)),ready=parse(read(kp,16384),16384),plain=read(asset,ASSET.bytes);try{const e=encrypt(plain,ready,b);write(out,encode(e),0o444);return {status:'CIPHERTEXT_ONLY_READY',envelopeSHA256:sha(encode(e)),bytes:encode(e).length,handoffBranch:ready.handoffBranch};}finally{plain.fill(0);}}
 if(mode==='decrypt'){need(args.length===5,'CLI_FIELDS');const [bp,kp,ep,priv,out]=args,b=binding(parse(read(bp,16384),16384)),ready=parse(read(kp,16384),16384),e=parse(read(ep,MAX_ENVELOPE),MAX_ENVELOPE),key=read(priv,16384,true);let plain;try{plain=decrypt(e,ready,b,key);write(out,plain,0o444);return {status:'EXACT_REVISED_ASSET_AUTHENTICATED',bytes:plain.length,sha256:sha(plain)};}finally{key.fill(0);if(plain)plain.fill(0);}}
 throw new CourierError('COMMAND');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{process.stdout.write(JSON.stringify(main(process.argv.slice(2)))+'\n');}catch(e){process.stderr.write(JSON.stringify({status:'REJECTED',code:e instanceof CourierError?e.code:'LOCAL_IO_OR_CRYPTO_FAILURE'})+'\n');process.exitCode=1;}}
