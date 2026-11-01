'use strict';
// Only the already admitted worker and inspector participate. This protocol
// establishes cross-process readback; it does not establish process restart.
const fs=require('node:fs');
const path=require('node:path');
const {createHash}=require('node:crypto');
const protocol='work8-assurance-discrepancy-readback-v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hash=/^[0-9a-f]{64}$/;
const valid=m=>m?.protocol===protocol&&uuid.test(m.id)&&hash.test(m.digest);
const digest=value=>createHash('sha256').update(value).digest('hex');
const send=(channel,m)=>{if(!channel.connected)throw Error('Readback channel unavailable');channel.send(m,()=>{});};

function requestDiscrepancyReadback({id,digest:expected,channel=process,timeoutMs=10000}){
 if(!uuid.test(id)||!hash.test(expected))return Promise.reject(Error('Invalid readback request'));
 return new Promise((resolve,reject)=>{
  let timer;
  const finish=(error,value)=>{clearTimeout(timer);channel.off('message',onMessage);channel.off('disconnect',onDisconnect);error?reject(error):resolve(value);};
  const onDisconnect=()=>finish(Error('Readback channel lost'));
  const onMessage=m=>{
   if(m?.protocol!==protocol||m.id!==id)return;
   if(!valid(m)||m.digest!==expected||m.action!=='result'||m.ok!==true||!Number.isSafeInteger(m.readerPid)||m.readerPid<=0||m.readerPid===process.pid){finish(Error('Independent readback refused'));return;}
   finish(null,{challenge:id,receiptDigest:expected,writerPid:process.pid,readerPid:m.readerPid,scope:'existing-independent-process-committed-readback',freshProcessRestart:false});
  };
  channel.on('message',onMessage);channel.once('disconnect',onDisconnect);
  timer=setTimeout(()=>finish(Error('Independent readback timed out')),timeoutMs);
  try{send(channel,{protocol,id,digest:expected,action:'request'});}catch(error){finish(error);}
 });
}

function readCommittedDiscrepancy(root,id,expected){
 if(!uuid.test(id)||!hash.test(expected))throw Error('Invalid readback input');
 const directory=path.resolve(root,'commissioning');
 if(fs.realpathSync(directory)!==directory)throw Error('Readback directory not canonical');
 const filename=path.join(directory,'assurance-probe-'+id+'.sqlite');
 const fd=fs.openSync(filename,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 let db;
 try{
  const before=fs.fstatSync(fd);
  if(!before.isFile()||before.nlink!==1||before.size>4*1024*1024)throw Error('Invalid readback file');
  // Writer closes its store before requesting. SQLite read-only inspection can
  // retain an empty WAL sidecar; any nonempty journal is outside this proof.
  for(const suffix of ['-wal','-journal'])if(fs.existsSync(filename+suffix)&&fs.lstatSync(filename+suffix).size!==0)throw Error('Readback journal not empty');
  const {DatabaseSync}=require('node:sqlite');
  db=new DatabaseSync('/proc/self/fd/'+fd,{readOnly:true,allowExtension:false,timeout:1000});
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
  const row=db.prepare("SELECT receipt FROM assurance_cycles WHERE id='discrepancy' AND completed_at IS NOT NULL").get();
  if(typeof row?.receipt!=='string'||digest(row.receipt)!==expected)throw Error('Readback receipt mismatch');
  const receipt=JSON.parse(row.receipt);
  if(receipt.schema!=='independent-assurance-cycle-v1'||receipt.healthy!==false||receipt.liveProof!==false||receipt.checks?.runtime?.status!=='FAIL'||receipt.checks?.workers?.status!=='SOURCE_UNAVAILABLE'||receipt.checks?.scheduler?.status!=='STALE'||receipt.checks?.['authority-spending']?.status!=='FAIL')throw Error('Readback discrepancy mismatch');
  const after=fs.lstatSync(filename);
  if(!after.isFile()||after.dev!==before.dev||after.ino!==before.ino||after.size!==before.size||after.mtimeMs!==before.mtimeMs||after.nlink!==1)throw Error('Readback file changed');
  return expected;
 }finally{db?.close();fs.closeSync(fd);}
}

function installDiscrepancyReader({root,capture,channel=process}){
 let busy=false,closed=false;
 const onMessage=async m=>{
  if(m?.protocol!==protocol||m.action!=='inspect')return;
  if(!valid(m)||!Number.isSafeInteger(m.writerPid)||m.writerPid<=0||m.writerPid===process.pid)return;
  if(busy||closed){try{send(channel,{protocol,id:m.id,digest:m.digest,action:'observed',ok:false});}catch{}return;}
  busy=true;let ok=false;
  try{const ran=await capture.run(()=>{readCommittedDiscrepancy(root,m.id,m.digest);ok=true;});if(!ran)ok=false;}catch{ok=false;}
  finally{busy=false;}
  if(!closed)try{send(channel,{protocol,id:m.id,digest:m.digest,action:'observed',ok});}catch{}
 };
 channel.on('message',onMessage);
 send(channel,{protocol,action:'ready'});
 return()=>{closed=true;channel.off('message',onMessage);};
}

function createDiscrepancyRelay({timeoutMs=10000}={}){
 const roles=new Map(),usedIds=new Set();let pending=null,ready=false,closed=false;
 const finish=ok=>{
  if(!pending)return;const p=pending;pending=null;clearTimeout(p.timer);
  try{send(p.writer,{protocol,id:p.id,digest:p.digest,action:'result',ok,readerPid:p.reader?.pid});}catch{}
 };
 const forward=()=>{
  if(!pending||pending.reader||!ready)return;
  const reader=roles.get('inspector');
  if(!reader?.connected||reader.pid===pending.writer.pid){finish(false);return;}
  pending.reader=reader;
  try{send(reader,{protocol,id:pending.id,digest:pending.digest,action:'inspect',writerPid:pending.writer.pid});}catch{finish(false);}
 };
 const register=(role,child)=>{
  if(!['worker','inspector'].includes(role)||roles.has(role)||closed)throw Error('Invalid readback role registration');
  roles.set(role,child);
  const onMessage=m=>{
   if(m?.protocol!==protocol||roles.get(role)!==child||closed)return;
   if(role==='inspector'&&m.action==='ready'){ready=true;forward();return;}
   if(role==='worker'&&m.action==='request'&&valid(m)){
    if(pending||usedIds.has(m.id)||usedIds.size>=1024){try{send(child,{protocol,id:m.id,digest:m.digest,action:'result',ok:false});}catch{}return;}
    usedIds.add(m.id);
    pending={id:m.id,digest:m.digest,writer:child,reader:null,timer:setTimeout(()=>finish(false),timeoutMs)};forward();return;
   }
   if(role==='inspector'&&m.action==='observed'&&pending?.reader===child&&m.id===pending.id){finish(valid(m)&&m.digest===pending.digest&&m.ok===true);}
  };
  const unregister=()=>{
   if(roles.get(role)!==child)return;
   roles.delete(role);if(role==='inspector')ready=false;
   if(pending?.writer===child||pending?.reader===child||role==='inspector')finish(false);
   child.off('message',onMessage);child.off('disconnect',unregister);child.off('exit',unregister);child.off('error',unregister);
  };
  child.on('message',onMessage);child.once('disconnect',unregister);child.once('exit',unregister);child.once('error',unregister);
  return unregister;
 };
 return{register,close(){closed=true;finish(false);roles.clear();}};
}
module.exports={protocol,digest,requestDiscrepancyReadback,readCommittedDiscrepancy,installDiscrepancyReader,createDiscrepancyRelay};
