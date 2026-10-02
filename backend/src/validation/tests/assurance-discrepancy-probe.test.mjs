import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runSafeDiscrepancyProbe} from '../../assurance/safe-discrepancy-probe.mjs';
test('isolated probe preserves discrepancies across a new process and never overwrites its receipt',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-probe-'));fs.mkdirSync(path.join(root,'commissioning'));
 try{const proof=await runSafeDiscrepancyProbe(root);assert.equal(proof.checks.reopenedInNewProcess,true);assert.equal(proof.productionRecordsMutated,0);assert.equal(await runSafeDiscrepancyProbe(root),undefined);}finally{fs.rmSync(root,{recursive:true,force:true});}
});
