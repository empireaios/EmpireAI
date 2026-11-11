#!/usr/bin/env python3
"""Require complete bounded diagnostic custody, never original browser acceptance."""
import hashlib,json,os,pathlib,stat,subprocess

def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(out,name):
 p=out/name;s=p.lstat();assert p.name==name and stat.S_ISREG(s.st_mode)and s.st_nlink==1 and not p.is_symlink()and s.st_size<=2097152;return json.loads(p.read_text())
def verify_evidence(out,run,head):
 index=read(out,'evidence-index.json');assert index['schema']=='v116-browser-renderer-diagnostic-index-v1'and index['runId']==run and index['launchCommit']==head
 assert index['applicationStarted']is False and index['acceptanceEvidence']is False and index['maximumTotalBytesIncludingIndex']==8388608 and index['retentionDays']==7
 assert len(index['payloads'])==len({x['path']for x in index['payloads']})
 actual={p.name for p in out.iterdir()};assert actual=={x['path']for x in index['payloads']}|{'evidence-index.json'}
 total=0
 for p in out.iterdir():
  s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=2097152;total+=s.st_size
 assert total<=8388608
 for x in index['payloads']:
  p=out/x['path'];assert p.name==x['path']and p.stat().st_size==x['bytes']and digest(p)==x['sha256']
 host=read(out,'host-execution.json');assert host['status']=='DIAGNOSTIC_CAPTURE_COMPLETE_NOT_ACCEPTANCE'and host['runId']==run
 assert host['applicationStarted']is False and host['acceptanceEvidence']is False and host['resourceDifferentialPermitted']is False and host['subsequentResourceChangeAuthorized']is False
 assert host['allInputsPreserved']is True and len(host['cases'])==1 and host['cases'][0]['case']=='original96'and host['cases'][0]['status']=='PASS_CAPTURED_BROWSER_DIAGNOSTIC_ONLY'
 assert not any(host.get(k)for k in ['firstFailure','cleanupFailure','preservationFailure'])
 for termination in [host['termination'],read(out,'provider-termination.json')]:assert termination['scopedContainersAbsent']is True and termination['labelledContainersAbsent']is True and termination['customNetworksCreated']is False
 custody=read(out,'private-custody.json');assert custody['status']=='PASS_BROWSER_ONLY_BOUNDED_CUSTODY'and custody['containersAbsent']is True and custody['applicationOrOwnerDataIncluded']is False and custody['credentialsOrPolicyCreated']is False
 assert len(custody['cases'])==1 and custody['cases'][0]['case']=='original96'and not custody['cases'][0]['rejected']
 probe=read(out,'original96-probe-result.json');assert probe['schema']=='v116-browser-renderer-resource-diagnostic-v1'and probe['case']=='original96'and probe['expectedPidsMax']==96
 assert probe['status']in['CAPTURED_BROWSER_SUCCESS','CAPTURED_BROWSER_FAILURE','DIAGNOSTIC_35S_DEADLINE']
 for k in ['applicationStarted','authenticationStarted','ownerStateMounted','acceptanceEvidence']:assert probe[k]is False
 snapshots=probe['snapshots'];assert 2<=len(snapshots)<=16
 for s in snapshots:
  assert s['rawCgroup']['pids.max']=='96'and s['rawCgroup']['memory.max']=='2147483648'
  for raw,parsed in [('pids.events','pidsEvents'),('memory.events','memoryEvents')]:
   pairs=[line.split()for line in s['rawCgroup'][raw].splitlines()];assert all(len(pair)==2 and pair[1].isdigit()for pair in pairs);assert len({pair[0]for pair in pairs})==len(pairs);assert {k:int(v)for k,v in pairs}==s[parsed]
 for field,source,key in [('pidsMaxEventsDelta','pidsEvents','max'),('memoryOOMEventsDelta','memoryEvents','oom'),('memoryOOMKillEventsDelta','memoryEvents','oom_kill')]:
  values=[s[source][key]for s in snapshots];assert all(isinstance(v,int)and not isinstance(v,bool)and v>=0 for v in values);assert probe[field]==values[-1]-values[0]>=0
 assert host['cases'][0]['pidsMaxEventsDelta']==probe['pidsMaxEventsDelta']and host['cases'][0]['probeResultSHA256']==digest(out/'original96-probe-result.json')
 namespaces=read(out,'host-namespaces.json');assert probe['runtime']['networkNamespace']!=namespaces['network']and probe['runtime']['processNamespace']!=namespaces['pid']
 initial=read(out,'original96-prelaunch-container.json');h=initial['HostConfig'];assert initial['Image']=='sha256:fee853fafa59550d162cef52bca02d907694b44ebf6ef9fb075bcc0c65d8dedb'
 assert initial['State']['Status']=='created'and initial['State']['Pid']==0 and h['PidsLimit']==96 and h['Memory']==h['MemorySwap']==2147483648 and h['NanoCpus']==2000000000
 assert probe['environment']['HOSTNAME']==probe['runtime']['hostname']==initial['Config']['Hostname']==initial['Id'][:12]
 assert h['NetworkMode']=='none'and h['ReadonlyRootfs']and h['CapDrop']==['ALL']and not h['CapAdd']and h['SecurityOpt']==['no-new-privileges']and h['IpcMode']=='private'and h['ShmSize']==134217728
 assert {m['Destination']:m['RW']for m in initial['Mounts']if m['Type']=='bind'}=={'/control':False,'/node':False,'/node_modules':False,'/output':True}
 assert h['CgroupnsMode']=='private'and h['Ulimits']==[{'Name':'core','Hard':0,'Soft':0},{'Name':'fsize','Hard':33554432,'Soft':33554432}]
 assert h['LogConfig']=={'Type':'json-file','Config':{'max-file':'2','max-size':'256k'}}
 terminal=read(out,'original96-terminal-container.json');assert terminal['Id']==initial['Id']and not terminal['State']['Running']
 outcome=read(out,'original96-host-outcome.json');assert outcome['case']=='original96'and outcome['expectedPidsMax']==96 and outcome['removed']is True and outcome['diagnosticOnly']is True
 assert outcome['exitCode']==terminal['State']['ExitCode']and outcome['OOMKilled']==terminal['State']['OOMKilled']
 for n in ['original96-stdout.log','original96-stderr.log']:assert n in actual and(out/n).stat().st_size<=1048576
 carrier=read(out,'never-started-carrier.json');assert carrier['applicationStarted']is False and carrier['applicationFilesCopied']is False and carrier['onlyCopiedPath']=='/usr/local/bin/node'
 assert all(carrier[k]['Status']=='created'and carrier[k]['Pid']==0 for k in ['initialState','beforeRemovalState'])
 assert not any('conditional256'in n for n in actual)
 return{'status':'PASS_COMPLETE_BASELINE_BROWSER_DIAGNOSTIC_CUSTODY_ONLY','case':'original96','browserOutcome':probe['status'],'pidsMaxEventsDelta':probe['pidsMaxEventsDelta'],'applicationExecuted':False,'originalAcceptanceGranted':False}

def main():
 P=pathlib.Path(__file__).resolve().parent;REPO=P.parents[1];run=os.environ['GITHUB_RUN_ID'];head=os.environ['GITHUB_SHA'];out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-browser-renderer-'+run)/'evidence'
 assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()==head
 assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=REPO,text=True).strip()
 m=json.loads((P/'source-manifest.json').read_text())
 for x in m['files']:
  p=REPO/x['path'];assert p.is_file()and not p.is_symlink()and p.stat().st_size==x['bytes']and digest(p)==x['sha256']
 launch=read(out,'launch-admission.json');assert launch['launchCommit']==head and launch['sourceManifestSHA256']==digest(P/'source-manifest.json')and launch['caseNames']==['original96']
 print(json.dumps(verify_evidence(out,run,head)))
if __name__=='__main__':main()
