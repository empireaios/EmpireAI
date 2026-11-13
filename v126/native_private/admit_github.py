#!/usr/bin/env python3
import hashlib,json,os,pathlib,re,subprocess
CONTROL=pathlib.Path(__file__).resolve().parent
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create'and os.environ['GITHUB_RUN_ATTEMPT']=='1'
event=json.loads(pathlib.Path(os.environ['GITHUB_EVENT_PATH']).read_text())
assert event['ref_type']=='branch'and event['ref']=='work8/v128-connector-owner-native-20261113-a03'
run=os.environ['GITHUB_RUN_ID'];assert run.isdigit()
head=os.environ['GITHUB_SHA'];assert re.fullmatch('[a-f0-9]{40}',head)
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==head
assert subprocess.check_output(['git','status','--porcelain','--untracked-files=all'])==b''
owner=os.environ.get('EMPIREAI_WORK8_NATIVE_OWNER_EMAIL','').strip().lower()
assert hashlib.sha256(owner.encode()).hexdigest()=='a437be3d7f2e7927959c2be2040016464de75d69529d9abd197e47a8caa21267','PRIVATE_OWNER_BINDING_REQUIRED'
manifest=json.loads((CONTROL/'source-manifest.json').read_text())
w=manifest['workflow'];wb=(CONTROL.parents[1]/w['path']).read_bytes();assert len(wb)==w['bytes']and hashlib.sha256(wb).hexdigest()==w['sha256']
assert {p['path']for p in manifest['repositoryFiles']}=={'vercel.json','empireai-web/vercel.json'}
for p in manifest['repositoryFiles']:
 file=CONTROL.parents[1]/p['path'];assert file.is_file()and not file.is_symlink()
 b=file.read_bytes();assert len(b)==p['bytes']and hashlib.sha256(b).hexdigest()==p['sha256']
 assert json.loads(b)['git']['deploymentEnabled'][event['ref']]is False
assert {p['path']for p in manifest['applicationFiles']}=={
 'backend/src/runtime/commerce-runtime/governed/runtime.ts',
 'backend/src/runtime/commerce-runtime/governed/work8-connector-source.ts',
 'backend/src/runtime/commerce-runtime/governed/work8-connector-walkthrough.ts',
 'empireai-web/components/owner/work7/ConnectorSourceCandidates.tsx',
 'empireai-web/components/owner/work7/OwnerJourneys.tsx',
 'empireai-web/lib/owner/runtime-identity.mjs','empireai-web/lib/owner/runtime-release-identity.test.ts'}
for p in manifest['applicationFiles']:
 file=CONTROL.parents[1]/p['path'];assert file.is_file()and not file.is_symlink()
 b=file.read_bytes();assert len(b)==p['bytes']and hashlib.sha256(b).hexdigest()==p['sha256']
for p in manifest['files']:
 file=CONTROL/p['path'];assert file.is_file()and not file.is_symlink()
 b=file.read_bytes();assert len(b)==p['bytes']and hashlib.sha256(b).hexdigest()==p['sha256']
r=json.loads((CONTROL/'reservation.json').read_text())
assert r['operationIdentity']=='V128-CONNECTOR-OWNER-NATIVE-A03-20261113'and r['status']=='RESERVED_IN_CANONICAL_LEDGER'
assert r['cumulativeCeilingUSD']==1000 and r['maximumNewExposureUSD']==1
assert type(r['expectedCountedExposureUSD'])in (int,float)and 0<r['expectedCountedExposureUSD']<=1000
for key in ['savedLedgerSHA256','independentReadbackSHA256']:assert re.fullmatch('[a-f0-9]{64}',r[key]or'')
assert type(r['savedLedgerVersion'])is int and r['savedLedgerVersion']>56
assert r['gitPublicationIdentity']==event['ref']
docker=json.loads(subprocess.check_output(['docker','info','--format','{{json .}}']))
assert docker['MemoryLimit']and docker['PidsLimit']and docker['CpuCfsPeriod']and docker['CpuCfsQuota']
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v126-native-'+run);assert not root.exists();root.mkdir(mode=0o700)
receipt={'schema':'v126-github-native-source-financial-admission-v1','runId':run,'attempt':1,'sourceCommit':head,
 'ownerPrivateBindingVerified':True,'ownerEmailDisclosed':False,'reservation':r,
 'sourceManifestSHA256':hashlib.sha256((CONTROL/'source-manifest.json').read_bytes()).hexdigest(),
 'sourceFiles':len(manifest['files']),'applicationStarted':False,'wholeRowAccepted':False}
(root/'admission.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'status':'PASS_SOURCE_PRIVATE_CONFIG_FINANCIAL_ADMISSION','runId':run,'sourceCommit':head}))
