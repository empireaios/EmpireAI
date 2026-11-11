#!/usr/bin/env python3
import hashlib,json,os,pathlib,subprocess
p=pathlib.Path(__file__).resolve().parent;repo=p.parents[1]
branch='work8/v116-current-redis-cohort-20261111-a01'
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create'and os.environ['GITHUB_REF']=='refs/heads/'+branch and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
parents=[x[7:]for x in subprocess.check_output(['git','cat-file','-p','HEAD'],text=True).split('\n\n',1)[0].splitlines()if x.startswith('parent ')]
assert parents==['6c1e63ba20619ee480742fd87dc810ca93152e22']
a=json.loads((p/'launch-authority.json').read_text())
assert a['reservationId']=='V116-CURRENT-REDIS-COHORT-A01-20261111'and a['reservedUSD']=='1.00'and a['maximumAttempts']==1
assert a['reservationCommitted']is True and a['jobTimeoutMinutes']==15 and a['nativeHelperSeconds']==120
assert a['masterLedgerReference']=='libfile_4adcc8ecd97481918fb74dbfe651972e#V116-CURRENT-REDIS-COHORT-A01-20261111'
assert a['productionAccess']is False and a['genuineOwnerAcceptance']is False and a['wholeRowAcceptance']is False
assert hashlib.sha256((p/'technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
m=json.loads((p/'source-manifest.json').read_text());assert m['schema']=='v116-current-redis-source-v1'
required={'.node-version','.github/workflows/work8-v116-current-redis.yml','vercel.json','empireai-web/vercel.json'}|{'v116/redis_cohort/'+x for x in ['admit.py','run.py','retained_input.py','capture_input.py','current-redis-cohort.mjs','frozen-cohort-validation.mjs','input-admission.json','launch-authority.json','technical-authority.json']}
cohort=json.loads((p/'frozen-cohort/manifest.json').read_text());assert hashlib.sha256((p/'frozen-cohort/manifest.json').read_bytes()).hexdigest()=='0259bb825217cbb1ed5e150941478a9912ff6179a25f5f4f7cc38c37996b8ebb'
required|={'v116/redis_cohort/frozen-cohort/manifest.json'}|{'v116/redis_cohort/frozen-cohort/'+x['path']for x in cohort['files']}
assert len(m['files'])==len(required)and{x['path']for x in m['files']}==required
for x in m['files']:
 target=repo/x['path'];assert target.is_file()and not target.is_symlink();b=target.read_bytes();assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256']
for name in ['vercel.json','empireai-web/vercel.json']:assert json.loads((repo/name).read_text())['git']['deploymentEnabled'][branch]is False
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-redis-cohort-'+os.environ['GITHUB_RUN_ID']);root.mkdir(mode=0o700);out=root/'evidence';out.mkdir(mode=0o700)
(out/'launch-admission.json').write_text(json.dumps({'launchCommit':os.environ['GITHUB_SHA'],'launchTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'sourceManifestSHA256':hashlib.sha256((p/'source-manifest.json').read_bytes()).hexdigest(),'launchAuthoritySHA256':hashlib.sha256((p/'launch-authority.json').read_bytes()).hexdigest(),'filesVerified':len(m['files']),'oneAttemptOnly':True,'productionAccess':False},indent=2)+'\n')
