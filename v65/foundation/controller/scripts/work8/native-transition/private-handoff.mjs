// Harness-only private file exchange. No application policy or capability change.
// Actual different-owner handoff ends with fchown; subsequent fstat/close are read-only.
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';

const pending=new WeakMap();
const sha=b=>createHash('sha256').update(b).digest('hex');
const codes=new Set(['EACCES','EPERM','ENOENT','EEXIST','EROFS','ENOSPC','EDQUOT','EIO','EINVAL','ELOOP','ENOTDIR','EBADF','EMFILE','ENFILE','ETIMEDOUT','EXDEV','EOPNOTSUPP','ERR_ASSERTION','ERR_SQLITE_ERROR','HANDOFF_CONTRACT']);
const check=(value,rule)=>{if(!value){const e=new Error('PRIVATE_HANDOFF_CONTRACT');e.code='HANDOFF_CONTRACT';e.rule=rule;throw e;}};
const mode=s=>(s.mode&0o7777).toString(8).padStart(4,'0');
function statMeta(s){return {uid:s.uid,gid:s.gid,mode:mode(s),bytes:s.size,device:s.dev,inode:s.ino,links:s.nlink,regularFile:s.isFile(),directory:s.isDirectory(),symlink:s.isSymbolicLink()};}
function metadata(file){try{return {present:true,...statMeta(fs.lstatSync(file))};}catch(e){return {present:false,errno:codes.has(e?.code)?e.code:'OTHER_CODE_REDACTED'};}}
export function processSecurityIdentity(){
 let status='';try{status=fs.readFileSync('/proc/self/status','utf8');}catch{}
 const value=k=>status.match(new RegExp('^'+k+':\\s*(\\S+)','m'))?.[1]??null;
 const capabilities=Object.fromEntries(['CapInh','CapPrm','CapEff','CapBnd','CapAmb'].map(k=>[k,/^[a-fA-F0-9]{16}$/.test(value(k)??'')?value(k):null]));
 const groups=process.getgroups?.()??[];
 return {pid:process.pid,effectiveUid:process.geteuid?.()??null,effectiveGid:process.getegid?.()??null,realUid:process.getuid?.()??null,realGid:process.getgid?.()??null,supplementaryGroups:groups.slice(0,128),supplementaryGroupCount:groups.length,capabilities,noNewPrivileges:value('NoNewPrivs')==='1'?true:value('NoNewPrivs')==='0'?false:null,nodeVersion:process.version};
}
function mountMetadata(file){
 try{
  const rows=fs.readFileSync('/proc/self/mountinfo','utf8').trim().split('\n').map(line=>{const [a,b]=line.split(' - ');const x=a.split(' '),y=b?.split(' ');return {point:x[4],options:x[5]?.split(',')??[],type:y?.[0],superOptions:y?.[2]?.split(',')??[]};});
  const row=rows.filter(r=>file===r.point||file.startsWith(r.point==='/'?'/':r.point+'/')).sort((a,b)=>b.point.length-a.point.length)[0];
  return row?{mountPoint:row.point==='/'?'/':row.point===path.dirname(file)?'PRIVATE_PARENT_MOUNT':'ENCLOSING_MOUNT',readWrite:row.options.includes('rw'),readOnly:row.options.includes('ro'),noexec:row.options.includes('noexec'),nosuid:row.options.includes('nosuid'),nodev:row.options.includes('nodev'),filesystem:/^[A-Za-z0-9_.-]{1,32}$/.test(row.type??'')?row.type:null}:null;
 }catch{return null;}
}
function traversal(directory){
 const parts=path.resolve(directory).split(path.sep).filter(Boolean),out=[];let current=path.sep;
 for(const [i,part]of parts.entries()){
  current=path.join(current,part);const m=metadata(current);let allowed=false,errno=null;
  try{fs.accessSync(current,fs.constants.X_OK);allowed=true;}catch(e){errno=codes.has(e?.code)?e.code:'OTHER_CODE_REDACTED';}
  out.push({depth:i+1,kind:i===parts.length-1?'PRIVATE_PARENT':'ANCESTOR',...m,writerTraversalAllowed:allowed,...(errno?{errno}:{})});
 }
 return out.slice(-16);
}
export function safeHandoffFailure(error,{operation='UNCLASSIFIED_OPERATION',target,label='PRIVATE_CONTROL_FILE'}={}){
 if(error?.safeHandoff)return error.safeHandoff;
 target=typeof target==='string'&&path.isAbsolute(target)?target:null;
 const errno=typeof error?.code==='string'?(codes.has(error.code)?error.code:'OTHER_CODE_REDACTED'):null;
 return {schema:'WORK8_PRIVATE_HANDOFF_FAILURE_V1',status:'FAIL',operation:/^[A-Z_]{1,64}$/.test(operation)?operation:'UNCLASSIFIED_OPERATION',errno,numericErrno:Number.isSafeInteger(error?.errno)?error.errno:null,rule:/^[A-Z0-9_]{1,80}$/.test(error?.rule??'')?error.rule:null,classification:/^[A-Z0-9_:-]{1,96}$/.test(label)?label:'PRIVATE_CONTROL_FILE',identity:processSecurityIdentity(),target:target?metadata(target):null,parent:target?metadata(path.dirname(target)):null,traversal:target?traversal(path.dirname(target)):[],mount:target?mountMetadata(target):null,rawPath:false,rawContents:false,rawErrorMessage:false};
}
function fail(error,state){
 const safe=safeHandoffFailure(error,{operation:state.operation,target:state.target,label:state.label});
 safe.pendingFile=state.pendingPath?metadata(state.pendingPath):null;
 safe.completedOperations=state.operations.slice(-24);safe.expectedReader={uid:state.readerUid,gid:state.readerGid,contract:state.ownerContract};
 if(state.fd!==null){try{safe.descriptor=statMeta(fs.fstatSync(state.fd));}catch{}try{fs.closeSync(state.fd);}catch{}state.fd=null;}
 const e=new Error('PRIVATE_HANDOFF_FAILED');e.code='PRIVATE_HANDOFF_FAILED';e.safeHandoff=safe;return e;
}
function op(state,name,fn){state.operation=name;const result=fn();state.operations.push(name);return result;}
function ownerContract(directory,readerUid,readerGid,contract){
 const parent=fs.lstatSync(directory);check(parent.isDirectory()&&!parent.isSymbolicLink(),'PRIVATE_PARENT_REGULAR_DIRECTORY');check(fs.realpathSync(directory)===directory,'PRIVATE_PARENT_NO_SYMLINK');check((parent.mode&0o7777)===0o700,'PRIVATE_PARENT_MODE_0700');
 check(Number.isSafeInteger(readerUid)&&readerUid>=0&&readerUid<=4294967294&&Number.isSafeInteger(readerGid)&&readerGid>=0&&readerGid<=4294967294,'NUMERIC_READER_IDENTITY');
 check(['CONTROL_READER','WRITER_ONLY'].includes(contract),'REVIEWED_OWNER_CONTRACT');
 if(contract==='CONTROL_READER')check(readerUid===parent.uid&&readerGid===parent.gid,'READER_BOUND_TO_PRIVATE_PARENT_OWNER');
 else check(readerUid===process.geteuid()&&readerGid===process.getegid(),'ROOT_PRIVATE_BASELINE_OWNER');
 return parent;
}
function digestDescriptor(fd,bytes){const value=Buffer.alloc(bytes);let offset=0;while(offset<bytes){const n=fs.readSync(fd,value,offset,bytes-offset,offset);check(n>0,'PRIVATE_CONTENT_READBACK_COMPLETE');offset+=n;}return sha(value);}
export function privateControlOwner(directory='/control'){
 const s=fs.lstatSync(directory);check(s.isDirectory()&&!s.isSymbolicLink()&&(s.mode&0o7777)===0o700,'PRIVATE_CONTROL_PARENT_CONTRACT');return {uid:s.uid,gid:s.gid};
}
export function preparePrivateHandoff({target,content,readerUid,readerGid,label='PRIVATE_CONTROL_FILE',maxBytes=1048576,ownerContract:contract='CONTROL_READER'}){
 const state={operation:'VALIDATE_PRIVATE_ARGUMENTS',operations:[],fd:null,target,readerUid,readerGid,label,ownerContract:contract,pendingPath:null};
 try{
  check(typeof target==='string'&&path.isAbsolute(target)&&path.normalize(target)===target,'PRIVATE_TARGET_ABSOLUTE_NORMALIZED');
  check(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,150}$/.test(path.basename(target)),'PRIVATE_STATIC_BASENAME');
  check(/^[A-Z0-9_:-]{1,96}$/.test(label),'SAFE_PRIVATE_FILE_CLASSIFICATION');
  check(Number.isSafeInteger(maxBytes)&&maxBytes>0&&maxBytes<=1048576,'PRIVATE_BYTE_BOUND_CONFIG');
  const bytes=Buffer.isBuffer(content)?content:Buffer.from(content,'utf8');check(bytes.length<=maxBytes,'PRIVATE_CONTENT_BYTE_BOUND');
  state.directory=path.dirname(target);state.parent=op(state,'VERIFY_PRIVATE_PARENT',()=>ownerContract(state.directory,readerUid,readerGid,contract));
  state.writer=processSecurityIdentity();state.contentSha256=sha(bytes);state.bytes=bytes.length;
  op(state,'VERIFY_TARGET_ABSENT',()=>{check(!fs.existsSync(target),'PRIVATE_TARGET_ALREADY_EXISTS');try{fs.lstatSync(target);check(false,'PRIVATE_TARGET_ALREADY_EXISTS');}catch(e){if(e?.code!=='ENOENT')throw e;}});
  state.pendingPath=path.join(state.directory,'.'+path.basename(target)+'.pending-'+process.pid+'-'+randomBytes(8).toString('hex'));
  state.fd=op(state,'CREATE_PRIVATE_0600',()=>fs.openSync(state.pendingPath,fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW|fs.constants.O_RDWR,0o600));
  op(state,'SET_PRIVATE_MODE_WHILE_OWNED',()=>fs.fchmodSync(state.fd,0o600));
  op(state,'VERIFY_WRITER_OWNERSHIP',()=>{const s=fs.fstatSync(state.fd);check(s.isFile()&&s.nlink===1&&s.uid===state.writer.effectiveUid&&s.gid===state.writer.effectiveGid&&(s.mode&0o7777)===0o600,'PRIVATE_CREATED_INODE_CONTRACT');state.inode={device:s.dev,inode:s.ino};});
  op(state,'WRITE_PRIVATE_CONTENT',()=>{let offset=0;while(offset<bytes.length){const n=fs.writeSync(state.fd,bytes,offset,bytes.length-offset,offset);check(n>0,'PRIVATE_WRITE_COMPLETE');offset+=n;}});
  op(state,'SYNC_PRIVATE_CONTENT_WHILE_OWNED',()=>fs.fsyncSync(state.fd));
  op(state,'VERIFY_PRIVATE_CONTENT_WHILE_OWNED',()=>{const s=fs.fstatSync(state.fd);check(s.size===bytes.length&&s.nlink===1&&s.uid===state.writer.effectiveUid&&(s.mode&0o7777)===0o600,'PRIVATE_PREPARED_INODE_CONTRACT');check(digestDescriptor(state.fd,bytes.length)===state.contentSha256,'PRIVATE_PREPARED_CHECKSUM');});
  const preparedReceipt={schema:'WORK8_PRIVATE_HANDOFF_PREPARED_V1',status:'PREPARED_NOT_TRANSFERRED',classification:label,writer:state.writer,reader:{uid:readerUid,gid:readerGid,contract},parent:statMeta(state.parent),pendingFile:statMeta(fs.fstatSync(state.fd)),contentBytes:state.bytes,contentSha256:state.contentSha256,operations:state.operations.slice(),mount:mountMetadata(target),traversal:traversal(state.directory),rawContents:false,finalPathPublished:false};
  const token=Object.freeze({pendingPath:state.pendingPath,target,receipt:Object.freeze(preparedReceipt)});pending.set(token,state);return token;
 }catch(e){throw fail(e,state);}
}
export function completePrivateHandoff(token){
 const state=pending.get(token);check(state&&state.fd!==null,'LIVE_PRIVATE_PREPARATION_REQUIRED');
 try{
  op(state,'VERIFY_PRIVATE_IDENTITY_BEFORE_TRANSFER',()=>{const s=fs.fstatSync(state.fd),p=fs.lstatSync(state.pendingPath);check(s.dev===state.inode.device&&s.ino===state.inode.inode&&s.nlink===1&&s.uid===state.writer.effectiveUid&&s.gid===state.writer.effectiveGid&&(s.mode&0o7777)===0o600&&s.size===state.bytes,'PRIVATE_PRETRANSFER_DESCRIPTOR');check(p.dev===s.dev&&p.ino===s.ino&&!p.isSymbolicLink(),'PRIVATE_PRETRANSFER_PATH');check(digestDescriptor(state.fd,state.bytes)===state.contentSha256,'PRIVATE_PRETRANSFER_CHECKSUM');ownerContract(state.directory,state.readerUid,state.readerGid,state.ownerContract);check(!fs.existsSync(state.target),'PRIVATE_TARGET_ALREADY_EXISTS');});
  op(state,'PUBLISH_COMPLETE_CONTENT_WHILE_OWNED',()=>fs.renameSync(state.pendingPath,state.target));
  op(state,'SYNC_PRIVATE_PARENT_WHILE_OWNED',()=>{const fd=fs.openSync(state.directory,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}});
  const transfer=state.readerUid!==state.writer.effectiveUid||state.readerGid!==state.writer.effectiveGid;
  if(transfer)op(state,'TRANSFER_OWNERSHIP_FINAL_MUTATION',()=>fs.fchownSync(state.fd,state.readerUid,state.readerGid));
  const final=op(state,'VERIFY_COMPLETED_METADATA_READ_ONLY',()=>{const s=fs.fstatSync(state.fd),p=fs.lstatSync(state.target);check(s.isFile()&&s.nlink===1&&s.uid===state.readerUid&&s.gid===state.readerGid&&(s.mode&0o7777)===0o600&&s.size===state.bytes,'PRIVATE_POSTTRANSFER_METADATA');check(p.dev===s.dev&&p.ino===s.ino&&!p.isSymbolicLink(),'PRIVATE_POSTTRANSFER_PATH');return statMeta(s);});
  op(state,'CLOSE_PRIVATE_DESCRIPTOR',()=>fs.closeSync(state.fd));state.fd=null;pending.delete(token);
  return {schema:'WORK8_PRIVATE_HANDOFF_V1',status:'PASS_PRIVATE_HANDOFF',classification:state.label,writer:state.writer,reader:{uid:state.readerUid,gid:state.readerGid,contract:state.ownerContract},parent:statMeta(state.parent),file:final,contentBytes:state.bytes,contentSha256:state.contentSha256,ownershipTransferPerformed:transfer,ownershipTransferWasFinalFileMutation:transfer,postTransferContentOrPermissionMutation:false,parentSyncedBeforeOwnershipTransfer:true,postTransferOwnershipDurabilityFlushClaimed:false,operations:state.operations,mount:mountMetadata(state.target),rawContents:false};
 }catch(e){pending.delete(token);throw fail(e,state);}
}
export function abandonPrivateHandoff(token){const s=pending.get(token);if(s?.fd!==null&&s?.fd!==undefined){try{fs.closeSync(s.fd);}finally{s.fd=null;pending.delete(token);}}}
export function writePrivateHandoff(options){return completePrivateHandoff(preparePrivateHandoff(options));}
export function privateReadiness(target,{ownerUid,ownerGid,ownerContract:contract='CONTROL_READER'}={}){
 try{const parent=fs.lstatSync(path.dirname(target));if(ownerUid===undefined)ownerUid=parent.uid;if(ownerGid===undefined)ownerGid=parent.gid;ownerContract(path.dirname(target),ownerUid,ownerGid,contract);const s=fs.lstatSync(target);return s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&(s.mode&0o7777)===0o600&&s.uid===ownerUid&&s.gid===ownerGid&&s.size<=1048576;}catch(e){if(e?.code==='ENOENT')return false;throw e;}
}
export function readPrivateHandoff({target,expectedSha256,expectedBytes,ownerUid,ownerGid,label='PRIVATE_CONTROL_FILE',ownerContract:contract='CONTROL_READER'}){
 let fd=null,operation='READER_VERIFY_PRIVATE_PARENT';
 try{
  check(typeof target==='string'&&path.isAbsolute(target)&&path.normalize(target)===target,'PRIVATE_TARGET_ABSOLUTE_NORMALIZED');
  ownerContract(path.dirname(target),ownerUid,ownerGid,contract);
  operation='READER_OPEN_PRIVATE_FILE';
  fd=fs.openSync(target,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);operation='READER_VERIFY_PRIVATE_METADATA';
  const s=fs.fstatSync(fd),p=fs.lstatSync(target);check(s.isFile()&&s.nlink===1&&(s.mode&0o7777)===0o600&&s.uid===ownerUid&&s.gid===ownerGid,'READER_PRIVATE_INODE_CONTRACT');check(!p.isSymbolicLink()&&p.dev===s.dev&&p.ino===s.ino,'READER_PRIVATE_PATH_IDENTITY');
  check(Number.isSafeInteger(expectedBytes)&&expectedBytes>=0&&expectedBytes<=1048576&&s.size===expectedBytes&&/^[a-f0-9]{64}$/.test(expectedSha256),'READER_PRIVATE_EXPECTATION');
  operation='READER_VERIFY_EXACT_CHECKSUM';const digest=digestDescriptor(fd,expectedBytes);check(digest===expectedSha256,'READER_PRIVATE_CHECKSUM');
  operation='READER_CLOSE_PRIVATE_DESCRIPTOR';fs.closeSync(fd);fd=null;
  return {schema:'WORK8_PRIVATE_HANDOFF_READER_V1',status:'PASS_PRIVATE_READER_CHECKSUM',classification:label,identity:processSecurityIdentity(),file:statMeta(s),expectedOwner:{uid:ownerUid,gid:ownerGid,contract},parent:metadata(path.dirname(target)),traversal:traversal(path.dirname(target)),mount:mountMetadata(target),bytes:expectedBytes,contentSha256:digest,rawContents:false};
 }catch(e){if(fd!==null)try{fs.closeSync(fd);}catch{}const safe=safeHandoffFailure(e,{operation,target,label});const error=new Error('PRIVATE_READER_FAILED');error.code='PRIVATE_READER_FAILED';error.safeHandoff=safe;throw error;}
}
