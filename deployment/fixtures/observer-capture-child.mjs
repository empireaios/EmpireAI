import {createRequire} from 'node:module';
import {AssuranceStore,runAssuranceCycle} from '../../backend/src/assurance/independent-assurance.mjs';
import {runInspectorPass} from '../../backend/src/assurance/inspector-cycle.mjs';
const {installObserverParticipant}=createRequire(import.meta.url)('../observer-capture.cjs');
const gate=installObserverParticipant(),file=process.env.OBSERVER_TEST_DATABASE;
const store=new AssuranceStore(file);gate.ready();
process.on('message',async m=>{
 if(m.type!=='cycle')return;
 const ran=await gate.run(async()=>{
  if(m.hold){process.send({type:'active'});await new Promise(resolve=>{const listener=v=>{if(v.type==='continue'){process.off('message',listener);resolve();}};process.on('message',listener);});}
  if(process.env.OBSERVER_TEST_KIND==='worker')await runAssuranceCycle(store,{id:m.id,scheduledAt:Date.now(),maxAgeMs:10000,timeoutMs:m.late?20:1000,collectors:m.late?{runtime:()=>gate.track(async()=>{process.send({type:'collector-active'});await new Promise(resolve=>{const listener=v=>{if(v.type==='settle-collector'){process.off('message',listener);resolve();}};process.on('message',listener);});store.db.exec("CREATE TABLE late_collector(value INTEGER); INSERT INTO late_collector VALUES(1)");return null;})}:{}});
  else runInspectorPass(file,Date.now());
 });
 process.send({type:'cycle-result',ran});
});
process.send({type:'ready'});
process.on('disconnect',()=>{store.close();process.exit(0);});
