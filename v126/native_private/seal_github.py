#!/usr/bin/env python3
"""Terminate exact scope; redact no secrets by publishing only admitted receipts."""
import hashlib,json,os,pathlib,re,shutil,stat,subprocess
from verify_final import verify_final
assert os.getuid()==0
CONTROL=pathlib.Path(__file__).resolve().parent;run=os.environ['GITHUB_RUN_ID'];assert run.isdigit()
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v126-native-'+run);runtime=root/'runtime';name='work8-v126-native-gh-'+run
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
def sha(b):return hashlib.sha256(b).hexdigest()
def command(argv):
 p=subprocess.run(argv,stdin=subprocess.DEVNULL,capture_output=True,timeout=30)
 assert len(p.stdout)+len(p.stderr)<=1048576
 return p
def require(condition,message):
 if not condition:raise RuntimeError(message)
listing=command(['docker','ps','-a','--format','{{json .}}']);require(listing.returncode==0,'DOCKER_INVENTORY_UNAVAILABLE')
containers=[json.loads(line)for line in listing.stdout.decode().splitlines()if line.strip()]
removed=False
if any(x['Names']==name for x in containers):
 inspect=command(['docker','inspect',name]);require(inspect.returncode==0,'EXACT_NATIVE_INSPECTION_UNAVAILABLE')
 x=json.loads(inspect.stdout)[0];assert x['Image']==IMAGE and x['Config']['Labels'].get('empireai.v126.native')==name
 if x['State']['Running']:
  p=command(['docker','stop','--time','8',name]);require(p.returncode==0,'EXACT_NATIVE_STOP_FAILED')
 x=json.loads(command(['docker','inspect',name]).stdout)[0];require(not x['State']['Running'],'NATIVE_STILL_RUNNING')
 p=command(['docker','rm',name]);require(p.returncode==0,'EXACT_NATIVE_REMOVE_FAILED');removed=True
listing=command(['docker','ps','-a','--format','{{json .}}']);require(listing.returncode==0,'FINAL_DOCKER_INVENTORY_UNAVAILABLE')
require(not any(json.loads(line)['Names']==name for line in listing.stdout.decode().splitlines()if line.strip()),'NATIVE_CONTAINER_NOT_ABSENT')
labelled=command(['docker','ps','-aq','--filter','label=empireai.v126.native='+name])
require(labelled.returncode==0,'FINAL_LABEL_INVENTORY_UNAVAILABLE');require(labelled.stdout.strip()==b'','SCOPED_CONTAINER_REMAINS')
private=root/'private';forbidden=[]
if private.exists():
 config_path=private/'native-bootstrap.json'
 if config_path.exists():
  require(config_path.is_file()and not config_path.is_symlink(),'PRIVATE_CONFIG_TYPE')
  cfg=json.loads(config_path.read_text())
  forbidden=[cfg[k].encode()for k in ['founderEmail','founderPassword','adminPassword']]
 for n in ['native-bootstrap.json','owner-policy.json']:
  p=private/n
  if p.exists():require(p.is_file()and not p.is_symlink(),'PRIVATE_FILE_TYPE');p.unlink()
 require(not any(private.iterdir()),'UNEXPECTED_PRIVATE_FILE');private.rmdir()
require(not private.exists(),'PRIVATE_CREDENTIALS_REMAIN')
git=['git','-c','safe.directory='+str(CONTROL.parents[1]),'-C',str(CONTROL.parents[1])]
require(subprocess.check_output(git+['rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA'],'CURRENT_HEAD_MISMATCH')
require(subprocess.check_output(git+['status','--porcelain','--untracked-files=all'])==b'','CHECKOUT_CHANGED')
manifest=json.loads((CONTROL/'source-manifest.json').read_text())
w=manifest['workflow'];wb=(CONTROL.parents[1]/w['path']).read_bytes();require(len(wb)==w['bytes']and sha(wb)==w['sha256'],'CURRENT_WORKFLOW_MISMATCH')
require({p['path']for p in manifest['repositoryFiles']}=={'vercel.json','empireai-web/vercel.json'},'REPOSITORY_CONTROL_SET_MISMATCH')
for pin in manifest['repositoryFiles']:
 p=CONTROL.parents[1]/pin['path'];require(p.is_file()and not p.is_symlink(),'REPOSITORY_CONTROL_TYPE')
 b=p.read_bytes();require(len(b)==pin['bytes']and sha(b)==pin['sha256'],'CURRENT_REPOSITORY_CONTROL_MISMATCH')
 require(json.loads(b)['git']['deploymentEnabled']['work8/v126-native-private-20261113-a02']is False,'DOWNSTREAM_DEPLOYMENT_NOT_DISABLED')
for pin in manifest['files']:
 p=CONTROL/pin['path'];b=p.read_bytes();require(len(b)==pin['bytes']and sha(b)==pin['sha256'],'CURRENT_SOURCE_MISMATCH')
publish=root/'publish';require(not publish.exists(),'PUBLISH_DESTINATION_NOT_FRESH');publish.mkdir(mode=0o755)
names={
 'admission.json':root/'admission.json',
 'prepared-runtime.json':runtime/'evidence/prepared-runtime.json',
 'exact-frontend.json':runtime/'evidence/exact-frontend.json',
 'carrier-termination.json':runtime/'evidence/carrier-termination.json',
 'preparation-first-failure.json':runtime/'evidence/preparation-first-failure.json',
 'private-launch-first-failure.json':runtime/'evidence/private-launch-first-failure.json',
 'backend-ready.json':runtime/'runtime-output/backend-ready.json',
 'runtime-ready.json':runtime/'runtime-output/runtime-ready.json',
 'runtime-termination.json':runtime/'runtime-output/runtime-termination.json',
 'delegated-native-session.json':runtime/'runtime-output/delegated-native-session.json',
 'technical-client-result.json':root/'technical-client-result.json',
 'execution-first-failure.json':root/'execution-first-failure.json',
}
rows=[];total=0
for name,path in names.items():
 if not path.exists():continue
 st=path.lstat();require(stat.S_ISREG(st.st_mode)and st.st_nlink==1 and st.st_size<=4194304,'RECEIPT_TYPE_OR_SIZE')
 b=path.read_bytes();value=json.loads(b)
 require(not any(secret in b for secret in forbidden),'PRIVATE_VALUE_IN_PUBLIC_RECEIPT')
 # Actual addresses and secret-bearing keys are refused rather than redacted after publication.
 require(re.search(rb'[A-Za-z0-9.!#$%&\x27*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',b)is None,'PRIVATE_EMAIL_IN_PUBLIC_RECEIPT')
 def check(v):
  if isinstance(v,dict):
   for k,w in v.items():
    require(k.lower()not in ['password','founderpassword','adminpassword','token','cookie','authorization','set-cookie','sessionsecret'],'SECRET_KEY_IN_PUBLIC_RECEIPT');check(w)
  elif isinstance(v,list):
   for w in v:check(w)
 check(value);total+=len(b);require(total<=20971520,'FINAL_PAYLOAD_BOUND')
 p=publish/name;p.write_bytes(b);p.chmod(0o644);rows.append({'path':name,'bytes':len(b),'sha256':sha(b)})
native_path=runtime/'runtime-output/delegated-native-session.json';native=json.loads(native_path.read_text())if native_path.exists()else{}
final={'schema':'v126-github-private-native-final-v1','runId':run,'attempt':1,'sourceCommit':os.environ['GITHUB_SHA'],
 'sourceManifestSHA256':sha((CONTROL/'source-manifest.json').read_bytes()),'currentSourceVerified':True,
 'checkoutClean':True,'containerAbsent':True,'containerRemoved':removed,'privateCredentialsAndPolicyRemoved':True,
 'status':native.get('status','FAIL_BEFORE_DELEGATED_NATIVE_RESULT'),'inputActor':'DELEGATED_TECHNICAL_OPERATOR',
 'ownerActionObserved':False,'wholeRowAccepted':False,'publicPortsCreated':False,'productionMutation':False,
 'payloads':rows,'maximumBytes':20971520,'retentionDays':7}
b=(json.dumps(final,indent=2)+'\n').encode();(publish/'final-result.json').write_bytes(b);(publish/'final-result.json').chmod(0o644)
index={'schema':'v126-final-evidence-index-v1','payloads':rows+[{'path':'final-result.json','bytes':len(b),'sha256':sha(b)}]}
(publish/'evidence-index.json').write_text(json.dumps(index,indent=2)+'\n');(publish/'evidence-index.json').chmod(0o644)
require(sum(p.stat().st_size for p in publish.iterdir())<=20971520,'FINAL_ARTIFACT_BOUND')
verified=verify_final(publish)
with open(os.environ['GITHUB_OUTPUT'],'a')as output:output.write('custody_ready=true\n')
print(json.dumps({'status':final['status'],'finalResultSHA256':sha(b),'custodyReady':True,'assembledByteReadback':verified,'wholeRowAccepted':False}))
