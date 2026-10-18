import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {GovernedCommerceStore} from '../EmpireAI/backend/src/runtime/commerce-runtime/governed/store.ts';
import {GovernedCommerceEngine} from '../EmpireAI/backend/src/runtime/commerce-runtime/governed/engine.ts';
import {acceptanceScenario} from '../EmpireAI/backend/src/runtime/commerce-runtime/governed/scenario.ts';
const dir=path.resolve('lane-e-20261018d'),store=new GovernedCommerceStore(':memory:'),now=1792316400000,engine=new GovernedCommerceEngine(store,()=>now),f=acceptanceScenario('bounded-o19','owner',now);
const bytes=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect width="220" height="220" fill="#225577"/><text x="10" y="110" fill="white">Owner-directed test media</text></svg>');
const hash=createHash('sha256').update(bytes).digest('hex');
const listing=structuredClone(f.listing);listing.images=[{url:'https://media.example.invalid/test.svg',license:'Original locally authored SVG examination asset; no supplier licence claimed',rightsEvidence:'evidence-QUALITY',sha256:hash}];
let n=0;const run=(actor,command)=>engine.execute(actor,{id:'event-'+(++n),missionId:'o19',expectedVersion:store.history('bounded-o19','o19').length,command});
const checks=[];function check(name,fn){fn();checks.push(name)}
try{
run(f.actors.PROPOSER,{type:'research',candidate:f.candidate});
check('Wrong product identity refused',()=>assert.throws(()=>run(f.actors.PROPOSER,{type:'listing',listing:{...listing,productId:'other'}}),/IDENTITY/));
check('Unknown rights reference refused',()=>assert.throws(()=>run(f.actors.PROPOSER,{type:'listing',listing:{...listing,images:[{...listing.images[0],rightsEvidence:'unknown'}]}}),/PROVENANCE/));
check('Non-HTTPS asset refused',()=>assert.throws(()=>run(f.actors.PROPOSER,{type:'listing',listing:{...listing,images:[{...listing.images[0],url:'http://example.invalid/asset.svg'}]}}),/UNSAFE/));
let r;check('Actual listing engine preserves complete permitted-asset package',()=>{r=run(f.actors.PROPOSER,{type:'listing',listing});assert.deepEqual(r.state.listing,listing);assert.equal(r.externalEffects,0);assert(r.entities.some(e=>e.kind==='ListingPackage'));});
check('Failed commands did not append receipts',()=>assert.equal(store.history('bounded-o19','o19').length,2));
check('A9 exact original SVG hash retained',()=>assert.equal(r.state.listing.images[0].sha256,hash));
fs.writeFileSync(path.join(dir,'O19-BOUNDED-RESULT.json'),JSON.stringify({status:'PASS_SCOPED_NOT_FULL_O19',checks,assetSHA256:hash,classification:'SYNTHETIC',externalEffects:0,paidInference:0,limitation:'In-process engine examination, no authenticated browser or actual supplier permission. Media approval store is independent from listing state; A9/A11 accepted media is not automatically copied into listing or its candidateDigest. Full same-asset approval-to-listing acceptance remains unproven.'},null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,status:'PASS_SCOPED_NOT_FULL_O19',hash}));
}finally{store.close()}
