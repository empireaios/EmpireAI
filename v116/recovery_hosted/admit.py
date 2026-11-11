#!/usr/bin/env python3
import hashlib,json,os,pathlib,re,subprocess
p=pathlib.Path(__file__).resolve().parent;root=p.parents[1]
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create'
assert os.environ['GITHUB_REF']=='refs/heads/work8/v116-o39-test1-20261111-a04'
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
a=json.loads((p/'launch-authority.json').read_text())
assert a['campaign']=='V116_MASTER_WORK8' and a['attempt']=='V116_E3_TEST1_A04'
assert a['standingOwnerDirective']=='V116' and a['technicalExecutionOnly'] is True
assert a['reservationCommitted'] is True and a['reservedUSD']=='2.00'
assert a['masterCeilingUSD']=='1000.00' and a['maximumAttempts']==1
assert a['jobTimeoutMinutes']==30 and a['containerTimeoutSeconds']==720
assert a['productionMutation'] is False and a['commerce']=='LOCKED' and a['pillow']=='NOT_BORN'
assert a['masterLedgerReference'] and a['independentReviewReference']
assert a['branch']=='work8/v116-o39-test1-20261111-a04'
assert re.fullmatch('[a-f0-9]{40}',a['expectedParentCommit'])
commit=subprocess.check_output(['git','cat-file','-p','HEAD'],text=True)
parents=[line.split(' ',1)[1] for line in commit.split('\n\n',1)[0].splitlines() if line.startswith('parent ')]
assert parents==[a['expectedParentCommit']]
assert hashlib.sha256((p/'technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'

manifest=json.loads((p/'source-manifest.json').read_text());assert manifest['schema']=='empireai-v116-test1-hosted-source-v1'
required={'.node-version','.github/workflows/work8-v116-o39-test1.yml','vercel.json','empireai-web/vercel.json',
 'v116/recovery_hosted/admit.py','v116/recovery_hosted/run-test1.sh','v116/recovery_hosted/retained_input.py',
 'v116/recovery_hosted/declared-recovery-objectives.json','v116/recovery_hosted/verify-evidence-boundary.mjs','v116/recovery_hosted/seal_evidence.py','v116/recovery_hosted/launch-authority.json','v116/recovery_hosted/technical-authority.json',
 'v116/test1/v116-test1-coordinator.mjs','v116/test1/v116-test1-business.mjs','v116/test1/v116-hh4-domain-state.mjs','v116/test1/canonical-business-records.mjs','v116/test1/native-commerce-baseline.mjs'}
assert {row['path'] for row in manifest['files']}==required and len(manifest['files'])==len(required)

for row in manifest['files']:
 target=root/row['path'];assert target.is_file() and not target.is_symlink()
 b=target.read_bytes();assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256']
for config in ['vercel.json','empireai-web/vercel.json']:
 assert json.loads((root/config).read_text())['git']['deploymentEnabled']['work8/v116-o39-test1-20261111-a04'] is False
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-test1-'+os.environ['GITHUB_RUN_ID'])/'evidence';out.mkdir(mode=0o700,parents=True,exist_ok=True)
receipt={'schema':'empireai-v116-test1-launch-admission-v1','launchCommit':os.environ['GITHUB_SHA'],'launchTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'sourceManifestSHA256':hashlib.sha256((p/'source-manifest.json').read_bytes()).hexdigest(),'launchAuthoritySHA256':hashlib.sha256((p/'launch-authority.json').read_bytes()).hexdigest(),'filesVerified':len(manifest['files']),'applicationSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','maximumAttempts':1,'productionMutation':False}
(out/'launch-admission.json').write_text(json.dumps(receipt,indent=2)+'\n')
