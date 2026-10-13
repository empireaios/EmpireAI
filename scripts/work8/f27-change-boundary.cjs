'use strict';
const fs=require('node:fs'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const baseline='b3c775c676f35fa5a8009bde7384839997116b16';
const allowed=new Set(['backend/src/validation/tests/work8-joined-assurance.test.ts','scripts/work8/f27-outer-controller.cjs','scripts/work8/f27-external-oracle.cjs','scripts/work8/f27-change-boundary.cjs','.github/workflows/pillow-runtime-repair-ci.yml','scripts/work8/tests/f27-external-oracle.test.cjs','scripts/work8/tests/f27-sqlite-boundary.test.cjs','scripts/work8/tests/f27-fixture.cjs','scripts/work8/tests/f27-change-boundary.test.cjs']);
function mayReuse(paths,workflowDigest){return Array.isArray(paths)&&paths.length>0&&paths.every(p=>allowed.has(p))&&workflowDigest==='c54b36e473a600b4c5b80942007879ed9bc8897412e74d81c6f1bb5eb7c58f25';}
module.exports={mayReuse};
if(require.main===module){let reuse=false;try{const paths=execFileSync('git',['diff','--name-only','-z',baseline,'HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean);const digest=createHash('sha256').update(fs.readFileSync('.github/workflows/pillow-runtime-repair-ci.yml')).digest('hex');reuse=mayReuse(paths,digest);}catch{}console.log('run_f29='+String(!reuse));console.log('retained_source='+baseline);console.log('retained_run=38338899372');}
