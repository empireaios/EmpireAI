#!/usr/bin/env python3
"""Preserve mandatory terminated HH3 evidence before optional host diagnostics."""
import hashlib,json,os,pathlib,re,shutil,stat,subprocess,sys
assert os.getuid()==0 and len(sys.argv)==3
run_id=sys.argv[1];out=pathlib.Path(sys.argv[2]);assert re.fullmatch('[0-9]+',run_id)
assert out.resolve(strict=True)==out and out.name=='evidence'
termination=json.loads((out/'termination.json').read_text())
assert termination['runId']==run_id and termination['remainingScopedNamespaceLaunchers']==[] and termination['packageContainerRemoved']
assert termination['unitActiveState']in['inactive','failed']
assert termination['cgroupEvents']is None or 'populated 0'in termination['cgroupEvents'].splitlines()
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-hh3-'+run_id)
if not stage.exists():
 (out/'stage-termination.json').write_text(json.dumps({'stageRemoved':True,'stageWasAbsent':True,'sourceWorkspaceUntouched':True})+'\n');sys.exit(0)
assert stage.resolve(strict=True)==stage and stage.lstat().st_uid==0 and stage.is_dir()
assert not any(line.split()[4]==str(stage) or line.split()[4].startswith(str(stage)+'/')for line in pathlib.Path('/proc/self/mountinfo').read_text().splitlines())
raw=stage/'evidence';control=pathlib.Path(__file__).resolve().parent;records=[];error=None
try:
 # Move only the three bounded metadata files emitted by our host launcher.
 # They are not original HH3 payloads and would correctly be rejected by the
 # closed original-evidence collector. The stage is already terminated.
 host_failures=[]
 for name in ['host-service-controls.json','cgroup-namespace.json','namespace-command.json']:
  p=raw/name
  if not p.exists():continue
  try:
   info=p.lstat();assert stat.S_ISREG(info.st_mode)and info.st_nlink==1 and info.st_size<=65536
   data=p.read_bytes();target=out/name;assert not target.exists();target.write_bytes(data)
   assert target.read_bytes()==data;p.unlink()
   records.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
  except BaseException as e:host_failures.append({'path':name,'type':type(e).__name__,'message':str(e)})
 # Mandatory original case receipts are still collected after a host metadata
 # refusal. Any rejection remains a final failure after artifact preservation.
 result=subprocess.run(['/usr/bin/python3','-B',str(control/'control/collect.py'),str(raw),str(out)],timeout=60,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 assert len(result.stdout)<=65536
 (out/'collection-console.log').write_bytes(result.stdout)
 if result.returncode:raise AssertionError('INNER_COLLECTION_FAILED:'+str(result.returncode))
 if host_failures:raise AssertionError('HOST_METADATA_REJECTED:'+json.dumps(host_failures))
except BaseException as e:error={'type':type(e).__name__,'message':str(e)}
finally:
 shutil.rmtree(stage);assert not stage.exists()
 (out/'stage-termination.json').write_text(json.dumps({'stageRemoved':True,'sourceWorkspaceUntouched':True,'hostPayloadsCopied':records,'collectionFailure':error},indent=2)+'\n')
if error:sys.exit(1)
