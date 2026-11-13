"""Create exact full A09 frontend build inputs from retained base and reviewed overlays."""
import copy,hashlib,json,pathlib,shutil,sys,subprocess
from extract_portable_runtime import tree,digest_rows
D=pathlib.Path(__file__).resolve().parent;repo=pathlib.Path(sys.argv[1]).resolve();retained=pathlib.Path(sys.argv[2]).resolve()
base=repo/'v126/native_private/frontend-build-inputs.json';pins=json.loads(base.read_bytes());source=D/'frontend-source'
assert not source.exists();rows=tree(retained/'app/empireai-web');assert len(rows)==957 and digest_rows(rows)==pins['baseTreeSHA256']
shutil.copytree(retained/'app/empireai-web',source,symlinks=True)
def repo_bytes(name):
 p=repo/name
 return p.read_bytes()if p.is_file()else subprocess.check_output(['git','-C',str(repo),'show',':'+name])
changes=['empireai-web/components/owner/work8/ConnectorMedia.tsx','empireai-web/lib/owner/review-proxy.ts','empireai-web/app/api/owner/commerce/review-session/route.ts','empireai-web/app/api/owner/commerce/review/route.ts']
expected={'empireai-web/components/owner/work8/ConnectorMedia.tsx':'ee10ea475046d67b8ebd64f161a4c7d69afeeadb072d79231840cd6ae428c519','empireai-web/lib/owner/review-proxy.ts':'2162a6b936f87f3c38aa49266f2a3872613298ec9604166b766c8b737db92e05'}
for p,h in expected.items():assert hashlib.sha256((repo/p).read_bytes()).hexdigest()==h
current=copy.deepcopy(pins);paths=[x['repositoryPath']for x in current['overlays']]
for p in changes:
 if p not in paths:current['overlays'].append({'repositoryPath':p,'frontendPath':p.removeprefix('empireai-web/'),'scope':'A09_EXACT_VERSION_OWNER_REVIEW_BFF_AND_ACK'})
for pin in current['overlays']:
 p=repo/pin['repositoryPath'];data=repo_bytes(pin['repositoryPath']);sha=hashlib.sha256(data).hexdigest()
 if pin['repositoryPath']not in changes+['empireai-web/vercel.json']:assert len(data)==pin['bytes']and sha==pin['sha256']
 pin.update(bytes=len(data),sha256=sha);target=source/pin['frontendPath'];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
assert json.loads((source/'vercel.json').read_bytes())['git']['deploymentEnabled']['work8/v128-media-owner-review-20261113-a09']is False
final=tree(source);assert len(final)==962 and len(current['overlays'])==13
assert hashlib.sha256((source/'package-lock.json').read_bytes()).hexdigest()==pins['packageLockSHA256']
current.update(schema='A09_COMPLETE_FRONTEND_SOURCE_BUILD_INPUTS_V1',changedSourceFileCount=len(final),changedSourceTreeSHA256=digest_rows(final),
 originalA08FrontendSourceTreeSHA256=pins['changedSourceTreeSHA256'],reviewedA09ApplicationChanges=changes,sourcePublicationCommit=None,publicationCommitMustBindAtImageBuild=True)
(D/'frontend-build-inputs.json').write_text(json.dumps(current,indent=2)+'\n');(D/'frontend-source-descriptor.json').write_text(json.dumps(final,indent=2)+'\n')
print(json.dumps({'status':'PASS_EXACT_RETAINED_BASE_PLUS_REVIEWED_OVERLAYS','files':len(final),'overlays':len(current['overlays']),'completeSourceSHA256':digest_rows(final),'packageLockSHA256':pins['packageLockSHA256'],'sourcePublicationCommit':None}))
