'use strict';
// Synthetic application only. Production controller, guard, native fencing and broker are unmodified.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const state=path.dirname(process.env.DATABASE_PATH),protocol='work8-runtime-broker-v1',capture='work8-primary-capture-v1';
const {withObserverCapture}=require('../../deployment/observer-capture.cjs');
if(process.env.WORK8_MEMBERSHIP_ROLE==='primary'){
 const handle=crypto.randomUUID();let stopping=false,release,held;
 const send=(action,extra={})=>process.send({protocol,handle,request:crypto.randomUUID(),action,...extra});
 process.on('message',async m=>{
  if(m?.protocol!==protocol||m.handle!==handle)return;
  if(m.action==='message'&&m.message.action==='acquire'){
   const id=m.message.id;
   try{await withObserverCapture(async()=>{send('send',{message:{protocol:capture,id,action:'held'}});await new Promise(r=>release=r);});send('send',{message:{protocol:capture,id,action:'released'}});}catch(e){console.error(e);process.exit(1);}
  }else if(m.action==='message'&&m.message.action==='release'){release?.();}
  else if(m.action==='exit'&&stopping)process.exit(m.code===0?0:1);
 });
 process.on('SIGTERM',()=>{stopping=true;send('signal',{signal:'SIGTERM'});});
 send('spawn');
}else if(process.env.WORK8_MEMBERSHIP_ROLE==='brain-worker'){
 const id=crypto.randomUUID();
 const result=require('node:child_process').spawnSync(process.execPath,['-e','process.exit(0)']);
 let journalWrite='UNEXPECTED_SUCCESS';try{fs.appendFileSync(process.env.WORK8_CONTROLLER_JOURNAL_PATH,'x');}catch(e){journalWrite=e.code;}
 fs.writeFileSync(path.join(state,'graph-probe.json'),JSON.stringify({spawnError:result.error?.code,journalWrite}));
 process.on('message',m=>{
  if(m?.protocol!==capture||m.id!==id)return;
  if(m.action==='held'){
   fs.writeFileSync(path.join(state,'graph-held.json'),JSON.stringify(m.membershipReceipt));
   const timer=setInterval(()=>{if(fs.existsSync(path.join(state,'release'))){clearInterval(timer);process.send({protocol:capture,id,action:'release'});}},20);
  }else if(m.action==='released')fs.writeFileSync(path.join(state,'graph-released'),'1');
 });
 const trigger=setInterval(()=>{if(fs.existsSync(path.join(state,'capture-trigger'))){clearInterval(trigger);process.send({protocol:capture,id,action:'acquire'});}},20);
 process.on('SIGTERM',()=>process.exit(0));
}else throw Error('UNEXPECTED_FIXTURE_ROLE');
setInterval(()=>{},1000);
