'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mayReuse,baselineTree,workflowDigest}=require('../f27-change-boundary.cjs');
const p='scripts/work8/f27-outer-controller.cjs';
test('retained examinations require exact known base, ancestry, workflow and regular examination-only paths',()=>{
 const check=(paths=[p],digest=workflowDigest,tree=baselineTree,ancestor=true,modes={[p]:'100644'})=>mayReuse(paths,digest,tree,ancestor,modes);
 assert.equal(check(),true);
 for(const paths of [null,[],['backend/src/app.ts'],['backend/src/runtime/work8-generated-capture-hold.ts'],['pillow/package-lock.json'],['scripts/work8/f29-outer-controller.cjs'],['railway.toml'],['deployment/locked-runtime.cjs'],['unknown'],[p,'backend/src/app.ts']])assert.equal(check(paths),false);
 assert.equal(check(undefined,'wrong'),false);assert.equal(check(undefined,undefined,'unknown'),false);assert.equal(check(undefined,undefined,undefined,false),false);
 for(const mode of ['120000','100755','160000','',undefined])assert.equal(check(undefined,undefined,undefined,undefined,{[p]:mode}),false);
});
