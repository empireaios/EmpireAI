import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {collectDurableOmissions} from '../../assurance/live-sources.mjs';
import {reconcileSnapshot} from '../../assurance/independent-assurance.mjs';

test('independent durable sources detect missing delivery without modifying sources',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'assurance-source-')),filename=path.join(dir,'reasoning.sqlite'),now=1000000;
  const db=new DatabaseSync(filename);db.exec('CREATE TABLE transcripts(workspace TEXT,session TEXT,turns TEXT)');
  db.prepare('INSERT INTO transcripts VALUES(?,?,?)').run('ws_empire_1','s',JSON.stringify([]));db.close();
  const before=fs.readFileSync(filename);
  const row={requestId:'r',sessionId:'s',workspaceId:'ws_empire_1',updatedAt:new Date(now-60000).toISOString(),status:'COMPLETED',finalResult:{message:'Persisted reply'}};
  const redis={scan:async()=>['0',['pillow:chatreq:v2:r']],get:async()=>JSON.stringify(row)};
  try{
    const snap=await collectDurableOmissions({redis,filename,now});
    const verdict=reconcileSnapshot(snap,now,120000);
    assert.equal(verdict.status,'FAIL');assert.equal(verdict.missing,1);assert.deepEqual(fs.readFileSync(filename),before);
    await assert.rejects(collectDurableOmissions({redis:{...redis,get:async()=>null},filename,now}));
    row.updatedAt=new Date(now-1000).toISOString();
    assert.deepEqual(await collectDurableOmissions({redis,filename,now}),null);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
