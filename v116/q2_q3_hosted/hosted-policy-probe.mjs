import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ownerWritesRestricted,installOwnerWriteRestriction} from '/app/backend/src/runtime/owner-write-restriction.ts';
import Fastify from '/app/backend/node_modules/fastify/fastify.js';
const root=process.env.V116_TECHNICAL_TEST_ROOT,policy=process.env.EMPIRE_OWNER_WRITE_POLICY;
assert.ok(root?.startsWith('/tmp/v116-')&&policy===path.join(root,'technical-policy.json'));
const payload=JSON.parse(fs.readFileSync(policy,'utf8'));
assert.equal(payload.approvalSha256,'f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3');
const app=Fastify();installOwnerWriteRestriction(app);app.post('/v116/technical-fixture',async()=>({scope:'technical-only'}));
const checks=[];
async function denied(label,file){if(file===undefined)delete process.env.EMPIRE_OWNER_WRITE_POLICY;else process.env.EMPIRE_OWNER_WRITE_POLICY=file;assert.equal(ownerWritesRestricted(),true);assert.equal((await app.inject({method:'POST',url:'/v116/technical-fixture'})).statusCode,423);checks.push(label);}
try{
 await denied('missing-policy');
 const expired=path.join(root,'expired.json');fs.writeFileSync(expired,JSON.stringify({...payload,expiresAt:new Date(Date.now()-1000).toISOString()}),{mode:0o600});await denied('expired-policy',expired);
 const invalid=path.join(root,'invalid.json');fs.writeFileSync(invalid,JSON.stringify({...payload,approvalSha256:'not-a-sha256'}),{mode:0o600});await denied('invalid-audit-reference',invalid);
 const linked=path.join(root,'linked.json');fs.symlinkSync(policy,linked);await denied('symlink-policy',linked);
 process.env.EMPIRE_OWNER_WRITE_POLICY=policy;assert.equal(ownerWritesRestricted(),false);assert.equal((await app.inject({method:'POST',url:'/v116/technical-fixture'})).statusCode,200);checks.push('actual-v116-technical-policy');
 delete process.env.EMPIRE_OWNER_WRITE_POLICY;assert.equal(ownerWritesRestricted(),true);checks.push('removal-restores-restriction');
 console.log(JSON.stringify({pass:true,checks,scope:'technical-test-only',nativeOwnerApproval:false,productionAccess:false}));
}finally{await app.close();process.env.EMPIRE_OWNER_WRITE_POLICY=policy;}
