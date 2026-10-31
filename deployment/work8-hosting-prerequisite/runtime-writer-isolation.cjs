'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const fail=()=>{throw Error('WRITER_ISOLATION_ATTESTATION_REFUSED');};
function status(pid='self') {
 const value=fs.readFileSync(`/proc/${pid}/status`,'utf8');
 const field=name=>value.match(new RegExp('^'+name+':\\s+(.+)$','m'))?.[1].trim();
 const filters=Number(field('Seccomp_filters'));
 if(!Number.isSafeInteger(filters)||filters<0)fail();
 return {filters,mode:field('Seccomp'),noNewPrivileges:field('NoNewPrivs'),effectiveCapabilities:field('CapEff')};
}
function protectedFile(file,operatorUid){
 if(typeof file!=='string'||!/^\/[A-Za-z0-9_./-]+$/.test(file)||fs.realpathSync(file)!==file)fail();
 const s=fs.lstatSync(file);if(!s.isFile()||s.nlink!==1)fail();
 let at=file;for(;;){const st=fs.lstatSync(at);if(st.uid!==operatorUid||(st.mode&0o022)!==0)fail();const parent=path.dirname(at);if(parent===at)break;at=parent;}
 return s;
}
/** The build/release supplies the expected native artifact digest. The controller
 * must append environment LAST after an operator-owned role allowlist; runtime
 * requests may never choose the library, digest, or launch environment. */
function prepareWriterIsolation({library,sha256,operatorUid=process.getuid()}){
 if(!/^[a-f0-9]{64}$/.test(sha256||''))fail();
 const identity=protectedFile(library,operatorUid);
 if(crypto.createHash('sha256').update(fs.readFileSync(library)).digest('hex')!==sha256)fail();
 const baseline=status();
 const device=BigInt(identity.dev);
 const major=Number(((device&0xfff00n)>>8n)|((device&0xfffff00000000000n)>>32n));
 const minor=Number((device&0xffn)|((device&0xffffff00000n)>>12n));
 return Object.freeze({
  environment:Object.freeze({LD_PRELOAD:library}),
  identity:Object.freeze({library,sha256,device:identity.dev,inode:identity.ino,parentFilters:baseline.filters}),
  verify(pid){
   if(!Number.isSafeInteger(pid)||pid<1)fail();
   const now=protectedFile(library,operatorUid);if(now.dev!==identity.dev||now.ino!==identity.ino||crypto.createHash('sha256').update(fs.readFileSync(library)).digest('hex')!==sha256)fail();
   const child=status(pid);
   // LD_PRELOAD alone is not evidence: the loader can warn and ignore it.
   // Require the immutable mapped image AND exactly one inherited new filter.
   if(child.mode!=='2'||child.noNewPrivileges!=='1'||child.filters!==baseline.filters+1||!/^0+$/.test(child.effectiveCapabilities||''))fail();
   const maps=fs.readFileSync(`/proc/${pid}/maps`,'utf8').split('\n');
   if(!maps.some(line=>{const fields=line.trim().split(/\s+/);const dev=fields[3]?.split(':');return dev?.length===2&&parseInt(dev[0],16)===major&&parseInt(dev[1],16)===minor&&fields[4]===String(identity.ino)&&fields.slice(5).join(' ')===library;}))fail();
   const entries=fs.readFileSync(`/proc/${pid}/environ`,'utf8').split('\0').filter(Boolean);
   if(entries.filter(x=>x.startsWith('LD_PRELOAD=')).join('')!=='LD_PRELOAD='+library||entries.some(x=>x.startsWith('LD_AUDIT=')||x.startsWith('NODE_PATH=')||x.startsWith('NODE_OPTIONS=')))fail();
   return {nativeSha256:sha256,seccompFilters:child.filters,noNewPrivileges:true,processCreation:'DENIED_EXCEPT_SAME_TGID_THREADS',processGroupEscape:'DENIED'};
  }
 });
}
module.exports={prepareWriterIsolation};
