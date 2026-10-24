import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { installPrimaryCaptureParticipant, withPrimaryCaptureFence } from '../../runtime/work8-primary-capture.js';
import { CaptureHttpAdmission } from '../../runtime/capture-http-admission.js';
const fixture = fileURLToPath(new URL('./fixtures/work8-primary-capture-child.ts', import.meta.url));
async function child(t: any) {
 const c = fork(fixture, [], {execArgv:['--import','tsx'],stdio:['ignore','ignore','pipe','ipc']});
 t.after(()=>{if(c.exitCode===null&&c.signalCode===null)c.kill('SIGKILL');});
 await wait(c,'ready'); return c;
}
function wait(c: ReturnType<typeof fork>, event: string): Promise<any> {
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error('timeout '+event));},5000);
  const listener=(m:any)=>{if(m?.event===event){cleanup();resolve(m);}};
  const cleanup=()=>{clearTimeout(timer);c.off('message',listener);};c.on('message',listener);
 });
}
test('actual child waits for primary HTTP drain, cannot admit writers until release',async t=>{
 const c=await child(t),gate=new CaptureHttpAdmission(); const release=gate.admit();
 installPrimaryCaptureParticipant(c,held=>gate.withDrainedAdmission(held));
 let called=false;c.on('message',(m:any)=>{if(m.event==='callback'){called=true;assert.throws(()=>gate.admit());}});
 const result=wait(c,'result');c.send({command:'run'});
 await new Promise(r=>setTimeout(r,60));assert.equal(called,false);release();
 assert.equal((await result).result,'captured');const done=gate.admit();done();
});
test('primary refuses before callback when a required participant fails to drain',async t=>{
 const c=await child(t);installPrimaryCaptureParticipant(c,async()=>{throw Error('OBSERVER_NOT_DRAINED');});
 let called=false;c.on('message',(m:any)=>{if(m.event==='callback')called=true;});
 const result=wait(c,'error');c.send({command:'run'});await result;assert.equal(called,false);
});
test('failed capture releases acknowledged primary fence without reporting success',async t=>{
 const c=await child(t),gate=new CaptureHttpAdmission();installPrimaryCaptureParticipant(c,held=>gate.withDrainedAdmission(held));
 const result=wait(c,'error');c.send({command:'run',fail:true});assert.match((await result).error,/CALLBACK_FAILED/);
 gate.admit()();
 const retry=wait(c,'result');c.send({command:'run'});assert.equal((await retry).result,'captured');
});
test('IPC loss terminates requester before primary writer admission resumes',async t=>{
 const c=await child(t),gate=new CaptureHttpAdmission();installPrimaryCaptureParticipant(c,held=>gate.withDrainedAdmission(held));
 const exited=once(c,'exit');c.send({command:'run',disconnect:true});
 const [,signal]=await exited;assert.equal(signal,'SIGKILL');await new Promise(r=>setTimeout(r,10));gate.admit()();
});
test('capture without inherited primary channel refuses',async()=>{
 await assert.rejects(withPrimaryCaptureFence(async()=>true),/PRIMARY_CAPTURE_IPC_REQUIRED/);
});
