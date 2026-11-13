#!/usr/bin/env python3
"""Drain the exact new scope and read back every safe final byte before upload."""
import hashlib,json,os,pathlib,re,stat,subprocess
from verify_final import verify_final
assert os.getuid()==0
CONTROL=pathlib.Path(__file__).resolve().parent;run=os.environ['GITHUB_RUN_ID'];assert run.isdigit()
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v126-native-'+run);runtime=root/'runtime'
NATIVE_IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
BROWSER_IMAGE='sha256:fee853fafa59550d162cef52bca02d907694b44ebf6ef9fb075bcc0c65d8dedb';CAP=268435456
def sha(b):return hashlib.sha256(b).hexdigest()
def require(condition,message):
 if not condition:raise RuntimeError(message)
def command(argv):
 p=subprocess.run(argv,stdin=subprocess.DEVNULL,capture_output=True,timeout=30)
 require(len(p.stdout)+len(p.stderr)<=1048576,'PROVIDER_OUTPUT_BOUND');require(p.returncode==0,'PROVIDER_COMMAND_FAILED_'+str(p.returncode));return p.stdout
def inventory():return [json.loads(line)for line in command(['docker','ps','-a','--format','{{json .}}']).decode().splitlines()if line.strip()]
native='work8-v126-native-gh-'+run;browser='work8-v128-connector-browser-'+run
carrier='work8-v126-carrier-'+hashlib.sha256(str(runtime).encode()).hexdigest()[:16]
scopes=[(browser,BROWSER_IMAGE,'empireai.v128.connector.browser',browser),
 (native,NATIVE_IMAGE,'empireai.v126.native',native),
 ('work8-v128-frontend-build-'+run,NATIVE_IMAGE,'empireai.v128.frontend',run),
 ('work8-v128-frontend-carrier-'+run,NATIVE_IMAGE,'empireai.v128.frontend',run),
 (carrier,NATIVE_IMAGE,'empireai.v126.native.carrier',carrier)]
removed=[]
for name,image,label,value in scopes:
 if not any(x['Names']==name for x in inventory()):continue
 x=json.loads(command(['docker','inspect',name]))[0]
 require(x['Image']==image and x['Config']['Labels'].get(label)==value,'EXACT_SCOPE_IDENTITY_MISMATCH')
 if x['State']['Running']:command(['docker','stop','--time','8',name])
 x=json.loads(command(['docker','inspect',name]))[0];require(not x['State']['Running'],'SCOPED_CONTAINER_STILL_RUNNING')
 command(['docker','rm',name]);removed.append(name)
final_inventory=inventory()
for name,image,label,value in scopes:
 require(not any(x['Names']==name for x in final_inventory),'SCOPED_CONTAINER_REMAINS')
 require(command(['docker','ps','-aq','--filter','label='+label+'='+value]).strip()==b'','SCOPED_LABEL_REMAINS')
private=root/'private';forbidden=[]
if private.exists():
 p=private/'native-bootstrap.json'
 if p.exists():
  require(p.is_file()and not p.is_symlink(),'PRIVATE_CONFIG_TYPE');cfg=json.loads(p.read_text())
  forbidden=[cfg[k].encode()for k in ['founderEmail','founderPassword','adminPassword']]
 for name in ['native-bootstrap.json','owner-policy.json','connector-policy.json']:
  p=private/name
  if p.exists():require(p.is_file()and not p.is_symlink(),'PRIVATE_FILE_TYPE');p.unlink()
 require(not any(private.iterdir()),'UNEXPECTED_PRIVATE_FILE');private.rmdir()
require(not private.exists(),'PRIVATE_CREDENTIALS_REMAIN')
git=['git','-c','safe.directory='+str(CONTROL.parents[1]),'-C',str(CONTROL.parents[1])]
require(subprocess.check_output(git+['rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA'],'CURRENT_HEAD_MISMATCH')
require(subprocess.check_output(git+['status','--porcelain','--untracked-files=all'])==b'','CHECKOUT_CHANGED')
manifest=json.loads((CONTROL/'source-manifest.json').read_text())
def verify_pin(base,pin):
 p=base/pin['path'];require(p.is_file()and not p.is_symlink(),'CURRENT_SOURCE_TYPE')
 b=p.read_bytes();require(len(b)==pin['bytes']and sha(b)==pin['sha256'],'CURRENT_SOURCE_MISMATCH')
verify_pin(CONTROL.parents[1],manifest['workflow'])
require({p['path']for p in manifest['repositoryFiles']}=={'vercel.json','empireai-web/vercel.json'},'REPOSITORY_GUARD_SET')
for pin in manifest['repositoryFiles']:
 verify_pin(CONTROL.parents[1],pin)
 require(json.loads((CONTROL.parents[1]/pin['path']).read_bytes())['git']['deploymentEnabled']['work8/v128-connector-owner-native-20261113-a02']is False,'DEPLOYMENT_NOT_DISABLED')
for pin in manifest['applicationFiles']:verify_pin(CONTROL.parents[1],pin)
for pin in manifest['files']:verify_pin(CONTROL,pin)
publish=root/'publish';require(not publish.exists(),'PUBLISH_DESTINATION_NOT_FRESH');publish.mkdir(mode=0o755)
rows=[];total=0
def append(name,b,limit=4194304):
 global total
 require(pathlib.Path(name).name==name and len(b)<=limit,'PAYLOAD_NAME_OR_SIZE')
 total+=len(b);require(total<=CAP,'FINAL_PAYLOAD_BOUND')
 p=publish/name
 with p.open('xb')as f:f.write(b)
 p.chmod(0o644);rows.append({'path':name,'bytes':len(b),'sha256':sha(b)})
def public_json(path):
 s=path.lstat();require(stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=4194304,'RECEIPT_TYPE_OR_SIZE')
 b=path.read_bytes();value=json.loads(b)
 require(not any(secret in b for secret in forbidden),'PRIVATE_VALUE_IN_PUBLIC_RECEIPT')
 require(re.search(rb'[A-Za-z0-9.!#$%&\x27*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',b)is None,'PRIVATE_EMAIL_IN_PUBLIC_RECEIPT')
 def check(v):
  if isinstance(v,dict):
   for k,w in v.items():
    require(k.lower()not in ['password','founderpassword','adminpassword','token','cookie','authorization','set-cookie','sessionsecret'],'SECRET_KEY_IN_PUBLIC_RECEIPT');check(w)
  elif isinstance(v,list):
   for w in v:check(w)
 check(value);return b,value
paths={'admission.json':root/'admission.json','technical-client-result.json':root/'technical-client-result.json',
 'execution-first-failure.json':root/'execution-first-failure.json','connector-build-manifest.json':CONTROL/'connector-build-manifest.json',
 'connector-backend-build.json':CONTROL/'connector-backend-build.json','authority.json':CONTROL/'authority.json'}
for name in ['prepared-runtime.json','exact-frontend.json','carrier-termination.json','preparation-first-failure.json','private-container-admission.json',
 'private-launch-first-failure.json','connector-frontend-build.json','connector-frontend-build-first-failure.json',
 'connector-frontend-build-termination.json','connector-frontend-build-cleanup-failure.json',
 'connector-runtime-prepared.json','connector-runtime-preparation-first-failure.json',
 'connector-browser-containment.json','connector-browser-termination.json','connector-browser-first-failure.json','connector-browser-cleanup-failure.json']:
 paths[name]=runtime/'evidence'/name
for name in ['backend-ready.json','runtime-ready.json','runtime-termination.json','connector-source-admission.json','connector-backend-first-failure.json']:
 paths[name]=runtime/'runtime-output'/name
for name in ['connector-browser-result.json','connector-portfolio-desktop.json','connector-portfolio-mobile.json']:
 paths[name]=runtime/'browser-output'/name
values={}
for name,path in paths.items():
 if path.exists():b,value=public_json(path);append(name,b);values[name]=value
browser_result=values.get('connector-browser-result.json',{})
if browser_result.get('status')=='PASS_AUTHENTICATED_DESKTOP_MOBILE_CONNECTOR_SOURCE_RENDERING':
 admission=values['connector-source-admission.json'];record=admission['record']
 require(admission['status']=='ADMITTED_SOURCE_OBSERVATION_ONLY'and admission['replayStatus']=='ALREADY_ADMITTED','NATIVE_SOURCE_ADMISSION_NOT_COMPLETE')
 require(browser_result['sameCanonicalRecordAcrossViews']is True and browser_result['browserClosed']is True,'BROWSER_RESULT_INCOMPLETE')
 require({v['name']for v in browser_result['views']}=={'desktop','mobile'},'VIEW_SET_INCOMPLETE')
 for view in browser_result['views']:
  require(view['canonicalCandidate']==record and view['contextClosed']is True,'NATIVE_BROWSER_CANONICAL_MISMATCH')
  response=view['portfolioResponse'];require(response['path']=='connector-portfolio-'+view['name']+'.json','PORTFOLIO_RECEIPT_NAME')
  original=(runtime/'browser-output'/response['path']).read_bytes()
  require(len(original)==response['bytes']and sha(original)==response['sha256'],'PORTFOLIO_RECEIPT_BYTES')
  screenshot=view['screenshot'];require(screenshot['path']=='connector-source-'+view['name']+'.png','SCREENSHOT_NAME')
  require(screenshot['scope']=='VERIFIED_CANDIDATE_ARTICLE_ONLY'and screenshot['privateIdentityMaskApplied']is True,'SCREENSHOT_PRIVACY_SCOPE')
  p=runtime/'browser-output'/screenshot['path'];s=p.lstat()
  require(stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=8388608,'PNG_TYPE_OR_SIZE')
  b=p.read_bytes();require(len(b)==screenshot['bytes']and sha(b)==screenshot['sha256'],'PNG_BYTES')
  require(b[:8]==b'\x89PNG\r\n\x1a\n'and b[12:16]==b'IHDR','PNG_SIGNATURE')
  require(int.from_bytes(b[16:20],'big')==screenshot['pixels']['width']and int.from_bytes(b[20:24],'big')==screenshot['pixels']['height'],'PNG_DIMENSIONS')
  append(screenshot['path'],b,8388608)
archive_index=None
if 'connector-frontend-build.json'in values:
 info=values['connector-frontend-build.json']['frontendArchive'];p=runtime/'connector-frontend.tar.gz'
 require(info['path']==p.name and p.is_file()and not p.is_symlink()and p.stat().st_nlink==1,'FRONTEND_ARCHIVE_TYPE')
 require(p.stat().st_size==info['bytes']<=209715200,'FRONTEND_ARCHIVE_SIZE')
 h=hashlib.sha256();chunks=[]
 with p.open('rb')as f:
  while True:
   b=f.read(4194304)
   if not b:break
   name='connector-frontend.part-'+str(len(chunks)).zfill(3)+'.bin';append(name,b);h.update(b);chunks.append(rows[-1])
 require(h.hexdigest()==info['sha256'],'FRONTEND_ARCHIVE_HASH')
 archive_index={'schema':'v128-new-frontend-archive-chunks-v1','archive':info,'chunks':chunks,'allCompressedBytesReadBack':True}
 append('connector-frontend-archive.json',(json.dumps(archive_index,indent=2)+'\n').encode())
runtime_end=values.get('runtime-termination.json',{});browser_end=values.get('connector-browser-termination.json',{})
build_end=values.get('connector-frontend-build-termination.json',{})
success_checks={
 'browserViewsPassed':browser_result.get('status')=='PASS_AUTHENTICATED_DESKTOP_MOBILE_CONNECTOR_SOURCE_RENDERING',
 'nativeRuntimeTerminated':runtime_end.get('status')=='TERMINATED_AFTER_NATIVE_RUNTIME_READY',
 'nativeChildrenDrained':bool(runtime_end.get('children'))and all(c.get('drain')=='CHILD_CLOSED'for c in runtime_end.get('children',[])),
 'browserTerminated':browser_end.get('containerAbsent')is True and browser_end.get('exitCode')==0,
 'buildContainersTerminated':build_end.get('allAbsent')is True,
 'exactPreparedComposition':values.get('connector-runtime-prepared.json',{}).get('status')=='PASS_EXACT_NEW_BUILD_AND_RETAINED_SOURCE_PREPARATION',
 'technicalClientReturnedZero':values.get('technical-client-result.json',{}).get('status')=='PASS_PRIVATE_NATIVE_CONNECTOR_BROWSER_RETURNED_ZERO',
 'noRecordedFailure':not any('first-failure'in name or'cleanup-failure'in name for name in values),
 'newFrontendBytesRetained':archive_index is not None}
success=all(success_checks.values())
final={'schema':'v128-connector-owner-native-final-v1','runId':run,'attempt':1,'sourceCommit':os.environ['GITHUB_SHA'],
 'sourceManifestSHA256':sha((CONTROL/'source-manifest.json').read_bytes()),'currentSourceVerified':True,'checkoutClean':True,
 'containerAbsent':True,'browserContainerAbsent':True,'buildContainersAbsent':True,'removedContainers':removed,
 'privateCredentialsAndPolicyRemoved':True,'status':browser_result['status']if success else'FAIL_NATIVE_CONNECTOR_EXAMINATION_CONJUNCTION',
 'successConjunction':success_checks,
 'inputActor':'DELEGATED_TECHNICAL_OPERATOR','ownerActionObserved':False,'ownerDecisionGranted':False,'wholeRowAccepted':False,
 'publicPortsCreated':False,'productionMutation':False,'frontendArchiveRetained':archive_index is not None,
 'payloads':rows.copy(),'maximumBytes':CAP,'retentionDays':7}
b=(json.dumps(final,indent=2)+'\n').encode();append('final-result.json',b)
index={'schema':'v128-final-evidence-index-v1','maximumBytes':CAP,'payloads':rows}
(publish/'evidence-index.json').write_text(json.dumps(index,indent=2)+'\n');(publish/'evidence-index.json').chmod(0o644)
verified=verify_final(publish)
with open(os.environ['GITHUB_OUTPUT'],'a')as out:out.write('custody_ready=true\n')
print(json.dumps({'status':final['status'],'finalResultSHA256':sha(b),'custodyReady':True,'assembledByteReadback':verified,'wholeRowAccepted':False}))
if not success:raise SystemExit(1)
