import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertReadiness, assertRecord, assertExecutive, digest} from './check-contract.mjs';

const source = '98970018d579e5a7c720d25293cdddbe294856c0';
const readyFixture = () => ({live:{status:200,body:{status:'ok',brain:'online',tier0Isolation:true,role:'tier0-primary',deploy:{gitCommitSha:source}}}, ready:{status:200,body:{ready:true,brain:'online',tier0Isolation:true,workerOnline:true,workerReady:true,sessionStore:'redis',checks:{redis:{ok:true,ping:true},pillow:{ok:true}},pillow:{enabled:true,ready:true,lifecycle:'running'}}}});
test('accepts actual isolated-primary readiness shape', () => {const {live,ready}=readyFixture(); assert.doesNotThrow(() => assertReadiness(live,ready,source));});
test('rejects live-only primary with unavailable worker', () => {const {live,ready}=readyFixture();ready.status=503;ready.body.workerReady=false;assert.throws(() => assertReadiness(live,ready,source));});
test('rejects disabled runtime even when birth must remain NOT_BORN', () => {const {live,ready}=readyFixture();ready.body.pillow.enabled=false;assert.throws(() => assertReadiness(live,ready,source));});
test('rejects Redis mock or unavailable authenticated ping', () => {for(const change of [r=>r.sessionStore='memory',r=>r.checks.redis.ping=false]){const {live,ready}=readyFixture();change(ready.body);assert.throws(() => assertReadiness(live,ready,source));}});
test('rejects different backend source or nonisolated topology', () => {for(const change of [l=>l.deploy.gitCommitSha='other',l=>l.tier0Isolation=false]){const {live,ready}=readyFixture();change(live.body);assert.throws(() => assertReadiness(live,ready,source));}});
const target='synthetic-target';
const command={id:'native-ui-event',target,decision:'DEFER',note:'Synthetic defer',expectedVersion:0};
const recordFixture=()=>({id:target,kind:'EXPERIENCE',origin:{authenticity:'SYNTHETIC'},version:1,grantsAuthority:false,events:[{...command,kind:'OWNER_DECISION',origin:{actor:'GRAND_KING',authenticity:'SYNTHETIC',source:'authenticated-owner:synthetic'},grantsAuthority:false}]});
test('accepts one synthetic authenticated native DEFER event',()=>assert.equal(assertRecord(recordFixture(),target,command).version,1));
test('rejects replay mutations, wrong version, substituted provenance and changed note',()=>{for(const change of [r=>r.events.push(r.events[0]),r=>r.version=0,r=>r.events[0].origin.authenticity='OWNER_ASSERTED',r=>r.events[0].note='different']){const r=recordFixture();change(r);assert.throws(()=>assertRecord(r,target,command));}});
test('full-record digest detects history changes after restart',()=>{const r=recordFixture(),before=digest(r);r.events[0].recordedAt='changed';assert.notEqual(before,digest(r));});
test('executive projection requires no-execution locked state',()=>{const body={birth:'NOT_BORN',commerce:'LOCKED',grantsAuthority:false,inferenceCalls:0,externalEffects:0,recommendations:[{id:target,version:1,classification:'SYNTHETIC',status:'DEFERRED',executionStatus:'NOT_EXECUTED',ownerDecision:command,grantsAuthority:false}]};assert.doesNotThrow(()=>assertExecutive(body,target,command));body.recommendations[0].executionStatus='EXECUTED';assert.throws(()=>assertExecutive(body,target,command));});
