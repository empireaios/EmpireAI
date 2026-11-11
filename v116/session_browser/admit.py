#!/usr/bin/env python3
import hashlib,json,os,pathlib,subprocess
P=pathlib.Path(__file__).resolve().parent;REPO=P.parents[1]
BRANCH='work8/v116-native-session-browser-20261111-a05';RESERVATION='V116-NATIVE-SESSION-BROWSER-A05-20261111'
assert os.environ['GITHUB_REPOSITORY']=='empireaios/EmpireAI'and os.environ['GITHUB_EVENT_NAME']=='create'and os.environ['GITHUB_REF']=='refs/heads/'+BRANCH and os.environ['GITHUB_RUN_ATTEMPT']=='1'
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
assert not subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],text=True).strip()
parents=[x[7:]for x in subprocess.check_output(['git','cat-file','-p','HEAD'],text=True).split('\n\n',1)[0].splitlines()if x.startswith('parent ')];assert parents==['6c1e63ba20619ee480742fd87dc810ca93152e22']
a=json.loads((P/'launch-authority.json').read_text());assert a['reservationId']==RESERVATION and a['maximumUSD']=='1.00'and a['maximumAttempts']==1 and a['jobTimeoutMinutes']==30 and a['supervisorSeconds']==260
assert a['rootSavedReadbackRequiredBeforeBranchCreation']is True and a['masterLedgerReference']=='libfile_4adcc8ecd97481918fb74dbfe651972e#'+RESERVATION
assert a['productionAccess']is False and a['genuineOwnerAcceptance']is False and a['wholeRowAcceptance']is False
assert hashlib.sha256((P/'technical-authority.json').read_bytes()).hexdigest()=='f1170d9351861402fac03c99b9eb829c1d05941546c085bfcae4790b8a26add3'
m=json.loads((P/'source-manifest.json').read_text());assert m['schema']=='v116-native-session-browser-source-v1'
assert len(m['files'])==len({x['path']for x in m['files']}) and all(not pathlib.PurePosixPath(x['path']).is_absolute()and '..'not in pathlib.PurePosixPath(x['path']).parts for x in m['files'])
required={'.node-version','.github/workflows/work8-v116-native-session-browser.yml','vercel.json','empireai-web/vercel.json'}|{'v116/session_browser/'+n for n in a['closedControlFiles']}
assert {x['path']for x in m['files']}==required
for x in m['files']:
 p=REPO/x['path'];assert p.is_file()and not p.is_symlink();b=p.read_bytes();assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256']
for n in ['vercel.json','empireai-web/vercel.json']:assert json.loads((REPO/n).read_text())['git']['deploymentEnabled'][BRANCH]is False
root=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-session-browser-'+os.environ['GITHUB_RUN_ID']);assert root.parent.resolve(strict=True)==root.parent;root.mkdir(mode=0o700);out=root/'evidence';out.mkdir(mode=0o700)
(out/'launch-admission.json').write_text(json.dumps({'launchCommit':os.environ['GITHUB_SHA'],'launchTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],text=True).strip(),'sourceManifestSHA256':hashlib.sha256((P/'source-manifest.json').read_bytes()).hexdigest(),'launchAuthoritySHA256':hashlib.sha256((P/'launch-authority.json').read_bytes()).hexdigest(),'filesVerified':len(m['files']),'oneAttemptOnly':True,'productionAccess':False,'genuineOwnerAcceptance':False},indent=2)+'\n')
