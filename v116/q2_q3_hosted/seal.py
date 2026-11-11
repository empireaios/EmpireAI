#!/usr/bin/env python3
import hashlib,json,os,pathlib
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-q2-q3-'+os.environ['GITHUB_RUN_ID'])/'evidence'
files=[];total=0
for p in sorted(root.rglob('*')):
 if not p.is_file():continue
 assert not p.is_symlink()
 size=p.stat().st_size;assert size<=2*1024*1024,(p,size)
 total+=size;assert total<=9*1024*1024
 files.append({'path':str(p.relative_to(root)),'bytes':size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
phases={}
for name in ['capture']:
 p=root/name/'receipt.json'
 phases[name]=json.loads(p.read_text())['status'] if p.exists() else 'NOT_EXECUTED_OR_NO_RECEIPT'
termination=json.loads((root/'termination.json').read_text()) if (root/'termination.json').exists() else {}
stage_termination=json.loads((root/'stage-termination.json').read_text()) if (root/'stage-termination.json').exists() else {}
ok=stage_termination.get('stageRemoved') is True and stage_termination.get('mandatoryEvidenceCollection')=='PASS' and all(v=='PASS_SCOPED_TECHNICAL_PHASE' for v in phases.values()) and termination.get('remainingScopedNamespaceLaunchers')==[] and termination.get('packageContainerRemoved') is True
result={'schema':'empireai-v116-q23-hosted-result-v1','runId':os.environ['GITHUB_RUN_ID'],'attempt':os.environ['GITHUB_RUN_ATTEMPT'],'sourceHead':os.environ['GITHUB_SHA'],'status':'PASS_SELECTED_ORIGINAL_TECHNICAL_PREDICATES' if ok else 'FAIL_OR_NOT_PROVEN','phases':phases,'files':files,'payloadBytesBeforeIndex':total,'productionMutation':False,'wholeRowAcceptance':False,'nativeOwnerAcceptance':False,'obligationId':'V116-O42-Q23-A04-20261111','actualProviderCharges':'UNCONFIRMED'}
(root/'EVIDENCE_INDEX.json').write_text(json.dumps(result,indent=2)+'\n')
assert sum(p.stat().st_size for p in root.rglob('*') if p.is_file())<=10*1024*1024
print(json.dumps({'status':result['status'],'phases':phases,'payloadBytes':total,'wholeRowAcceptance':False}))
