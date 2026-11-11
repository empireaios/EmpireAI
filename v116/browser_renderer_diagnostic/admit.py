#!/usr/bin/env python3
"""Admit one exact, financially gated, browser-only diagnostic source."""
import hashlib,json,os,pathlib,subprocess
P=pathlib.Path(__file__).resolve().parent;REPO=P.parents[1]
BRANCH='work8/v116-browser-renderer-diagnostic-20261111-a01'
OBLIGATION='V116-BROWSER-RENDERER-DIAGNOSTIC-A01-20261111'
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'
assert os.environ['GITHUB_EVENT_NAME']=='create'and os.environ['GITHUB_REF']=='refs/heads/'+BRANCH and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert os.environ['GITHUB_RUN_ID'].isdigit()
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert head==os.environ['GITHUB_SHA']
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
parents=[x[7:]for x in subprocess.check_output(['git','cat-file','-p','HEAD'],text=True).split('\n\n',1)[0].splitlines()if x.startswith('parent ')];assert parents==['6c1e63ba20619ee480742fd87dc810ca93152e22']
a=json.loads((P/'launch-authority.json').read_text());assert a['reservationId']==OBLIGATION and a['maximumUSD']=='1.00'and a['maximumAttempts']==1 and a['jobTimeoutMinutes']==20
assert a['masterLedgerReference']=='libfile_4adcc8ecd97481918fb74dbfe651972e#'+OBLIGATION and a['rootSavedReadbackRequiredBeforeBranchCreation']is True
assert a['caseNames']==['original96']and a['pidsLimit']==96 and a['probeDeadlineSeconds']==35 and a['hostCaseDeadlineSeconds']==45
assert a['productionAccess']is False and a['applicationExecution']is False and a['authenticationExecution']is False and a['ownerStateInput']is False and a['wholeRowAcceptance']is False
m=json.loads((P/'source-manifest.json').read_text());assert m['schema']=='v116-browser-renderer-diagnostic-source-v1'and m['parentCommit']==parents[0]and m['branch']==BRANCH
required={'.node-version','.github/workflows/work8-v116-browser-renderer-diagnostic.yml','vercel.json','empireai-web/vercel.json'}|{'v116/browser_renderer_diagnostic/'+n for n in a['closedControlFiles']}
assert len(m['files'])==len({x['path']for x in m['files']})and{x['path']for x in m['files']}==required
for x in m['files']:
 n=pathlib.PurePosixPath(x['path']);assert not n.is_absolute()and'..'not in n.parts
 p=REPO/x['path'];assert p.is_file()and not p.is_symlink();b=p.read_bytes();assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256']
assert {x.name for x in P.iterdir()}==set(a['closedControlFiles'])|{'source-manifest.json'}
assert not any('__pycache__'in x.parts or x.suffix=='.pyc'for x in P.rglob('*'))
assert (REPO/'.node-version').read_text().strip()=='22.23.2'
for n in ['vercel.json','empireai-web/vercel.json']:assert json.loads((REPO/n).read_text())['git']['deploymentEnabled'][BRANCH]is False
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-browser-renderer-'+os.environ['GITHUB_RUN_ID']);assert root.parent.resolve(strict=True)==root.parent;root.mkdir(mode=0o700);out=root/'evidence';out.mkdir(mode=0o700)
(out/'launch-admission.json').write_text(json.dumps({'schema':'v116-browser-renderer-launch-admission-v1','launchCommit':head,'launchTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'sourceManifestSHA256':hashlib.sha256((P/'source-manifest.json').read_bytes()).hexdigest(),'launchAuthoritySHA256':hashlib.sha256((P/'launch-authority.json').read_bytes()).hexdigest(),'filesVerified':len(m['files']),'oneAttemptOnly':True,'caseNames':['original96'],'productionAccess':False,'applicationExecution':False,'acceptanceEvidence':False},indent=2)+'\n')
