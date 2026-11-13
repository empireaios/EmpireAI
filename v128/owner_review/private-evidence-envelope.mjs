// A09-only Railway binding adapter; original v126 helper remains unchanged.
// Minimal private evidence transport. Node built-ins only; no network or application execution.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes,createPublicKey,createPrivateKey,publicEncrypt,privateDecrypt,createCipheriv,createDecipheriv,constants} from 'node:crypto';
import {Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const MAX_PUBLIC_BYTES=12*1024*1024,MAX_ENVELOPE_BYTES=16384;
const MAX_ARCHIVE_BYTES=8*1024*1024; // A09 bounded compressed private review ZIP.
const SCHEMA='EMPIREAI_RAILWAY_PRIVATE_EVIDENCE_ENVELOPE_V1';
const hex=/^[a-f0-9]{64}$/;
class EnvelopeError extends Error{constructor(code){super(code);this.code=code;}}
function requireThat(value,code){if(!value)throw new EnvelopeError(code);}
const sha=b=>createHash('sha256').update(b).digest('hex');
const serialize=v=>Buffer.from(JSON.stringify(v,null,2)+'\n');
function exact(value,keys,code='FIELDS'){
 requireThat(value!==null&&typeof value==='object'&&!Array.isArray(value),code);
 requireThat(Object.keys(value).sort().join('\0')===[...keys].sort().join('\0'),code);return value;
}
function absolute(filename){requireThat(typeof filename==='string'&&path.isAbsolute(filename)&&filename.length<=4096,'ABSOLUTE_PATH_REQUIRED');return path.normalize(filename);}
function opened(filename,max,privateOnly=false){
 filename=absolute(filename);requireThat(fs.realpathSync(filename)===filename,'LINK_PATH_REFUSED');
 const lst=fs.lstatSync(filename);requireThat(lst.isFile()&&!lst.isSymbolicLink()&&lst.nlink===1&&lst.size<=max,'REGULAR_SINGLE_LINK_FILE_REQUIRED');
 if(privateOnly)requireThat((lst.mode&0o077)===0&&lst.uid===process.getuid(),'PRIVATE_KEY_PERMISSIONS');
 const fd=fs.openSync(filename,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW),st=fs.fstatSync(fd,{bigint:true});
 requireThat(st.isFile()&&st.nlink===1n&&st.size<=BigInt(max),'OPEN_FILE_IDENTITY');
 return {fd,filename,stat:st};
}
function sameStat(a,b){return ['dev','ino','size','mtimeNs','ctimeNs'].every(k=>a[k]===b[k]);}
function snapshotHash(file){
 const h=createHash('sha256'),block=Buffer.alloc(65536);let at=0,n;
 while((n=fs.readSync(file.fd,block,0,block.length,at))>0){h.update(block.subarray(0,n));at+=n;}
 requireThat(BigInt(at)===file.stat.size&&sameStat(file.stat,fs.fstatSync(file.fd,{bigint:true})),'FILE_CHANGED');
 return {bytes:at,sha256:h.digest('hex')};
}
function smallBytes(filename,max,privateOnly=false){const f=opened(filename,max,privateOnly);try{const b=fs.readFileSync(f.fd);requireThat(BigInt(b.length)===f.stat.size&&sameStat(f.stat,fs.fstatSync(f.fd,{bigint:true})),'FILE_CHANGED');return b;}finally{fs.closeSync(f.fd);}}
function jsonFile(filename,max=MAX_ENVELOPE_BYTES){
 const raw=smallBytes(filename,max);const value=JSON.parse(raw.toString('utf8'));
 requireThat(serialize(value).equals(raw),'NONCANONICAL_OR_DUPLICATE_JSON');return value;
}
function binding(value){
 exact(value,['operationIdentity','provider','deploymentId','runId','attempt','publicationCommit','sourceManifestSHA256'],'BINDING_FIELDS');
 requireThat(value.provider==='RAILWAY'&&typeof value.deploymentId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value.deploymentId),'RAILWAY_DEPLOYMENT_ID');
 requireThat(value.runId===BigInt('0x'+value.deploymentId.replaceAll('-','')).toString(),'DEPLOYMENT_DECIMAL_IDENTITY');
 requireThat(typeof value.operationIdentity==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(value.operationIdentity),'OPERATION_IDENTITY');
 requireThat(typeof value.runId==='string'&&/^[0-9]{1,39}$/.test(value.runId),'RUN_ID');
 requireThat(Number.isSafeInteger(value.attempt)&&value.attempt>=1&&value.attempt<=1000,'ATTEMPT');
 requireThat(typeof value.publicationCommit==='string'&&/^[a-f0-9]{40}$/.test(value.publicationCommit),'COMMIT');
 requireThat(typeof value.sourceManifestSHA256==='string'&&hex.test(value.sourceManifestSHA256),'SOURCE_MANIFEST');
 return {operationIdentity:value.operationIdentity,provider:value.provider,deploymentId:value.deploymentId,runId:value.runId,attempt:value.attempt,publicationCommit:value.publicationCommit,sourceManifestSHA256:value.sourceManifestSHA256};
}
function runtimePin(filename){
 const p=jsonFile(filename);exact(p,['schema','nodeVersion','executableSHA256'],'RUNTIME_PIN_FIELDS');
 requireThat(p.schema==='NODE_CRYPTO_RUNTIME_PIN_V1'&&typeof p.nodeVersion==='string'&&/^v(?:22|24)\.\d+\.\d+$/.test(p.nodeVersion)&&hex.test(p.executableSHA256),'RUNTIME_PIN');
 return {nodeVersion:p.nodeVersion,executableSHA256:p.executableSHA256};
}
function actualRuntime(filename){
 const pin=runtimePin(filename);requireThat(process.version===pin.nodeVersion,'NODE_VERSION_MISMATCH');
 const executable=opened(fs.realpathSync(process.execPath),1048576000);try{requireThat(snapshotHash(executable).sha256===pin.executableSHA256,'NODE_EXECUTABLE_MISMATCH');}finally{fs.closeSync(executable.fd);}
 return pin;
}
function keyIdentity(key,expected){
 requireThat(typeof expected==='string'&&hex.test(expected),'RECIPIENT_FINGERPRINT');
 requireThat(key.asymmetricKeyType==='rsa'&&key.asymmetricKeyDetails?.modulusLength===4096&&key.asymmetricKeyDetails?.publicExponent===65537n,'RSA4096_KEY_REQUIRED');
 const publicKey=key.type==='private'?createPublicKey(key):key;
 const fingerprint=sha(publicKey.export({type:'spki',format:'der'}));requireThat(fingerprint===expected,'RECIPIENT_FINGERPRINT_MISMATCH');return {publicKey,fingerprint};
}
function newDirectory(directory){
 directory=absolute(directory);const parent=path.dirname(directory);requireThat(fs.realpathSync(parent)===parent,'OUTPUT_PARENT_LINK_REFUSED');
 requireThat(!fs.existsSync(directory),'OUTPUT_NOT_FRESH');fs.mkdirSync(directory,{mode:0o700});return directory;
}
function b64(value,length,code){requireThat(typeof value==='string'&&value.length<=2048,'BASE64_BOUND');const b=Buffer.from(value,'base64');requireThat(b.length===length&&b.toString('base64')===value,code);return b;}
function aadFor(recipient,bound,archive,runtime){
 return Buffer.from(JSON.stringify({schema:SCHEMA,contentAlgorithm:'AES-256-GCM',keyWrapAlgorithm:'RSA-OAEP-SHA256',recipientSPKISHA256:recipient,binding:bound,plaintextArchive:archive,encryptorRuntime:runtime}));
}
function monitor(hash){let bytes=0;return {stream:new Transform({transform(chunk,encoding,callback){bytes+=chunk.length;if(bytes>MAX_ARCHIVE_BYTES){callback(new EnvelopeError('STREAM_SIZE_LIMIT'));return;}hash.update(chunk);callback(null,chunk);}}),count:()=>bytes};}
function options(args){
 const out={};for(let i=0;i<args.length;i++){const key=args[i];requireThat(/^--[a-z][a-z0-9-]*$/.test(key)&&!Object.hasOwn(out,key),'CLI_ARGUMENT');if(key==='--local-only'){out[key]=true;continue;}requireThat(i+1<args.length&&!args[i+1].startsWith('--'),'CLI_ARGUMENT_VALUE');out[key]=args[++i];}return out;
}
function fields(opts,required){requireThat(Object.keys(opts).sort().join('\0')===[...required].sort().join('\0'),'CLI_FIELDS');}
function writePublicFile(filename,bytes){const fd=fs.openSync(filename,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}

async function encrypt(opts){
 fields(opts,['--archive','--format','--binding','--public-key','--public-key-sha256','--fingerprint','--runtime-pin','--out-dir']);
 const runtime=actualRuntime(opts['--runtime-pin']),bound=binding(jsonFile(opts['--binding']));
 requireThat(['tar','zip'].includes(opts['--format']),'ARCHIVE_FORMAT');
 const publicBytes=smallBytes(opts['--public-key'],16384);requireThat(publicBytes.toString('ascii').startsWith('-----BEGIN PUBLIC KEY-----\n'),'SPKI_PUBLIC_PEM_REQUIRED');
 requireThat(hex.test(opts['--public-key-sha256'])&&sha(publicBytes)===opts['--public-key-sha256'],'PUBLIC_KEY_SOURCE_PIN_MISMATCH');
 const {publicKey,fingerprint}=keyIdentity(createPublicKey(publicBytes),opts['--fingerprint']);
 const source=opened(opts['--archive'],MAX_ARCHIVE_BYTES);let directory=null,key=null;
 try{
  const input=snapshotHash(source);requireThat(input.bytes>0,'EMPTY_ARCHIVE');
  const archive={format:opts['--format'],bytes:input.bytes,sha256:input.sha256};
  const aad=aadFor(fingerprint,bound,archive,runtime);key=randomBytes(32);const nonce=randomBytes(12);
  const wrapped=publicEncrypt({key:publicKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key);requireThat(wrapped.length===512,'WRAPPED_KEY_SIZE');
  directory=newDirectory(opts['--out-dir']);const ciphertextPath=path.join(directory,'ciphertext.bin');
  const cipher=createCipheriv('aes-256-gcm',key,nonce,{authTagLength:16});cipher.setAAD(aad,{plaintextLength:input.bytes});
  const plainHash=createHash('sha256'),cipherHash=createHash('sha256'),plain=monitor(plainHash),encrypted=monitor(cipherHash);
  await pipeline(fs.createReadStream(source.filename,{fd:source.fd,autoClose:false,start:0}),plain.stream,cipher,encrypted.stream,fs.createWriteStream(ciphertextPath,{flags:'wx',mode:0o600}));
  requireThat(plain.count()===input.bytes&&plainHash.digest('hex')===input.sha256&&encrypted.count()===input.bytes,'PLAINTEXT_CHANGED_OR_SIZE_MISMATCH');
  requireThat(sameStat(source.stat,fs.fstatSync(source.fd,{bigint:true})),'FILE_CHANGED');
  const ciphertext={path:'ciphertext.bin',bytes:encrypted.count(),sha256:cipherHash.digest('hex')};
  const envelope={schema:SCHEMA,contentAlgorithm:'AES-256-GCM',keyWrapAlgorithm:'RSA-OAEP-SHA256',recipientSPKISHA256:fingerprint,
   binding:bound,plaintextArchive:archive,encryptorRuntime:runtime,aadSHA256:sha(aad),nonceBase64:nonce.toString('base64'),
   authenticationTagBase64:cipher.getAuthTag().toString('base64'),wrappedKeyBase64:wrapped.toString('base64'),ciphertext};
  const encoded=serialize(envelope);requireThat(encoded.length<=MAX_ENVELOPE_BYTES&&encoded.length+ciphertext.bytes<=MAX_PUBLIC_BYTES,'ENVELOPE_SIZE_LIMIT');
  writePublicFile(path.join(directory,'envelope.json'),encoded);
  const actual=opened(ciphertextPath,MAX_ARCHIVE_BYTES);try{const readback=snapshotHash(actual);requireThat(readback.bytes===ciphertext.bytes&&readback.sha256===ciphertext.sha256,'CIPHERTEXT_READBACK_MISMATCH');}finally{fs.closeSync(actual.fd);}
  requireThat(fs.readFileSync(path.join(directory,'envelope.json')).equals(encoded),'ENVELOPE_READBACK_MISMATCH');
  fs.chmodSync(ciphertextPath,0o444);fs.chmodSync(path.join(directory,'envelope.json'),0o444);fs.chmodSync(directory,0o755);
  return {status:'ENCRYPTED_FULL_EVIDENCE_ONLY',envelopeSHA256:sha(encoded),ciphertextSHA256:ciphertext.sha256,ciphertextBytes:ciphertext.bytes,
   plaintextArchiveSHA256:input.sha256,plaintextArchiveBytes:input.bytes,recipientSPKISHA256:fingerprint,runtime,privateKeyAccessed:false,plaintextUploaded:false};
 }catch(error){if(directory!==null)fs.rmSync(directory,{recursive:true,force:true});throw error;}finally{if(key)key.fill(0);fs.closeSync(source.fd);}
}

function verifyEnvelope(opts){
 const directory=absolute(opts['--envelope-dir']);requireThat(fs.realpathSync(directory)===directory&&fs.lstatSync(directory).isDirectory(),'ENVELOPE_DIRECTORY');
 requireThat(fs.readdirSync(directory).sort().join('\0')===['ciphertext.bin','envelope.json'].join('\0'),'PUBLIC_OUTPUT_MEMBERS');
 const raw=smallBytes(path.join(directory,'envelope.json'),MAX_ENVELOPE_BYTES),e=JSON.parse(raw.toString('utf8'));requireThat(serialize(e).equals(raw),'NONCANONICAL_OR_DUPLICATE_JSON');
 exact(e,['schema','contentAlgorithm','keyWrapAlgorithm','recipientSPKISHA256','binding','plaintextArchive','encryptorRuntime','aadSHA256','nonceBase64','authenticationTagBase64','wrappedKeyBase64','ciphertext'],'ENVELOPE_FIELDS');
 requireThat(e.schema===SCHEMA&&e.contentAlgorithm==='AES-256-GCM'&&e.keyWrapAlgorithm==='RSA-OAEP-SHA256','ALGORITHM_OR_SCHEMA');
 requireThat(e.recipientSPKISHA256===opts['--fingerprint']&&hex.test(e.recipientSPKISHA256),'RECIPIENT_FINGERPRINT_MISMATCH');
 const bound=binding(e.binding),wanted=binding(jsonFile(opts['--expected-binding']));requireThat(JSON.stringify(bound)===JSON.stringify(wanted),'EXPECTED_BINDING_MISMATCH');
 const archive=exact(e.plaintextArchive,['format','bytes','sha256'],'ARCHIVE_FIELDS');requireThat(['tar','zip'].includes(archive.format)&&Number.isSafeInteger(archive.bytes)&&archive.bytes>0&&archive.bytes<=MAX_ARCHIVE_BYTES&&hex.test(archive.sha256),'ARCHIVE_IDENTITY');
 const runtime=exact(e.encryptorRuntime,['nodeVersion','executableSHA256'],'ENCRYPTOR_RUNTIME_FIELDS');requireThat(JSON.stringify(runtime)===JSON.stringify(runtimePin(opts['--encryptor-runtime-pin'])),'ENCRYPTOR_RUNTIME_MISMATCH');
 const aad=aadFor(e.recipientSPKISHA256,bound,archive,runtime);requireThat(e.aadSHA256===sha(aad),'AAD_DIGEST_MISMATCH');
 const nonce=b64(e.nonceBase64,12,'NONCE'),tag=b64(e.authenticationTagBase64,16,'AUTHENTICATION_TAG'),wrapped=b64(e.wrappedKeyBase64,512,'WRAPPED_KEY');
 const ciphertext=exact(e.ciphertext,['path','bytes','sha256'],'CIPHERTEXT_FIELDS');requireThat(ciphertext.path==='ciphertext.bin'&&ciphertext.bytes===archive.bytes&&hex.test(ciphertext.sha256),'CIPHERTEXT_IDENTITY');
 requireThat(raw.length+ciphertext.bytes<=MAX_PUBLIC_BYTES,'ENVELOPE_SIZE_LIMIT');
 const input=opened(path.join(directory,'ciphertext.bin'),MAX_ARCHIVE_BYTES);
 try{const actual=snapshotHash(input);requireThat(actual.bytes===ciphertext.bytes&&actual.sha256===ciphertext.sha256,'CIPHERTEXT_INTEGRITY');}catch(error){fs.closeSync(input.fd);throw error;}
 return {e,raw,aad,nonce,tag,wrapped,input};
}
async function verify(opts){
 fields(opts,['--envelope-dir','--expected-binding','--fingerprint','--runtime-pin','--encryptor-runtime-pin']);actualRuntime(opts['--runtime-pin']);
 const checked=verifyEnvelope(opts);try{return {status:'PUBLIC_CIPHERTEXT_INTEGRITY_ONLY',envelopeSHA256:sha(checked.raw),ciphertextSHA256:checked.e.ciphertext.sha256,ciphertextBytes:checked.e.ciphertext.bytes,recipientSPKISHA256:checked.e.recipientSPKISHA256,plaintextAuthenticated:false,privateKeyAccessed:false};}finally{fs.closeSync(checked.input.fd);}
}
async function decrypt(opts){
 fields(opts,['--envelope-dir','--expected-binding','--fingerprint','--runtime-pin','--encryptor-runtime-pin','--private-key','--local-only','--out-dir']);
 requireThat(opts['--local-only']===true&&!process.env.GITHUB_RUN_ID&&process.env.GITHUB_ACTIONS!=='true'&&process.env.CI!=='true','LOCAL_DECRYPTION_ONLY');
 actualRuntime(opts['--runtime-pin']);const checked=verifyEnvelope(opts);let directory=null,key=null;
 try{
  const privateBytes=smallBytes(opts['--private-key'],16384,true);let privateKey;
  try{requireThat(privateBytes.toString('ascii').startsWith('-----BEGIN PRIVATE KEY-----\n'),'PKCS8_PRIVATE_PEM_REQUIRED');privateKey=createPrivateKey(privateBytes);}finally{privateBytes.fill(0);}
  keyIdentity(privateKey,opts['--fingerprint']);
  try{key=privateDecrypt({key:privateKey,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},checked.wrapped);}catch{throw new EnvelopeError('KEY_UNWRAP_AUTHENTICATION_FAILED');}
  requireThat(key.length===32,'UNWRAPPED_KEY_SIZE');directory=newDirectory(opts['--out-dir']);
  const partial=path.join(directory,'unauthenticated.partial'),output=path.join(directory,'evidence.'+checked.e.plaintextArchive.format);
  const decipher=createDecipheriv('aes-256-gcm',key,checked.nonce,{authTagLength:16});decipher.setAAD(checked.aad,{plaintextLength:checked.e.plaintextArchive.bytes});decipher.setAuthTag(checked.tag);
  const cipherHash=createHash('sha256'),plainHash=createHash('sha256'),encrypted=monitor(cipherHash),plain=monitor(plainHash);
  try{await pipeline(fs.createReadStream(checked.input.filename,{fd:checked.input.fd,autoClose:false,start:0}),encrypted.stream,decipher,plain.stream,fs.createWriteStream(partial,{flags:'wx',mode:0o600}));}catch{throw new EnvelopeError('GCM_AUTHENTICATION_OR_STREAM_FAILED');}
  requireThat(encrypted.count()===checked.e.ciphertext.bytes&&cipherHash.digest('hex')===checked.e.ciphertext.sha256&&sameStat(checked.input.stat,fs.fstatSync(checked.input.fd,{bigint:true})),'CIPHERTEXT_CHANGED');
  requireThat(plain.count()===checked.e.plaintextArchive.bytes&&plainHash.digest('hex')===checked.e.plaintextArchive.sha256,'PLAINTEXT_ARCHIVE_INTEGRITY');
  const fd=fs.openSync(partial,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  fs.renameSync(partial,output);fs.chmodSync(output,0o400);
  return {status:'LOCAL_AUTHENTICATED_PLAINTEXT_RECOVERED',envelopeSHA256:sha(checked.raw),plaintextArchiveSHA256:checked.e.plaintextArchive.sha256,plaintextArchiveBytes:checked.e.plaintextArchive.bytes,output,recipientSPKISHA256:checked.e.recipientSPKISHA256};
 }catch(error){if(directory!==null)fs.rmSync(directory,{recursive:true,force:true});throw error;}finally{if(key)key.fill(0);fs.closeSync(checked.input.fd);}
}

try{
 requireThat(process.execArgv.length===0&&!['NODE_OPTIONS','NODE_PATH','LD_PRELOAD','LD_LIBRARY_PATH'].some(k=>process.env[k]),'UNTRUSTED_RUNTIME_PRELOAD_OR_FLAGS');
 const [mode,...args]=process.argv.slice(2),opts=options(args);requireThat(['encrypt','verify','decrypt'].includes(mode),'COMMAND');
 const result=await ({encrypt,verify,decrypt}[mode])(opts);process.stdout.write(JSON.stringify(result)+'\n');
}catch(error){process.stderr.write(JSON.stringify({status:'REJECTED',code:error instanceof EnvelopeError?error.code:'LOCAL_IO_OR_CRYPTO_FAILURE'})+'\n');process.exitCode=1;}
