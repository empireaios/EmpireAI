#!/usr/bin/env python3
import hashlib,json,os,pathlib
out=pathlib.Path(os.environ['RUNNER_TEMP'])/('v116-session-browser-'+os.environ['GITHUB_RUN_ID'])/'evidence'
expected={'host-execution.json':'PASS_AWAITING_INDEPENDENT_BROWSER_REVIEW','browser-capability.json':'PASS_AF_UNIX_AND_IMMUTABLE_CHROMIUM','supervisor-result.json':'PASS_AWAITING_INDEPENDENT_NATIVE_BROWSER_ADJUDICATION','browser-result.json':'PASS_AWAITING_INDEPENDENT_A1_19_A1_20_REVIEW','native-final.json':'PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED','backend-result.json':'PASS_OLD_NATIVE_SESSION_RECORDS_PRESERVED','private-custody.json':'PASS_BOUNDED_PRIVATE_EVIDENCE_CUSTODY'}
for name,status in expected.items():
 r=json.loads((out/name).read_text());assert r['status']==status,(name,r['status']);assert not r.get('cleanupFailure')and not r.get('cleanupFailures')
assert json.loads((out/'host-execution.json').read_text())['allOriginalInputFilesAndLinksPreserved']is True
assert json.loads((out/'provider-termination.json').read_text())['scopedContainersAbsent']is True
assert json.loads((out/'private-custody.json').read_text())['credentialsPublished']is False
index=json.loads((out/'evidence-index.json').read_text());assert index['runId']==os.environ['GITHUB_RUN_ID']and index['launchCommit']==os.environ['GITHUB_SHA']
for x in index['payloads']:
 p=out/x['path'];assert p.name==x['path']and p.is_file()and not p.is_symlink();b=p.read_bytes();assert len(b)==x['bytes']and hashlib.sha256(b).hexdigest()==x['sha256']
print('PASS_ACTUAL_NATIVE_BROWSER_PENDING_INDEPENDENT_ORIGINAL_CLAUSE_REVIEW')
