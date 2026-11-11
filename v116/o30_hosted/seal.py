#!/usr/bin/env python3
import hashlib,json,os,pathlib,stat
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-o30-'+os.environ['GITHUB_RUN_ID'])/'evidence'
files=[];total=0
for p in sorted(root.rglob('*')):
 info=p.lstat();assert stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)
 if not stat.S_ISREG(info.st_mode):continue
 assert info.st_nlink==1 and info.st_size<=2*1024*1024
 total+=info.st_size;assert total<=9*1024*1024
 files.append({'path':str(p.relative_to(root)),'bytes':info.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
def read(name):
 p=root/name;return json.loads(p.read_text()) if p.exists() else {}
entry=read('isolated-entry-result.json');termination=read('termination.json');stage=read('stage-termination.json')
ok=entry.get('status')=='PASS_SCOPED_NATIVE_TIMING_ENTRY' and stage.get('stageRemoved') is True and termination.get('remainingScopedNamespaceLaunchers')==[] and termination.get('packageContainerRemoved') is True
result={'schema':'empireai-v116-o30-hosted-result-v1','runId':os.environ['GITHUB_RUN_ID'],'attempt':os.environ['GITHUB_RUN_ATTEMPT'],'sourceHead':os.environ['GITHUB_SHA'],'status':'PASS_SCOPED_NATIVE_TIMING' if ok else 'FAIL_OR_NOT_PROVEN','entryStatus':entry.get('status','NOT_EXECUTED_OR_NO_RECEIPT'),'firstFailure':entry.get('firstFailure'),'files':files,'payloadBytesBeforeIndex':total,'productionMutation':False,'wholeRowAcceptance':False,'nativeOwnerAcceptance':False,'obligationId':'V116-O30-NATIVE-TIMERS-A01-20261111','actualProviderCharges':'UNCONFIRMED'}
(root/'EVIDENCE_INDEX.json').write_text(json.dumps(result,indent=2)+'\n')
assert sum(p.stat().st_size for p in root.rglob('*') if p.is_file())<=10*1024*1024
print(json.dumps({'status':result['status'],'payloadBytes':total,'wholeRowAcceptance':False}))
