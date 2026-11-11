#!/usr/bin/env python3
"""Adjudicate the exact three original cases only after bounded artifact custody."""
import hashlib,json,os,pathlib,subprocess
control=pathlib.Path(__file__).resolve().parent;checkout=control.parents[1]
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-hh3-'+os.environ['GITHUB_RUN_ID'])/'evidence'
index=json.loads((out/'EVIDENCE_INDEX.json').read_text());assert index['sourceHead']==os.environ['GITHUB_SHA']and index['runId']==os.environ['GITHUB_RUN_ID']
assert sum(p.stat().st_size for p in out.rglob('*')if p.is_file())<=10485760
for item in index['payloads']:
 p=out/item['path'];assert p.is_file()and not p.is_symlink();data=p.read_bytes();assert len(data)==item['bytes']and hashlib.sha256(data).hexdigest()==item['sha256']
def read(name):return json.loads((out/name).read_text())
entry=read('original/isolated-entry-result.json');assert entry['status']=='PASS_ORIGINAL_HH3_THREE_CASES'and entry['sourceBytesUnchanged']
assert entry['publicationHead']==os.environ['GITHUB_SHA']and entry['originalFiveSecondHoldChanged']is False
assert entry['execution']['exitCode']==0 and not entry['execution']['timedOut']and not entry['execution']['consoleCapExceeded']and not entry['execution']['childLogCapExceeded']
assert [c['mode']for c in entry['cases']]==['timeout','observer-error','invalidate-error']
for case in entry['cases']:
 assert hashlib.sha256((out/'original'/case['mode']/'receipt.json').read_bytes()).hexdigest()==case['resultSHA256']
 assert hashlib.sha256((out/'original'/case['mode']/'process-cleanup.json').read_bytes()).hexdigest()==case['cleanupSHA256']
 assert case['cleanup']['remainingLive']==0 and case['cleanup']['observedIdentitySurvivors']==0
termination=read('termination.json');assert termination['remainingScopedNamespaceLaunchers']==[]and termination['packageContainerRemoved']
assert termination['unitActiveState']in['inactive','failed']and(termination['cgroupEvents']is None or 'populated 0'in termination['cgroupEvents'].splitlines())
stage=read('stage-termination.json');assert stage['stageRemoved']and stage.get('collectionFailure')is None
collection=read('collection-result.json');assert collection['rejected']==[]
assert collection['uncollectedUnknown']==[] and not collection['unknownInventoryTruncated']
assert read('cgroup-namespace.json')['different']is True
assert read('namespace-staging.json')['completeBeforeAfterCopyEqual']is True
for item in json.loads((control/'source-manifest.json').read_text())['files']:
 assert hashlib.sha256((checkout/item['path']).read_bytes()).hexdigest()==item['sha256']
assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=checkout,text=True).strip()==os.environ['GITHUB_SHA']
assert subprocess.check_output(['git','status','--porcelain'],cwd=checkout,text=True).strip()==''
print(json.dumps({'status':'PASS_ORIGINAL_HH3_THREE_CASES','sourceHead':os.environ['GITHUB_SHA'],'originalHoldMilliseconds':5000,'caseCount':3,'wholeQ5Accepted':False,'wholeO42Accepted':False,'productionMutation':False}))
