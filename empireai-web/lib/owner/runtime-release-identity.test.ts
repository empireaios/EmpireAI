import test from 'node:test';
import assert from 'node:assert/strict';
import {expectedBackendRevision,verifyOwnerRuntime} from './runtime-identity.mjs';

test('owner verification requires the exact release and every locked readiness invariant',()=>{
 assert.equal(expectedBackendRevision,'91bc23e99e311302573c7f53fe5394aee3d38712');
 const identity={deploy:{gitCommitSha:expectedBackendRevision}};
 const state={ready:true,birth:'NOT_BORN',commerce:'LOCKED',operational:false,readinessScope:'transport_and_storage_only'};
 assert.equal(verifyOwnerRuntime(identity,state),true);
 for(const revision of ['a07d0c4702cea0a2f435291ab3c63d909bf616cf','fd07adbac72604170c26d5601e93f0ecb2234ab2','f85effe413f8ac5d271034ade425ffd77d90d7b9','f3e74fdd58ab9aecf3566118bc27e4ff14440fda','aeaa4ab466e55d5e16568578f0869259346edccc','bd368ceda8f10deceb20be80e65db436f6ac82c2','82c2a7b89702677f15f42bd02b12ef6e8d4736a3','e20bd468e86853d56cfa66ed661c18b17eddaa29','',undefined])assert.equal(verifyOwnerRuntime({deploy:{gitCommitSha:revision}},state),false);
 for(const patch of [{ready:false},{birth:'BORN'},{commerce:'UNLOCKED'},{operational:true},{readinessScope:'operational'}])assert.equal(verifyOwnerRuntime(identity,{...state,...patch}),false);
 assert.equal(verifyOwnerRuntime(null,state),false);assert.equal(verifyOwnerRuntime(identity,null),false);
});
