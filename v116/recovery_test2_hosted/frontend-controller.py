#!/usr/bin/env python3
"""Bounded isolated exact-package frontend preparation and one selection switch.
Application source is unchanged. Outer wrapper owns complete container teardown.
"""
import datetime,hashlib,json,os,pathlib,re,subprocess,sys,time,zipfile
import retained_current_packages as packages
ROOT=pathlib.Path(sys.argv[1]);OUT=ROOT/'evidence';EXAM=sys.argv[2];LABEL=sys.argv[3]
assert re.fullmatch(r'work8-[a-z0-9-]{1,100}',EXAM) and re.fullmatch(r'work8-[a-z0-9-]{1,100}',LABEL)
CONTROL=pathlib.Path(__file__).resolve().parent
pins=json.loads((CONTROL/'frontend-pins.json').read_text())
assert hashlib.sha256((CONTROL/'retained_current_packages.py').read_bytes()).hexdigest()==pins['reusedVerifierSHA256']
packages.BACKEND.update(pins['backend']);packages.FRONTENDS=pins['frontends']
started=time.monotonic();deadline=started+400;created=[];phase='prepare-normal';receipt={'schema':'v116-test2-frontends-v1','status':'FAIL','source':'6c1e63ba20619ee480742fd87dc810ca93152e22','productionAccess':False,'rebuild':False,'steps':[]}
def now():return int(time.time()*1000)
def command(argv,timeout=30,cleanup=False):
 assert cleanup or time.monotonic()<deadline,'FRONTEND_CONTROLLER_DEADLINE'
 r=subprocess.run(argv,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=10 if cleanup else min(timeout,max(1,deadline-time.monotonic())),env={'PATH':'/usr/bin:/bin','HOME':str(ROOT)})
 assert len(r.stdout.encode())+len(r.stderr.encode())<=1048576,'COMMAND_OUTPUT_BOUND'
 if r.returncode:raise RuntimeError(str({'command':argv[:3],'status':r.returncode,'stderr':r.stderr[-2000:]}))
 return r.stdout

def inspect(name,cleanup=False):return json.loads(command(['docker','inspect',name],cleanup=cleanup))[0]
def write(name,value):
 with (OUT/('test2-'+name+'.json')).open('x')as f:json.dump({'scope':'V116_A2_21_ISOLATED_PREPARATION','source':pins['backend']['commit'],**value},f,indent=2)
def await_marker(name):
 while not (OUT/('test2-'+name+'.json')).exists():
  assert time.monotonic()<deadline,'FRONTEND_MARKER_DEADLINE:'+name
  state=inspect(EXAM)['State'];assert state['Running'],'NATIVE_CONTAINER_NOT_RUNNING'
  time.sleep(.1)
 value=json.loads((OUT/('test2-'+name+'.json')).read_text());assert value['scope']=='V116_A2_21_ISOLATED_PREPARATION';assert value['source']==pins['backend']['commit'];return value

def extract(role):
 pin=pins['frontends'][role];archive=ROOT/pin['file']
 with zipfile.ZipFile(ROOT/'retained-input.zip')as z:
  name='archives/'+pin['file'];assert z.namelist().count(name)==1 and z.getinfo(name).file_size==pin['bytes']
  digest=hashlib.sha256();total=0
  with z.open(name)as source,archive.open('xb')as target:
   while chunk:=source.read(1048576):
    total+=len(chunk);assert total<=pin['bytes'];digest.update(chunk);target.write(chunk)
  assert total==pin['bytes'] and digest.hexdigest()==pin['sha256']
 target=ROOT/('frontend-'+role)
 proof=packages.verify_frontend(archive,role,destination=target)
 receipt['steps'].append({'operation':'verified-exact-'+role,'at':now(),'proof':proof})
 return target

def start(role,target,port,suffix):
 name=LABEL+'-'+suffix
 argv=packages.frontend_argv(role,target,name=name,anchor=EXAM,label=LABEL,script_dir=CONTROL)
 argv=[('PORT='+str(port))if x=='PORT=43117'else x for x in argv]
 argv[2:2]=['--log-driver','json-file','--log-opt','max-size=1m','--log-opt','max-file=2']
 # Existing mount primitive is exact; only isolated preparation PORT differs.
 argv[argv.index('--pids-limit')+1]='128'
 command(argv);created.append(name)
 c=inspect(name);h=c['HostConfig'];assert c['Image']==pins['backend']['image'] and c['Config']['User']=='65534:65534'
 assert h['ReadonlyRootfs'] and not h['Privileged'] and not h['PortBindings'] and h['CapDrop']==['ALL'] and not h['CapAdd']
 anchor=inspect(EXAM);assert h['NetworkMode']in ['container:'+EXAM,'container:'+anchor['Id']] and h['Memory']==1073741824 and h['NanoCpus']==1000000000 and h['PidsLimit']==128
 own_ns=command(['docker','exec',name,'/frontend/runtime/bin/node','-e',"console.log(require('node:fs').readlinkSync('/proc/self/ns/net'))"]).strip();anchor_ns=command(['docker','exec',EXAM,'/usr/local/bin/node','-e',"console.log(require('node:fs').readlinkSync('/proc/self/ns/net'))"]).strip();assert re.fullmatch(r'net:\[\d+\]',own_ns) and own_ns==anchor_ns,'EXACT_ANCHOR_NETWORK_NAMESPACE_REQUIRED'
 assert 'no-new-privileges' in h['SecurityOpt'];assert c['Config']['Entrypoint']==['/frontend/runtime/bin/node']
 assert h['LogConfig']=={'Type':'json-file','Config':{'max-size':'1m','max-file':'2'}}
 assert {m['Destination']for m in c['Mounts']if m['Type']=='bind'}=={'/frontend','/examination'}
 assert all(not m['RW']for m in c['Mounts']if m['Type']=='bind')
 assert not any(v.split('=',1)[0]in ['GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN','OPENAI_API_KEY','ANTHROPIC_API_KEY']for v in c['Config']['Env'])
 begun=now();ready_by=min(deadline,time.monotonic()+90)
 while True:
  assert time.monotonic()<ready_by,'ORIGINAL_FRONTEND_STARTUP_DEADLINE'
  code="fetch('http://127.0.0.1:"+str(port)+"/login',{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"
  r=subprocess.run(['docker','exec',EXAM,'/usr/local/bin/node','-e',code],stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=5,env={'PATH':'/usr/bin:/bin','HOME':str(ROOT)})
  if r.returncode==0:break
  state=inspect(name)['State'];assert state['Running'],'PREPARED_FRONTEND_EXITED'
  time.sleep(.25)
 state=inspect(name)['State'];assert state['Running'] and state['Pid']>0
 item={'operation':'start-'+suffix,'frontend':pins['frontends'][role]['commit'],'archiveSHA256':pins['frontends'][role]['sha256'],'image':c['Image'],'port':port,'container':name,'containerId':c['Id'],'startedAtMs':begun,'readyAtMs':now(),'pid':state['Pid'],'readonly':True,'capabilities':[],'networkNamespace':own_ns,'anchorContainerId':anchor['Id']}
 receipt['steps'].append(item);return name,item

def stop(name,cleanup=False):
 state=inspect(name,cleanup=cleanup);receipt['steps'].append({'operation':'stop','container':name,'at':now(),'wasRunning':state['State']['Running']})
 command(['docker','rm','--force',name],cleanup=cleanup);created.remove(name)
try:
 normal=extract('normal');phase='await-native-backend';await_marker('backend-ready')
 phase='normal-frontend';normal_name,normal_proof=start('normal',normal,43117,'normal');write('normal-ready',normal_proof)
 phase='prepare-recovery';request=await_marker('prepare-requested');assert request['frontend']==pins['frontends']['recovery']['commit'];recovery=extract('recovery');prepared_name,prepared=start('recovery',recovery,43118,'prepared');write('prepared-running',prepared)
 phase='observe-native-commits-during-preparation';request=await_marker('upgrade-requested');assert request['preparedArchiveSHA256']==pins['frontends']['recovery']['sha256'];assert inspect(prepared_name)['State']['Running'];assert inspect(normal_name)['State']['Running']
 phase='one-compatible-selection-switch';stop(normal_name);stop(prepared_name);selected_name,selected=start('recovery',recovery,43117,'selected');write('upgrade-ready',selected)
 phase='await-native-final-readback'
 while not (OUT/'test2-native-evidence-handoff.json').exists():
  assert time.monotonic()<deadline,'NATIVE_FINAL_READBACK_DEADLINE';state=inspect(EXAM)['State']
  if not state['Running']:
   assert (OUT/'test2-native-evidence-handoff.json').exists(),'NATIVE_EXIT_WITHOUT_COMPLETED_EVIDENCE_HANDOFF'
   break
  time.sleep(.1)
 handoff=json.loads((OUT/'test2-native-evidence-handoff.json').read_text());assert handoff['schema']=='v116-test2-declared-native-evidence-handoff-v1' and handoff['source']==pins['backend']['commit'] and handoff['receiptBytesUnchanged'] is True and handoff['uploaderPrivateFilesTouched'] is False;expected=[f for f in handoff['files']if f['name']=='v116-test2-result.json'];assert len(expected)==1;raw=(OUT/'v116-test2-result.json').read_bytes();assert len(raw)==expected[0]['bytes'] and hashlib.sha256(raw).hexdigest()==expected[0]['sha256'];result=json.loads(raw);assert result['status']=='PASS_AWAITING_INDEPENDENT_A2_21_REVIEW'
 receipt['status']='PASS_PREPARATION_AND_SINGLE_SELECTION_SWITCH'
except BaseException as error:
 receipt['firstFailure']={'phase':phase,'type':type(error).__name__,'message':str(error)};raise
finally:
 for name in list(created):
  try:
   logs=command(['docker','logs','--tail','100',name],cleanup=True);(OUT/('test2-'+name+'.log')).write_text(logs[:1048576]);stop(name,cleanup=True)
  except BaseException as error:receipt.setdefault('cleanupErrors',[]).append({'container':name,'message':str(error)})
 if receipt.get('cleanupErrors'):
  receipt['status']='FAIL_CLEANUP';receipt.setdefault('firstFailure',{'phase':'cleanup','type':'CleanupFailure','message':'One or more scoped frontend resources failed termination; outer independent cleanup required'})
 receipt['finishedAtMs']=now();receipt['elapsedSeconds']=round(time.monotonic()-started,3);(OUT/'test2-frontend-controller.json').write_text(json.dumps(receipt,indent=2)+'\n')
if receipt['status']!='PASS_PREPARATION_AND_SINGLE_SELECTION_SWITCH':sys.exit(1)
