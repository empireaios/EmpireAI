#!/usr/bin/python3
"""Require exact original execution and complete custody; never whole-row accept."""
import hashlib,json,os,pathlib,subprocess
control=pathlib.Path(__file__).resolve().parent;repo=control.parent.parent
run=os.environ['GITHUB_RUN_ID'];out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-hh4-'+run)/'public-evidence'
index=json.loads((out/'EVIDENCE_INDEX.json').read_text());assert index['sourceHead']==os.environ['GITHUB_SHA']and index['runId']==run
assert sum(p.stat().st_size for p in out.rglob('*')if p.is_file())<=10485760
for item in index['payloads']:
 p=out/item['path'];assert p.is_file()and not p.is_symlink()and p.stat().st_nlink==1;b=p.read_bytes();assert len(b)==item['bytes']and hashlib.sha256(b).hexdigest()==item['sha256']
def read(relative):return json.loads((out/relative).read_text())
def original(relative):
 x=read(relative);assert x['schema']=='v116-hh4-private-source-derived-receipt-v1'and x['originalRelativePath']==relative;return x['evidence']
inner=read('INDEX.json');assert inner['collectionStatus']=='PASS_BOUNDED_COLLECTION'and not any(x['status']=='REFUSED'for x in inner['observations'])
outer=read('outer/collection.json');assert not any(x['status']=='REFUSED'for x in outer['observations'])
summary=original('evidence/hh4-execution-summary.json');assert summary['status']=='PASS_ORIGINAL_HH4_AND_DEFAULT_GRAPH_EXECUTION_PENDING_INDEPENDENT_ADJUDICATION'
assert summary['source']=='6c1e63ba20619ee480742fd87dc810ca93152e22'and summary['originalApplicationChanged']is False and summary['rawCanonicalRecordsPublished']is False and not summary['externalStopRequested']
assert [x['phase']for x in summary['stages']]==['redis-preflight','producer','consumers','application-graph']
for x in summary['stages']:assert x['status']=='PASS_PROCESS_EXECUTION_ONLY'and x['exitCode']==0 and not x['timeout']and not x['outputCapExceeded']and not x['externalStopRequested']
assert original('evidence/redis-mounted-preflight.json')['status']=='PASS_EXACT_IMAGE_DEFAULT_LOADER'
producer=original('producer-raw/held-capture-result.json');assert producer['status']=='PASS_HELD_CAPTURE_AND_CONTAINMENT_ONLY'and producer['contained']is True
consumers=original('consumer-raw/consumer-summary.json');assert consumers['status']=='PASS_TWO_ORIGINAL_INSPECTION_CONSUMERS'and consumers['digest']==summary['digest']and consumers['sourceBytesUnchanged']is True
assert original('consumer-raw/domain-rehydration-result.json')['status']=='PASS_SCOPED_DOMAIN_REHYDRATION_ONLY'
inspection=original('consumer-raw/inspection-restoration-result.json');assert inspection['status']=='PASS_INSPECTION_RESTORATION_ONLY'and inspection['equality']['equal']is True and inspection['sourceCanonicalSha256']==inspection['restoredCanonicalSha256']
graph=original('graph-raw/application-graph-result.json');assert graph['status']in['PASS_SCOPED_APPLICATION_GRAPH_ONLY','AWAITING_INDEPENDENT_MUTATION_CLASSIFICATION']and graph['mode']=='graph'and graph['source']==summary['source']and graph['digest']==summary['digest']
assert graph['originalSessionAuthenticated']and graph['missionAndFinancialHistoryPreserved']and graph['queueAdmissionRemainsFenced']and graph['authorityImported']is False and graph['sourceManifestBootAllowed']is False and graph['externalEffects']==0 and graph['paidInference']==0
term=read('outer/evidence/independent-termination.json');assert term['runId']==run and term['currentRunLabelAbsent']is True and len(term['verifiedAbsent'])==4 and len(set(term['verifiedAbsent']))==4
assert [x['phase']for x in term['hostControllers']]==['redis-preflight','producer','consumers','application-graph']and all(x['formerSessionLiveMembers']==[]for x in term['hostControllers'])
for role,memory,pids,cpus in [('abi',134217728,32,1000000000),('producer',3221225472,512,2000000000),('reader',3221225472,128,2000000000),('graph',3221225472,256,2000000000)]:
 actual=read('outer/evidence/'+role+'-termination-inspect.json');h=actual['HostConfig'];assert actual['Image']==summary['image']and h['NetworkMode']=='none'and h['ReadonlyRootfs']is True and h['Privileged']is False and h['CapDrop']==['ALL']and not h['CapAdd']and not h['PortBindings']
 assert h['Memory']==memory and h['MemorySwap']==memory and h['PidsLimit']==pids and h['NanoCpus']==cpus and h['RestartPolicy']['Name']=='no'and 'no-new-privileges'in h['SecurityOpt']
 assert h['LogConfig']=={'Type':'json-file','Config':{'max-size':'256k','max-file':'2'}}
assert read('outer/evidence/package-termination.json')['packageContainerRemoved']is True
for item in json.loads((control/'source-manifest.json').read_text())['files']:assert hashlib.sha256((repo/item['path']).read_bytes()).hexdigest()==item['sha256']
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()==os.environ['GITHUB_SHA']and subprocess.check_output(['git','status','--porcelain'],cwd=repo,text=True).strip()==''
print(json.dumps({'status':'ORIGINAL_HH4_SCOPES_EXECUTED_AND_PRESERVED_PENDING_INDEPENDENT_ADJUDICATION','graphStatus':graph['status'],'graphMutationsRequireIndependentAdjudication':bool(graph.get('targetTableChanges')),'wholeQ5Accepted':False,'wholeO42Accepted':False,'productionMutation':False}))
