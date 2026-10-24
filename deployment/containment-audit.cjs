'use strict';
const fs=require('node:fs');
const path=require('node:path');
async function recordContainment(env,receipt){
 try{
  const target=path.join(env.RAILWAY_VOLUME_MOUNT_PATH,'commissioning','assurance-containment.jsonl');
  const fd=await fs.promises.open(target,fs.constants.O_WRONLY|fs.constants.O_APPEND|fs.constants.O_CREAT|fs.constants.O_NOFOLLOW,0o600);
  try{await fd.writeFile(JSON.stringify(receipt)+'\n');await fd.sync();}finally{await fd.close();}
  const dir=await fs.promises.open(path.dirname(target),'r');try{await dir.sync();}finally{await dir.close();}
  return true;
 }catch{return false;}
}
async function settleAudit(promise){
 let timer;
 try{return await Promise.race([promise,new Promise(resolve=>{timer=setTimeout(()=>resolve(false),1000);})]);}
 finally{clearTimeout(timer);}
}
module.exports={recordContainment,settleAudit};
