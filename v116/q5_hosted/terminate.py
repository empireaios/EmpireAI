#!/usr/bin/python3
"""Independent always-step cleanup of only recorded current-run owned containers."""
import json,os,pathlib,re,signal,subprocess,sys,time
root=pathlib.Path(sys.argv[1]).resolve(strict=True);run=sys.argv[2];assert run.isdigit()
image='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
evidence=root/'evidence';removed=[];absent=[];hostControllers=[]
for phase in ['f27','f29']:
 p=evidence/phase/'launch.json'
 if not p.exists():continue
 assert p.is_file()and not p.is_symlink()and p.stat().st_size<=65536
 launch=json.loads(p.read_text());pid=launch['controllerPid'];assert isinstance(pid,int)and pid>0
 identity=launch['controllerIdentity'];assert identity['bootId']==pathlib.Path('/proc/sys/kernel/random/boot_id').read_text().strip()
 proc=pathlib.Path('/proc')/str(pid)
 try:
  raw=(proc/'stat').read_text();fields=raw[raw.rfind(')')+2:].split()
  if int(fields[19])==identity['startTicks']and fields[0]not in ['Z','X']:
   assert int(fields[2])==pid and int(fields[3])==pid
   assert os.readlink(proc/'cwd')==identity['cwd']
   argv=(proc/'cmdline').read_bytes().decode().rstrip('\0').split('\0');assert argv in identity['allowedCommands']
   os.killpg(pid,signal.SIGKILL)
   deadline=time.monotonic()+5
   while proc.exists():
    try:
     raw=(proc/'stat').read_text();f=raw[raw.rfind(')')+2:].split()
     if int(f[19])!=identity['startTicks']or f[0]in ['Z','X']:break
    except FileNotFoundError:break
    assert time.monotonic()<deadline,'HOST_CONTROLLER_SURVIVED';time.sleep(.025)
 except FileNotFoundError:pass
 # Never claim containment if any former separately created session can still
 # issue Docker commands. Unknown survivors fail closed instead of being killed.
 survivors=[]
 for member in pathlib.Path('/proc').iterdir():
  if not member.name.isdigit():continue
  try:
   raw=(member/'stat').read_text();f=raw[raw.rfind(')')+2:].split()
   if int(f[2])==pid and int(f[3])==pid and f[0]not in ['Z','X']:survivors.append(int(member.name))
  except FileNotFoundError:pass
 assert survivors==[],'HOST_CONTROLLER_SESSION_SURVIVED'
 hostControllers.append({'pid':pid,'bootId':identity['bootId'],'startTicks':identity['startTicks'],'formerSessionLiveMembers':survivors})
 expected=['work8-f27-'+str(pid)]if phase=='f27'else['work8-f29-'+str(pid)+'-'+mode for mode in ['both-observers-killed','launcher-and-guard-killed']]
 assert launch['ownedContainerNames']==expected
 for name in expected:
  r=subprocess.run(['/usr/bin/docker','inspect',name],capture_output=True,timeout=15)
  if r.returncode==0:
   assert len(r.stdout)<=1048576
   item=json.loads(r.stdout)[0];assert item['Image']==image and item['Config']['Labels'].get('empireai.v116.q5')==run
   (evidence/phase/(name+'-always-termination.json')).write_bytes(r.stdout)
   subprocess.run(['/usr/bin/docker','rm','--force',name],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=15,check=True);removed.append(name)
  r=subprocess.run(['/usr/bin/docker','inspect',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=15);assert r.returncode!=0;absent.append(name)
(evidence/'independent-termination.json').write_text(json.dumps({'runId':run,'hostControllers':hostControllers,'removed':removed,'verifiedAbsent':absent,'productionAccess':False},indent=2)+'\n')
