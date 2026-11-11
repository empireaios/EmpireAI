#!/usr/bin/python3
import hashlib,json,os,pathlib,subprocess
control=pathlib.Path(__file__).resolve().parent;repo=control.parent.parent
branch='work8/v116-o42-q5-precutover-20261111-a01';parent='6c1e63ba20619ee480742fd87dc810ca93152e22'
def git(*args):return subprocess.check_output(['git',*args],cwd=repo,text=True).strip()
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'and os.environ['GITHUB_EVENT_NAME']=='create'and os.environ['GITHUB_REF']=='refs/heads/'+branch and os.environ['GITHUB_RUN_ATTEMPT']=='1'
head=git('rev-parse','HEAD');assert head==os.environ['GITHUB_SHA']and git('rev-list','--parents','-n','1','HEAD').split()==[head,parent]and git('status','--porcelain')==''
assert git('config','--local','--get','remote.origin.url')in['https://github.com/empireaios/EmpireAI','https://github.com/empireaios/EmpireAI.git']and subprocess.run(['git','config','--local','--get-regexp','.*extraheader'],cwd=repo,stdout=subprocess.DEVNULL).returncode==1
manifest=json.loads((control/'source-manifest.json').read_text());assert manifest['schema']=='empireai-v116-precutover-hosted-source-v1'
required={'.node-version','.github/workflows/work8-v116-precutover.yml','vercel.json','empireai-web/vercel.json'}
required.update('v116/precutover_hosted/'+x for x in ['admit.py','retained_input.py','prepare.sh','cleanup-package.py','run.py','terminate.py','normalize.py','collect.py','final.py','entry.cjs','precutover-closure.cjs','precutover-fixture-composition.cjs','source-composition-map.json','technical-authority.json','launch-authority.json','dependencies/fetch-and-stage.py','dependencies/pinned-dependencies.json'])
assert {x['path']for x in manifest['files']}==required and len(required)==len(manifest['files']);changed=sorted(required-{'.node-version'}|{'v116/precutover_hosted/source-manifest.json'});assert manifest['changedPaths']==changed and git('diff','--name-only',parent,head).splitlines()==changed
for x in manifest['files']:
 f=repo/x['path'];assert f.is_file()and not f.is_symlink();b=f.read_bytes();assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256'];assert git('ls-tree','HEAD','--',x['path']).split()[0]=='100644'
for name in ['vercel.json','empireai-web/vercel.json']:
 current=json.loads((repo/name).read_text());prior=json.loads(git('show',parent+':'+name));assert branch not in prior['git']['deploymentEnabled']and current['git']['deploymentEnabled'].pop(branch)is False and current==prior
assert hashlib.sha256((control/'technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
launch=json.loads((control/'launch-authority.json').read_text());assert launch['obligationId']=='V116-O42-Q5-PRECUTOVER-A01-20261111'and launch['prospectiveBoundUSD']=='1.00'and launch['reservationStateClaimed']is False and launch['jobMaximumMinutes']==30
original=json.loads((control/'source-composition-map.json').read_text());assert original['applicationSource']==parent and original['originalAssertionCount']==49 and original['allOriginalAssertionsByteIdenticalAndMultiplicityPreserved']is True
for x in original['originalInputs']:assert hashlib.sha256((repo/x['path']).read_bytes()).hexdigest()==x['sha256']
for x in original['fixtureOnlyOverlays']:assert hashlib.sha256((control/pathlib.Path(x['target']).name).read_bytes()).hexdigest()==x['sha256']
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-precutover-'+os.environ['GITHUB_RUN_ID'])/'evidence';out.mkdir(mode=0o700,parents=True,exist_ok=False)
result=subprocess.run(['node','scripts/verify-product-path-ci.mjs'],cwd=repo,env={'PATH':os.environ['PATH']},capture_output=True,timeout=60);assert len(result.stdout)+len(result.stderr)<=65536;(out/'affected-source-contract.log').write_bytes(result.stdout+result.stderr);assert result.returncode==0
(out/'source-admission.json').write_text(json.dumps({'sourceHead':head,'sourceTree':git('rev-parse','HEAD^{tree}'),'parent':parent,'sourceManifestSHA256':hashlib.sha256((control/'source-manifest.json').read_bytes()).hexdigest(),'sourceFiles':len(required),'changedPaths':changed,'originalApplicationSourceUnchanged':True,'originalAssertionCount':49,'obligationId':launch['obligationId'],'wholeQ5Accepted':False},indent=2)+'\n')
