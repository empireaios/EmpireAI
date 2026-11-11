#!/usr/bin/env python3
"""Collect only browser-only diagnostic data after exact labelled container absence."""
import hashlib,json,os,pathlib,stat,subprocess,sys
CASES={'original96':96};MAX=262144

def regular(p,uid,cap=MAX):
 s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_uid==uid and s.st_size<=cap and p.resolve(strict=True)==p;return s

def publish(out,name,b):
 assert pathlib.Path(name).name==name and len(b)<=MAX
 p=out/name
 if p.exists():regular(p,1001);assert p.read_bytes()==b;return
 fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600)
 try:
  with os.fdopen(fd,'wb',closefd=False)as f:f.write(b);f.flush();os.fsync(fd)
  os.fchown(fd,1001,1001)
 finally:os.close(fd)

def absent(root,run):
 env={'PATH':'/usr/bin:/bin','HOME':str(root/'docker-home'),'LANG':'C.UTF-8'};label='empireai.v116.browser-renderer='+run;prefix='work8-v116-browser-renderer-'+run
 p=subprocess.run(['/usr/bin/docker','ps','-aq','--filter','label='+label],env=env,capture_output=True,timeout=10);assert len(p.stdout)+len(p.stderr)<=65536 and p.returncode==0 and not p.stdout.strip()
 for suffix in ['carrier',*CASES]:
  p=subprocess.run(['/usr/bin/docker','inspect',prefix+'-'+suffix],env=env,capture_output=True,timeout=10);assert len(p.stdout)+len(p.stderr)<=1048576 and p.returncode!=0 and b'No such object'in p.stderr

def validate_probe(value,case,host):
 assert value['schema']=='v116-browser-renderer-resource-diagnostic-v1'and value['case']==case and value['expectedPidsMax']==CASES[case]
 assert value['applicationStarted']is False and value['authenticationStarted']is False and value['ownerStateMounted']is False and value['acceptanceEvidence']is False
 assert value['status']in['CAPTURED_BROWSER_SUCCESS','CAPTURED_BROWSER_FAILURE','DIAGNOSTIC_35S_DEADLINE']
 snapshots=value['snapshots'];assert 2<=len(snapshots)<=16
 for s in snapshots:
  assert s['rawCgroup']['pids.max']==str(CASES[case])and s['rawCgroup']['memory.max']=='2147483648';x=s['pidsEvents']['max'];assert isinstance(x,int)and not isinstance(x,bool)and x>=0
  raw=dict(line.split()for line in s['rawCgroup']['pids.events'].splitlines());assert str(x)==raw['max']
 delta=snapshots[-1]['pidsEvents']['max']-snapshots[0]['pidsEvents']['max'];assert delta>=0 and value['pidsMaxEventsDelta']==delta
 assert value['runtime']['networkNamespace']!=host['network']and value['runtime']['processNamespace']!=host['pid']
 return delta

def collect(root,run,case,strict):
 out=root/'evidence';private=root/('private-'+case);receipt={'case':case,'copied':[],'missing':[],'rejected':[],'applicationOrOwnerDataIncluded':False}
 if not private.exists():receipt['missing']=['probe-result.json','probe-progress.json'];return receipt
 assert private.resolve(strict=True)==private and private.stat().st_uid==0 and stat.S_IMODE(private.stat().st_mode)==0o700
 result=None
 for n in ['probe-result.json','probe-progress.json']:
  p=private/n
  if not p.exists():receipt['missing'].append(n);continue
  try:
   regular(p,0);b=p.read_bytes();v=json.loads(b);assert v.get('case')==case;publish(out,case+'-'+n,b);receipt['copied'].append({'path':case+'-'+n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
   if n=='probe-result.json':result=v
  except BaseException as e:receipt['rejected'].append({'path':n,'class':type(e).__name__})
 names=os.listdir(private);assert len(names)<=10
 for n in names:
  if n not in['probe-result.json','probe-progress.json']:receipt['rejected'].append({'path':n,'class':'UNEXPECTED_DIAGNOSTIC_OUTPUT'})
 if strict:
  assert result is not None and not receipt['rejected'];hp=root/'evidence/host-namespaces.json';regular(hp,1001);delta=validate_probe(result,case,json.loads(hp.read_text()));receipt['pidsMaxEventsDelta']=delta;receipt['probeResultSHA256']=hashlib.sha256((private/'probe-result.json').read_bytes()).hexdigest();receipt['status']='PASS_CAPTURED_BROWSER_DIAGNOSTIC_ONLY'
 return receipt

def main():
 assert os.getuid()==0;args=sys.argv[1:];assert len(args)in[3,4]and args[0]in['case','seal'];mode=args[0];root=pathlib.Path(args[1]);run=args[2]
 assert run.isdigit()and root.name=='v116-browser-renderer-'+run and root.is_absolute()and root.resolve(strict=True)==root and root.stat().st_uid==1001
 out=root/'evidence';assert out.resolve(strict=True)==out and out.stat().st_uid==1001;absent(root,run)
 if mode=='case':assert len(args)==4 and args[3]in CASES;print(json.dumps(collect(root,run,args[3],True)));return
 assert len(args)==3;cases=[collect(root,run,c,False)for c in CASES];r={'schema':'v116-browser-only-custody-v1','status':'PASS_BROWSER_ONLY_BOUNDED_CUSTODY'if all(not x['rejected']for x in cases)else'FAIL_UNEXPECTED_DIAGNOSTIC_OUTPUT','containersAbsent':True,'applicationOrOwnerDataIncluded':False,'credentialsOrPolicyCreated':False,'cases':cases};publish(out,'private-custody.json',(json.dumps(r,indent=2)+'\n').encode());print(json.dumps(r))
if __name__=='__main__':main()
