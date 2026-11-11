#!/usr/bin/python3
"""Post-upload assertion of retained original pre-cutover scope, never whole Work8."""
import hashlib,json,os,pathlib,re,stat,subprocess,sys
SOURCE='6c1e63ba20619ee480742fd87dc810ca93152e22'
IMAGE='sha256:f28556a588b84f8256800a311943c204019fa5336cd10e5c99cb703f0df812e0'
root=pathlib.Path(sys.argv[1]);assert root.is_absolute()and root.resolve(strict=True)==root
def raw(name):
 p=root/name;assert p.is_relative_to(root)
 for parent in [p,*p.parents]:
  if parent==root:break
  assert not parent.is_symlink(),'SYMLINK_REFUSED'
 s=p.lstat();assert stat.S_ISREG(s.st_mode)and s.st_nlink==1 and s.st_size<=1048576
 return p.read_bytes()
index=json.loads(raw('INDEX.json'));assert index['schema']=='v116-original-precutover-public-evidence-index-v1'
assert index['collectionStatus']=='PASS_BOUNDED_COLLECTION'and not any(x['status']=='REFUSED'for x in index['observations'])
seen=set();total=len(raw('INDEX.json'))
for item in index['payloads']:
 name=item['path'];assert name not in seen and not pathlib.Path(name).is_absolute()and'..'not in pathlib.Path(name).parts;seen.add(name)
 data=raw(name);assert len(data)==item['bytes']and hashlib.sha256(data).hexdigest()==item['sha256'];total+=len(data)
assert total<=10*1048576
def read(name):
 assert name in seen,'MANDATORY_EVIDENCE_NOT_PRODUCED:'+name
 return json.loads(raw(name))['evidence']
receipt=read('native/receipt.json');assert receipt['schema']=='precutover-closure-v1'and receipt['passed']is True and receipt['buildSha']==SOURCE
for field in ['permanentProfile','noExpiry','independentVolumeRestore','wholeDedicatedVolume','financialJournalContinuity','sourceRootsQuarantinedBeforeReopen','identityContinuity','missionHistoryContinuity','shadowOwnershipAuthorityContinuity','redisSessionAndTerminalContinuity','noDuplicateTerminalExecution','mutationGuards','unavailableRedisReadiness503']:assert receipt[field]is True,field
assert receipt['observedSteadySeconds']==30 and receipt['providerCredentials']==0 and receipt['productionTouched']is False and receipt['commerce']=='LOCKED'and receipt['birth']=='NOT_BORN'
fixture=read('native/fixture-composition.json');assert fixture['schema']=='v116-original-precutover-fixture-composition-v1'and fixture['source']==SOURCE and fixture['originalAssertionsChanged']is False and fixture['originalPassed']is True and fixture['launches']==2 and fixture['policyRemoved']is True
assert fixture['productionAccess']is False and fixture['genuineOwnerEvidence']is False and fixture['providerCredentials']==0 and fixture['wholeRowAccepted']is False
events=fixture['events'];assert [x['phase']for x in events]==['prepared-source','offline-shadow-source','prepared-restored','offline-shadow-restored']
for i,label in [(0,'source'),(2,'restored')]:
 e=events[i];assert e['source']==SOURCE and re.fullmatch(r'[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}',e['generation'])and re.fullmatch(r'[0-9a-f]{40}',e['redisRunId'])
 assert re.fullmatch(r'[0-9a-f]{64}',e['cutoverDigest'])and re.fullmatch(r'[0-9a-f]{64}',e['originalDataSHA256'])
 assert isinstance(e['originalDataFileCount'],int)and e['originalDataFileCount']>=0 and e['originalDataBytesPreserved']is True and e['newAuthorityExplicit']is True
 assert e['oldAuthorityCopiedAsHistory']is(label=='restored')and e['runtimeUid']==65534 and e['operatorUid']==0
assert events[0]['generation']!=events[2]['generation']and events[0]['redisRunId']!=events[2]['redisRunId']and events[0]['cutoverDigest']!=events[2]['cutoverDigest']
for i in [1,3]:
 e=events[i];assert e['allRegisteredProcessesAbsent']is True and e['exclusiveGenerationLockVerified']is True
 assert isinstance(e['journalRevision'],int)and e['journalRevision']>0 and isinstance(e['registeredProcesses'],int)and e['registeredProcesses']>0
entry=read('native/entry-admission.json');assert entry['status']=='PASS_SOURCE_LIBRARY_AND_DEFAULT_LOADER_ADMISSION'and entry['source']==SOURCE and entry['originalAssertionCount']==49 and entry['originalApplicationSourceChanged']is False and entry['fixtureOverlayCount']==2
assert entry['librarySHA256']=='5048f19ec38c708dd1b139f7a3f60cb8eb5e9146cd4fdb6e978caffbcac87a1b'and entry['redisVersion']=='7.0.15'and entry['noNewPrivs']==1 and entry['network']=='PRIVATE_LOOPBACK_ONLY'and entry['capEff']=='00000000000800e3'
execution=read('native/entry-execution.json');assert execution['source']==SOURCE and execution['maximumSeconds']==840 and execution['code']==0 and execution['signal']is None and execution['timedOut']is False and execution['signalReceived']is None and execution['originalFixtureExecuted']is True
end=read('native/entry-result.json');assert end['status']=='ORIGINAL_PRECUTOVER_EXECUTED_PENDING_INDEPENDENT_REVIEW'and end['source']==SOURCE and end['original49AssertionsUnchanged']is True and end['sourceBytesUnchanged']is True and end['wholeQ5Accepted']is False
assert 'native/entry-first-failure.json'not in seen
http=read('native/http-observations.json');assert isinstance(http,list)and 0<len(http)<=1000
assert any(x.get('route')=='/health/ready'and x.get('status')==503 for x in http)
admission=read('host/actual-container-admission.json');assert admission['imageId']==IMAGE and admission['source']==SOURCE and admission['verifiedControls']is True
assert admission['networkMode']=='none'and admission['readOnlyRootfs']is True and admission['privileged']is False and admission['noPublishedPorts']is True and admission['productionVolumesAttached']is False
assert admission['user']=='0:0'and admission['capDrop']==['ALL']and set(admission['capAdd'])=={'SETUID','SETGID','CHOWN','DAC_OVERRIDE','KILL','SYS_PTRACE'}
assert admission['memory']==3221225472 and admission['memorySwap']==3221225472 and admission['pidsLimit']==256 and admission['nanoCpus']==2000000000
assert [x['destination']for x in admission['mounts']if not x['readonly']]==['/evidence']
assert set(admission['tmpfs'])=={'/data','/work8-native','/tmp'}
host=read('host/container-execution.json');assert host['exitCode']==0 and host['timedOut']is False and host['maximumSeconds']==900 and host['containerStopped']is True and host['originalPassMarkerPresent']is True
termination=read('host/independent-termination.json');assert termination['imageId']==IMAGE and termination['exactContainerAbsent']is True and termination['currentRunLabelAbsent']is True and termination['nativeOutputNormalized']is True
assert termination['schema']=='v116-precutover-independent-termination-v1'and termination['containerName']=='work8-v116-precutover-'+str(termination['runId'])
assert admission['containerName']==termination['containerName']and str(admission['runId'])==str(termination['runId'])
assert host['containerName']==termination['containerName']and str(host['runId'])==str(termination['runId'])and host['source']==SOURCE and host['imageId']==IMAGE
package=read('host/package-termination.json');assert package['packageContainerRemoved']is True and package['neverStartedByWrapper']is True
dependencies=read('dependencies/dependency-staging-receipt.json');assert dependencies['manifestSHA256']=='4718286af9c9a747f98da2197305271433a2a57505b9939f7bc34b64ce6bb87b'and len(dependencies['mounts'])==6
for name in ['host/retained-input-integrity.json','host/retained-input-metadata.json']:read(name)
# This is the real post-upload source boundary; metadata controls use a genuine
# disposable Git repository, never a runtime bypass or fabricated source HEAD.
control=pathlib.Path(__file__).resolve().parent;repo=control.parent.parent
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
assert head==os.environ['GITHUB_SHA']and re.fullmatch(r'[0-9a-f]{40}',head)
assert subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=repo,text=True).strip()==''
manifest_path=control/'source-manifest.json';assert not manifest_path.is_symlink();manifest_bytes=manifest_path.read_bytes();manifest=json.loads(manifest_bytes)
assert manifest['schema']=='empireai-v116-precutover-hosted-source-v1'
source=read('host/source-admission.json');assert source['sourceHead']==head and source['sourceManifestSHA256']==hashlib.sha256(manifest_bytes).hexdigest()and source['originalApplicationSourceUnchanged']is True and source['originalAssertionCount']==49
paths=set()
for item in manifest['files']:
 relative=pathlib.Path(item['path']);assert not relative.is_absolute()and'..'not in relative.parts and str(relative)not in paths;paths.add(str(relative))
 file=repo/relative
 for parent in [file,*file.parents]:
  if parent==repo:break
  assert not parent.is_symlink()
 assert file.is_file()and file.stat().st_nlink==1
 data=file.read_bytes();assert len(data)==item['bytes']and hashlib.sha256(data).hexdigest()==item['sha256']
assert str(pathlib.Path(__file__).resolve().relative_to(repo))in paths

print(json.dumps({'status':'PASS_ORIGINAL_PRECUTOVER_SCOPE_RETAINED_FOR_INDEPENDENT_ADJUDICATION','source':SOURCE,'originalAssertionCount':49,'actualTwoLaunches':True,'publicArtifactBytesIncludingIndex':total,'wholeQ5Accepted':False,'wholeWork8Accepted':False,'genuineOwnerAcceptance':False}))
