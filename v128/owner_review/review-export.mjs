import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash,timingSafeEqual} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(name,value)=>fs.writeFileSync(name,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o400});
function command(binary,args,timeout){return new Promise((resolve,reject)=>{
 const child=spawn(binary,args,{stdio:['ignore','pipe','pipe'],env:{PATH:'/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8',TZ:'UTC'}});let chunks=[],bytes=0,errorBytes=0;
 const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('REVIEW_SEAL_DEADLINE'));},timeout);
 child.stdout.on('data',b=>{bytes+=b.length;if(bytes>65536){child.kill('SIGKILL');reject(Error('REVIEW_SEAL_OUTPUT_BOUND'));}else chunks.push(b);});
 child.stderr.on('data',b=>{errorBytes+=b.length;if(errorBytes>65536)child.kill('SIGKILL');});
 child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('close',code=>{clearTimeout(timer);if(code!==0)reject(Error('REVIEW_SEAL_PROCESS_FAILED'));else resolve(Buffer.concat(chunks));});
});}

export function createReviewExporter({config,stateRoot,receiptDir,controlRoot,outputRoot,closeAdmission,onAcknowledged=()=>{}}){
 let sealing=null,fixed=null,acked=false;
 function authenticated(value){return typeof value==='string'&&/^[A-Za-z0-9_-]{43,128}$/.test(value)&&value.length===config.exportToken.length&&timingSafeEqual(Buffer.from(value),Buffer.from(config.exportToken));}
 async function seal(reason){
  if(sealing)return sealing;
  closeAdmission();
  sealing=(async()=>{
   if(!/^[A-Z_]{1,64}$/.test(reason))throw Error('REVIEW_SEAL_REASON');
   fs.mkdirSync(outputRoot,{mode:0o700});
   const raw=await command('/usr/local/bin/python3',[path.join(controlRoot,'seal_review.py'),'--state',stateRoot,'--baseline',path.join(controlRoot,'retained-a08-baseline.json'),'--receipts',receiptDir,'--out',path.join(outputRoot,'native'),'--runtime-manifest',path.join(controlRoot,'runtime-manifest.json'),'--source-manifest',path.join(controlRoot,'source-manifest.json'),'--build-provenance',path.join(controlRoot,'build-provenance.json'),'--runtime-sha256',config.runtimeManifestSHA256,'--source-sha256',config.sourceManifestSHA256],8000);
   const summary=JSON.parse(raw.toString('utf8'));
   const binding={operationIdentity:config.operationIdentity,provider:'RAILWAY',deploymentId:config.deploymentId,runId:BigInt('0x'+config.deploymentId.replaceAll('-','')).toString(),attempt:1,publicationCommit:config.publicationCommit,sourceManifestSHA256:config.sourceManifestSHA256};
   write(path.join(outputRoot,'binding.json'),binding);
   const pub=path.join(controlRoot,'recipient-public-key.pem'),runtime=path.join(controlRoot,'evidence-envelope-runtime-pin.json');
   const encrypted=JSON.parse((await command('/usr/local/bin/node',[path.join(controlRoot,'private-evidence-envelope.mjs'),'encrypt','--archive',summary.archive,'--format','zip','--binding',path.join(outputRoot,'binding.json'),'--public-key',pub,'--public-key-sha256',sha(fs.readFileSync(pub)),'--fingerprint','f9a3caad605563c58bb85ebb33a52a82f8eb1ede75ea44e7452aaa5c60dd28a0','--runtime-pin',runtime,'--out-dir',path.join(outputRoot,'cipher')],8000)).toString('utf8'));
   const envelope=JSON.parse(fs.readFileSync(path.join(outputRoot,'cipher/envelope.json'))),ciphertext=fs.readFileSync(path.join(outputRoot,'cipher/ciphertext.bin'));
   const body=Buffer.from(JSON.stringify({schema:'A09_ENCRYPTED_NATIVE_REVIEW_EXPORT_V1',envelope,ciphertextBase64:ciphertext.toString('base64')}));
   if(body.length>12*1024*1024)throw Error('REVIEW_EXPORT_BOUND');
   fixed={body,sha256:sha(body),ciphertextSHA256:sha(ciphertext),bytes:body.length,finalVersion:summary.finalVersion};
   fs.writeFileSync(path.join(outputRoot,'fixed-export.json'),body,{flag:'wx',mode:0o400});
   write(path.join(receiptDir,'ciphertext-custody.json'),{schema:'A09_FIXED_CIPHERTEXT_CUSTODY_V1',reason,exportSHA256:fixed.sha256,exportBytes:fixed.bytes,ciphertextSHA256:fixed.ciphertextSHA256,envelopeSHA256:encrypted.envelopeSHA256,finalVersion:summary.finalVersion,authenticatedControllerReadback:false,wholeRowAccepted:false});
   // Provider logs receive recipient-encrypted bytes only. The independent
   // reader must reconstruct every numbered chunk and verify the fixed digest.
   // This bounded fallback survives a stalled Work session; partial logs fail.
   void emitCiphertext(fixed).then(()=>process.send?.({type:'ciphertext-log-complete',exportSHA256:fixed.sha256})).catch(()=>{});
   // Plaintext is kept private until controller ACK or hard termination. Never
   // delete the only native outcome before an encrypted copy is fixed.
   return fixed;
  })();
  return sealing;
 }
 return {
  authenticated,seal,
  get ready(){return fixed;},
  async acknowledge(expected){
   if(!fixed||expected!==fixed.sha256||acked)throw Error('REVIEW_EXPORT_ACK_MISMATCH');
   acked=true;write(path.join(receiptDir,'controller-export-ack.json'),{schema:'A09_EXACT_CIPHERTEXT_CONTROLLER_ACK_V1',exportSHA256:fixed.sha256,ciphertextSHA256:fixed.ciphertextSHA256,atUTC:new Date().toISOString(),independentAcceptanceClaimed:false});
   onAcknowledged();return {acknowledged:true,exportSHA256:fixed.sha256,acceptanceClaimed:false};
  },
 };
}

async function emitCiphertext(fixed){
 const chunkBytes=4096,count=Math.ceil(fixed.body.length/chunkBytes);
 if(count>3072)throw Error('CIPHERTEXT_LOG_BOUND');
 const index={schema:'A09_CUSTODY_INDEX_V1',exportSHA256:fixed.sha256,exportBytes:fixed.body.length,ciphertextSHA256:fixed.ciphertextSHA256,chunkBytes,chunks:count,encoding:'BASE64_OF_FIXED_ENCRYPTED_EXPORT_JSON',plaintextDisclosed:false};
 process.stdout.write(JSON.stringify({...index,complete:false})+'\n');
 for(let i=0;i<count;i++){
  const b=fixed.body.subarray(i*chunkBytes,(i+1)*chunkBytes);
  process.stdout.write(JSON.stringify({schema:'A09_CUSTODY_CIPHERTEXT_V1',exportSHA256:fixed.sha256,index:i,bytes:b.length,sha256:sha(b),dataBase64:b.toString('base64')})+'\n');
  await new Promise(resolve=>setTimeout(resolve,10));
 }
 process.stdout.write(JSON.stringify({...index,complete:true})+'\n');
}
