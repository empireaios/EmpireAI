#!/usr/bin/env python3
import hashlib,json,os,pathlib,subprocess
control=pathlib.Path(__file__).resolve().parent;root=control.parents[1]
branch='work8/v116-o30-native-timers-20261111-a01';parent='6c1e63ba20619ee480742fd87dc810ca93152e22'
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+branch
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
head=git('rev-parse','HEAD');assert head==os.environ['GITHUB_SHA']
assert git('rev-list','--parents','-n','1','HEAD').split()==[head,parent]
assert git('status','--porcelain')==''
assert git('config','--local','--get','remote.origin.url') in ['https://github.com/empireaios/EmpireAI','https://github.com/empireaios/EmpireAI.git']
assert subprocess.run(['git','config','--local','--get-regexp','.*extraheader'],cwd=root,stdout=subprocess.DEVNULL).returncode==1
authority=json.loads((control/'control/launch-authority.json').read_text())
assert authority['obligationId']=='V116-O30-NATIVE-TIMERS-A01-20261111'
assert authority['prospectiveMaximumUSD']=='1.00' and authority['masterCeilingUSD']=='1000.00'
assert authority['maximumAttempts']==1 and authority['jobTimeoutMinutes']==25
assert authority['reservationStateClaimedByThisFile'] is False
assert authority['applicationCodeChanged'] is False and authority['productionMutation'] is False
manifest=json.loads((control/'source-manifest.json').read_text())
assert manifest['schema']=='empireai-v116-o30-hosted-source-v1'
required={'.node-version','.github/workflows/work8-v116-o30-native-timers.yml','vercel.json','empireai-web/vercel.json'}
required.update('v116/o30_hosted/'+n for n in ['admit.py','run-hosted.sh','host-entry.py','terminate.sh','make-readable.py','stage-inputs.py','collect-stage.py','seal.py','retained_input.py','deny-service-start'])
operation=json.loads((control/'control/operation-inputs.json').read_text())
required.update('v116/o30_hosted/control/'+n for n in operation['controlSHA256'])
required.add('v116/o30_hosted/control/operation-inputs.json')
assert {x['path']for x in manifest['files']}==required and len(manifest['files'])==len(required)
changed=manifest['changedPaths'];assert changed==sorted(changed)
assert set(changed)==required- {'.node-version'}|{'v116/o30_hosted/source-manifest.json'}
assert git('diff','--name-only',parent,head).splitlines()==changed
for item in manifest['files']:
 p=root/item['path'];assert p.is_file() and not p.is_symlink()
 d=p.read_bytes();assert len(d)==item['bytes'] and hashlib.sha256(d).hexdigest()==item['sha256']
for relative in ['vercel.json','empireai-web/vercel.json']:
 current=json.loads((root/relative).read_text());previous=json.loads(git('show',parent+':'+relative))
 assert branch not in previous['git']['deploymentEnabled']
 assert current['git']['deploymentEnabled'].pop(branch) is False and current==previous
assert hashlib.sha256((control/'control/technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-o30-'+os.environ['GITHUB_RUN_ID'])/'evidence'
out.mkdir(mode=0o700,parents=True,exist_ok=False)
check=subprocess.run(['node','scripts/verify-product-path-ci.mjs'],cwd=root,env={'PATH':os.environ['PATH']},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60)
assert len(check.stdout)<65536;(out/'affected-source-contract.log').write_bytes(check.stdout);assert check.returncode==0
(out/'source-admission.json').write_text(json.dumps({'sourceHead':head,'sourceTree':git('rev-parse','HEAD^{tree}'),'parent':parent,'changedPaths':changed,'sourceManifestSHA256':hashlib.sha256((control/'source-manifest.json').read_bytes()).hexdigest(),'filesVerified':len(required),'originalApplicationSource':parent,'newApplicationChanges':False,'scope':'Actual worker and inspector no-progress detection with native unshortened timers; no genuine canonical owner or whole-row acceptance','obligationId':authority['obligationId']},indent=2)+'\n')
