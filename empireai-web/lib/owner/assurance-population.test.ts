import test from 'node:test';
import assert from 'node:assert/strict';
import {assurancePopulation} from './assurance-coverage';
test('source population stays unknown unless all counts are present and reconcile',()=>{
 const valid={authoritativeCount:3,internalCount:3,matched:1,missing:1,mismatched:1,unexpected:1};
 assert.match(assurancePopulation(valid),/3 authoritative entries.*1 missing.*Observed scope only/);
 for(const bad of [null,{}, {...valid,matched:2},{...valid,missing:NaN},{...valid,unexpected:-1},{...valid,internalCount:Infinity},{...valid,matched:0.5}]) assert.equal(assurancePopulation(bad),'Compared population: unknown');
 assert.match(assurancePopulation({authoritativeCount:0,internalCount:0,matched:0,missing:0,mismatched:0,unexpected:0}),/0 authoritative entries/);
});
