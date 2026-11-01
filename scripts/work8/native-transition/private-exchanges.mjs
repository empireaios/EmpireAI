// Exact harness exchange classes; application files and policies are outside this contract.
import fs from 'node:fs';
import {privateControlOwner,writePrivateHandoff,safeHandoffFailure} from './private-handoff.mjs';
export const transferredFiles=['normal-persistence.json','returned-persistence.json','replayed-persistence.json','expected-recovery-commerce.json'];
export const browserFiles=['expected-commerce.json','returned-snapshot-private.json','replayed-snapshot-private.json','normal-observed.json','normal-complete.json','recovery-complete.json','returned-observed.json','replayed-observed.json','browser-complete.json','browser-first-failure.json'];
export const writerOnlyFiles=['whole-app-baseline.json','runtime-ready.json','runtime-drained.json'];
export const hostFiles=['component-identities.json','normal-readback-ready.json','recovery-ready.json','return-ready.json','returned-readback-ready.json','replayed-readback-ready.json','stop-runtime.json','readback-complete.json'];
export function exchangeOptions(name,content,control='/control'){
 const writerOnly=writerOnlyFiles.includes(name);
 if(!writerOnly&&!transferredFiles.includes(name)&&!browserFiles.includes(name))throw Error('UNREVIEWED_PRIVATE_EXCHANGE');
 const reader=writerOnly?{uid:process.geteuid(),gid:process.getegid()}:privateControlOwner(control);
 return {target:control+'/'+name,content,readerUid:reader.uid,readerGid:reader.gid,ownerContract:writerOnly?'WRITER_ONLY':'CONTROL_READER',label:name.toUpperCase().replaceAll(/[^A-Z0-9]/g,'_')};
}
export function writeControlPrivate(name,content,control='/control',evidence='/evidence'){
 try{return writePrivateHandoff(exchangeOptions(name,content,control));}
 catch(error){
  const receipt=safeHandoffFailure(error,{operation:'PRIVATE_EXCHANGE_WRITE',target:control+'/'+name});
  try{fs.writeFileSync(evidence+'/private-handoff-first-failure.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx',mode:0o644});}catch{}
  throw error;
 }
}
