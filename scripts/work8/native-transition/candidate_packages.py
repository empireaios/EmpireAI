"""Bounded build-only CANDIDATE packages. Never include runtime mounts or secrets."""
import gzip, hashlib, json, os, pathlib, re, stat, subprocess, time

MAX_BYTES = 2 * 1024**3
ZIP_ENVELOPE_RESERVE = 2 * 1024**2
MAX_PAYLOAD_BYTES = MAX_BYTES - ZIP_ENVELOPE_RESERVE
EVIDENCE_RESERVE = 16 * 1024**2
ROLES = ('backend', 'normal', 'recovery')
PATTERNS = (
 ('github-token', re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})')),
 ('resend-token', re.compile(rb'(?<![A-Za-z0-9_])re_[A-Za-z0-9]{32,}')),
 ('aws-access-key', re.compile(rb'AKIA[A-Z0-9]{16}')),
 ('private-key-material', re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\r\n]+[A-Za-z0-9+/=\r\n]{64,}')),
)

def sha(path):
 with path.open('rb') as f:return hashlib.file_digest(f, 'sha256').hexdigest()

def directory_bytes(root):
 if not root.exists():return 0
 total=0
 for p in root.iterdir():
  info=p.lstat()
  assert stat.S_ISREG(info.st_mode) and info.st_nlink==1 and not p.is_symlink(), 'NONREGULAR_ARTIFACT_REFUSED'
  total+=info.st_size
 return total

def scan_context(context):
 files=0;byte_count=0;public_fixture_databases=[]
 for p in sorted(context.rglob('*')):
  if p.is_symlink():
   assert p.resolve().is_relative_to(context.resolve()), 'BUILD_SYMLINK_ESCAPE_REFUSED'
   continue
  if not p.is_file():continue
  assert '.git' not in p.relative_to(context).parts, 'BUILD_GIT_METADATA_REFUSED'
  relative=p.relative_to(context)
  assert p.name != '.env', 'BUILD_RUNTIME_ENV_REFUSED'
  if p.suffix.lower() in {'.db','.sqlite','.sqlite3','.db-wal','.db-shm'}:
   # Exact public source / npm package fixtures are not live runtime databases.
   # No examination runtime has started or produced credentials at this point.
   assert any(part in {'test','tests','fixtures','__fixtures__','examples'} for part in relative.parts[:-1]), 'BUILD_RUNTIME_DATA_REFUSED'
   public_fixture_databases.append({'path':str(relative),'sha256':sha(p),'bytes':p.stat().st_size,'provenance':'public source or dependency fixture; never mounted as examination state'})
  files+=1;byte_count+=p.stat().st_size;tail=b''
  with p.open('rb') as stream:
   while chunk:=stream.read(1024*1024):
    sample=tail+chunk
    for category,pattern in PATTERNS:
     assert not pattern.search(sample), 'BUILD_SECRET_PATTERN_REFUSED:'+category
    tail=sample[-8192:]
 return {'regularFilesScanned':files,'bytesScanned':byte_count,'categories':[c for c,_ in PATTERNS],'matches':0,'nonfixtureDatabaseFilenamesRefused':True,'publicFixtureDatabases':public_fixture_databases,'escapingSymlinksRefused':True}

class BoundedCompressedWriter:
 def __init__(self, stream, limit):self.stream,self.limit=stream,limit
 def write(self,data):
  assert self.stream.tell()+len(data)<=self.limit, 'COMPRESSED_CANDIDATE_BYTES_BOUND'
  return self.stream.write(data)
 def flush(self):return self.stream.flush()
 def tell(self):return self.stream.tell()

def write_index(directory, schema, **extra):
 entries=[]
 for p in sorted(directory.iterdir()):
  if p.name=='artifact-index.json':continue
  info=p.lstat();assert stat.S_ISREG(info.st_mode) and info.st_nlink==1 and not p.is_symlink()
  entries.append({'path':p.name,'bytes':info.st_size,'sha256':sha(p)})
 (directory/'artifact-index.json').write_text(json.dumps({'schema':schema,'maxBytes':MAX_BYTES,'maxPayloadBytes':MAX_PAYLOAD_BYTES,'zipEnvelopeReserveBytes':ZIP_ENVELOPE_RESERVE,'files':entries,**extra},indent=2)+'\n')

def prepare(root, private, evidence, images, components, generated):
 assert not generated, 'RUNTIME_SECRETS_EXIST_BEFORE_CANDIDATE_RETENTION'
 candidates=root/'native-transition-candidates';candidates.mkdir()
 scans={}
 for role in ROLES:
  scans[role]=scan_context(private/(role+'-context'))
  image=json.loads(subprocess.check_output(['docker','image','inspect',images[role]]))[0]
  assert image['Id']==images[role]
  labels=image['Config']['Labels']
  assert labels['org.opencontainers.image.revision']==components[role]['commit']
  assert labels['io.empireai.source-tree']==components[role]['tree']
  permitted={'PATH','NODE_VERSION','YARN_VERSION','NODE_ENV','NEXT_TELEMETRY_DISABLED'}
  assert all(item.split('=',1)[0] in permitted for item in image['Config'].get('Env',[])), 'UNREVIEWED_IMAGE_ENVIRONMENT'
  scans[role]['imageConfigEnvironmentAllowlistPassed']=True
 (candidates/'candidate-secret-scan.json').write_text(json.dumps({'schema':'work8-candidate-secret-scan-v1','generatedRuntimeSecretsExist':False,'providerCredentialsSupplied':False,'productionDataSupplied':False,'source':'reviewed exact public application checkouts and compiled outputs only','scans':scans},indent=2)+'\n')
 for role in ROLES:
  target=candidates/(role+'-image.tar.gz');partial=private/(role+'-image.partial')
  limit=MAX_PAYLOAD_BYTES-directory_bytes(candidates)-directory_bytes(evidence)-EVIDENCE_RESERVE
  assert limit>0
  proc=subprocess.Popen(['docker','save',images[role]],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
  try:
   with partial.open('wb') as raw:
    with gzip.GzipFile(filename='',fileobj=BoundedCompressedWriter(raw,limit),mode='wb',mtime=0) as dst:
     while chunk:=proc.stdout.read(1024*1024):dst.write(chunk)
   assert proc.wait(timeout=120)==0, 'DOCKER_SAVE_FAILED'
   partial.replace(target)
  finally:
   if proc.poll() is None:proc.kill()
   proc.stdout.close();proc.wait(timeout=10)
   if partial.exists():partial.unlink()
  components[role]['archiveFile']=target.name
  components[role]['archiveBytes']=target.stat().st_size
  components[role]['archiveSha256']=sha(target)
  components[role]['acceptance']='CANDIDATE_NOT_ACCEPTED'
 (candidates/'immutable-images.json').write_text(json.dumps(components,indent=2)+'\n')
 (candidates/'CANDIDATES.txt').write_text('CANDIDATES — NOT ACCEPTED RELEASES\nThree exact application images built once before examination runtime credentials or data exist.\nVerify each compressed archive against immutable-images.json archiveSha256.\nRestore bytes with: gzip -dc ROLE-image.tar.gz | docker load\nVerify docker image inspect ID and revision/tree labels against immutable-images.json.\nDo not deploy these images without applicable authority and a compatible reviewed runtime policy.\nThis archive was created before any examination runtime database or generated session secret existed; no provider credential was supplied. Any public source/dependency fixture database is separately identified by the scan receipt and is never examination state.\nThe GitHub artifact upload digest identifies the outer Actions ZIP; per-image hashes identify inner compressed archives.\nSeven-day Actions retention is time-limited; retain the verified archive through an authorised evidence route before expiry if further reuse is needed.\n')
 write_index(candidates,'work8-candidate-upload-v1',secretScanPassed=True,beforeRuntimeSecrets=True,candidateStatus='CANDIDATE_NOT_ACCEPTED')
 assert directory_bytes(candidates)+directory_bytes(evidence)<=MAX_PAYLOAD_BYTES-EVIDENCE_RESERVE, 'AGGREGATE_CANDIDATE_BYTES_BOUND'
 return candidates

def reuse(root, evidence, manifest):
 candidates=root/'native-transition-candidates'
 artifact_id=os.environ.get('CANDIDATE_ARTIFACT_ID','');digest=os.environ.get('CANDIDATE_ARTIFACT_DIGEST','')
 assert re.fullmatch(r'[1-9][0-9]*',artifact_id), 'REMOTE_CANDIDATE_UPLOAD_RECEIPT_REQUIRED'
 assert re.fullmatch(r'[a-f0-9]{64}',digest), 'REMOTE_CANDIDATE_UPLOAD_DIGEST_REQUIRED'
 index=json.loads((candidates/'artifact-index.json').read_text());assert index['schema']=='work8-candidate-upload-v1'
 assert index['secretScanPassed'] is True and index['beforeRuntimeSecrets'] is True
 expected={r['path']:r for r in index['files']}
 assert {p.name for p in candidates.iterdir()}==set(expected)|{'artifact-index.json'}
 for name,entry in expected.items():
  p=candidates/name;assert p.stat().st_size==entry['bytes'] and sha(p)==entry['sha256'], 'CANDIDATE_BYTES_CHANGED'
 components=json.loads((candidates/'immutable-images.json').read_text());images={}
 for role in ROLES:
  component=components[role];assert component['commit']==manifest[role]['commit'] and component['tree']==manifest[role]['tree']
  image=json.loads(subprocess.check_output(['docker','image','inspect',component['image']]))[0]
  assert image['Id']==component['image']
  labels=image['Config']['Labels'];assert labels['org.opencontainers.image.revision']==component['commit'] and labels['io.empireai.source-tree']==component['tree']
  assert component['archiveSha256']==sha(candidates/component['archiveFile'])
  images[role]=component['image']
 assert directory_bytes(candidates)+directory_bytes(evidence)<=MAX_PAYLOAD_BYTES
 receipt={'schema':'work8-candidate-upload-receipt-v1','status':'RETAINED_CANDIDATES_NOT_ACCEPTED','artifactId':int(artifact_id),'githubOuterArtifactSha256':digest,'candidateIndexSha256':sha(candidates/'artifact-index.json'),'candidateBytes':directory_bytes(candidates),'retentionDays':7,'archiveBytesVerifiedBeforeExamination':True,'buildsRepeated':False,'providerUploadReceiptSource':'pinned actions/upload-artifact successful step outputs'}
 (evidence/'candidate-upload-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
 return images,components
