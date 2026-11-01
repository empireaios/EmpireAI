#!/usr/bin/env python3
"""One immutable independently reviewed harness, no application build or publication."""
import hashlib,json,os,pathlib,re,subprocess,time
root=pathlib.Path(os.environ['GITHUB_WORKSPACE']).resolve();controller=root/'controller';script=controller/'scripts/work8/native-transition'
out=root/'native-transition-output';out.mkdir(exist_ok=True)
branch='work8/v29-20261101-private-handoff'
budget={'schema':'work8-v29-authorised-exposure-v1','startedAtEpoch':time.time(),'maximumSeconds':1650,'cleanupAndUploadReserveSeconds':120,'jobTimeoutMinutes':30,'aggregateAllowanceUSD':10,'priorReservedUSD':3.85,'additionalReservedUSD':0.50,'aggregateReservedUSD':4.35,'unreservedUSD':5.65,'reservationIsConfirmedSpending':False,'actualChargesUSD':None,'maximumAdditionalArtifactBytes':2*1024**3,'retentionDays':7,'attempts':1,'automaticRetry':False,'applicationBuilds':0,'candidateReuploads':0}
(out/'workflow-budget.json').write_text(json.dumps(budget,indent=2)+'\n')
result={'status':'FAIL','applicationBuilds':0,'newCandidateUploads':0,'wholeRowsAccepted':[]}
try:
 assert os.environ['GITHUB_EVENT_NAME']=='create' and os.environ['GITHUB_REF']=='refs/heads/'+branch
 event=json.load(open(os.environ['GITHUB_EVENT_PATH']));assert event['ref_type']=='branch' and event['ref']==branch
 assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_RUN_NUMBER']=='1'
 gate=json.loads((script/'v29-source-gate.json').read_text())
 assert gate['approved'] is True and gate['status']=='PASS_INDEPENDENT_SOURCE_AND_LOCAL_PREFLIGHT'
 assert gate['reviewer']=='independent_v29' and gate['targetedTests']['status']=='PASS' and gate['contract']['status']=='PASS'
 assert gate['phaseARequiredBeforeApplicationStartup'] is True and gate['candidateReuploads']==0 and gate['applicationBuilds']==0
 for entry in gate['files']:
  p=(controller/entry['path']);assert p.resolve().is_relative_to(controller.resolve()) and p.is_file() and not p.is_symlink()
  assert entry['path']!='scripts/work8/native-transition/v29-source-gate.json','GATE_SELF_HASH_REFUSED'
  assert p.stat().st_size==entry['bytes'] and hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256'],'REVIEWED_SOURCE_CHANGED'
 assert len(gate['files'])==len({e['path'] for e in gate['files']})
 for deleted in gate['requiredDeletions']:assert not (controller/deleted).exists(),'PRIOR_WORKFLOW_RETAINED'
 assert '.github/workflows/work8-v28-canonical-return-20261101.yml' in gate['requiredDeletions']
 for path in ['vercel.json','empireai-web/vercel.json']:assert json.loads((controller/path).read_text())['git']['deploymentEnabled'][branch] is False
 assert hashlib.sha256((script/'components.json').read_bytes()).hexdigest()=='1511f21cb02fe26e2b7a6322dc3f0a90ab8d56ff4de5e9d04aebe945e07b52c7','APPLICATION_PINS_CHANGED'
 source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=controller,text=True).strip();tree=subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=controller,text=True).strip()
 assert source==os.environ['GITHUB_SHA'] and re.fullmatch('[a-f0-9]{40}',tree)
 result.update(status=gate['status'],reviewer=gate['reviewer'],source=source,tree=tree,gateSha256=hashlib.sha256((script/'v29-source-gate.json').read_bytes()).hexdigest(),reviewedFiles=gate['files'],targetedTests=gate['targetedTests'],contract=gate['contract'])
except Exception:
 result['firstFailure']='V29_SOURCE_OR_AUTHORITY_GATE_REFUSED'
finally:
 (out/'v29-source-gate.json').write_text(json.dumps(result,indent=2)+'\n')
 import candidate_packages
 candidate_packages.write_index(out,'work8-bounded-upload-v1',exactGeneratedSecretCheck=True)
if result['status']=='FAIL':raise SystemExit(1)
