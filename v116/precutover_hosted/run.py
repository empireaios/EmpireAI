#!/usr/bin/python3
"""Create one bounded private original precutover fixture and inspect before start."""
import hashlib,json,os,pathlib,re,subprocess,sys,time
root=pathlib.Path(sys.argv[1]);run=sys.argv[2];assert run.isdigit()and root.is_absolute()and root.resolve(strict=True)==root and root.name=='v116-precutover-'+run
control=pathlib.Path(__file__).resolve().parent;repo=control.parent.parent;out=root/'evidence';raw=root/'raw/evidence';raw.mkdir(parents=True,mode=0o700)
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22';IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0';name='work8-v116-precutover-'+run;label='empireai.v116.precutover='+run;env={'PATH':'/usr/bin:/bin','LANG':'C.UTF-8','HOME':str(root/'docker-home')};start=time.monotonic();phase='source-admission';result={'schema':'v116-precutover-container-execution-v1','runId':run,'source':SOURCE,'imageId':IMAGE,'containerName':name,'status':'FAIL_CLOSED','maximumSeconds':900,'timedOut':False,'exitCode':None,'containerStopped':False}
def write(p,x):
 b=(json.dumps(x,indent=2)+'\n').encode();assert len(b)<=1048576
 with p.open('xb')as f:f.write(b);f.flush();os.fsync(f.fileno())
def docker(args,timeout=20,check=True):
 r=subprocess.run(['/usr/bin/docker',*args],env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout);assert len(r.stdout)+len(r.stderr)<=1048576
 if check:assert r.returncode==0,'DOCKER_COMMAND_FAILED:'+args[0]
 return r
def regular(p,maxbytes=2097152):
 s=p.lstat();assert p.is_file()and not p.is_symlink()and s.st_nlink==1 and s.st_size<=maxbytes;return p.read_bytes()
def mount(src,dst,ro=True):return 'type=bind,src='+str(src)+',dst='+dst+(',readonly'if ro else'')
try:
 original=json.loads(regular(control/'source-composition-map.json'))
 for x in original['originalInputs']:assert len(regular(repo/x['path']))==x['bytes']and hashlib.sha256(regular(repo/x['path'])).hexdigest()==x['sha256']
 for x in original['fixtureOnlyOverlays']:assert hashlib.sha256(regular(control/pathlib.Path(x['target']).name)).hexdigest()==x['sha256']
 manifest=json.loads(regular(control/'dependencies/pinned-dependencies.json'));assert hashlib.sha256(regular(control/'dependencies/pinned-dependencies.json')).hexdigest()=='4718286af9c9a747f98da2197305271433a2a57505b9939f7bc34b64ce6bb87b';stage=json.loads(regular(root/'dependency-mounts/dependency-staging-receipt.json'));assert stage['manifestSHA256']=='4718286af9c9a747f98da2197305271433a2a57505b9939f7bc34b64ce6bb87b'and len(stage['mounts'])==len(manifest['mounts'])==6
 proof=root/'isolation-proof.json';proof.write_text('{}\n');proof.chmod(0o600);proofstat=proof.stat()
 mounts=[(control/'entry.cjs','/control/entry.cjs',True),(control/'source-composition-map.json','/control/source-composition-map.json',True),(control/'technical-authority.json','/technical-authority.json',True),(proof,'/precutover-isolation-proof.json',True),(raw,'/evidence',False)]
 for x in original['fixtureOnlyOverlays']:mounts.append((control/pathlib.Path(x['target']).name,'/app/'+x['target'],True))
 for x in manifest['mounts']:
  f=root/'dependency-mounts/mounts'/x['name'];b=regular(f,x['bytes']);assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256'];staged=next(y for y in stage['mounts']if y['name']==x['name']);assert staged['source']==str(f);mounts.append((f,x['target'],True))
 caps=['SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE'];tmpfs={'/data':'rw,noexec,nosuid,nodev,mode=0755,size=768m','/work8-native':'rw,exec,nosuid,nodev,mode=0755,size=1m','/tmp':'rw,noexec,nosuid,nodev,mode=1777,size=16m'}
 a=['create','--name',name,'--label',label,'--user','0:0','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','256','--memory','3g','--memory-swap','3g','--cpus','2','--restart','no','--log-driver','json-file','--log-opt','max-size=256k','--log-opt','max-file=2']
 for cap in caps:a+=['--cap-add',cap]
 for dst,opts in tmpfs.items():a+=['--tmpfs',dst+':'+opts]
 for src,dst,ro in mounts:
  assert src.resolve(strict=True)==src and not src.is_symlink();a+=['--mount',mount(src,dst,ro)]
 a+=['--entrypoint','/usr/local/bin/node','--workdir','/app',IMAGE,'/control/entry.cjs']
 assert docker(['container','ls','-aq','--filter','name=^/'+name+'$']).stdout.strip()==b''
 write(out/'container-creation-intent.json',{'name':name,'runId':run,'source':SOURCE,'image':IMAGE,'argumentSHA256':hashlib.sha256(json.dumps(a).encode()).hexdigest()});phase='create-and-inspect';cid=docker(a).stdout.decode().strip();assert re.fullmatch('[a-f0-9]{64}',cid)
 x=json.loads(docker(['inspect',name]).stdout)[0];h=x['HostConfig'];config=x['Config'];assert x['Id']==cid and x['Name']=='/'+name and x['Image']==IMAGE and not x['State']['Running']and config['Labels'].get('empireai.v116.precutover')==run
 assert h['NetworkMode']=='none'and h['ReadonlyRootfs']and not h['Privileged']and not h['PortBindings']and h['CapDrop']==['ALL']and {c.removeprefix('CAP_')for c in h['CapAdd']}==set(caps)and h['SecurityOpt']==['no-new-privileges']and h['Memory']==3221225472 and h['MemorySwap']==3221225472 and h['PidsLimit']==256 and h['NanoCpus']==2000000000 and h['RestartPolicy']['Name']=='no'and h['Tmpfs']==tmpfs
 assert h['PidMode']=='' and h['IpcMode']=='private' and h['UTSMode']=='' and not h['Binds'] and not h['Devices'] and not h['DeviceRequests']
 assert h['LogConfig']=={'Type':'json-file','Config':{'max-size':'256k','max-file':'2'}}and config['User']=='0:0'and config['Entrypoint']==['/usr/local/bin/node']and config['Cmd']==['/control/entry.cjs']and config['WorkingDir']=='/app'
 assert set(config['Env'])=={'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin','NODE_VERSION=22.23.2','YARN_VERSION=1.22.22'}
 actual={m['Destination']:m for m in x['Mounts']if m['Type']=='bind'};assert len(actual)==len(mounts)and {m['Type']for m in x['Mounts']}<={'bind','tmpfs'}
 for src,dst,ro in mounts:assert actual[dst]['Source']==str(src)and actual[dst]['RW']==(not ro)
 verified={'schema':'v116-precutover-isolation-v1','source':SOURCE,'imageId':IMAGE,'containerId':cid,'containerName':name,'runId':run,'verifiedControls':True,'networkMode':'none','readOnlyRootfs':True,'privileged':False,'noPublishedPorts':True,'productionVolumesAttached':False,'user':'0:0','pidMode':h['PidMode'],'ipcMode':h['IpcMode'],'utsMode':h['UTSMode'],'capDrop':['ALL'],'capAdd':caps,'memory':h['Memory'],'memorySwap':h['MemorySwap'],'pidsLimit':h['PidsLimit'],'nanoCpus':h['NanoCpus'],'tmpfs':h['Tmpfs'],'mounts':[{'source':str(src),'destination':dst,'readonly':ro}for src,dst,ro in mounts]}
 # Fill the exact bound inode before first startup; never replace its bind target.
 with proof.open('w')as f:json.dump(verified,f);f.write('\n');f.flush();os.fsync(f.fileno())
 proof.chmod(0o444);assert(proof.stat().st_dev,proof.stat().st_ino)==(proofstat.st_dev,proofstat.st_ino);write(out/'actual-container-admission.json',verified)
 phase='original-native-examination';docker(['start',name]);started=time.monotonic()
 while True:
  x=json.loads(docker(['inspect',name]).stdout)[0];assert x['Id']==cid and x['Image']==IMAGE
  if not x['State']['Running']:result['exitCode']=x['State']['ExitCode'];result['containerStopped']=True;break
  if time.monotonic()-started>=900:
   result['timedOut']=True;docker(['stop','--time','10',name],timeout=15,check=False);docker(['kill',name],check=False);break
  time.sleep(.5)
 result['elapsedSeconds']=round(time.monotonic()-started,3);log=docker(['logs',name],check=False);assert len(log.stdout)+len(log.stderr)<=1048576;(out/'console.log').write_bytes(log.stdout+log.stderr);result['originalPassMarkerPresent']=b'PRE_CUTOVER_CLOSURE_PASS'in log.stdout+log.stderr
 assert result['exitCode']==0 and not result['timedOut']and result['containerStopped']and result['originalPassMarkerPresent'],'ORIGINAL_CONTAINER_FAILED';result['status']='ORIGINAL_NATIVE_PROCESS_COMPLETED_PENDING_INDEPENDENT_REVIEW'
except BaseException as error:result['firstFailure']={'phase':phase,'type':type(error).__name__,'message':str(error)}
finally:
 result['totalElapsedSeconds']=round(time.monotonic()-start,3);write(out/'container-execution.json',result)
if result['status']!='ORIGINAL_NATIVE_PROCESS_COMPLETED_PENDING_INDEPENDENT_REVIEW':sys.exit(1)
