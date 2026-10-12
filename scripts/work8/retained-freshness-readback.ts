import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {projectWork8Sources} from '../../backend/src/runtime/commerce-runtime/governed/work8-source-projection.js';
import type {Evidence} from '../../backend/src/intelligence/model.js';
const [filename,output]=process.argv.slice(2);assert.ok(filename&&output);assert.equal(fs.realpathSync(filename),filename);assert.ok(path.isAbsolute(output));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');const before=sha(fs.readFileSync(filename));
const now=Date.now(),db=new DatabaseSync(filename,{readOnly:true,allowExtension:false});db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
let evidence:Evidence[];try{evidence=db.prepare("SELECT body FROM objects WHERE workspace='ws_empire_1' AND kind='evidence' ORDER BY id").all().map(r=>JSON.parse(String(r.body)) as Evidence);}finally{db.exec('ROLLBACK');db.close();}
const byId=new Map(evidence.map(e=>[e.id,e]));const sourceIds=evidence.filter(e=>e.provider==='CJ'&&['cj.catalog','cj.detail'].includes(e.capabilityId)).map(e=>e.id);
const projection=projectWork8Sources((w,id)=>w==='ws_empire_1'?byId.get(id)??null:null,'ws_empire_1',sourceIds,now);
assert.ok(sourceIds.length>0);assert.equal(sha(fs.readFileSync(filename)),before);
const receipt={schema:'WORK8_RETAINED_GENUINE_FRESHNESS_READBACK_V1',observedAt:new Date(now).toISOString(),sourceFileSha256:before,sourceUnchanged:true,
 sourceEvidence:evidence.filter(e=>sourceIds.includes(e.id)).map(e=>({id:e.id,digest:e.digest,observedAt:e.observedAt,staleAfter:e.staleAfter})),
 products:projection.products.map(p=>({productId:p.productId,freshness:p.freshness,reasons:p.reasons})),rejected:projection.rejected,
 externalRefresh:false,providerCalls:0,paidInference:0,productionChanged:false,qualifiedBusinessAcceptance:false,
 limitation:'Current re-evaluation of retained genuine evidence only; no new supplier read, replacement generation, Pillow assessment or completed freshness requirement.'};
fs.writeFileSync(output,JSON.stringify(receipt,null,2),{flag:'wx'});console.log(JSON.stringify({sourceRecords:sourceIds.length,products:receipt.products.length,freshness:receipt.products.map(p=>p.freshness),sourceUnchanged:true}));
