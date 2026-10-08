import test from 'node:test';
import assert from 'node:assert/strict';
import {assurancePage,exactAssuranceRecord} from '../../assurance/readback.js';
import {acceptanceRevisionEligible,retainedAcceptance} from '../../assurance/acceptance-continuity.js';
import {reconciliationHash} from '../../assurance/evidence-reconciliation.js';
test('growing nested event history stays bounded and summary pages retain exact identities',()=>{
 const cp={status:'DEGRADED',revision:'a',components:[],events:Array.from({length:100},(_,seq)=>({seq,type:'REPAIR',body:{projection:'x'.repeat(30000)}}))};const snapshot={controlPlane:cp};const before=reconciliationHash(snapshot);let after='',ids:string[]=[];
 do{const p=assurancePage(snapshot,after,7);assert.ok(Buffer.byteLength(JSON.stringify(p))<256000);assert.ok(p.records.length<=7);ids.push(...p.records.map((r:any)=>r.recordId));after=p.pagination.next??'';}while(after);
 assert.equal(new Set(ids).size,100);assert.equal(reconciliationHash(snapshot),before);assert.throws(()=>assurancePage(snapshot,'unknown',1),/UNKNOWN_CURSOR/);
});
test('large exact records round trip losslessly by chunks including Unicode',()=>{const row={id:'r',result:'😀Evidence'.repeat(30000)};let after='',json='';do{const p=exactAssuranceRecord('recovery',row,after)!;assert.ok(Buffer.byteLength(JSON.stringify(p))<256000);assert.equal(p.sha256,reconciliationHash(row));json+=p.jsonChunk;after=p.next??'';}while(after);assert.deepEqual(JSON.parse(json),row);assert.equal(exactAssuranceRecord('recovery',null),undefined);assert.throws(()=>exactAssuranceRecord('recovery',row,'-1'));});
test('carry-forward accepts only pinned receipt, revision and preservation digest',()=>{const h={mode:'API_ADVISOR',revision:retainedAcceptance.revision,id:retainedAcceptance.ids.API_ADVISOR,preservation:{manifestSha256:retainedAcceptance.preservationManifestSha256}};assert.equal(acceptanceRevisionEligible(h,'new'),true);for(const altered of [{...h,id:'other'},{...h,revision:'other'},{...h,preservation:{manifestSha256:'other'}}])assert.equal(acceptanceRevisionEligible(altered,'new'),false);});
