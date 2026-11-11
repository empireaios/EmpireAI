#!/usr/bin/python3
"""Closed original pre-cutover evidence collection; never publish raw session/SQLite archive data."""
import hashlib,json,os,pathlib,re,stat,sys
MAX_OUTPUT=9*1048576
def digest(b):return hashlib.sha256(b).hexdigest()
def compact(v):return json.dumps(v,separators=(',',':'),ensure_ascii=False).encode()
def opaque(v):
 b=compact(v);return {'privateSyntheticValueOmitted':True,'sha256OfJSONEncoding':digest(b),'bytes':len(b)}
def diagnostic(value):
 raw=value.encode();out=opaque(value)
 out.update(freeFormDiagnosticPublished=False,errorClasses=sorted(set(x.decode()for x in re.findall(rb'\b[A-Za-z]*(?:Error|Exception)\b',raw)))[:30],symbolicErrors=sorted(set(x.decode()for x in re.findall(rb'\b(?:HH4|WORK8|SQLITE|ERR)_[A-Z0-9_]{2,100}\b',raw)))[:100],sourceLocations=sorted(set(x.decode()for x in re.findall(rb'(?:file://)?(?:/[A-Za-z0-9_.-]+)+\.(?:mjs|cjs|js|py|ts):[0-9]+(?::[0-9]+)?',raw)))[:100])
 return out
def sanitize(v):
 if isinstance(v,dict):
  out={}
  for k,x in v.items():
   if isinstance(x,str)and re.search(r'error|message|stack|reason|detail',k,re.I):out[k]=diagnostic(x)
   elif k in ['originalSession','publicReadback','canonicalRecords','Env']or re.search(r'token|password|authorization|cookie|secret',k,re.I):out[k]=opaque(x)
   else:out[k]=sanitize(x)
  return out
 if isinstance(v,list):return [sanitize(x)for x in v]
 return v
def safe_read(base,relative,limit):
 p=base/relative;assert p.is_relative_to(base)
 cur=base
 assert cur.is_dir()and not cur.is_symlink()
 for part in pathlib.Path(relative).parts[:-1]:
  cur=cur/part
  if not cur.exists():raise FileNotFoundError(str(cur))
  assert cur.is_dir()and not cur.is_symlink(),'SYMLINK_OR_NON_DIRECTORY_PARENT'
 s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=limit,'UNSAFE_OR_OVERSIZED_FILE'
 fd=os.open(p,os.O_RDONLY|os.O_NOFOLLOW)
 try:
  observed=os.fstat(fd);assert observed.st_ino==s.st_ino and observed.st_dev==s.st_dev and observed.st_size==s.st_size
  with os.fdopen(fd,'rb',closefd=False)as f:data=f.read(limit+1)
  assert len(data)==s.st_size and len(data)<=limit
 finally:os.close(fd)
 return data
def main():
 assert len(sys.argv)==2,'privateRunRoot'
 root=pathlib.Path(sys.argv[1]);assert root.is_absolute()and root.resolve(strict=True)==root
 out=root/'public-evidence';assert not out.exists();out.mkdir(mode=0o700)
 admitted=[];observations=[];total=0
 # Decisions/termination precede potentially large diagnostics and HTTP traces.
 native=['receipt.json','entry-result.json','entry-execution.json','fixture-composition.json','entry-admission.json','entry-first-failure.json']
 outer=['independent-termination.json','actual-container-admission.json','container-execution.json','source-admission.json','package-termination.json','retained-input-integrity.json','retained-input-metadata.json']
 selection=[('raw/evidence/'+n,'native/'+n)for n in native]+[('evidence/'+n,'host/'+n)for n in outer]+[('dependency-mounts/dependency-staging-receipt.json','dependencies/dependency-staging-receipt.json'),('raw/evidence/http-observations.json','native/http-observations.json')]
 for relative,destination in selection:
  try:
   raw=safe_read(root,relative,2*1048576);value=json.loads(raw)
   wrapped={'schema':'v116-precutover-private-source-derived-receipt-v1','originalRelativePath':relative,'originalBytes':len(raw),'originalSHA256':digest(raw),'privacyTransform':'Raw session/environment/canonical values and free-form diagnostics omitted; exact raw identity retained. Original source assertions are not replaced by this transform.','evidence':sanitize(value)}
   data=(json.dumps(wrapped,indent=2,ensure_ascii=False)+'\n').encode();assert len(data)<=1048576 and total+len(data)<=MAX_OUTPUT,'CUMULATIVE_COLLECTION_BOUND'
   target=out/destination;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);total+=len(data)
   admitted.append({'path':destination,'bytes':len(data),'sha256':digest(data),'originalBytes':len(raw),'originalSHA256':digest(raw)})
  except FileNotFoundError:observations.append({'path':relative,'status':'NOT_PRODUCED'})
  except Exception as e:observations.append({'path':relative,'status':'REFUSED','reason':diagnostic(str(e))})
 for relative,destination in [('raw/evidence/failure.log','native/failure-log-integrity.json'),('evidence/console.log','host/console-integrity.json')]:
  try:
   raw=safe_read(root,relative,2*1048576);text=raw.decode(errors='replace');identity=diagnostic(text);identity.update(originalRelativePath=relative,originalBytes=len(raw),originalSHA256=digest(raw),rawConsolePublished=False)
   data=(json.dumps(identity,indent=2)+'\n').encode();assert total+len(data)<=MAX_OUTPUT
   target=out/destination;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);total+=len(data);admitted.append({'path':destination,'bytes':len(data),'sha256':digest(data),'originalSHA256':digest(raw)})
  except FileNotFoundError:pass
  except Exception as e:observations.append({'path':relative,'status':'REFUSED','reason':diagnostic(str(e))})
 result={'schema':'v116-original-precutover-public-evidence-index-v1','payloads':admitted,'observations':observations,'payloadBytes':total,'wholeQ5Accepted':False,'genuineOwnerData':False,'rawLogsOrCanonicalRowsPublished':False,'collectionStatus':'PASS_BOUNDED_COLLECTION'if not any(x['status']=='REFUSED'for x in observations)else'BOUNDED_EVIDENCE_PRESERVED_WITH_REFUSALS'}
 data=(json.dumps(result,indent=2)+'\n').encode();assert len(data)<=1048576 and total+len(data)<=10*1048576
 (out/'INDEX.json').write_bytes(data);print(json.dumps({'status':result['collectionStatus'],'payloads':len(admitted),'totalBytesIncludingIndex':total+len(data)}))
 return 0
if __name__=='__main__':sys.exit(main())
