import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const allowed=new Set(['runtime.sqlite','runtime.sqlite.initialized','runtime.sqlite-wal','runtime.sqlite-shm']);
const hash=b=>createHash('sha256').update(b).digest('hex');
function identity(s){return Object.fromEntries(['dev','ino','mode','uid','gid','nlink','size','mtimeNs','ctimeNs'].map(k=>[k,String(s[k])]));}
function directory(dir,uid){assert.equal(path.resolve(dir),dir);assert.equal(fs.realpathSync(dir),dir,'COPY_PARENT_SYMLINK');const st=fs.lstatSync(dir,{bigint:true});assert.ok(st.isDirectory()&&!st.isSymbolicLink());assert.equal(Number(st.uid),uid,'COPY_DIRECTORY_OWNER');assert.equal(Number(st.mode&0o777n),0o700,'COPY_DIRECTORY_MODE');return identity(st);}
function sourceFile(file,uid){
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{const st=fs.fstatSync(fd,{bigint:true});assert.ok(st.isFile()&&st.nlink===1n,'COPY_REGULAR_SINGLE_LINK_REQUIRED');assert.equal(Number(st.uid),uid,'COPY_SOURCE_OWNER');assert.equal(Number(st.mode&0o777n),0o600,'COPY_SOURCE_MODE');assert.ok(st.size<=67108864n,'COPY_FILE_BYTE_BOUND');const bytes=fs.readFileSync(fd);assert.deepEqual(identity(fs.fstatSync(fd,{bigint:true})),identity(st),'COPY_SOURCE_CHANGED_DURING_READ');assert.deepEqual(identity(fs.lstatSync(file,{bigint:true})),identity(st),'COPY_SOURCE_REPLACED_DURING_READ');return {identity:identity(st),sha256:hash(bytes),bytes};}finally{fs.closeSync(fd);}
}
export function inventoryCommerce(dir,uid){
 directory(dir,uid);const names=fs.readdirSync(dir).sort();assert.ok(names.includes('runtime.sqlite')&&names.includes('runtime.sqlite.initialized'),'COPY_DATABASE_AND_MARKER_REQUIRED');assert.ok(names.every(n=>allowed.has(n)),'COPY_UNEXPECTED_FILE');let total=0;const files={};for(const name of names){const item=sourceFile(path.join(dir,name),uid);total+=item.bytes.length;assert.ok(total<=134217728,'COPY_TOTAL_BYTE_BOUND');if(name==='runtime.sqlite.initialized')assert.equal(item.bytes.toString(),'Governed commerce evidence; never reset','COPY_MARKER_CONTENT');files[name]={identity:item.identity,bytes:item.bytes.length,sha256:item.sha256};}return {directoryIdentity:directory(dir,uid),files};
}
export function assertOperatorOwnedInactiveSQLite(file){
 assert.equal(fs.realpathSync(file),file,'REPLAY_COPY_SYMLINK');const st=fs.lstatSync(file);assert.ok(st.isFile()&&!st.isSymbolicLink()&&st.nlink===1,'REPLAY_COPY_REGULAR_SINGLE_LINK');assert.equal(st.uid,process.getuid(),'REPLAY_REQUIRES_OPERATOR_OWNED_INACTIVE_COPY');assert.equal(st.mode&0o777,0o600,'REPLAY_COPY_MODE');
}
/** The caller must independently prove complete writer drain before/throughout
 * this exact family copy. No SQLite connection is opened on the original.
 * Native SQLite constructors/transactions may write only the disposable copy. */
export async function withDrainedCommerceCopy({sourceDirectory,destinationDirectory,expectedSourceUid,assertDrained},inspect){
 assert.equal(typeof assertDrained,'function');assert.equal(typeof inspect,'function');assert.ok(Number.isSafeInteger(expectedSourceUid));
 assertDrained();const before=inventoryCommerce(sourceDirectory,expectedSourceUid),operator=process.getuid();
 directory(path.dirname(destinationDirectory),operator);assert.equal(path.resolve(destinationDirectory),destinationDirectory);assert.ok(!fs.existsSync(destinationDirectory),'COPY_DESTINATION_MUST_BE_FRESH');assert.ok(!destinationDirectory.startsWith(sourceDirectory+'/')&&!sourceDirectory.startsWith(destinationDirectory+'/'),'COPY_DESTINATION_OVERLAP');fs.mkdirSync(destinationDirectory,{mode:0o700});
 let originalError,cleanupError,value,copyBefore;const copied={};
 try{
  directory(destinationDirectory,operator);
  for(const [name,pinned]of Object.entries(before.files)){
   assertDrained();const item=sourceFile(path.join(sourceDirectory,name),expectedSourceUid);assert.deepEqual({identity:item.identity,bytes:item.bytes.length,sha256:item.sha256},pinned,'COPY_SOURCE_CHANGED_BEFORE_COPY');
   const to=path.join(destinationDirectory,name),fd=fs.openSync(to,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,item.bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   const out=sourceFile(to,operator);assert.equal(out.sha256,pinned.sha256);assert.equal(out.bytes.length,pinned.bytes);copied[name]={bytes:out.bytes.length,sha256:out.sha256,uid:operator,mode:0o600};
  }
  assert.deepEqual(Object.keys(copied).sort(),Object.keys(before.files).sort(),'COPY_SQLITE_FAMILY_INCOMPLETE');assertDrained();assert.deepEqual(inventoryCommerce(sourceDirectory,expectedSourceUid),before,'COPY_SOURCE_CHANGED_DURING_COPY');
  copyBefore=inventoryCommerce(destinationDirectory,operator);value=await inspect(path.join(destinationDirectory,'runtime.sqlite'),{source:before,copied});
 }catch(error){originalError=error;}
 finally{
  try{assertDrained();assert.deepEqual(inventoryCommerce(sourceDirectory,expectedSourceUid),before,'COPY_SOURCE_CHANGED_DURING_INSPECTION');}catch(error){cleanupError=error;}
  try{directory(destinationDirectory,operator);for(const name of fs.readdirSync(destinationDirectory)){assert.ok(allowed.has(name),'COPY_CLEANUP_UNEXPECTED_FILE');const f=path.join(destinationDirectory,name),s=fs.lstatSync(f);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.uid===operator,'COPY_CLEANUP_UNSAFE_FILE');fs.unlinkSync(f);}fs.rmdirSync(destinationDirectory);assert.ok(!fs.existsSync(destinationDirectory));}catch(error){cleanupError??=error;}
 }
 if(originalError){if(cleanupError)originalError.copyCleanupError=String(cleanupError);throw originalError;}if(cleanupError)throw cleanupError;
 return {value,preservation:{sourceBefore:before,sourceAfter:inventoryCommerce(sourceDirectory,expectedSourceUid),copyBefore,copied,originalSQLiteNeverOpened:true,originalExactBytesIdentityOwnershipModeUnchanged:true,copyRemoved:true,sourceWriterDrainChecked:true}};
}
