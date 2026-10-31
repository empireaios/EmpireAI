import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const policy=JSON.parse(fs.readFileSync(new URL('./package-exclusions.json',import.meta.url),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function verifyRetainedSqlJs(packageRoot){
 const require=createRequire(path.join(packageRoot,'package.json'));
 const entry=require.resolve('sql.js');
 assert.equal(path.relative(packageRoot,entry),policy.defaultEntry);
 for(const [relative,digest] of Object.entries(policy.preserve))assert.equal(sha(fs.readFileSync(path.join(packageRoot,relative))),digest);
 assert.equal(sha(fs.readFileSync(path.join(packageRoot,'package.json'))),policy.packageJsonSha256);
 for(const item of policy.remove)assert.equal(fs.existsSync(path.join(packageRoot,'dist',path.basename(item.path))),false);
 const initSqlJs=require('sql.js');
 const SQL=await initSqlJs({locateFile:file=>path.join(packageRoot,'dist',file)});
 let original,restored;
 try{
  original=new SQL.Database();original.run('CREATE TABLE work8_packaging_probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');original.run('INSERT INTO work8_packaging_probe VALUES (?,?)',[1,'SYNTHETIC_PACKAGING_ONLY']);
  assert.equal(original.exec('SELECT count(*) AS total FROM work8_packaging_probe')[0].values[0][0],1);
  const bytes=original.export();restored=new SQL.Database(bytes);
  assert.deepEqual(restored.exec('SELECT id,value FROM work8_packaging_probe')[0].values,[[1,'SYNTHETIC_PACKAGING_ONLY']]);
  return {schema:'work8-v23-retained-sqljs-smoke-v1',status:'PASS',nodeVersion:process.version,resolvedRelative:path.relative(packageRoot,entry),sourcePackageVersion:policy.packageVersion,exactRetainedFileHashesVerified:true,removedVariantsAbsent:true,createInsertSelect:true,exportReloadReadback:true,syntheticRowCount:1,exportedBytes:bytes.length,exportedSha256:sha(bytes),databaseBytesRetained:false,applicationAcceptance:false,providerAccess:false};
 }finally{restored?.close();original?.close();}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 let receipt;
 try{assert.equal(process.version,'v22.23.2');assert.equal(process.argv.length,4);receipt=await verifyRetainedSqlJs(path.resolve(process.argv[2]));}
 catch{receipt={schema:'work8-v23-retained-sqljs-smoke-v1',status:'FAIL',nodeVersion:process.version,code:'RETAINED_SQLJS_SMOKE_FAILED',rawExceptionRecorded:false};process.exitCode=1;}
 const serialized=JSON.stringify(receipt,null,2)+'\n';
 if(process.argv[3]==='-')process.stdout.write(serialized);else fs.writeFileSync(process.argv[3],serialized);
}
