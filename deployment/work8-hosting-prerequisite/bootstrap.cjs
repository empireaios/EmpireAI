'use strict';
// A trusted bootstrap reduces the provider's default root capability set before
// the actual operator probe. It cannot add a missing provider capability.
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const receipt={schema:'work8-hosting-prerequisite-v1',status:'NO_GO',applicationStarted:false,productionAccess:false,providerCalls:0,wholeRowsAccepted:[]};
const fail=reason=>{receipt.failure=reason;process.stdout.write(JSON.stringify(receipt)+'\n');process.exit(1);};
if(process.versions.node!=='22.23.2'||process.getuid()!==0)fail('BOOTSTRAP_NODE_OR_OPERATOR_UID');
const fields=fs.readFileSync('/proc/self/status','utf8'),names={CHOWN:0,DAC_OVERRIDE:1,KILL:5,SETGID:6,SETUID:7,SYS_PTRACE:19};
const cap=kind=>BigInt('0x'+fields.match(new RegExp('^'+kind+':\\s*([a-f0-9]+)$','m'))[1]);
const wanted=Object.values(names).reduce((n,b)=>n|(1n<<BigInt(b)),0n);
receipt.providerRequiredCapabilities=Object.fromEntries(Object.entries(names).map(([name,b])=>[name,(cap('CapPrm')&(1n<<BigInt(b)))!==0n&&(cap('CapBnd')&(1n<<BigInt(b)))!==0n]));
receipt.providerSetpcapAvailable=(cap('CapEff')&256n)!==0n;
if(!Object.values(receipt.providerRequiredCapabilities).every(Boolean))fail('REQUIRED_PROVIDER_CAPABILITY_ABSENT');
// setpriv uses CAP_SETPCAP while dropping bounding bits, then exec gives the
// operator precisely the bounded six-capability set, with no privilege gain.
const args=['--bounding-set=-all,+chown,+dac_override,+kill,+setgid,+setuid,+sys_ptrace','--inh-caps=-all','--ambient-caps=-all','--no-new-privs',process.execPath,'/probe/probe.cjs'];
const exact=cap('CapEff')===wanted&&cap('CapPrm')===wanted&&cap('CapBnd')===wanted&&cap('CapInh')===0n&&cap('CapAmb')===0n;
const r=spawnSync('/usr/bin/setpriv',exact?['--no-new-privs',process.execPath,'/probe/probe.cjs']:args,{env:{PATH:'/usr/local/bin:/usr/bin:/bin'},encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:27000,killSignal:'SIGKILL',maxBuffer:4096});
if(r.error||r.signal)fail('BOUNDED_CAPABILITY_BOOTSTRAP_FAILED');
let result;try{result=JSON.parse(r.stdout.trim());}catch{fail('OPERATOR_CAPABILITY_REDUCTION_REFUSED');}
if(result.schema!=='work8-hosting-prerequisite-v1'||!['NO_GO','PASS_PREREQUISITES_ONLY'].includes(result.status))fail('UNRECOGNIZED_PROBE_RECEIPT');
result.providerRequiredCapabilities=receipt.providerRequiredCapabilities;result.providerSetpcapAvailable=receipt.providerSetpcapAvailable;result.capabilityReducer=exact?'UTIL_LINUX_SETPRIV_NO_NEW_PRIVILEGES_ONLY':'UTIL_LINUX_SETPRIV';
result.reducerVersion=fs.readFileSync('/probe/setpriv-version.txt','utf8').trim();result.reducerSha256=fs.readFileSync('/probe/setpriv.sha256','utf8').trim();
process.stdout.write(JSON.stringify(result)+'\n');process.exit(r.status===0?0:1);
