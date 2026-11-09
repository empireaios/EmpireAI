#!/usr/bin/env python3
"""Allowlisted, bounded, deterministic export; never reads private application data."""
import argparse,base64,gzip,hashlib,io,json,os,pathlib,re,stat,sys,tarfile
sys.dont_write_bytecode=True
from runtime_common import Refusal,require,regular,sha,atomic
MAX_TOTAL=2*1024*1024
MAX_FILE=2*1024*1024
MAX_ARCHIVE=512*1024
MAX_CHUNK=512
STAGE_NAMES=set('''stage-start workflow-budget exact-components current-package-import reused-private-handoff accepted-module-preflight-reused phase-b-private-contract frontend-native-qualification new-private-capture-channel-controls isolation observation-clock-contract container-lifecycle host-private-handoff-first-failure browser-stderr-sanitized runner-result first-native-failure first-docker-failure first-docker-state-error actual-runtime-ready last-startup-observation native-storage-preflight native-storage-child-bindings live-brain-ready live-brain-capture live-brain-channel-failure native-drain-observation native-runtime-result mounted-entrypoint-preflight child-startup-selftest child-startup-fixture-progress command-first-exception origin-preflight-verified normal-replay-comparison returned-comparison replayed-comparison recovery-schema-comparison browser-lifecycle transition-http-observations transition-browser-result private-handoff-first-failure phase-a-private-handoff preflight-receipt frontend-origin-boundary'''.split())
LOG_NAMES={'entrypoint-original-command.log','entrypoint-checkout-command.log','entrypoint-corrected-command.log','child-fixture-protected-entrypoint-command.log','child-fixture-system-errno-command.log','child-fixture-untrusted-message-command.log','browser-container.log','backend-container.log','sanitized-runtime.log','entrypoint-writer-refusal-command.log','entrypoint-root-command.log','entrypoint-drop-command.log','entrypoint-operator-command.log'}
TOP_NAMES={'controller-supervisor-preflight.json','controller-supervisor-full.json','launch-contract.json','native-qualification.json','package-delivery.json','run-contract.json','executor-review.json','source-review.json','preflight-review.json','bootstrap-contract.json','provider-network.json'}
RUNTIME_NAMES={'first-runtime-command-failure.json','native-capability-observation.json','first-runtime-failure.json','receipt-provision.json','receipt-start-daemon.json','receipt-import-dependencies.json','receipt-qualify.json','receipt-cleanup.json','daemon-final.json'}
PATTERNS=[re.compile(x) for x in [rb'(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})',rb'(?<![A-Za-z0-9_])re_[A-Za-z0-9]{32,}',rb'AKIA[A-Z0-9]{16}',rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'(?i)Bearer\s+(?!\[REDACTED\])[^\s"<>]{8,}',rb'empireai_session=(?!\[REDACTED\])[^;\s"<>]{8,}']]

def stage_allowed(name):
 if name in LOG_NAMES or name=='recovery-canonical-business.png':return True
 if pathlib.PurePosixPath(name).stem in STAGE_NAMES and name.endswith('.json'):return True
 return re.fullmatch(r'(?:normal|recovery|returned|replayed|final)-(?:independent-gate|whole-app-readback|commerce-independent-readback|persistence-capture|brain-audit-projection)\.json',name) is not None or re.fullmatch(r'frontend-(?:startup|listener)-(?:NORMAL|RECOVERY|NORMAL_RETURN|PREFLIGHT_NORMAL|PREFLIGHT_RECOVERY|[0-9]+|normal|recovery)\.json',name) is not None

def safe_bytes(p):
 s=regular(p);require(s.st_size<=MAX_FILE,'EXPORT_FILE_BOUND');data=p.read_bytes()
 require(not any(x.search(data) for x in PATTERNS),'EXPORT_SECRET_PATTERN_REFUSED')
 if p.suffix=='.json':json.loads(data)
 elif p.suffix=='.png':require(data.startswith(b'\x89PNG\r\n\x1a\n'),'EXPORT_PNG_SIGNATURE_REFUSED')
 else:data.decode('utf8')
 if 'first-' in p.name:require(len(data)<=16384,'FIRST_FAILURE_SIZE_BOUND')
 return data

def gather(root):
 root=pathlib.Path(root);require(root.is_absolute() and root.resolve()==root,'EXPORT_CANONICAL_ROOT')
 files={}
 def take(p):
  name=p.relative_to(root).as_posix();require(name not in files,'EXPORT_DUPLICATE');files[name]=safe_bytes(p);require(sum(map(len,files.values()))<=MAX_TOTAL,'EXPORT_TOTAL_BOUND')
 for name in sorted(TOP_NAMES):
  p=root/name
  if p.exists():take(p)
 runtime=root/'runtime-evidence'
 if runtime.exists():
  require(runtime.resolve()==runtime,'EXPORT_RUNTIME_DIRECTORY_REFUSED')
  for name in sorted(RUNTIME_NAMES):
   p=runtime/name
   if p.exists():take(p)
 for name in ['receipt-resolve.json','receipt-download.json','receipt-install.json','package-lock.json']:
  p=root/'provision'/name
  if p.exists():take(p)
 for phase in ['preflight','full']:
  d=root/'evidence'/phase
  if not d.exists():continue
  require(d.resolve()==d,'EXPORT_STAGE_DIRECTORY_REFUSED')
  index=d/'artifact-index.json';regular(index);require(index.stat().st_size<=MAX_FILE,'EXPORT_INDEX_BOUND');value=json.loads(index.read_text())
  require(value.get('schema')=='work8-bounded-upload-v1','EXPORT_STAGE_INDEX_SCHEMA')
  require(value.get('exactGeneratedSecretCheck') is True or value.get('setupOnlySanitizedFailure') is True,'EXPORT_GENERATED_SECRET_SCAN_REQUIRED')
  entries=value['files'];require(isinstance(entries,list) and len(entries)<=256,'EXPORT_INDEX_ENTRY_BOUND')
  names=[row['path'] for row in entries];require(len(names)==len(set(names)),'EXPORT_DUPLICATE_INDEX')
  require(set(names)=={p.name for p in d.iterdir() if p.name!='artifact-index.json'},'EXPORT_COMPLETE_STAGE_INVENTORY_REQUIRED')
  if value.get('setupOnlySanitizedFailure'):require(names==['first-native-failure.json'],'EXPORT_SETUP_FAILURE_SCOPE')
  for row in entries:
   name=row['path'];require(pathlib.PurePosixPath(name).name==name and stage_allowed(name),'EXPORT_UNREVIEWED_ARTIFACT_NAME')
   p=d/name;regular(p);require(p.stat().st_size==row['bytes'] and sha(p)==row['sha256'],'EXPORT_STAGE_IDENTITY_CHANGED');take(p)
  take(index)
 require(files,'EXPORT_EMPTY_REFUSED');return files

def build(root,label='failure'):
 root=pathlib.Path(root);require(label in ['preflight','final','failure'],'EXPORT_LABEL_REFUSED')
 if label=='preflight':require((root/'evidence/preflight/artifact-index.json').is_file() and not (root/'evidence/full').exists(),'EXPORT_PREFLIGHT_STAGE_SCOPE')
 if label=='final':require((root/'evidence/preflight/artifact-index.json').is_file() and (root/'evidence/full/artifact-index.json').is_file(),'EXPORT_FINAL_STAGE_SCOPE')
 files=gather(root)
 index={'schema':'work8-v62-durable-evidence-export-v1','status':'READY_FOR_INDEPENDENT_TRANSFER_READBACK','files':[{'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in sorted(files.items())],'uncompressedBytes':sum(map(len,files.values())),'maximumUncompressedBytes':MAX_TOTAL,'privateDataIncluded':False,'nativeAcceptanceClaimed':False}
 encoded=(json.dumps(index,sort_keys=True,separators=(',',':'))+'\n').encode();files['export-index.json']=encoded
 destination=root/'evidence-exports'/label;destination.mkdir(parents=True,mode=0o700,exist_ok=True);require(destination.resolve()==destination,'EXPORT_DESTINATION_PATH_REFUSED')
 maximum_archive=512*1024
 target=destination/'evidence-export.tar.gz';require(not target.exists(),'EXPORT_ALREADY_CREATED')
 pending=target.with_suffix('.pending');require(not pending.exists(),'EXPORT_PARTIAL_PRESENT')
 with pending.open('xb') as out:
  os.chmod(pending,0o600)
  with gzip.GzipFile(fileobj=out,mode='wb',mtime=0,filename='') as zipped:
   with tarfile.open(fileobj=zipped,mode='w|') as archive:
    for name,data in sorted(files.items()):
     info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o600;info.uid=info.gid=0;info.mtime=0;archive.addfile(info,io.BytesIO(data))
  out.flush();os.fsync(out.fileno())
 require(pending.stat().st_size<=maximum_archive,'EXPORT_ARCHIVE_BOUND');os.rename(pending,target)
 receipt={'schema':'work8-v62-evidence-export-receipt-v1','label':label,'file':target.relative_to(root).as_posix(),'bytes':target.stat().st_size,'sha256':sha(target),'exportIndexSHA256':hashlib.sha256(encoded).hexdigest(),'files':len(index['files']),'chunkBytes':MAX_CHUNK,'chunks':(target.stat().st_size+MAX_CHUNK-1)//MAX_CHUNK,'independentlyReadBack':False,'maximumBytes':maximum_archive}
 atomic(destination/'evidence-export-receipt.json',receipt,exclusive=True);return receipt

def chunk(path,digest,offset):
 p=pathlib.Path(path);regular(p);require(p.name=='evidence-export.tar.gz' and re.fullmatch('[a-f0-9]{64}',digest or '') is not None and sha(p)==digest,'EXPORT_READBACK_IDENTITY_REQUIRED');require(p.stat().st_size<=MAX_ARCHIVE and type(offset) is int and 0<=offset<p.stat().st_size and offset%MAX_CHUNK==0,'EXPORT_CHUNK_OFFSET_REFUSED')
 with p.open('rb') as f:f.seek(offset);data=f.read(MAX_CHUNK)
 return {'offset':offset,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'base64':base64.b64encode(data).decode(),'archiveSHA256':digest,'eof':offset+len(data)==p.stat().st_size}

if __name__=='__main__':
 parser=argparse.ArgumentParser();sub=parser.add_subparsers(dest='action',required=True);b=sub.add_parser('build');b.add_argument('--root',required=True);b.add_argument('--label',choices=['preflight','final','failure'],required=True);r=sub.add_parser('chunk');r.add_argument('--file',required=True);r.add_argument('--sha256',required=True);r.add_argument('--offset',type=int,required=True);a=parser.parse_args()
 try:result=build(a.root,a.label) if a.action=='build' else chunk(a.file,a.sha256,a.offset);print(json.dumps(result,sort_keys=True,separators=(',',':')))
 except Exception as e:print(json.dumps({'schema':'work8-v62-export-refusal-v1','code':str(e) if isinstance(e,Refusal) else type(e).__name__,'rawOutputRetained':False}));raise SystemExit(12)
