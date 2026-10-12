import fs from 'node:fs';import assert from 'node:assert/strict';
import {GovernedCommerceStore} from '../../backend/src/runtime/commerce-runtime/governed/store.ts';import {GovernedCommerceEngine} from '../../backend/src/runtime/commerce-runtime/governed/engine.ts';import {CommerceWorker} from '../../backend/src/runtime/commerce-runtime/governed/worker.ts';
assert.equal(process.env.WORK8_KERNEL_EGRESS,'AF_UNIX_ONLY');const store=new GovernedCommerceStore('/evidence/commerce.sqlite'),worker=new CommerceWorker(new GovernedCommerceEngine(store)),ws='synthetic:closure:platform';const t=worker.enqueue(ws,'synthetic-owner','platform-containment');
fs.writeFileSync('/evidence/writer-pid.json',JSON.stringify({pid:process.pid}));
setInterval(()=>{const current=worker.get(ws,t.id);if(current.status==='COMPLETE')return;worker.tick(ws,t.id,current.fence);fs.writeFileSync('/evidence/business-checkpoint.json',JSON.stringify({task:worker.get(ws,t.id),history:store.history(ws,t.mission)}));},5000);
