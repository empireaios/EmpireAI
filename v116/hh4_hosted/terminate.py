#!/usr/bin/python3
"""Stop only exact recorded HH4 host sessions and current-run containers."""
import hashlib,json,os,pathlib,re,signal,subprocess,sys,time
from fixture_policy import remove_after_termination
root=pathlib.Path(sys.argv[1]).resolve(strict=True);run=sys.argv[2];assert run.isdigit()and root.name=='v116-hh4-'+run
control=pathlib.Path(__file__).resolve().parent;repo=control.parent.parent;evidence=root/'evidence';evidence.mkdir(exist_ok=True)
image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0';boot=pathlib.Path('/proc/sys/kernel/random/boot_id').read_text().strip();hosts=[];absent=[];removed=[]
env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':str(root/'docker-home')}
def read(p):
 s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_size<=1048576;return json.loads(p.read_text())
for phase in ['redis-preflight','producer','consumers','application-graph']:
 file=evidence/(phase+'-launch.json')
 if not file.exists():continue
 launch=read(file);identity=launch['identity'];pid=identity['pid'];assert isinstance(pid,int)and pid>0
 assert identity['bootId']==boot and identity['processGroup']==pid and identity['session']==pid and launch['cwd']==str(repo)
 proc=pathlib.Path('/proc')/str(pid)
 try:
  raw=(proc/'stat').read_text();fields=raw[raw.rfind(')')+2:].split()
  if int(fields[19])==identity['startTicks']and fields[0]not in['Z','X']:
   assert int(fields[2])==pid and int(fields[3])==pid and os.readlink(proc/'cwd')==str(repo)
   argv=(proc/'cmdline').read_bytes().decode().rstrip('\0').split('\0')
   if phase=='producer':assert argv==launch['argv']
   else:
    original=launch['argv'];assert original[0]=='docker'
    if argv[:2]==['/usr/bin/python3',str(control/'docker')]:assert argv[2:]==original[1:]
    else:
     assert argv[0]=='/usr/bin/docker';digest=hashlib.sha256(json.dumps(argv[1:]).encode()).hexdigest();journal=root/'transport/docker-transport.jsonl';assert journal.stat().st_size<=1048576
     assert any(json.loads(line)['argumentSHA256']==digest for line in journal.read_text().splitlines())
   os.killpg(pid,signal.SIGKILL);until=time.monotonic()+5
   while proc.exists():
    try:
     raw=(proc/'stat').read_text();f=raw[raw.rfind(')')+2:].split()
     if int(f[19])!=identity['startTicks']or f[0]in['Z','X']:break
    except FileNotFoundError:break
    assert time.monotonic()<until;time.sleep(.025)
 except FileNotFoundError:pass
 survivors=[]
 for member in pathlib.Path('/proc').iterdir():
  if not member.name.isdigit():continue
  try:
   raw=(member/'stat').read_text();f=raw[raw.rfind(')')+2:].split()
   if int(f[2])==pid and int(f[3])==pid and f[0]not in['Z','X']:survivors.append(int(member.name))
  except FileNotFoundError:pass
 assert not survivors,'OWNED_HOST_SESSION_SURVIVED';hosts.append({'phase':phase,'pid':pid,'startTicks':identity['startTicks'],'bootId':boot,'formerSessionLiveMembers':survivors})
for role in ['abi','producer','reader','graph']:
 p=root/'transport'/(role+'-creation.json')
 if not p.exists():continue
 claim=read(p);assert claim['role']==role and claim['runId']==run and claim['image']==image;name=claim['name']
 assert name==('work8-hh4-'+role+'-'+run)if role!='producer'else re.fullmatch('work8-hh4-[a-f0-9-]{36}',name)
 item=subprocess.run(['/usr/bin/docker','inspect',name],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=10)
 if item.returncode==0:
  assert len(item.stdout)<=1048576;x=json.loads(item.stdout)[0]
  assert x['Name']=='/'+name and x['Image']==image and x['Config']['Labels'].get('empireai.v116.hh4')==run
  if role=='producer':assert x['Config']['Labels'].get('work8.hh4')==name
  # Sanitized actual identity/host constraints only; no complete container env.
  (evidence/(role+'-termination-inspect.json')).write_text(json.dumps({'Id':x['Id'],'Name':x['Name'],'Image':x['Image'],'State':{k:x['State'].get(k)for k in ['Status','Running','Paused','Restarting','OOMKilled','Dead','Pid','ExitCode','StartedAt','FinishedAt']},'HostConfig':{k:x['HostConfig'][k]for k in['NetworkMode','ReadonlyRootfs','CapDrop','CapAdd','SecurityOpt','PortBindings','Privileged','RestartPolicy','Memory','MemorySwap','PidsLimit','NanoCpus','LogConfig']},'Mounts':x['Mounts']},indent=2)+'\n')
  subprocess.run(['/usr/bin/docker','rm','--force',name],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=15,check=True);removed.append(name)
 check=subprocess.run(['/usr/bin/docker','container','ls','-aq','--filter','name=^/'+name+'$'],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=10,check=True);assert check.stdout.strip()==b'';absent.append(name)
check=subprocess.run(['/usr/bin/docker','container','ls','-aq','--filter','label=empireai.v116.hh4='+run],env=env,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=10,check=True);assert check.stdout.strip()==b''
termination={'runId':run,'hostControllers':hosts,'removed':removed,'verifiedAbsent':absent,'currentRunLabelAbsent':True,'productionAccess':False}
(evidence/'independent-termination.json').write_text(json.dumps(termination,indent=2)+'\n')
policy=remove_after_termination(root,control,run,termination)
(evidence/'fixture-policy-termination.json').write_text(json.dumps(policy,indent=2)+'\n')
