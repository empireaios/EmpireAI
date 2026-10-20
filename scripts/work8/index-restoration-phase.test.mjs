import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIndexHealth,processIdentity} from './index-restoration-phase.mjs';
const healthy=()=>({continuity:{watchdogEnabled:true,watchdogRunning:true,healthy:true,lastHeartbeatAgeMs:100,alerts:[]}});
test('actual index readiness requires acknowledged watchdog and current heartbeat',()=>{validateIndexHealth(healthy());for(const mutate of [v=>v.continuity.watchdogEnabled=false,v=>v.continuity.watchdogRunning=false,v=>v.continuity.healthy=false,v=>v.continuity.lastHeartbeatAgeMs=22500,v=>v.continuity.lastHeartbeatAgeMs=-1,v=>v.continuity.alerts.push('heartbeat_missing')]){const v=healthy();mutate(v);assert.throws(()=>validateIndexHealth(v));}assert.equal(processIdentity(2147483647),null);});

test('actual proc namespace process identity is available',t=>{const own=processIdentity(process.pid);if(!own){assert.notEqual(process.env.CI,'true','HOSTED_PROC_IDENTITY_REQUIRED');t.skip('Local execution namespace has no /proc entry for process.pid; real hosted namespace assertion remains required');return;}assert.equal(own.pid,process.pid);assert.match(own.startTicks,/^\d+$/);});

import {validatePersistCommand} from './index-restoration-launcher.mjs';
test('target critical persist accepts one exact parent capability and no arbitrary operation',()=>{
 const scope={capability:'00000000-0000-0000-0000-000000000000',source:'a'.repeat(40),used:false};
 const command=()=>({action:'persist-restored-index-once',capability:scope.capability,source:scope.source});
 validatePersistCommand(command(),scope);
 for(const mutate of [m=>m.action='resume-queue',m=>m.capability='forged',m=>m.source='b'.repeat(40),m=>m.path='/other',m=>delete m.source]){const m=command();mutate(m);assert.throws(()=>validatePersistCommand(m,scope));}
 assert.throws(()=>validatePersistCommand(command(),{...scope,used:true}),/ALREADY_USED/);
});
