import importlib.util,json,os,pathlib,signal,sys,time
spec=importlib.util.spec_from_file_location('b',pathlib.Path(__file__).with_name('ci-prerequisite.py'));b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
source,root=map(lambda p:pathlib.Path(p).resolve(),sys.argv[1:3]);image=sys.argv[3];assert os.environ.get('GITHUB_ACTIONS')=='true';assert b.command(['git','-C',str(source),'rev-parse','HEAD']).stdout.strip()==b.SOURCE
root.mkdir();cid=None;result={'status':'FAIL','source':b.SOURCE,'runId':os.environ['GITHUB_RUN_ID'],'timersChanged':False,'manualContainmentAfterInjection':False};start=time.monotonic()
try:
 cid=b.launch(source,root,image,['python3','scripts/work8/ci-isolated-unix.py','node','scripts/work8/closure-launcher.cjs','launcher','platform']);info=b.inspect(cid);b.assert_boundary(info)
 result['boundary']={k:info['HostConfig'][k] for k in ['NetworkMode','Memory','MemorySwap','PidsLimit','NanoCpus','ReadonlyRootfs','Privileged','CapDrop','SecurityOpt']}
 while not (root/'business-checkpoint.json').exists() or len(json.loads((root/'business-checkpoint.json').read_text())['history'])<2:
  assert b.inspect(cid)['State']['Running'];assert time.monotonic()-start<90;time.sleep(.25)
 before=json.loads((root/'business-checkpoint.json').read_text());identity=json.loads((root/'identity.json').read_text());assert identity['launcher']==1
 top=b.command(['docker','top',cid,'-eo','pid,ppid,args']).stdout;result['preFaultProcesses']=top
 lines=top.splitlines()[1:];launcher=b.inspect(cid)['State']['Pid'];guards=[int(x.split()[0]) for x in lines if '/launcher-loss-guard.cjs ' in x];assert len(guards)==1;guard=guards[0]
 result['hostFaultTargets']={'launcher':launcher,'guard':guard};result['before']=before
 fault=time.monotonic()
 # Fault injection from ancestor namespace: PID1 cannot be SIGKILLed from its own namespace.
 for pid in [launcher,guard]:os.kill(pid,signal.SIGSTOP)
 for pid in [guard,launcher]:os.kill(pid,signal.SIGKILL)
 while b.inspect(cid)['State']['Running']:
  assert time.monotonic()-fault<30,'AUTOMATIC_PLATFORM_CONTAINMENT_FAILED';time.sleep(.1)
 result['automaticContainmentMs']=(time.monotonic()-fault)*1000;result['exitCode']=b.inspect(cid)['State']['ExitCode'];assert result['exitCode']==137
 frozen=b.file_hashes(root);time.sleep(6);assert frozen==b.file_hashes(root);result['sixSecondNoWriteObservation']=True
 result['after']=json.loads((root/'business-checkpoint.json').read_text());assert result['after']==before
 result['status']='PASS_SCOPED_AUTOMATIC_PID1_CONTAINMENT';result['paidInference']=0;result['externalCommerce']=0
 result['limitations']=['Existing CI Docker PID1 boundary only; production entrypoint mapping and external health monitoring are not certified','No delivered owner alert','Unchanged real commerce worker, synthetic admitted task; not all enabled stores or transports']
finally:
 if cid:
  logs=b.command(['docker','logs',cid],check=False);(root/'console.log').write_text(logs.stdout+'\n'+logs.stderr);result['cleanupAfterEvidence']=True;b.command(['docker','rm','--force',cid],check=False)
 result['elapsedSeconds']=time.monotonic()-start;b.save(root/'receipt.json',result)
