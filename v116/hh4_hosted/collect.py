#!/usr/bin/python3
"""Closed HH4 evidence collection; never publish raw session/SQLite archive data."""
import hashlib,json,os,pathlib,re,stat,sys
MAX_OUTPUT=8*1048576
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
   if isinstance(x,str)and re.search(r'error|message|stack',k,re.I):out[k]=diagnostic(x)
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
 assert len(sys.argv)==3,'privateRunRoot freshPublicOutput'
 base=pathlib.Path(sys.argv[1]);assert base.is_absolute()and base.resolve(strict=True)==base
 out=pathlib.Path(sys.argv[2]);assert out.is_absolute()and not out.exists();out.mkdir(mode=0o700)
 admitted=[];rejected=[];total=0
 # First preserve the mandatory execution and three original scope decisions.
 files=[('evidence/hh4-execution-summary.json',True),('producer-raw/held-capture-result.json',True),('consumer-raw/consumer-summary.json',True),('consumer-raw/domain-rehydration-result.json',True),('consumer-raw/inspection-restoration-result.json',True),('graph-raw/application-graph-result.json',True)]
 files += [('evidence/'+phase+'-'+kind+'.json',True)for phase in ['redis-preflight','producer','consumers','application-graph']for kind in ['launch','execution']]
 files += [('evidence/redis-mounted-preflight.json',True),('producer-raw/container-evidence/hh4-technical-policy-admission.json',True),('producer-raw/container-evidence/hh4-assurance-prerequisite.json',True),('producer-raw/container-evidence/hh4-held.json',True),('producer-raw/container-evidence/hh4-worker-ready.json',True)]
 files += [('producer-raw/'+name,False)for name in ['held-capture-external-verification.json','cohort-containment.json','cohort-started.json','container-created.json','container-inspect.json','cohort-containment-failure-1.json','cohort-containment-failure-2.json']]
 for relative,mandatory in files:
  try:
   raw=safe_read(base,relative,2097152);parsed=json.loads(raw)
   value={'schema':'v116-hh4-private-source-derived-receipt-v1','originalRelativePath':relative,'originalBytes':len(raw),'originalSHA256':digest(raw),'privacyTransform':'Raw session, domain publicReadback and environment values omitted; exact raw bytes remain identified by SHA256. Transformation does not execute or replace original assertions; scope decisions are preserved.','evidence':sanitize(parsed)}
   data=(json.dumps(value,indent=2,ensure_ascii=False)+'\n').encode()
   assert len(data)<=1048576 and total+len(data)<=MAX_OUTPUT,'CUMULATIVE_COLLECTION_BOUND'
   target=out/relative;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);total+=len(data)
   admitted.append({'path':relative,'bytes':len(data),'sha256':digest(data),'originalBytes':len(raw),'originalSHA256':digest(raw),'mandatoryWhenProduced':mandatory})
  except FileNotFoundError:rejected.append({'path':relative,'status':'NOT_PRODUCED','mandatoryWhenProduced':mandatory})
  except Exception as e:rejected.append({'path':relative,'status':'REFUSED','reason':str(e)[:256],'mandatoryWhenProduced':mandatory})
 # Console output can contain raw values formatted by native assertions. Retain
 # only integrity and bounded symbolic error identifiers, never original text.
 for relative in ['evidence/redis-preflight-console.log','evidence/producer-console.log','evidence/consumers-console.log','evidence/application-graph-console.log','producer-raw/container-logs.txt']:
  try:
   raw=safe_read(base,relative,1048576);symbols=sorted(set(re.findall(rb'\b(?:HH4|WORK8|SQLITE|ERR)_[A-Z0-9_]{2,100}\b',raw)))[:100]
   # Source stack locations and error class retain diagnostic identity without
   # assertion values, environment strings, session IDs or raw domain records.
   locations=sorted(set(re.findall(rb'(?:file://)?(?:/[A-Za-z0-9_.-]+)+\.(?:mjs|cjs|js|py|ts):[0-9]+(?::[0-9]+)?',raw)))[:100]
   classes=sorted(set(re.findall(rb'\b[A-Za-z]*(?:Error|Exception)\b',raw)))[:30]
   value={'originalRelativePath':relative,'originalBytes':len(raw),'originalSHA256':digest(raw),'rawConsolePublished':False,'symbolicErrors':[s.decode()for s in symbols],'sourceLocations':[s.decode()for s in locations],'errorClasses':[s.decode()for s in classes]};data=(json.dumps(value,indent=2)+'\n').encode();assert total+len(data)<=MAX_OUTPUT
   target=out/(relative+'.integrity.json');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);total+=len(data);admitted.append({'path':relative+'.integrity.json','bytes':len(data),'sha256':digest(data),'originalSHA256':digest(raw)})
  except FileNotFoundError:pass
  except Exception as e:rejected.append({'path':relative,'status':'REFUSED','reason':str(e)[:256]})
 index={'schema':'v116-hh4-public-evidence-index-v1','files':admitted,'observations':rejected,'payloadBytes':total,'privateRawArchivePublished':False,'genuineOwnerData':False,'wholeRequirementAccepted':False,'collectionStatus':'PASS_BOUNDED_COLLECTION'if not any(x['status']=='REFUSED'for x in rejected)else'REFUSED_OPTIONAL_OR_MANDATORY_PAYLOAD_PRESERVED_OTHER_EVIDENCE'}
 data=(json.dumps(index,indent=2)+'\n').encode();assert len(data)<=1048576 and total+len(data)<=9*1048576
 (out/'INDEX.json').write_bytes(data)
 print(json.dumps({'status':index['collectionStatus'],'payloads':len(admitted),'totalBytesIncludingIndex':total+len(data),'rawArchivePublished':False}))
 return 0 if not any(x['status']=='REFUSED'and x.get('mandatoryWhenProduced')for x in rejected)else 1
if __name__=='__main__':sys.exit(main())
