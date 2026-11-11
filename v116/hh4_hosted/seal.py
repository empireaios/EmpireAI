#!/usr/bin/python3
"""Preserve sanitized mandatory HH4 evidence before any final scope verdict."""
import hashlib,json,os,pathlib,stat
from collect import safe_read
run=os.environ['GITHUB_RUN_ID'];assert run.isdigit()
base=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-hh4-'+run);out=base/'public-evidence';assert base.resolve(strict=True)==base
out.mkdir(mode=0o700,exist_ok=True);assert not out.is_symlink()
# Read the closed inner index if produced; its own failure does not suppress
# independently bounded outer failure and termination evidence.
observations=[];index=out/'INDEX.json'
if index.exists():
 inner=json.loads(safe_read(out,'INDEX.json',1048576));assert inner['schema']=='v116-hh4-public-evidence-index-v1'
 for item in inner['files']:
  b=safe_read(out,item['path'],1048576);assert len(b)==item['bytes']and hashlib.sha256(b).hexdigest()==item['sha256']
 assert sum(p.stat().st_size for p in out.rglob('*')if p.is_file())<=9437184
else:observations.append({'path':'INDEX.json','status':'INNER_INDEX_NOT_PRODUCED'})
paths=['evidence/source-admission.json','evidence/affected-source-contract.log','evidence/retained-input-metadata.json','evidence/retained-input-integrity.json','evidence/docker-load.txt','evidence/package-container.txt','evidence/independent-termination.json','evidence/package-termination.json','dependency-mounts/dependency-staging-receipt.json']
paths+=['evidence/'+role+'-termination-inspect.json'for role in ['abi','producer','reader','graph']]
paths+=['transport/'+role+'-creation.json'for role in ['abi','producer','reader','graph']]+['transport/docker-transport.jsonl']
outer=out/'outer';outer.mkdir(mode=0o700);total=0
for relative in paths:
 try:
  b=safe_read(base,relative,262144);assert total+len(b)<=786432,'OUTER_METADATA_BOUND';p=outer/relative;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);total+=len(b)
 except FileNotFoundError:observations.append({'path':relative,'status':'NOT_PRODUCED'})
 except Exception as error:observations.append({'path':relative,'status':'REFUSED','errorClass':type(error).__name__})
(outer/'collection.json').write_text(json.dumps({'status':'BOUNDED_OUTER_COLLECTION','observations':observations,'bytesCopied':total,'rawPrivateArchivePublished':False},indent=2)+'\n')
files=[];size=0
for p in sorted(out.rglob('*')):
 s=p.lstat();assert stat.S_ISDIR(s.st_mode)or stat.S_ISREG(s.st_mode)
 if stat.S_ISDIR(s.st_mode):continue
 assert s.st_nlink==1 and s.st_size<=1048576;size+=s.st_size;assert size<=10223616
 files.append({'path':str(p.relative_to(out)),'bytes':s.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
receipt={'schema':'v116-hh4-final-bounded-evidence-index-v1','runId':run,'attempt':os.environ['GITHUB_RUN_ATTEMPT'],'sourceHead':os.environ['GITHUB_SHA'],'payloads':files,'payloadBytes':size,'maximumBytesIncludingIndex':10485760,'originalScopesAwaitIndependentReview':True,'wholeQ5Accepted':False,'wholeO42Accepted':False,'rawPrivateArchivePublished':False,'productionMutation':False,'obligationId':'V116-O42-Q5-HH4-A01-20261111','actualProviderCharges':'UNCONFIRMED'}
b=(json.dumps(receipt,indent=2)+'\n').encode();assert len(b)<=262144 and size+len(b)<=10485760
with(out/'EVIDENCE_INDEX.json').open('xb')as f:f.write(b)
print(json.dumps({'status':'EVIDENCE_SEALED_NOT_ACCEPTANCE','payloads':len(files),'bytesIncludingIndex':size+len(b)}))
