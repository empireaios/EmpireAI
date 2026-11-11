#!/usr/bin/env python3
"""Seal existing bounded mandatory evidence even when the examination failed."""
import hashlib,json,os,pathlib,stat
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-hh3-'+os.environ['GITHUB_RUN_ID'])/'evidence'
index=root/'EVIDENCE_INDEX.json'
if index.exists():
 assert not index.is_symlink()and index.stat().st_nlink==1;index.unlink()
files=[];total=0
for p in sorted(root.rglob('*')):
 info=p.lstat();assert stat.S_ISDIR(info.st_mode)or stat.S_ISREG(info.st_mode)
 if not stat.S_ISREG(info.st_mode):continue
 assert info.st_nlink==1 and info.st_size<=1048576
 total+=info.st_size;assert total<=10485760
 files.append({'path':str(p.relative_to(root)),'bytes':info.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
result={'schema':'v116-hh3-final-bounded-evidence-index-v1','runId':os.environ['GITHUB_RUN_ID'],'attempt':os.environ['GITHUB_RUN_ATTEMPT'],'sourceHead':os.environ['GITHUB_SHA'],'payloads':files,'payloadBytes':total,'maximumArtifactBytesIncludingIndex':10485760,'wholeQ5Accepted':False,'productionMutation':False,'obligationId':'V116-O42-Q5-HH3-A01-20261111','actualProviderCharges':'UNCONFIRMED'}
body=json.dumps(result,indent=2)+'\n';assert total+len(body.encode())<=10485760;index.write_text(body)
print(json.dumps({'status':'EVIDENCE_SEALED_NOT_ACCEPTANCE','payloadBytes':total,'wholeQ5Accepted':False}))
