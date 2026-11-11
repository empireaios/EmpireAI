#!/usr/bin/env python3
"""Create an exact root-owned examination copy outside protected runner parents."""
import hashlib,json,os,pathlib,re,shutil,stat,sys
assert os.getuid()==0 and len(sys.argv)==5
source=pathlib.Path(sys.argv[1]);node=pathlib.Path(sys.argv[2]);run_id=sys.argv[3];out=pathlib.Path(sys.argv[4])
assert re.fullmatch('[0-9]+',run_id)
assert source.is_absolute() and source.resolve(strict=True)==source
assert node.is_absolute() and node.resolve(strict=True)==node
assert out.is_absolute() and out.resolve(strict=True)==out and out.name=='evidence'
stage=pathlib.Path('/var/tmp').resolve(strict=True)/('v116-q2-q3-'+run_id)
stage.mkdir(mode=0o700,exist_ok=False)
def inventory(root,require_root_owner=False):
 rows=[];total=0;counts={'files':0,'directories':0,'symlinks':0}
 for parent,dirs,files in os.walk(root,followlinks=False):
  for name in ['.'] if pathlib.Path(parent)==root else []:
   p=root;info=p.lstat();rows.append(['.','directory',stat.S_IMODE(info.st_mode)]);counts['directories']+=1
  for name in sorted(dirs+files):
   p=pathlib.Path(parent)/name;info=p.lstat();relative=str(p.relative_to(root))
   if require_root_owner:assert info.st_uid==0
   mode=stat.S_IMODE(info.st_mode)
   if stat.S_ISLNK(info.st_mode):
    target=os.readlink(p);assert not os.path.isabs(target)
    resolved=pathlib.Path(os.path.normpath(str(p.parent/target)));assert resolved.is_relative_to(root)
    rows.append([relative,'symlink',mode,target]);counts['symlinks']+=1
   elif stat.S_ISDIR(info.st_mode):rows.append([relative,'directory',mode]);counts['directories']+=1
   else:
    assert stat.S_ISREG(info.st_mode),'Nonregular source refused'
    h=hashlib.sha256()
    with p.open('rb') as f:
     for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
    rows.append([relative,'file',mode,info.st_size,h.hexdigest()]);total+=info.st_size;counts['files']+=1
 encoded=json.dumps(sorted(rows),separators=(',',':')).encode()
 return {'inventorySHA256':hashlib.sha256(encoded).hexdigest(),'bytes':total,**counts}
before=inventory(source)
shutil.copytree(source,stage/'app',symlinks=True)
shutil.copytree(node,stage/'node',symlinks=True)
after=inventory(source);copied=inventory(stage/'app',True)
assert before==after==copied
node_before=inventory(node);node_copied=inventory(stage/'node',True);assert node_before==node_copied
(stage/'evidence').mkdir(mode=0o700)
assert (stage/'app').stat().st_uid==0 and (stage/'node').stat().st_uid==0
parents=[]
for p in [source,*source.parents]:
 info=p.stat();parents.append({'path':str(p),'uid':info.st_uid,'gid':info.st_gid,'mode':oct(stat.S_IMODE(info.st_mode))})
receipt={'source':str(source),'stage':str(stage),'sourceParents':parents,'sourceAndDependencies':before,'node':node_before,'completeBeforeAfterCopyEqual':True,'allStagedMembersRootOwned':True,'sourceUnmodified':True,'credentialsCopied':'Only reviewed Git checkout with persist-credentials=false and noextraheader; no home or environment copied','applicationMountReadOnlyRequired':True}
(out/'namespace-staging.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'stage':str(stage),'inventorySHA256':before['inventorySHA256'],'files':before['files']}))
