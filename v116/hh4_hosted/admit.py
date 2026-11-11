#!/usr/bin/env python3
import hashlib,json,os,pathlib,subprocess
from source_binding import verify_git
control=pathlib.Path(__file__).resolve().parent;repo=control.parents[1]
branch='work8/v116-o42-q5-hh4-20261111-a03';parent='e074d690bb60d37f5692d34d3dd5620eeed8f3c6'
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'and os.environ['GITHUB_EVENT_NAME']=='create'
assert os.environ['GITHUB_REF']=='refs/heads/'+branch and os.environ['GITHUB_RUN_ATTEMPT']=='1'
def git(*args):return subprocess.check_output(['git',*args],cwd=repo,text=True).strip()
head=git('rev-parse','HEAD');assert head==os.environ['GITHUB_SHA']
assert git('rev-list','--parents','-n','1','HEAD').split()==[head,parent]and git('status','--porcelain')==''
assert git('config','--local','--get','remote.origin.url')in['https://github.com/empireaios/EmpireAI','https://github.com/empireaios/EmpireAI.git']
assert subprocess.run(['git','config','--local','--get-regexp','.*extraheader'],cwd=repo,stdout=subprocess.DEVNULL).returncode==1
manifest=json.loads((control/'source-manifest.json').read_text());assert manifest['schema']=='empireai-v116-hh4-hosted-source-v1'
required={'.node-version','.github/workflows/work8-v116-hh4.yml','vercel.json','empireai-web/vercel.json'}
required.update('v116/hh4_hosted/'+name for name in ['admit.py','prepare.sh','cleanup-package.py','retained_input.py','docker','terminate.py','seal.py','final.py','hh4-held-capture-controller.mjs','hh4-outer-cohort.mjs','hh4-assurance-host.mjs','hh4-assurance-prerequisite.mjs','hh4-assurance-source-inputs.json','hh4-original-consumers.mjs','hh4-consumer-source-inputs.json','run-hh4.py','process_boundary.py','collect.py','original-inputs.json','launch-authority.json','technical-authority.json','dependencies/fetch-and-stage.py','dependencies/pinned-dependencies.json','source_binding.py','source-binding.json','image-inputs.py','fixture_policy.py','hh4-technical-policy.mjs','hh4-generated-worker.mjs'])
assert {x['path']for x in manifest['files']}==required and len(manifest['files'])==len(required)
changed=manifest['changedPaths'];assert changed==sorted(set(changed))and set(changed)<=required|{'v116/hh4_hosted/source-manifest.json'}and 'v116/hh4_hosted/source-manifest.json'in changed
assert git('diff','--name-only',parent,head).splitlines()==changed
for item in manifest['files']:
 p=repo/item['path'];assert p.is_file()and not p.is_symlink();data=p.read_bytes();assert len(data)==item['bytes']and hashlib.sha256(data).hexdigest()==item['sha256']
 mode=git('ls-tree','HEAD','--',item['path']).split()[0];assert mode==item['gitMode'];assert(mode=='100755')==(item['path']=='v116/hh4_hosted/docker')
for relative in ['vercel.json','empireai-web/vercel.json']:
 current=json.loads((repo/relative).read_text());prior=json.loads(git('show',parent+':'+relative));assert branch not in prior['git']['deploymentEnabled'];assert current['git']['deploymentEnabled'].pop(branch)is False and current==prior
assert hashlib.sha256((control/'technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
launch=json.loads((control/'launch-authority.json').read_text());assert launch['obligationId']=='V116-O42-Q5-HH4-A03-20261111'and launch['prospectiveBoundUSD']=='1.00'and launch['reservationStateClaimedByThisFile']is False and launch['providerJobMaximumMinutes']==25
original=json.loads((control/'original-inputs.json').read_text())
splitProof=verify_git(repo,control)
for p,h in original['controlSHA256'].items():assert hashlib.sha256((control/p).read_bytes()).hexdigest()==h
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-hh4-'+os.environ['GITHUB_RUN_ID'])/'evidence';out.mkdir(mode=0o700,parents=True,exist_ok=False)
check=subprocess.run(['node','scripts/verify-product-path-ci.mjs'],cwd=repo,env={'PATH':os.environ['PATH']},stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60);assert len(check.stdout)<=65536;(out/'affected-source-contract.log').write_bytes(check.stdout);assert check.returncode==0
(out/'source-admission.json').write_text(json.dumps({'sourceHead':head,'sourceTree':git('rev-parse','HEAD^{tree}'),'parent':parent,'changedPaths':changed,'sourceManifestSHA256':hashlib.sha256((control/'source-manifest.json').read_bytes()).hexdigest(),'filesVerified':len(required),'originalApplicationSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','sourceChannels':splitProof,'applicationChanged':False,'scope':'Original bounded HH4 held producer and read-only inspection scopes; no genuine production or owner acceptance','obligationId':launch['obligationId']},indent=2)+'\n')
