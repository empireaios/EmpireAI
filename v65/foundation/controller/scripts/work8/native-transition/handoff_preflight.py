"""One pre-application Phase A. Failure is terminal; no retries or alternate identities."""
import errno,hashlib,json,os,pathlib,subprocess,time
from private_contract import backend_options,browser_options,private_write,host_control_metadata,safe_docker_contract,host_identity,safe_stat

HOST_FILES=['component-identities.json','normal-readback-ready.json','recovery-ready.json','return-ready.json','returned-readback-ready.json','replayed-readback-ready.json','stop-runtime.json','readback-complete.json']

def synthetic(name):return {'schema':'WORK8_V29_SYNTHETIC_PRIVATE_BYTES','syntheticOnly':True,'exchange':name}

def execute(*,root,script,private,out,label,images,browser_image,run):
 started=time.monotonic();receipt={'schema':'work8-v29-private-handoff-preflight-v1','status':'FAIL','phaseBStarted':False,'applicationStarted':False,'syntheticBytesOnly':True,'automaticRetry':False,'historicalPreviousErrno':'UNKNOWN','roles':{}}
 names=[];writer=None
 def start(role,mode,backend=False,wrong=False):
  name=label+'-handoff-'+role;names.append(name)
  options=backend_options(private,script) if backend else browser_options(private,script,root/'native-transition-driver',65534 if wrong else None,65534 if wrong else None)
  image=images['backend'] if backend else browser_image
  run(['docker','run','-d','--name',name,'--label','work8.native='+label,'--network','none','--memory','256m','--cpus','0.5','--pids-limit','64',*options,'--entrypoint','node',image,'/examination/private-handoff-preflight.mjs',mode],timeout=30)
  inspected=json.loads(run(['docker','inspect',name]))[0]
  assert inspected['Image']==image if backend else inspected['Config']['Image']==image
  contract=safe_docker_contract(inspected);assert not inspected['HostConfig']['PortBindings'] and not contract['privileged']
  receipt['roles'][role]={'contract':contract,'entrypoint':['node','/examination/private-handoff-preflight.mjs',mode],'network':'none','applicationStarted':False}
  return name
 def logs(role,name):
  data=run(['docker','logs',name],timeout=15)
  (out/('phase-a-'+role+'.log')).write_text(data)
  rows=[]
  for line in data.splitlines():
   row=json.loads(line);assert row.get('schema')=='work8-v29-private-file-role-v1';rows.append(row)
  assert rows and len(rows)<=2,'PHASE_A_ROLE_OUTPUT_BOUND'
  return rows
 def complete(role,name,expected):
  exit_code=run(['docker','wait',name],timeout=100).strip();rows=logs(role,name)
  receipt['roles'][role]['result']=rows[-1]
  assert exit_code=='0' and rows[-1]['status']==expected,'PHASE_A_ROLE_FAILED:'+role
  return rows[-1]
 try:
  try:receipt['hostControl']=host_control_metadata(private/'control')
  except Exception as error:
   safe=RuntimeError('PHASE_A_HOST_CONTROL_METADATA_FAILED');safe.safe_handoff={'schema':'WORK8_HOST_PRIVATE_HANDOFF_FAILURE_V1','operation':'HOST_MEASURE_PRIVATE_CONTROL_METADATA','errno':errno.errorcode.get(getattr(error,'errno',None),'HOST_CONTRACT_ASSERTION'),'numericErrno':getattr(error,'errno',None),'identity':host_identity(),'parent':safe_stat(private/'control'),'rawContents':False,'rawErrorMessage':False};raise safe from None
  assert os.getuid() not in [0,65534],'ACTUAL_UNPRIVILEGED_RUNNER_REQUIRED'
  gate=json.loads((script/'v29-source-gate.json').read_text());reviewed={x['path']:x for x in gate['files']}
  bound=['private-handoff.mjs','private-exchanges.mjs','private-handoff-preflight.mjs','private_contract.py','handoff_preflight.py','capture-canonical-persistence.mjs','offline-commerce-readback.mjs','whole-app-readback.mjs','browser.mjs','coordinator.mjs','examine-v26.py']
  receipt['reviewedSourceContract']=[]
  for name in bound:
   p=script/name;entry=reviewed['scripts/work8/native-transition/'+name]
   actual=hashlib.sha256(p.read_bytes()).hexdigest();assert actual==entry['sha256'] and p.stat().st_size==entry['bytes'],'PHASE_A_REVIEWED_SOURCE_CHANGED'
   receipt['reviewedSourceContract'].append({'path':entry['path'],'sha256':actual,'bytes':entry['bytes']})
  receipt['hostSyntheticWrites']=[{'classification':name,**private_write(private/'control'/name,synthetic(name))} for name in HOST_FILES]
  writer=start('writer','writer',backend=True)
  deadline=time.monotonic()+45
  while True:
   text=run(['docker','logs',writer],timeout=10)
   if text.strip():
    rows=logs('writer',writer)
    if rows[0].get('event')=='PREPARED_NOT_TRANSFERRED':break
    receipt['roles']['writer']['result']=rows[-1];raise AssertionError('PHASE_A_WRITER_PREPARATION_FAILED')
   state=json.loads(run(['docker','inspect',writer]))[0]['State']
   assert state['Running'] and time.monotonic()<deadline,'PHASE_A_WRITER_PREPARATION_DEADLINE'
   time.sleep(.1)
  receipt['roles']['writer']['prepared']=rows[0]
  before=start('reader-before','reader-before');complete('reader-before',before,'PASS_READER_REFUSED_BEFORE_TRANSFER')
  denied_before=start('wrong-reader-before','wrong-reader',wrong=True);complete('wrong-reader-before',denied_before,'PASS_WRONG_PRINCIPAL_REFUSED')
  receipt['releaseHostWrite']=private_write(private/'control/phase-a-release.json',{'syntheticRelease':True})
  complete('writer',writer,'PASS_PRIVATE_WRITER')
  # Host existence-only consumption of root-owned atomic markers matches coordinator.
  receipt['rootMarkerPublication']={name:(private/'control'/name).is_file() for name in ['runtime-ready.json','runtime-drained.json']};assert all(receipt['rootMarkerPublication'].values())
  after=start('reader-after','reader-after');complete('reader-after',after,'PASS_ACTUAL_BROWSER_READER_AND_WRITER')
  wrong=start('wrong-reader','wrong-reader',wrong=True);complete('wrong-reader',wrong,'PASS_WRONG_PRINCIPAL_REFUSED')
  final=start('root-final-reader','root-final-reader',backend=True);complete('root-final-reader',final,'PASS_INDEPENDENT_FINAL_READER_EXCHANGES')
  assert receipt['roles']['writer']['contract']==receipt['roles']['root-final-reader']['contract'],'INDEPENDENT_READER_CONTRACT_CHANGED'
  assert receipt['roles']['reader-before']['contract']==receipt['roles']['reader-after']['contract'],'ACTUAL_BROWSER_READER_CONTRACT_CHANGED'
  for file in (private/'control').iterdir():
   assert file.is_file() and not file.is_symlink(),'PREFLIGHT_CONTROL_NONREGULAR_ENTRY'
   file.unlink()
  assert not list((private/'control').iterdir()),'PREFLIGHT_SYNTHETIC_OPERANDS_REMAIN'
  receipt.update(status='PASS_PRIVATE_FILE_HANDOFF_PREFLIGHT',syntheticControlFilesRemoved=True,phaseBGateSatisfied=True)
 except Exception as error:
  receipt['firstFailure']={'code':str(error)[:160] if str(error).startswith(('PHASE_A_','ACTUAL_','INDEPENDENT_','PREFLIGHT_')) else 'PHASE_A_PRIVATE_FILE_CONTRACT_FAILED','arbitraryErrorValuesRetained':False}
  if getattr(error,'safe_handoff',None):receipt['firstFailure']['privateHandoff']=error.safe_handoff
  raise
 finally:
  for role,data in receipt['roles'].items():
   name=label+'-handoff-'+role
   try:
    rows=logs(role,name)
    if 'status' in rows[-1]:data['result']=rows[-1]
   except Exception:pass
  for name in names:
   subprocess.run(['docker','rm','-f',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=10,check=False)
  receipt['elapsedSeconds']=round(time.monotonic()-started,3)
  (out/'phase-a-private-handoff.json').write_text(json.dumps(receipt,indent=2)+'\n')
 return receipt
