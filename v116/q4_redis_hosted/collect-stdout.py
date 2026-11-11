#!/usr/bin/env python3
import base64,hashlib,json,os,pathlib,re,stat,sys
source=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);prefix=b'EMPIREAI_Q4_REDIS_EVIDENCE_V1 '
assert source.is_file() and not source.is_symlink() and source.stat().st_size<=2097152
raw=source.read_bytes();lines=raw.splitlines(keepends=True)
envelopes=[line for line in lines if line.startswith(prefix)]
assert len(envelopes)==1,'EXPECTED_ONE_COMPLETE_EVIDENCE_ENVELOPE'
line=envelopes[0];assert line.endswith(b'\n') and len(line)<=1600000
def unique(pairs):
 d={}
 for k,v in pairs:assert k not in d,'DUPLICATE_JSON_KEY';d[k]=v
 return d
d=json.loads(line[len(prefix):],object_pairs_hook=unique)
assert set(d)=={'schema','source','files'} and d['schema']=='v116-q4-redis-stdout-evidence-v1'
assert d['source']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
limits={'preflight.json':32768,'tests.tap':1048576,'result.json':16384}
assert isinstance(d['files'],list) and len(d['files'])==3
assert {f.get('name') for f in d['files']}==set(limits)
validated=[]
for f in d['files']:
 assert set(f)=={'name','bytes','sha256','base64'}
 assert type(f['bytes']) is int and 0<f['bytes']<=limits[f['name']]
 assert isinstance(f['sha256'],str) and re.fullmatch('[0-9a-f]{64}',f['sha256'])
 assert isinstance(f['base64'],str) and len(f['base64'])<=((limits[f['name']]+2)//3)*4
 b=base64.b64decode(f['base64'],validate=True)
 assert base64.b64encode(b).decode()==f['base64']
 assert len(b)==f['bytes'] and hashlib.sha256(b).hexdigest()==f['sha256']
 validated.append((f,b))
assert out.is_dir() and not out.is_symlink() and out.resolve()==out
for f,b in validated:
 p=out/f['name']
 if p.exists() or p.is_symlink():
  s=p.lstat();assert stat.S_ISREG(s.st_mode) and s.st_nlink==1 and p.read_bytes()==b
 else:
  fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
  with os.fdopen(fd,'wb') as stream:stream.write(b);stream.flush();os.fsync(stream.fileno())
receipt={'schema':'v116-q4-redis-verified-stdout-custody-v1','source':d['source'],'envelopeSHA256':hashlib.sha256(line).hexdigest(),'envelopeBytes':len(line),'files':[{k:f[k] for k in ['name','bytes','sha256']} for f,b in validated],'transport':'Bounded checksum/base64 stdout envelope emitted synchronously before process exit; no tmpfs post-stop read or writable host bind','wholeRowAccepted':False}
dest=out/'stdout-custody.json';payload=(json.dumps(receipt,indent=2)+'\n').encode()
if dest.exists() or dest.is_symlink():assert not dest.is_symlink() and dest.stat().st_nlink==1 and dest.read_bytes()==payload
else:
 fd=os.open(dest,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 with os.fdopen(fd,'wb') as stream:stream.write(payload);stream.flush();os.fsync(stream.fileno())
print(json.dumps({'status':'VERIFIED_STDOUT_CUSTODY','files':len(validated),'envelopeBytes':len(line)}))
