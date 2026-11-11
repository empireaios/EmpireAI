#!/usr/bin/env python3
import hashlib,json,os,pathlib,stat,sys
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-test1-'+os.environ['GITHUB_RUN_ID'])/'evidence'
assert root.is_dir() and not root.is_symlink()
custody=json.loads((root/'evidence-custody.json').read_text());assert custody['status']=='PASS' and custody['runId']==os.environ['GITHUB_RUN_ID'] and custody['providerContainersAndNetworkAbsent'] is True
rows=[];total=0
for p in sorted(root.rglob('*')):
 s=p.lstat();assert not stat.S_ISLNK(s.st_mode),'Evidence symlink refused'
 if stat.S_ISDIR(s.st_mode):continue
 assert stat.S_ISREG(s.st_mode) and s.st_nlink==1,'Evidence special file refused'
 if p.name=='evidence-index.json':raise AssertionError('Evidence already sealed')
 total+=s.st_size;assert total<=134000000,'Evidence cap exceeded; upload refused'
 rows.append({'path':str(p.relative_to(root)),'bytes':s.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert rows
index={'schema':'empireai-v116-test1-evidence-index-v1','runId':os.environ['GITHUB_RUN_ID'],'runAttempt':os.environ['GITHUB_RUN_ATTEMPT'],'launchCommit':os.environ['GITHUB_SHA'],'applicationCommit':'6c1e63ba20619ee480742fd87dc810ca93152e22','maximumArtifactBytes':134217728,'retentionDays':7,'wholeRowAccepted':False,'payloads':rows}
b=(json.dumps(index,indent=2)+'\n').encode();assert total+len(b)<=134217728
(root/'evidence-index.json').write_bytes(b)
print(json.dumps({'files':len(rows),'bytes':total+len(b),'indexSHA256':hashlib.sha256(b).hexdigest()}))
