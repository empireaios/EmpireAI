#!/usr/bin/python3
"""Keep mandatory bounded results first, then bounded original controller diagnostics."""
import hashlib,json,pathlib,stat,sys
root=pathlib.Path(sys.argv[1]).resolve(strict=True);out=root/'evidence';records=[];rejected=[]
used=sum(p.stat().st_size for p in out.rglob('*')if p.is_file())
assert used<=15728640,'Mandatory controller evidence independently exceeds reserved15MiB'
def copy(src,dst,cap,log=False):
 global used
 if not src.exists():return
 st=src.lstat()
 if not stat.S_ISREG(st.st_mode)or src.is_symlink()or st.st_nlink!=1:
  rejected.append({'path':str(src.relative_to(root)),'reason':'NONREGULAR_OR_LINKED_ORIGINAL_PAYLOAD'});return
 if(st.st_size>cap and not log)or st.st_size>33554432:
  rejected.append({'path':str(src.relative_to(root)),'bytes':st.st_size,'sha256':None,'reason':'ORIGINAL_PAYLOAD_EXCEEDS_BOUNDED_READ'});return
 h=hashlib.sha256();size=0;first=b'';last=b''
 with src.open('rb')as stream:
  while True:
   chunk=stream.read(65536)
   if not chunk:break
   h.update(chunk);size+=len(chunk)
   if len(first)<cap//2:first+=(chunk[:cap//2-len(first)])
   last=(last+chunk)[-cap//2:]
 digest=h.hexdigest()
 savedSize=min(size,cap+64)if log else size
 if(size>cap and not log)or used+savedSize>19922944:
  rejected.append({'path':str(src.relative_to(root)),'bytes':size,'sha256':digest,'reason':'ORIGINAL_EVIDENCE_EXCEEDS_REVIEWED_BOUND'});return
 dst.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
 if size<=cap:dst.write_bytes(src.read_bytes())
 else:dst.write_bytes(first+b'\n[BOUNDED_DIAGNOSTIC_TRUNCATION]\n'+last)
 used+=dst.stat().st_size
 records.append({'original':str(src.relative_to(root)),'saved':str(dst.relative_to(out)),'originalBytes':size,'originalSHA256':digest,'savedBytes':dst.stat().st_size,'savedSHA256':hashlib.sha256(dst.read_bytes()).hexdigest(),'truncatedDiagnostic':size>cap})
# Mandatory phase result/TAP-equivalent console/termination are already separate
# from raw original payloads. Never delete these if an optional payload is invalid.
for phase in ['f27','f29']:
 raw=root/(phase+'-raw')
 if not raw.exists():continue
 dirs=[raw]if phase=='f27'else[raw/x for x in ['both-observers-killed','launcher-and-guard-killed']]
 for directory in dirs:
  if not directory.exists():continue
  for src in sorted(directory.iterdir()):
   if src.is_dir():continue # Never export fixture databases, owner sessions or the full data volume.
   relative=src.relative_to(raw)
   if src.suffix=='.json':copy(src,out/phase/'original'/relative,4194304)
   elif src.suffix in ['.log','.txt','.jsonl']:copy(src,out/phase/'original'/relative,131072,True)
manifest={'schema':'v116-q5-original-controller-evidence-index-v1','files':records,'rejected':rejected,'wholeQ5Accepted':False}
(out/'original-payload-collection.json').write_text(json.dumps(manifest,indent=2)+'\n')
files=[];total=0
for p in sorted(out.rglob('*')):
 if not p.is_file():continue
 s=p.lstat();assert not p.is_symlink()and s.st_nlink==1
 total+=s.st_size;assert s.st_size<=4194304 and total<=20971520
 files.append({'path':str(p.relative_to(out)),'bytes':s.st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
index=json.dumps({'schema':'v116-q5-bounded-final-index-v1','payloads':files,'totalPayloadBytes':total,'maximumArtifactBytesIncludingIndex':20971520,'originalPayloadsRejected':rejected},indent=2)+'\n'
assert total+len(index.encode())<=20971520,'FINAL_ARTIFACT_WITH_INDEX_EXCEEDS_CAP'
(out/'EVIDENCE_INDEX.json').write_text(index)
# Upload the bounded mandatory evidence even when a raw payload is rejected.
# A separate final adjudication must require rejected==[] for complete evidence.
