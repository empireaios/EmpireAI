#!/usr/bin/env python3
"""Complete sanitized diagnostics. Raw logs and secret registry remain private."""
import argparse,base64,hashlib,json,os,pathlib,re,shutil,sys,urllib.parse
p=argparse.ArgumentParser();p.add_argument('action',choices=['register-env','register-generated','command','finalize']);p.add_argument('--directory');p.add_argument('--command');p.add_argument('--line',type=int);p.add_argument('--script');p.add_argument('--exit-code',type=int);p.add_argument('--pipeline-status');a=p.parse_args()
root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'release-package-output';private=root/'private';public=root/'publishable';private.mkdir(parents=True,exist_ok=True);public.mkdir(parents=True,exist_ok=True)
registry=private/'diagnostic-secrets.json';destination=public/'complete-diagnostics';temporary=public/'.diagnostics-pending'
def atomic(path,data):
 tmp=path.with_name(path.name+'.tmp');tmp.write_text(data);tmp.chmod(0o600);tmp.replace(path)
def secrets():
 if not registry.exists():return []
 assert registry.is_file() and not registry.is_symlink()
 value=json.loads(registry.read_text());assert isinstance(value,list) and all(isinstance(x,str) and x for x in value);return value
try:
 if a.action.startswith('register-'):
  values=secrets()
  if a.action=='register-env':
   values += [v for k,v in os.environ.items() if v and re.search(r'TOKEN|PASSWORD|SECRET|API_KEY|CREDENTIAL|AUTHORIZATION|COOKIE',k,re.I)]
  else:
   assert registry.exists(),'Secret registry must precede generated credential registration'
   directory=pathlib.Path(a.directory).resolve()
   for name in ['backend.env','browser.env','redis-password']:
    f=directory/name
    if not f.exists():continue
    assert f.is_file() and not f.is_symlink()
    if name=='redis-password':values.append(f.read_text().strip());continue
    for line in f.read_text().splitlines():
     k,sep,v=line.partition('=')
     if sep and v and re.search(r'TOKEN|PASSWORD|SECRET|REDIS_URL|COOKIE',k,re.I):values.append(v)
  atomic(registry,json.dumps(sorted(set(v for v in values if v)))+'\n')
 elif a.action=='command':
  assert a.command is not None and a.line is not None and a.script and a.exit_code is not None
  event={'command':a.command,'line':a.line,'script':a.script,'exitCode':a.exit_code,'pipelineStatuses':a.pipeline_status}
  with (private/'command-failures.jsonl').open('a') as f:f.write(json.dumps(event)+'\n')
 else:
  assert registry.exists(),'Secret registry required for finalization'
  values=secrets()
  expanded=set(values)
  for value in values:
   expanded.update([urllib.parse.quote(value,safe=''),base64.b64encode(value.encode()).decode()])
  expanded=sorted((v for v in expanded if v),key=len,reverse=True)
  def sanitize(text):
   for value in expanded:text=text.replace(value,'[REDACTED]')
   credential_key=re.compile(r'(?:password|secret|token|authorization|cookie|api[_-]?key|empireai_session)',re.I)
   quoted_credentials=re.compile(r"(?i)((?:[\"'])?(?:[a-z0-9_-]{0,64}(?:token|password|secret)|authorization|cookie|set-cookie|empireai_session|api[_-]?key)(?:[\"'])?\s*[:=]\s*)([\"'])(?:\\.|(?!\2)[\s\S])*\2")
   def redact_quoted(value):return quoted_credentials.sub(lambda m:m[1]+m[2]+'[REDACTED]'+m[2],value)
   def scrub_json(value):
    if isinstance(value,dict):return {k:('[REDACTED]' if credential_key.search(k) else scrub_json(v)) for k,v in value.items()}
    if isinstance(value,list):return [scrub_json(v) for v in value]
    if isinstance(value,str):return redact_quoted(value)
    return value
   lines=[]
   for line in text.splitlines(keepends=True):
    try:
     obj=json.loads(line)
     if isinstance(obj,(dict,list)):line=json.dumps(scrub_json(obj),ensure_ascii=False)+('\n' if line.endswith('\n') else '')
    except (ValueError,TypeError):pass
    lines.append(line)
   text=''.join(lines)
   # Whole quoted credential values (including escaped interior quotes).
   text=redact_quoted(text)
   # JSON and JSON-escaped header fields retain surrounding nonsecret context.
   text=re.sub(r"(?i)((?:\\?[\"'])(?:authorization|cookie|set-cookie)(?:\\?[\"'])\s*:\s*)(\\?[\"'])(.*?)(\2)",lambda m:m[1]+m[2]+'[REDACTED]'+m[2],text)
   text=re.sub(r"(?i)((?:\\?[\"'])?(?:[a-z0-9_-]{0,64}token|password|session[_-]?secret|empireai_session|api[_-]?key)(?:\\?[\"'])?\s*[:=]\s*(?:\\?[\"'])?)[^\s,;\"'\\}]+",r'\1[REDACTED]',text)
   text=re.sub(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b','[REDACTED]',text)
   text=re.sub(r'(?im)^([^\r\n]*(?:authorization|set-cookie|cookie)\s*[:=])[^\r\n]*',r'\1 [REDACTED]',text)
   text=re.sub(r'(?i)(bearer\s+)[^\s,;"\']+',r'\1[REDACTED]',text)
   text=re.sub(r'(?i)((?:password|session[_-]?secret|session[_-]?token|empireai_session|access[_-]?token|api[_-]?key)["\']?\s*[:=]\s*["\']?)[^\s,;"\'}]+',r'\1[REDACTED]',text)
   text=re.sub(r'(https?://|rediss?://)[^\s/@]+:[^\s/@]+@',r'\1[REDACTED]@',text)
   assert not any(value in text for value in expanded if value!='[REDACTED]')
   return text
  if temporary.exists():shutil.rmtree(temporary)
  temporary.mkdir(mode=0o700)
  entries=[]
  names=['pipeline.log','load.log','backend-dependencies.log','compile.log','backend-build.log','frontend-build.log','frontend-image.log','command-failures.jsonl']
  logs=[private/name for name in names if (private/name).exists()]
  logs += sorted((private/'container-logs').glob('*.log')) if (private/'container-logs').exists() else []
  if (private/'container-logs/acquisition.tsv').exists():logs.append(private/'container-logs/acquisition.tsv')
  for path in logs:
   assert path.is_file() and not path.is_symlink()
   assert re.fullmatch(r'[A-Za-z0-9_.-]+',path.name)
   raw=path.read_bytes();clean=sanitize(raw.decode('utf8',errors='replace'))
   target=temporary/path.name;atomic(target,clean)
   entries.append({'file':path.name,'rawBytes':len(raw),'rawSha256':hashlib.sha256(raw).hexdigest(),'sanitizedBytes':len(clean.encode()),'sanitizedSha256':hashlib.sha256(clean.encode()).hexdigest(),'redactionMarkerCount':clean.count('[REDACTED]'),'allCapturedInputProcessed':True,'utf8InvalidBytesReplaced':True,'containerLogAcquisitionExit':int(re.findall(r'\[container-log-capture-exit:(\d+)\]',clean)[-1]) if re.findall(r'\[container-log-capture-exit:(\d+)\]',clean) else None,'tailTruncated':False})
  coverage_incomplete=(public/'diagnostics-failure.json').exists() or not (private/'pipeline.log').exists()
  acquisition=private/'container-logs/acquisition.tsv'
  if acquisition.exists():
   for record in acquisition.read_text().splitlines():
    fields=record.split('\t')
    if len(fields)!=3 or fields[1]!='LOGS_CAPTURED' or fields[2]!='0':coverage_incomplete=True
  build_receipt=public/'build-execution.json'
  if build_receipt.exists():
   build=json.loads(build_receipt.read_text())
   if build.get('exitCode',0)!=0 and not (private/'command-failures.jsonl').exists():coverage_incomplete=True
  atomic(temporary/'manifest.json',json.dumps({'status':'SANITIZED_INCOMPLETE' if coverage_incomplete else 'SANITIZED_COMPLETE','coverageIncomplete':coverage_incomplete,'logs':entries,'rawLogsPublished':False,'hardRunnerLossMayPreventFinalCapture':True,'wholeRowsAccepted':[]},indent=2)+'\n')
  if destination.exists():shutil.rmtree(destination)
  temporary.replace(destination)
except Exception:
 if temporary.exists():shutil.rmtree(temporary)
 if destination.exists():shutil.rmtree(destination)
 # Never print the exception or an input value on a sanitization failure.
 atomic(public/'diagnostics-failure.json',json.dumps({'status':'DIAGNOSTICS_FAILED_CLOSED','rawLogsPublished':False})+'\n')
 print('Complete diagnostics failed closed; raw logs remain private.',file=sys.stderr)
 sys.exit(1)
