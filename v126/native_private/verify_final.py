"""Verify every indexed byte and reconstruct the exact new frontend archive digest."""
import hashlib,json,pathlib,stat
def verify_final(directory):
 root=pathlib.Path(directory);index=root/'evidence-index.json';assert root.is_dir()and not root.is_symlink()
 d=json.loads(index.read_text());assert d['maximumBytes']==268435456
 rows=d['payloads'];expected={r['path']:r for r in rows};assert len(expected)==len(rows)and'final-result.json'in expected
 assert {p.name for p in root.iterdir()}==set(expected)|{'evidence-index.json'}
 total=0
 for name in set(expected)|{'evidence-index.json'}:
  assert pathlib.Path(name).name==name and name not in ['.','..']
  p=root/name;s=p.lstat();limit=8388608 if name in ['connector-source-desktop.png','connector-source-mobile.png','connector-media-request-desktop.png','connector-media-desktop.png','connector-media-mobile.png']else 4194304
  assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=limit
  b=p.read_bytes();total+=len(b)
  if name in expected:assert len(b)==expected[name]['bytes']and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
 assert total<=268435456
 archive=None
 if'connector-frontend-archive.json'in expected:
  archive=json.loads((root/'connector-frontend-archive.json').read_text());h=hashlib.sha256();size=0
  for i,chunk in enumerate(archive['chunks']):
   assert chunk['path']=='connector-frontend.part-'+str(i).zfill(3)+'.bin'and chunk==expected[chunk['path']]
   b=(root/chunk['path']).read_bytes();h.update(b);size+=len(b)
  assert size==archive['archive']['bytes']<=209715200 and h.hexdigest()==archive['archive']['sha256']
 return {'payloads':len(rows),'aggregateBytes':total,'indexSHA256':hashlib.sha256(index.read_bytes()).hexdigest(),
  'allIndexedBytesReadBack':True,'frontendArchiveReconstructedAndHashed':archive is not None}
