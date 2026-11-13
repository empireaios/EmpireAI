"""Read back complete indexed final evidence before an upload is admitted."""
import hashlib,json,pathlib,stat
def verify_final(directory):
 root=pathlib.Path(directory);index=root/'evidence-index.json'
 assert root.is_dir()and not root.is_symlink()and index.is_file()and not index.is_symlink()
 rows=json.loads(index.read_text())['payloads'];expected={x['path']:x for x in rows}
 assert len(expected)==len(rows)and 'final-result.json'in expected and 'evidence-index.json'not in expected
 assert {x.name for x in root.iterdir()}==set(expected)|{'evidence-index.json'}
 total=0
 for name in sorted(set(expected)|{'evidence-index.json'}):
  assert pathlib.Path(name).name==name and name not in ['.','..']
  p=root/name;s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=4194304
  b=p.read_bytes();total+=len(b)
  if name in expected:assert len(b)==expected[name]['bytes']and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
 assert total<=20971520
 return {'payloads':len(rows),'aggregateBytes':total,'indexSHA256':hashlib.sha256(index.read_bytes()).hexdigest(),'allIndexedBytesReadBack':True}
