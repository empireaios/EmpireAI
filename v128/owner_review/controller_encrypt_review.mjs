// Local controller: fixed private inputs -> signed ciphertext only. No network I/O.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPrivateKey,createPublicKey,randomBytes,publicEncrypt,createCipheriv,sign,constants} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {ALGORITHM,BINDING_FIELDS,FILES,MAX_BYTES,MAX_KEY_BYTES,BASELINE_PINS,OWNER_EMAIL_SHA,canonical,sha,exact,requireValue,validateKeyResponse,validatePayload,readStable} from './review-transport.mjs';

export function encryptRestore({keyResponse,expectedBinding,controllerPrivateKey,files,pins=BASELINE_PINS,ownerEmailSHA=OWNER_EMAIL_SHA,now=Date.now()}){
 const recipient=validateKeyResponse(keyResponse,now);exact(expectedBinding,[...BINDING_FIELDS,'publicKeySHA256','instanceNonce','controllerSigningPublicKeySHA256']);
 for(const [key,value]of Object.entries(expectedBinding))requireValue(keyResponse[key]===value,'EXPECTED_INSTANCE_PIN');
 const signingKey=createPrivateKey(controllerPrivateKey);requireValue(signingKey.asymmetricKeyType==='ed25519','SIGNING_PRIVATE_TYPE');
 requireValue(sha(createPublicKey(signingKey).export({format:'der',type:'spki'}))===keyResponse.controllerSigningPublicKeySHA256,'SIGNING_KEY_PIN');
 requireValue(files instanceof Map&&files.size===4&&FILES.every(name=>files.has(name)),'INPUT_FIXED_FILES');
 const payload={schema:'A09_FIXED_RESTORE_PAYLOAD_V1',files:FILES.map(name=>{const raw=files.get(name);requireValue(Buffer.isBuffer(raw),'INPUT_BUFFER');return {path:name,bytes:raw.length,sha256:sha(raw),base64:raw.toString('base64')};})};
 const expanded=Buffer.from(canonical(payload)),binding=Object.fromEntries(BINDING_FIELDS.map(key=>[key,keyResponse[key]]));validatePayload(expanded,binding,{pins,ownerEmailSHA,now});
 const compressed=gzipSync(expanded,{level:9});requireValue(compressed.length<=MAX_BYTES,'COMPRESSED_BOUND');
 const keyBindingSHA256=sha(canonical(keyResponse));const header={keyBindingSHA256,instanceNonce:keyResponse.instanceNonce,encoding:'gzip-json-fixed-files-v1',compressedBytes:compressed.length,expandedBytes:expanded.length,compressedSHA256:sha(compressed)};
 const key=randomBytes(32),iv=randomBytes(12);
 try{
  const wrapped=publicEncrypt({key:recipient,padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256',oaepLabel:Buffer.from('EMPIREAI_A09_RESTORE_V1:'+keyBindingSHA256)},key);
  const cipher=createCipheriv('aes-256-gcm',key,iv,{authTagLength:16});cipher.setAAD(Buffer.from(canonical(header)));const ciphertext=Buffer.concat([cipher.update(compressed),cipher.final()]);
  const unsigned={schema:'A09_SIGNED_RESTORE_ENVELOPE_V1',algorithm:ALGORITHM,header,wrappedKey:wrapped.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
  const envelope=Buffer.from(canonical({...unsigned,signature:sign(null,Buffer.from(canonical(unsigned)),signingKey).toString('base64')}));requireValue(envelope.length<MAX_BYTES,'ENVELOPE_BOUND');
  const receipt={schema:'A09_CONTROLLER_SIGNED_RESTORE_ENVELOPE_RECEIPT_V1',...binding,keyBindingSHA256,instanceNonce:keyResponse.instanceNonce,recipientPublicKeySHA256:keyResponse.publicKeySHA256,controllerSigningPublicKeySHA256:keyResponse.controllerSigningPublicKeySHA256,envelopeBytes:envelope.length,envelopeSHA256:sha(envelope),fixedFiles:4,networkActions:0,plaintextOutput:false,privateKeyOutput:false,ownerActionObserved:false};
  return {envelope,receipt};
 }finally{key.fill(0);expanded.fill(0);compressed.fill(0);}
}
function output(file,raw){
 const target=path.resolve(file);requireValue(fs.realpathSync(path.dirname(target))===path.dirname(target),'OUTPUT_PARENT');
 const fd=fs.openSync(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
 try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 requireValue(readStable(target,MAX_BYTES,{privateInput:true}).equals(raw),'OUTPUT_READBACK');
 const dir=fs.openSync(path.dirname(target),fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
}
function main(){
 const args=process.argv.slice(2),names=['key-response','expected-binding','signing-private-key','database','original','revised','bootstrap','output','receipt'];requireValue(args.length===names.length*2,'CLI_ARGUMENTS');const options={};
 for(let i=0;i<args.length;i+=2){requireValue(args[i].startsWith('--')&&names.includes(args[i].slice(2))&&!Object.hasOwn(options,args[i].slice(2)),'CLI_OPTION');options[args[i].slice(2)]=args[i+1];}
 const keyResponse=JSON.parse(readStable(options['key-response'],MAX_KEY_BYTES)),expectedBinding=JSON.parse(readStable(options['expected-binding'],MAX_KEY_BYTES));
 const privateBytes=readStable(options['signing-private-key'],16384,{privateInput:true});
 try{
  const files=new Map(FILES.map((name,index)=>[name,readStable(options[['database','original','revised','bootstrap'][index]],index===3?32768:MAX_BYTES,{privateInput:true})]));
  const result=encryptRestore({keyResponse,expectedBinding,controllerPrivateKey:privateBytes,files});
  requireValue(path.resolve(options.output)!==path.resolve(options.receipt),'DISTINCT_OUTPUTS');requireValue(!fs.existsSync(options.output)&&!fs.existsSync(options.receipt),'OUTPUT_EXISTS');
  output(options.output,result.envelope);output(options.receipt,Buffer.from(canonical(result.receipt)));
  process.stdout.write(JSON.stringify({status:'SIGNED_CIPHERTEXT_CREATED',bytes:result.envelope.length,sha256:sha(result.envelope),networkActions:0,plaintextOutput:false})+'\n');
 }finally{privateBytes.fill(0);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch{process.stderr.write('A09_CONTROLLER_ENCRYPT_REFUSED\n');process.exit(1);}}
