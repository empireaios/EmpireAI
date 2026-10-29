#!/usr/bin/env python3
"""Persist bounded allowlisted build diagnostics; never publish raw log text."""
import argparse, hashlib, json, os, pathlib, re, time
p=argparse.ArgumentParser();p.add_argument('action',choices=['stage','finish','fallback']);p.add_argument('--stage');p.add_argument('--exit-code',type=int);args=p.parse_args()
root=pathlib.Path(os.environ['GITHUB_WORKSPACE'])/'release-package-output';private=root/'private';out=root/'publishable';out.mkdir(parents=True,exist_ok=True)
receipt=out/'build-execution.json'
state={'schema':'work8-build-execution-v1','stages':[],'status':'NOT_STARTED','wholeRowsAccepted':[]}
try:
 previous=json.loads(receipt.read_text())
 assert previous['schema']==state['schema'] and previous['status'] in ['NOT_STARTED','IN_PROGRESS','PASS_BUILD_ONLY','FAIL','INTERRUPTED_OR_EXIT_RECEIPT_UNAVAILABLE']
 assert isinstance(previous['stages'],list) and len(previous['stages'])<=64
 for item in previous['stages']:
  assert re.fullmatch('[a-z][a-z0-9-]{0,63}',item['stage']) and item['status'] in ['STARTED','COMPLETED','FAILED']
  assert isinstance(item['startedAtUnix'],int)
  state['stages'].append({key:item[key] for key in ['stage','status','startedAtUnix']})
 state['status']=previous['status']
 if isinstance(previous.get('exitCode'),int) and 0<=previous['exitCode']<=255:state['exitCode']=previous['exitCode']
except (OSError,ValueError,KeyError,TypeError,AssertionError):
 state={'schema':'work8-build-execution-v1','stages':[],'status':'NOT_STARTED','wholeRowsAccepted':[]}
workspace=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve()
known_packages=set();metadata_valid=True
for role in ['backend','frontend']:
 directory=workspace/(role+'-source')/('backend' if role=='backend' else 'empireai-web')
 for name in ['package.json','package-lock.json']:
  try:
   data=json.loads((directory/name).read_text());assert isinstance(data,dict)
   for field in ['dependencies','devDependencies','optionalDependencies']:
    entries=data.get(field,{});assert isinstance(entries,dict);known_packages.update(entries)
   packages=data.get('packages',{});assert isinstance(packages,dict)
   known_packages.update(key.rsplit('node_modules/',1)[-1] for key in packages if 'node_modules/' in key)
  except (OSError,ValueError,TypeError,AssertionError):metadata_valid=False
known_packages={x for x in known_packages if isinstance(x,str) and re.fullmatch(r'(?:@[a-zA-Z0-9_.-]+/)?[a-zA-Z0-9_.-]+',x)}
if not metadata_valid:known_packages=set()

if args.action=='stage':
 assert args.stage and re.fullmatch('[a-z][a-z0-9-]{0,63}',args.stage)
 if state['stages'] and state['stages'][-1]['status']=='STARTED':state['stages'][-1]['status']='COMPLETED'
 state['stages'].append({'stage':args.stage,'status':'STARTED','startedAtUnix':int(time.time())});state['status']='IN_PROGRESS'
elif args.action=='finish':
 assert args.exit_code is not None and 0<=args.exit_code<=255
 state['exitCode']=args.exit_code;state['status']='PASS_BUILD_ONLY' if args.exit_code==0 else 'FAIL'
 if state['stages']:state['stages'][-1]['status']='COMPLETED' if args.exit_code==0 else 'FAILED'
elif state['status']=='IN_PROGRESS':state['status']='INTERRUPTED_OR_EXIT_RECEIPT_UNAVAILABLE'
logs={}
for name in ['load.log','backend-dependencies.log','compile.log','backend-build.log','frontend-build.log','frontend-image.log']:
 path=private/name
 if not path.is_file() or path.is_symlink():continue
 h=hashlib.sha256();size=0
 with path.open('rb') as stream:
  for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk);size+=len(chunk)
  stream.seek(max(0,size-65536));text=stream.read(65536).decode('utf8',errors='replace')
 # Only fixed diagnostic tokens survive. No URLs, arbitrary message bodies,
 # environment values, shell commands, cookies or credential substrings leave.
 codes=sorted(set(re.findall(r'\b(?:TS\d{3,5}|E(?:USAGE|RESOLVE|INTEGRITY|LOCKVERIFY|ACCES|PERM|NOENT|CONNRESET|TIMEDOUT|AI_AGAIN|INVALIDTAGNAME|TARGET))\b',text)))[:32]
 signals={key:bool(re.search(pattern,text,re.I)) for key,pattern in {
  'outOfMemory':r'out of memory|heap limit|cannot allocate memory',
  'noSpace':r'no space left on device',
  'permissionDenied':r'permission denied',
  'missingFile':r'no such file or directory|cannot find module',
  'dependencyLockMismatch':r'package.json.*package-lock.json.*in sync|missing: .* from lock file|invalid: .* lock file',
  'imageLoadError':r'error processing tar file|invalid tar header',
  'networkFailure':r'network.*(?:error|failed)|connection (?:refused|reset)|timed? ?out'
 }.items()}
 structured=[]
 for match in re.finditer(r'^([^\r\n]+?)\((\d+),(\d+)\): error (TS\d{3,5}): ([^\r\n]*)',text,re.M):
  filename,line,column,code,message=match.groups()
  candidate=pathlib.Path(filename)
  if not candidate.is_absolute():candidate=workspace/'backend-source'/candidate
  try:
   relative=candidate.resolve().relative_to((workspace/'backend-source').resolve())
   if not candidate.is_file() or candidate.suffix not in ['.ts','.tsx'] or 'node_modules' in relative.parts:continue
   item={'file':relative.as_posix(),'line':int(line),'column':int(column),'code':code}
   missing=re.search(r"Cannot find module '([^']+)'",message)
   if missing:
    module=missing.group(1)
    if module in known_packages:item['unresolvedModule']=module
    elif re.fullmatch(r'[./A-Za-z0-9_@-]{1,160}',module) and module.startswith('.'):
     imports=re.findall(r"(?:from\s*|import\s*\(?)['\"]([^'\"]+)['\"]",candidate.read_text())
     if module in imports:item['unresolvedModule']=module
   structured.append(item)
  except (ValueError,OSError):continue
 lock_packages=[]
 for match in re.finditer(r'(?:Missing|Invalid):\s+([^\s]+)',text,re.I):
  token=match.group(1);package=token.rsplit('@',1)[0]
  if package in known_packages:lock_packages.append(package)
 logs[name]={'typescriptDiagnostics':structured[:32],'lockDependencyNames':sorted(set(lock_packages))[:32],'bytes':size,'sha256':h.hexdigest(),'diagnosticCodes':codes,'signals':signals,'rawLogPublished':False}
state['dependencyMetadataValidated']=metadata_valid;state['diagnostics']=logs;state['updatedAtUnix']=int(time.time());state['rawLogsPublished']=False
state['evidencePermissions']={'receiptMode':'0600','ownerUid':os.getuid()}
tmp=out/'build-execution.json.tmp';tmp.write_text(json.dumps(state,indent=2)+'\n');tmp.chmod(0o600);tmp.replace(receipt)
