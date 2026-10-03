import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedBackendRevision,verifyOwnerRuntime} from './runtime-identity.mjs';

test('owner verification requires the exact release and every locked readiness invariant',()=>{
 const identity={deploy:{gitCommitSha:expectedBackendRevision}};
 const state={ready:true,birth:'NOT_BORN',commerce:'LOCKED',operational:false,readinessScope:'transport_and_storage_only'};
 assert.equal(verifyOwnerRuntime(identity,state),true);
 for(const revision of ['56e72198992ff857da5aa9a7a057069753fe9866','008bc98b6937ac3cbb7279c8e4c134a8db87034c','3605c4202dae07ab8a41aed0c202e2f48aa1eacb','f4011924a3e46b41aad800d29104b223a0c8fa62','79ba206471b4a755242747ebf12282713adfc694','aeaa4ab466e55d5e16568578f0869259346edccc','bd368ceda8f10deceb20be80e65db436f6ac82c2','82c2a7b89702677f15f42bd02b12ef6e8d4736a3','e20bd468e86853d56cfa66ed661c18b17eddaa29','',undefined])assert.equal(verifyOwnerRuntime({deploy:{gitCommitSha:revision}},state),false);
 for(const patch of [{ready:false},{birth:'BORN'},{commerce:'UNLOCKED'},{operational:true},{readinessScope:'operational'}])assert.equal(verifyOwnerRuntime(identity,{...state,...patch}),false);
 assert.equal(verifyOwnerRuntime(null,state),false);assert.equal(verifyOwnerRuntime(identity,null),false);
});
