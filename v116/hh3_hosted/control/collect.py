#!/usr/bin/python3
"""Preserve mandatory HH3 results before handling bounded original diagnostics."""
import hashlib,json,os,pathlib,stat,sys
raw,out=[pathlib.Path(p).resolve(strict=True)for p in sys.argv[1:3]]
assert raw!=out and raw not in out.parents and out not in raw.parents
records=[];rejected=[]
used=sum(p.lstat().st_size for p in out.rglob('*')if p.is_file())
assert used<=1048576,'BOUNDED_HOST_METADATA_PRECONDITION'
# Reserve a full MiB for collection/index metadata. Mandatory identity/result and
# six exact case receipts precede optional per-case failure details and child logs.
budget=9437184
modes=['timeout','observer-error','invalidate-error']
names=['isolated-entry-result.json','coordinator-console.log']
names += [mode+'/'+name for mode in modes for name in ['receipt.json','process-cleanup.json']]
names += [mode+'/failure.json'for mode in modes]+[mode+'/child.log'for mode in modes]
for relative in names:
 src=raw/relative
 safe=True;parent=raw
 for part in pathlib.PurePosixPath(relative).parts[:-1]:
  parent=parent/part
  if parent.is_symlink():safe=False;break
  if not parent.exists():break
  if not parent.is_dir()or not parent.resolve().is_relative_to(raw):safe=False;break
 if not safe:
  rejected.append({'path':relative,'reason':'SYMLINK_OR_FOREIGN_PARENT'});continue
 if not src.exists():continue
 s=src.lstat();cap=1048576
 if not stat.S_ISREG(s.st_mode)or src.is_symlink()or s.st_nlink!=1:
  rejected.append({'path':relative,'reason':'NONREGULAR_OR_LINKED'});continue
 if src.suffix=='.json'and s.st_size>cap:
  rejected.append({'path':relative,'bytes':s.st_size,'reason':'JSON_EXCEEDS_CAP'});continue
 with src.open('rb')as stream:data=stream.read(cap+1)
 truncated=len(data)>cap;data=data[:cap]
 if used+len(data)>budget:
  rejected.append({'path':relative,'bytes':s.st_size,'reason':'CUMULATIVE_PAYLOAD_BUDGET_EXCEEDED','mandatoryEvidencePreserved':True});continue
 used+=len(data)
 dst=out/'original'/relative;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(data)
 records.append({'path':'original/'+relative,'originalBytes':s.st_size,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'truncated':truncated})
 if truncated:rejected.append({'path':relative,'bytes':s.st_size,'reason':'LOG_EXCEEDS_CAP_DIAGNOSTIC_PREFIX_PRESERVED'})
unknown=[];unknownTruncated=False;scanned=0
# Only the three exact original directories are eligible. Never recurse through
# an unreviewed directory or symlink, and never lose mandatory results due to extras.
for directory in [raw]+[raw/m for m in ['timeout','observer-error','invalidate-error']]:
 if directory.is_symlink()or not directory.is_dir():continue
 with os.scandir(directory)as entries:
  for item in entries:
   scanned+=1;relative=str(pathlib.Path(item.path).relative_to(raw))
   if relative in ['timeout','observer-error','invalidate-error']and item.is_dir(follow_symlinks=False):continue
   if relative not in names:
    if len(unknown)<100:unknown.append(relative)
    else:unknownTruncated=True;break
   if scanned>=1024:unknownTruncated=True;break
 if unknownTruncated:break
if unknown or unknownTruncated:rejected.append({'reason':'UNKNOWN_OPTIONAL_PAYLOADS','recordedCount':len(unknown),'inventoryTruncated':unknownTruncated})
(out/'collection-result.json').write_text(json.dumps({'schema':'v116-hh3-bounded-mandatory-evidence-collection-v1','records':records,'rejected':rejected,'uncollectedUnknown':unknown,'unknownInventoryTruncated':unknownTruncated,'wholeQ5Accepted':False},indent=2)+'\n')
index=[];total=0
for p in sorted(out.rglob('*')):
 if not p.is_file():continue
 s=p.lstat();assert not p.is_symlink()and s.st_nlink==1 and s.st_size<=1048576
 total+=s.st_size;assert total<=10485760
 index.append({'path':str(p.relative_to(out)),'bytes':s.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
body=json.dumps({'schema':'v116-hh3-final-evidence-index-v1','payloads':index,'payloadBytes':total,'maximumArtifactBytesIncludingIndex':10485760},indent=2)+'\n'
assert total+len(body.encode())<=10485760
(out/'EVIDENCE_INDEX.json').write_text(body)
