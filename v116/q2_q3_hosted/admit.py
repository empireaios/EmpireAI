#!/usr/bin/env python3
import hashlib,json,os,pathlib,subprocess
control=pathlib.Path(__file__).resolve().parent
root=control.parents[1]
branch='work8/v116-o42-q2-q3-20261111-a01'
parent='6c1e63ba20619ee480742fd87dc810ca93152e22'
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+branch
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
head=git('rev-parse','HEAD');assert head==os.environ['GITHUB_SHA']
assert git('rev-list','--parents','-n','1','HEAD').split()==[head,parent]
assert git('status','--porcelain')==''
authority=json.loads((control/'launch-authority.json').read_text())
assert authority['obligationId']=='V116-O42-Q23-A01-20261111'
assert authority['reservationUSD']=='1.00' and authority['masterCeilingUSD']=='1000.00'
assert authority['maximumAttempts']==1 and authority['jobTimeoutMinutes']==60
assert authority['applicationCodeChanged'] is False and authority['productionMutation'] is False
assert authority['financialAdmission']=='Root independently verifies the saved unique master-ledger reservation against this exact source before creating the trigger branch.'
manifest=json.loads((control/'source-manifest.json').read_text())
assert manifest['schema']=='empireai-v116-q23-hosted-source-v1'
required={'.node-version','.github/workflows/work8-v116-o42-q2-q3.yml','vercel.json','empireai-web/vercel.json',
 'backend/scripts/reasoning-admission-full-path.mjs','backend/scripts/response-delivery-full-path.mjs'}
required.update('v116/q2_q3_hosted/'+name for name in ['admit.py','run-hosted.sh','terminate.sh','make-readable.py','seal.py','retained_input.py','deny-service-start','launch-authority.json','authority.json','hosted-inputs.json','hosted-loopback-controller.py','hosted-policy-probe.mjs','harness-correction-manifest.json','selection.json'])
assert {x['path'] for x in manifest['files']}==required and len(manifest['files'])==len(required)
changed=sorted(required-{'.node-version'}|{'v116/q2_q3_hosted/source-manifest.json'})
assert git('diff','--name-only',parent,head).splitlines()==changed
for item in manifest['files']:
 p=root/item['path'];assert p.is_file() and not p.is_symlink()
 d=p.read_bytes();assert len(d)==item['bytes'] and hashlib.sha256(d).hexdigest()==item['sha256']
for relative in ['vercel.json','empireai-web/vercel.json']:
 current=json.loads((root/relative).read_text());previous=json.loads(git('show',parent+':'+relative))
 assert branch not in previous['git']['deploymentEnabled']
 assert current['git']['deploymentEnabled'].pop(branch) is False and current==previous
assert hashlib.sha256((control/'authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-q2-q3-'+os.environ['GITHUB_RUN_ID'])/'evidence'
out.mkdir(mode=0o700,parents=True,exist_ok=False)
# This original structural check is affected by the newly added real workflow.
# Accepted application tests, builds, and the A5 lifecycle are not selected.
check=subprocess.run(['node','scripts/verify-product-path-ci.mjs'],cwd=root,env={'PATH':os.environ['PATH']},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60)
assert len(check.stdout)<65536
(out/'affected-source-contract.log').write_bytes(check.stdout)
assert check.returncode==0
(out/'source-admission.json').write_text(json.dumps({'sourceHead':head,'sourceTree':git('rev-parse','HEAD^{tree}'),'parent':parent,'changedPaths':changed,'sourceManifestSHA256':hashlib.sha256((control/'source-manifest.json').read_bytes()).hexdigest(),'filesVerified':len(required),'originalApplicationSource':parent,'newApplicationChanges':False,'scope':'Two original failed capture leaves and full original1950/1381 corpora; no native-owner or whole-row acceptance','obligationId':authority['obligationId']},indent=2)+'\n')
