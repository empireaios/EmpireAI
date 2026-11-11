#!/usr/bin/env python3
import hashlib,json,os,pathlib,re
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-session-browser-'+os.environ['GITHUB_RUN_ID'])/'evidence'
expected={'host-execution.json':'PASS_AWAITING_INDEPENDENT_BROWSER_REVIEW','browser-capability.json':'PASS_AF_UNIX_AND_IMMUTABLE_CHROMIUM','supervisor-result.json':'PASS_AWAITING_INDEPENDENT_NATIVE_BROWSER_ADJUDICATION','browser-result.json':'PASS_AWAITING_INDEPENDENT_A1_19_A1_20_REVIEW','native-final.json':'PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED','backend-result.json':'PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED','private-custody.json':'PASS_BOUNDED_PRIVATE_EVIDENCE_CUSTODY'}
for name,status in expected.items():
 r=json.loads((out/name).read_text());assert r['status']==status,(name,r['status']);assert not r.get('cleanupFailure')and not r.get('cleanupFailures')
assert json.loads((out/'host-execution.json').read_text())['allOriginalInputFilesAndLinksPreserved']is True
assert json.loads((out/'provider-termination.json').read_text())['scopedContainersAbsent']is True
assert json.loads((out/'private-custody.json').read_text())['credentialsPublished']is False
index=json.loads((out/'evidence-index.json').read_text());assert index['runId']==os.environ['GITHUB_RUN_ID']and index['launchCommit']==os.environ['GITHUB_SHA']
for x in index['payloads']:
 p=out/x['path'];assert p.name==x['path']and p.is_file()and not p.is_symlink();b=p.read_bytes();assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256']
telemetry=json.loads((out/'browser-preflight-telemetry.json').read_text());capability=json.loads((out/'browser-capability.json').read_text())
assert telemetry['schema']=='v116-native-browser-preflight-resource-telemetry-v1'
assert telemetry['expectedKernelPidsLimit']==256 and telemetry['expectedMemoryBytes']==2147483648 and telemetry['expectedCPUQuota']=='200000 100000'and telemetry['expectedFileSizeSoftHard']==33554432
assert telemetry['applicationStarted']is False and telemetry['authenticationStarted']is False and capability['applicationStarted']is False and capability['authenticationStarted']is False
assert capability['AF_UNIX']is True and capability['aboutBlank']is True
assert capability['telemetrySHA256']==hashlib.sha256((out/'browser-preflight-telemetry.json').read_bytes()).hexdigest()and capability['resourceSummary']==telemetry['summary']
assert 2<=len(telemetry['snapshots'])<=12
for x in telemetry['snapshots']:assert x['raw']['pids.max']=='256'and x['raw']['memory.max']=='2147483648'and x['raw']['cpu.max']=='200000 100000'
def counters(raw):
 assert isinstance(raw,str)and len(raw.encode())<=8192
 lines=[x for x in raw.strip().splitlines()if x];assert 1<=len(lines)<=64;result={}
 for line in lines:
  fields=line.split();assert len(fields)==2;k,v=fields
  assert len(k)<=64 and re.fullmatch(r'[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*',k)and k not in result and re.fullmatch(r'\d+',v)
  number=int(v);assert 0<=number<=9007199254740991;result[k]=number
 return result
for field,name,key in [('pidsMaxEventsDelta','pids.events','max'),('memoryOOMEventsDelta','memory.events','oom'),('memoryOOMKillEventsDelta','memory.events','oom_kill'),('cpuUsageUsecDelta','cpu.stat','usage_usec')]:
 values=[counters(x['raw'][name])[key]for x in telemetry['snapshots']]
 assert all(a<=b for a,b in zip(values,values[1:]));assert telemetry['summary'][field]==values[-1]-values[0]
for key in ['pidsMaxEventsDelta','memoryOOMEventsDelta','memoryOOMKillEventsDelta']:assert telemetry['summary'][key]==0
for field,name in [('sampledMaximumPidsCurrent','pids.current'),('sampledMaximumMemoryCurrent','memory.current')]:
 values=[x['raw'][name]for x in telemetry['snapshots']];assert all(re.fullmatch(r'\d+',x)for x in values);assert telemetry['summary'][field]==max(map(int,values))
for field,name in [('kernelPidsPeak','pids.peak'),('kernelMemoryPeakBytes','memory.peak')]:
 value=telemetry['snapshots'][-1]['raw'][name];assert value is None or re.fullmatch(r'\d+',value);assert telemetry['summary'][field]==(None if value is None else int(value))
assert telemetry['summary']['cpuUsageUsecDelta']>=0 and telemetry['selfLimitsSHA256']==hashlib.sha256(telemetry['selfLimits'].encode()).hexdigest()
assert(out/'browser-preflight-diagnostics.log').is_file()and(out/'browser-preflight-diagnostics.log').stat().st_size<=1048576
assert json.loads((out/'private-custody.json').read_text())['preNativeBrowserDiagnosticsPublished']is True
prelaunch=json.loads((out/'prelaunch-container.json').read_text());assert prelaunch['HostConfig']['PidsLimit']==256 and prelaunch['HostConfig']['Memory']==prelaunch['HostConfig']['MemorySwap']==2147483648
print('PASS_ACTUAL_NATIVE_BROWSER_PENDING_INDEPENDENT_ORIGINAL_CLAUSE_REVIEW')
