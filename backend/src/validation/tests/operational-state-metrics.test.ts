import test from 'node:test';
import assert from 'node:assert/strict';
import {formatExecutiveTruthBrief} from '../../orchestration/pillow-host/executive-truth-grounding.js';
import {readReasoningTools} from '../../orchestration/pillow-host/read-only-tools.js';
import type {ExecutiveTruthSnapshot} from '../../orchestration/pillow-host/executive-truth-types.js';
const truth:ExecutiveTruthSnapshot={
 computedAt:'2026-10-03T07:22:20Z',workspaceId:'owner',provenance:'live_sqlite_commissioning_kpi_birth',
 product:{commissioningId:null,asin:null,productName:null,supplier:null,marketplace:null,selectionAuthority:null,cursorSelected:null,stage:null,pillowRecommendation:null,truthClass:'UNKNOWN'},
 financial:{orders:0,realisedRevenueUsd:0,buyableListings:0,publishedListings:0,expectedProfitDisplay:null,expectedProfitTruthClass:'UNKNOWN',realisedTruthClass:'CURRENT_VERIFIED'},
 birth:{status:'NOT_BORN',technicallyReady:false,birthTimestamp:null,gatesPassedCount:2,gatesTotal:13,truthClass:'CURRENT_VERIFIED'},
 deploy:{gitCommitSha:null,serviceOnlineHint:'assume_online_if_answering',truthClass:'UNKNOWN'},
 authority:{pillowMayPublish:false,pillowMaySupplierSpend:false,pillowMayAuthoriseBirth:false,pillowMayExecuteProductionDeploy:false,chatHasToolCallingLoop:false,executableNow:[],requiresGrandKing:[],truthClass:'CURRENT_VERIFIED'},
 demandEvidence:'UNKNOWN',notes:[],
 assurance:{metric:'independent_assurance_domains',source:'assurance.sqlite:assurance_cycles',readAt:1791012140000,observedAt:1791012000598,evidenceReference:'cycle_1791012000000',status:'CURRENT',passed:4,total:13,grantsAuthority:false,scope:'Partial internal monitoring'},
};
test('Birth diagnostics and Assurance coverage coexist without substituting counts or timestamps',()=>{
 const brief=formatExecutiveTruthBrief(truth);
 assert.match(brief,/legacyBirthDiagnostics=2\/13/);assert.doesNotMatch(brief,/\bgates=2\/13/);
 assert.match(brief,/NOT independent Assurance coverage/);assert.match(brief,/"passed":4/);
 assert.match(brief,/1791012000598/);assert.match(brief,/Hypothetical test premises remain hypothetical/);
 assert.match(formatExecutiveTruthBrief({...truth,assurance:undefined}),/UNKNOWN: independent Assurance cycle was not read/);
});
test('current truth gets a bounded immutable receipt independent of historical or hypothetical context',async()=>{
 const source=structuredClone(truth.assurance);
 const input={workspaceId:'owner',authorizedWorkspace:'owner',requestId:'new-request',repository:{historicalCount:'9/13'},mission:()=>({hypotheticalLimit:80,authority:'none'}),pending:()=>[],currentTruth:()=>source};
 const receipts=await readReasoningTools(input),r=receipts.find(x=>x.tool==='current_operational_truth')!;
 assert.deepEqual(r.result,source);assert.equal(r.grantsAuthority,false);assert.equal(r.requestId,'new-request');
 assert.match(r.sha256,/^[a-f0-9]{64}$/);
 assert.equal((r.result as typeof source)?.passed,4);
 assert.equal((r.result as typeof source)?.observedAt,truth.assurance!.observedAt);
 await assert.rejects(readReasoningTools({...input,workspaceId:'other'}),/scope denied/);
});
