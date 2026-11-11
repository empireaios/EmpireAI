#!/usr/bin/env python3
import hashlib,json,os,pathlib,stat
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-q5-graph-clean-'+os.environ['GITHUB_RUN_ID'])/'evidence'
assert root.is_dir() and not root.is_symlink()
rows=[];total=0
for p in sorted(root.rglob('*')):
 s=p.lstat();assert not stat.S_ISLNK(s.st_mode)
 if stat.S_ISDIR(s.st_mode):continue
 assert stat.S_ISREG(s.st_mode) and s.st_nlink==1
 assert p.name!='evidence-index.json'
 total+=s.st_size;assert total<=5000000
 rows.append({'path':str(p.relative_to(root)),'bytes':s.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert rows
index={'schema':'empireai-v116-q5-graph-clean-evidence-index-v1','runId':os.environ['GITHUB_RUN_ID'],'runAttempt':os.environ['GITHUB_RUN_ATTEMPT'],'launchCommit':os.environ['GITHUB_SHA'],'applicationCommit':'6c1e63ba20619ee480742fd87dc810ca93152e22','maximumArtifactBytes':5242880,'retentionDays':7,'wholeRowAccepted':False,'payloads':rows}
b=(json.dumps(index,indent=2)+'\n').encode();assert total+len(b)<=5242880
(root/'evidence-index.json').write_bytes(b)
print(json.dumps({'payloads':len(rows),'bytes':total+len(b),'indexSHA256':hashlib.sha256(b).hexdigest()}))
