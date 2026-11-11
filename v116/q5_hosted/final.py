#!/usr/bin/env python3
"""Require both complete original scopes only after preserving the bounded artifact."""
import hashlib,json,os,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]).resolve(strict=True);run=sys.argv[2];assert run.isdigit();out=root/'evidence'
index=json.loads((out/'EVIDENCE_INDEX.json').read_text());assert index['originalPayloadsRejected']==[]
assert sum(p.stat().st_size for p in out.rglob('*')if p.is_file())<=20971520
for item in index['payloads']:
 p=out/item['path'];assert p.is_file()and not p.is_symlink();data=p.read_bytes()
 assert len(data)==item['bytes']and hashlib.sha256(data).hexdigest()==item['sha256']
summary=json.loads((out/'outer-controller-summary.json').read_text());results=summary['results']
assert len(results)==2 and [x['phase']for x in results]==['f27','f29']
assert summary['wholeQ5Accepted']is False and summary['originalApplicationSource']=='6c1e63ba20619ee480742fd87dc810ca93152e22'
expected_names=[];expected_hosts=[]
for result in results:
 assert result['status']=='PASS_ORIGINAL_'+result['phase'].upper()+'_SCOPE'
 assert result['sourceBytesUnchanged']and result['ownedContainersAbsent']and not result['externalStopRequested']
 assert result['execution']['exitCode']==0 and not result['execution']['timeout']and not result['execution']['outputCapExceeded']
 expected_names+=result['ownedContainerNames']
 identity=result['controllerIdentity'];expected_hosts.append({'pid':result['controllerPid'],'bootId':identity['bootId'],'startTicks':identity['startTicks'],'formerSessionLiveMembers':[]})
termination=json.loads((out/'independent-termination.json').read_text());assert termination['runId']==run
assert sorted(termination['verifiedAbsent'])==sorted(expected_names)and termination['hostControllers']==expected_hosts
assert json.loads((out/'package-termination.json').read_text())['packageContainerRemoved']is True
control=pathlib.Path(__file__).resolve().parent;checkout=control.parents[1];manifest=json.loads((control/'source-manifest.json').read_text())
for item in manifest['files']:
 p=checkout/item['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256']
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=checkout,text=True).strip()==os.environ['GITHUB_SHA']
assert subprocess.check_output(['git','diff','--name-only','HEAD'],cwd=checkout,text=True).strip()==''
app=checkout/'application';assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=app,text=True).strip()=='6c1e63ba20619ee480742fd87dc810ca93152e22'
assert subprocess.check_output(['git','status','--porcelain'],cwd=app,text=True).strip()==''
print(json.dumps({'status':'PASS_ORIGINAL_F27_AND_F29_SCOPES','applicationSource':'6c1e63ba20619ee480742fd87dc810ca93152e22','sourceHead':os.environ['GITHUB_SHA'],'runId':run,'originalTestsUnchanged':True,'wholeQ5Accepted':False,'wholeO42Accepted':False,'productionAccess':False}))
