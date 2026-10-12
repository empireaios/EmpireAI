#!/usr/bin/env python3
"""External CI controller. Existing container boundary; no endurance rerun."""
import importlib.util,json,os,pathlib,subprocess,sys,time,hashlib
spec=importlib.util.spec_from_file_location('boundary',pathlib.Path(__file__).with_name('ci-prerequisite.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
source,root=map(lambda p:pathlib.Path(p).resolve(),sys.argv[1:3]);image=sys.argv[3]
assert os.environ.get('GITHUB_ACTIONS')=='true'
assert b.command(['git','-C',str(source),'rev-parse','HEAD']).stdout.strip()==b.SOURCE
root.mkdir(parents=True,exist_ok=False)
receipts=[]
for mode in ['observers','launcher-guard']:
 out=root/mode;out.mkdir();cid=None;start=time.monotonic();result={'mode':mode,'status':'FAIL','productionTimersOverridden':False}
 try:
  cid=b.launch(source,out,image,['python3','scripts/work8/ci-isolated-unix.py','node','scripts/work8/post-monitoring.cjs','hold',mode]);b.assert_boundary(b.inspect(cid))
  result['container']=cid;result['boundary']=b.inspect(cid)['HostConfig']
  injected=False
  while b.inspect(cid)['State']['Running']:
   assert time.monotonic()-start<720,'Execution deadline'
   if mode=='launcher-guard' and not injected and (out/'identity.json').exists() and (out/'writer.jsonl').exists():
    before=(out/'writer.jsonl').read_bytes()
    b.command(['docker','exec',cid,'python3','scripts/work8/ci-isolated-unix.py','node','scripts/work8/post-monitoring.cjs','kill-pair'])
    injected=True;fault=time.monotonic()
    # Host controller independently observes launcher/guard process loss.
    top=b.command(['docker','top',cid,'-eo','pid,ppid,args']).stdout
    result['postFaultProcessInventory']=top
    b.command(['docker','kill',cid])
    result['externalContainmentMs']=(time.monotonic()-fault)*1000
    assert not b.inspect(cid)['State']['Running']
    frozen=b.file_hashes(out);time.sleep(1);assert frozen==b.file_hashes(out)
    assert (out/'writer.jsonl').read_bytes().startswith(before)
    result['writerHistoryPreserved']=True;result['writesAfterContainment']=0
    result['externalControllerRequired']=True
    break
   time.sleep(.5)
  result['exitCode']=b.inspect(cid)['State']['ExitCode']
  if mode=='observers':assert result['exitCode']==0
  else:assert injected and result['externalContainmentMs']<660000
  result['status']='PASS_SCOPED_MONITORING_CONTAINMENT'
 finally:
  if cid:
   logs=b.command(['docker','logs',cid],check=False);(out/'console.log').write_text(logs.stdout+'\n'+logs.stderr)
   b.command(['docker','rm','--force',cid],check=False)
  result['elapsedSeconds']=time.monotonic()-start
  # Exclude large host configuration; retain only actual enforced safety fields.
  if 'boundary' in result:result['boundary']={k:result['boundary'][k] for k in ['NetworkMode','Memory','MemorySwap','PidsLimit','NanoCpus','ReadonlyRootfs','Privileged','CapDrop','SecurityOpt']}
  b.save(out/'receipt.json',result);receipts.append(result)
b.save(root/'receipt.json',{'status':'PASS_SCOPED_NOT_REQUIREMENT30_CLOSURE','runId':os.environ['GITHUB_RUN_ID'],'source':b.SOURCE,'workflow':os.environ['GITHUB_SHA'],'arms':receipts,'limitations':['Synthetic protected writer; not full commerce process','Existing isolated CI external controller is not production monitoring','Owner notification delivery not examined'],'paidInference':0,'externalCommerce':0})
