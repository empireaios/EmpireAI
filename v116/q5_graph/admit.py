#!/usr/bin/env python3
import hashlib,json,os,pathlib,re,subprocess
p=pathlib.Path(__file__).resolve().parent;root=p.parents[1]
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create'
assert os.environ['GITHUB_REF']=='refs/heads/work8/v116-o42-q5-graph-20261111-a01'
assert os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert re.fullmatch(r'[0-9]+',os.environ['GITHUB_RUN_ID'])
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
assert subprocess.run(['git','config','--local','--get-regexp','.*extraheader'],capture_output=True).returncode==1
a=json.loads((p/'launch-authority.json').read_text())
assert a['campaign']=='V116_MASTER_WORK8' and a['attempt']=='V116_O42_Q5_GRAPH_A01'
assert a['obligationId']=='V116-O42-Q5-GRAPH-A01-20261111'
assert a['standingOwnerDirective']=='V116' and a['technicalExecutionOnly'] is True
assert a['reservationStateClaimedByThisFile'] is False and a['prospectiveReservationUSD']=='1.00'
assert a['masterCeilingUSD']=='1000.00' and a['maximumAttempts']==1
assert a['jobTimeoutMinutes']==20 and a['containerTimeoutSeconds']==100 and a['originalTestTimeoutSeconds']==60
assert a['productionMutation'] is False and a['commerce']=='LOCKED' and a['pillow']=='NOT_BORN'
assert a['branch']=='work8/v116-o42-q5-graph-20261111-a01'
assert a['expectedParentCommit']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
commit=subprocess.check_output(['git','cat-file','-p','HEAD'],text=True)
assert [line.split(' ',1)[1] for line in commit.split('\n\n',1)[0].splitlines() if line.startswith('parent ')]==[a['expectedParentCommit']]
assert hashlib.sha256((p/'technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
manifest=json.loads((p/'source-manifest.json').read_text())
assert manifest['schema']=='empireai-v116-q5-graph-source-v1'
required={'.node-version','.github/workflows/work8-v116-o42-q5-graph.yml','vercel.json','empireai-web/vercel.json'}
required.update('v116/q5_graph/'+x for x in ['admit.py','run-graph.sh','retained_input.py','seal.py','prepare.mjs','verify-container.py','verify-result.py','application-inputs.json','launch-authority.json','technical-authority.json','runtime-writer-graph.hosted.test.cjs','runtime-graph-application.cjs','runtime-graph-lock-stores.cjs'])
assert {row['path'] for row in manifest['files']}==required and len(manifest['files'])==len(required)
for row in manifest['files']:
 target=root/row['path'];assert target.is_file() and not target.is_symlink()
 b=target.read_bytes();assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256']
for config in ['vercel.json','empireai-web/vercel.json']:
 assert json.loads((root/config).read_text())['git']['deploymentEnabled'][a['branch']] is False
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-q5-graph-'+os.environ['GITHUB_RUN_ID'])/'evidence'
out.mkdir(mode=0o700,parents=True,exist_ok=True)
receipt={'schema':'empireai-v116-q5-graph-launch-admission-v1','launchCommit':os.environ['GITHUB_SHA'],'launchTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'sourceManifestSHA256':hashlib.sha256((p/'source-manifest.json').read_bytes()).hexdigest(),'launchAuthoritySHA256':hashlib.sha256((p/'launch-authority.json').read_bytes()).hexdigest(),'filesVerified':len(manifest['files']),'applicationSource':a['applicationSource'],'maximumAttempts':1,'productionMutation':False,'financialReadbackExternalRootGateRequired':True,'runtimeFinancialReadbackPerformed':False}
(out/'launch-admission.json').write_text(json.dumps(receipt,indent=2)+'\n')
