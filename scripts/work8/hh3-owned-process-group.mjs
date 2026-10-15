import fs from 'node:fs';
import assert from 'node:assert/strict';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function processIdentity(pid){
 try{const text=fs.readFileSync(`/proc/${pid}/stat`,'utf8');const fields=text.slice(text.lastIndexOf(')')+2).split(' ');return {pid:Number(pid),state:fields[0],group:Number(fields[2]),session:Number(fields[3]),start:fields[19]};}
 catch(error){if(error.code==='ENOENT'||error.code==='ESRCH')return null;throw error;}
}
function members(group){return fs.readdirSync('/proc').filter(name=>/^\d+$/.test(name)).map(processIdentity).filter(item=>item?.group===group);}
// Only a freshly detached child may grant group termination authority.
export function ownProcessGroup(child){
 const identity=processIdentity(child.pid),controller=processIdentity(process.pid);
 assert.ok(identity&&controller,'HH3 process identities unavailable');
 assert.equal(identity.group,child.pid,'HH3 child must lead its own process group');
 assert.equal(identity.session,child.pid,'HH3 child must lead its own session');
 assert.notEqual(identity.group,controller.group,'HH3 controller must remain outside owned group');
 return Object.freeze({pid:child.pid,start:identity.start,group:identity.group,controllerGroup:controller.group});
}
export async function terminateOwnedProcessGroup(owner,{timeoutMs=5000}={}){
 const leader=processIdentity(owner.pid);
 assert.ok(!leader||leader.start===owner.start,'HH3 leader PID reused; refusing group signal');
 assert.notEqual(owner.group,processIdentity(process.pid)?.group,'HH3 refusing controller group');
 const observed=members(owner.group);
 try{process.kill(-owner.group,'SIGKILL');}catch(error){if(error.code!=='ESRCH')throw error;}
 const deadline=Date.now()+timeoutMs;
 for(;;){
  const remaining=members(owner.group).filter(item=>item.state!=='Z'&&item.state!=='X');
  const survivors=observed.map(item=>processIdentity(item.pid)).filter(item=>item&&observed.some(old=>old.pid===item.pid&&old.start===item.start)&&item.state!=='Z'&&item.state!=='X');
  if(!remaining.length&&!survivors.length)return {group:owner.group,controllerGroup:owner.controllerGroup,signal:'SIGKILL',observed,remainingLive:0,observedIdentitySurvivors:0,zombiesAreTerminated:true};
  if(Date.now()>=deadline)throw Error('HH3 owned process group failed termination: '+JSON.stringify({remaining,survivors}));
  await delay(20);
 }
}
