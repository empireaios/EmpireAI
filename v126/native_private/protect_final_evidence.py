#!/usr/bin/env python3
"""Verify a private flat evidence archive before recipient-only encryption."""
import hashlib,json,os,pathlib,shutil,stat,subprocess,tarfile
PUBLIC_CAP=268435456
PLAINTEXT_CAP=262144000
RECIPIENT_PEM_SHA256='f54723612078a39ce1cad72b0da0408f9461242533b49f2261ec9539e10e7107'
RECIPIENT_SPKI_SHA256='f9a3caad605563c58bb85ebb33a52a82f8eb1ede75ea44e7452aaa5c60dd28a0'
RETAINED_NODE_SHA256='3517c2df0b2f8cd7f422b4b8450ef81c6889f08eb03e281d6de9079b15e6a327'
def require(value,code):
 if not value:raise RuntimeError(code)
def file_sha(path):
 with pathlib.Path(path).open('rb')as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
def create_verified_archive(bundle,archive):
 bundle=pathlib.Path(bundle);archive=pathlib.Path(archive)
 require(bundle.is_dir()and not bundle.is_symlink()and bundle.resolve(strict=True)==bundle,'PRIVATE_BUNDLE_DIRECTORY')
 require(not archive.exists()and not archive.is_symlink(),'ARCHIVE_NOT_FRESH')
 index=bundle/'evidence-index.json';require(index.is_file()and not index.is_symlink(),'INDEX_FILE')
 rows=json.loads(index.read_bytes())['payloads'];require(isinstance(rows,list),'ARCHIVE_INDEX_ROWS')
 require(len({r['path']for r in rows})==len(rows),'ARCHIVE_DUPLICATE_PATH')
 require(all(r['path']!='evidence-index.json'for r in rows),'ARCHIVE_INDEX_SELF_REFERENCE')
 expected={r['path']:r for r in rows}
 expected['evidence-index.json']={'path':'evidence-index.json','bytes':index.stat().st_size,'sha256':file_sha(index)}
 require(set(p.name for p in bundle.iterdir())==set(expected),'ARCHIVE_EXACT_FILE_SET')
 for name,row in expected.items():
  require(pathlib.Path(name).name==name and name not in ('.','..'),'ARCHIVE_FLAT_NAME')
  p=bundle/name;s=p.lstat();require(stat.S_ISREG(s.st_mode)and s.st_nlink==1,'ARCHIVE_REGULAR_SINGLE_LINK')
  require(s.st_size==row['bytes']and file_sha(p)==row['sha256'],'ARCHIVE_INPUT_BYTES')
 fd=os.open(archive,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 with os.fdopen(fd,'wb')as output:
  with tarfile.open(fileobj=output,mode='w',format=tarfile.USTAR_FORMAT)as tar:
   for name,row in sorted(expected.items()):
    info=tarfile.TarInfo(name);info.size=row['bytes'];info.mode=0o600;info.uid=info.gid=0;info.mtime=0
    with(bundle/name).open('rb')as source:tar.addfile(info,source)
  output.flush();os.fsync(output.fileno())
 require(archive.stat().st_size<=PLAINTEXT_CAP,'ENCRYPTED_ARTIFACT_CAP')
 seen=set()
 with tarfile.open(archive,'r:')as tar:
  for member in tar:
   require(member.isfile()and member.name in expected and member.name not in seen,'ARCHIVE_MEMBER_SET')
   seen.add(member.name);row=expected[member.name]
   require(member.size==row['bytes'],'ARCHIVE_MEMBER_BYTES')
   with tar.extractfile(member)as source:require(hashlib.file_digest(source,'sha256').hexdigest()==row['sha256'],'ARCHIVE_MEMBER_SHA256')
 require(seen==set(expected),'ARCHIVE_COMPLETE_READBACK')
 return {'bytes':archive.stat().st_size,'sha256':file_sha(archive),'memberCount':len(seen),'allMembersReadBack':True}
def protect_bundle(bundle,publish,control,runtime,binding):
 bundle=pathlib.Path(bundle);publish=pathlib.Path(publish);control=pathlib.Path(control);runtime=pathlib.Path(runtime)
 require(bundle.parent==publish.parent==runtime.parent,'EXACT_PRIVATE_EXECUTION_ROOT')
 require(not publish.exists()and not publish.is_symlink(),'PUBLIC_DESTINATION_NOT_FRESH')
 key=control/'recipient-public-key.pem';require(file_sha(key)==RECIPIENT_PEM_SHA256,'RECIPIENT_PUBLIC_KEY_PIN')
 archive=bundle.parent/'private-final-evidence.tar';verified=create_verified_archive(bundle,archive)
 binding_file=bundle.parent/'private-evidence-binding.json'
 with binding_file.open('x')as output:json.dump(binding,output,indent=2);output.write('\n')
 binding_file.chmod(0o600)
 node=runtime/'node'
 require(node.is_file()and not node.is_symlink()and file_sha(node)==RETAINED_NODE_SHA256,'ENCRYPTION_RETAINED_NODE_PIN')
 command=[str(node),str(control/'private-evidence-envelope.mjs'),'encrypt','--archive',str(archive),'--format','tar',
  '--binding',str(binding_file),'--public-key',str(key),'--public-key-sha256',RECIPIENT_PEM_SHA256,'--fingerprint',RECIPIENT_SPKI_SHA256,
  '--runtime-pin',str(control/'evidence-envelope-runtime-pin.json'),'--out-dir',str(publish)]
 result=subprocess.run(command,stdin=subprocess.DEVNULL,capture_output=True,timeout=90,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'})
 require(len(result.stdout)+len(result.stderr)<=1048576,'ENCRYPTION_DIAGNOSTIC_BOUND')
 require(result.returncode==0,'PRIVATE_EVIDENCE_ENCRYPTION_FAILED_'+str(result.returncode))
 require({p.name for p in publish.iterdir()}=={'envelope.json','ciphertext.bin'},'PUBLIC_ENVELOPE_FILE_SET')
 envelope=json.loads((publish/'envelope.json').read_bytes())
 require(envelope['binding']==binding and envelope['recipientSPKISHA256']==RECIPIENT_SPKI_SHA256,'ENVELOPE_ACTUAL_BINDING')
 require(envelope['plaintextArchive']=={'format':'tar','bytes':verified['bytes'],'sha256':verified['sha256']},'ENVELOPE_PRIVATE_ARCHIVE_IDENTITY')
 verification=subprocess.run([str(node),str(control/'private-evidence-envelope.mjs'),'verify','--envelope-dir',str(publish),
  '--expected-binding',str(binding_file),'--fingerprint',RECIPIENT_SPKI_SHA256,
  '--runtime-pin',str(control/'evidence-envelope-runtime-pin.json'),'--encryptor-runtime-pin',str(control/'evidence-envelope-runtime-pin.json')],
  stdin=subprocess.DEVNULL,capture_output=True,timeout=60,env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8'})
 require(len(verification.stdout)+len(verification.stderr)<=1048576 and verification.returncode==0,'ENVELOPE_INDEPENDENT_READBACK')
 public=[]
 for p in sorted(publish.iterdir()):
  s=p.lstat();require(stat.S_ISREG(s.st_mode)and s.st_nlink==1,'PUBLIC_ENVELOPE_FILE_TYPE')
  public.append({'path':p.name,'bytes':s.st_size,'sha256':file_sha(p)});p.chmod(0o444)
 require(sum(p['bytes']for p in public)<=PUBLIC_CAP,'PUBLIC_ENCRYPTED_ARTIFACT_CAP')
 # All writers were drained by the caller before sealing. Remove every runtime copy,
 # including image-bearing API records, screenshots, SQLite state and private logs.
 require(runtime.parent.resolve(strict=True)==runtime.parent and runtime.name=='runtime'and not runtime.is_symlink(),'RUNTIME_CLEANUP_SCOPE')
 if runtime.exists():shutil.rmtree(runtime)
 shutil.rmtree(bundle);archive.unlink();binding_file.unlink()
 require(not runtime.exists()and not bundle.exists()and not archive.exists()and not binding_file.exists(),'PRIVATE_EVIDENCE_COPIES_REMAIN')
 return {'status':'RECIPIENT_ONLY_EVIDENCE_ENCRYPTED','privateArchive':verified,'publicFiles':public,
  'recipientSPKISHA256':RECIPIENT_SPKI_SHA256,'privateRuntimeAndPlaintextRemoved':True}
