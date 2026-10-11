import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {productionFinance,retainProductionFinance} from '../../finance/financial-centre.js';
test('last drained app closes financial WAL without creating unused state or losing entries',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'finance-shutdown-')),prior=process.env.RAILWAY_VOLUME_MOUNT_PATH;
 process.env.RAILWAY_VOLUME_MOUNT_PATH=root;
 const file=path.join(root,'finance/evidence.sqlite');
 try{
  const unused=retainProductionFinance();unused();unused();assert.equal(fs.existsSync(file),false);
  const first=retainProductionFinance(),second=retainProductionFinance();
  const centre=productionFinance();
  centre.append('test','owner',{id:'provider',type:'provider',data:{id:'railway',name:'Railway',category:'TECHNOLOGY',commissioned:'NO',mandatory:false,billingAccess:'MANUAL',note:'Isolated shutdown examination'}});
  const before=centre.entries('test');
  first();first();assert.deepEqual(productionFinance().entries('test'),before,'other app still owns the journal');
  second();second();
  for(const suffix of ['-wal','-shm','-journal'])assert.equal(fs.existsSync(file+suffix),false,'closed store has no active sidecar');
  const reopened=retainProductionFinance();assert.deepEqual(productionFinance().entries('test'),before);reopened();
 }finally{if(prior===undefined)delete process.env.RAILWAY_VOLUME_MOUNT_PATH;else process.env.RAILWAY_VOLUME_MOUNT_PATH=prior;fs.rmSync(root,{recursive:true,force:true});}
});
