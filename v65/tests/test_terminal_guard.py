"""Synthetic provider/executor binding tests, not hosted qualification."""
import copy
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'adapter'))
from compare_executor_provenance import compare,runner_image_block,Refusal
from test_executor_guard import fixture,W,H

PATH='.github/workflows/work8-v75-a5.yml'
OPTIONS={'run_id':123,'job_id':456,'source_sha':W,'workflow_path':PATH}

def inputs():
 _,identity,observations=fixture()
 identity.update(provider='github-actions',repository='empireaios/EmpireAI',repositoryId='1275922460',workflowPath=PATH,runnerGroupName='GitHub Actions',labels=['ubuntu-24.04'])
 run={'id':123,'repository':{'id':1275922460,'full_name':'empireaios/EmpireAI'},'run_attempt':1,'head_sha':W,'head_branch':'fixture-branch','path':PATH,'event':'create','status':'completed','conclusion':'failure'}
 job={'id':456,'run_id':123,'run_url':'https://api.github.com/repos/empireaios/EmpireAI/actions/runs/123','run_attempt':1,'head_sha':W,'runner_id':789,'runner_name':identity['runnerName'],'runner_group_name':'GitHub Actions','runner_group_id':2,'labels':['ubuntu-24.04'],'name':'Synthetic qualification job','started_at':'2026-11-04T00:00:00Z','status':'completed','conclusion':'failure'}
 identity['serviceRunObserved']={k:run[k] for k in ('id','run_attempt','head_sha','head_branch','event','path','status')};identity['serviceRunObserved']['status']='in_progress'
 identity['serviceJobObserved']={k:job[k] for k in ('id','run_id','name','status','runner_id','runner_name','runner_group_id','runner_group_name','labels','started_at')};identity['serviceJobObserved']['status']='in_progress'
 def line(value):return '2026-11-04T00:00:01.0000000Z '+value+'\n'
 setup=observations['observations']['setupInfo']
 log=line("Current runner version: '2.338.2'")+line('##[group]Runner Image')+''.join(line(k+': '+v) for k,v in setup.items())+line('##[endgroup]')+line('Complete job name: '+job['name'])
 return log.encode(),identity,observations,{'run':run,'jobs':{'total_count':1,'jobs':[job]}}


class TerminalObservationControls(unittest.TestCase):
 def reject(self,mutate,code):
  values=list(inputs());mutate(values)
  with self.assertRaisesRegex(Refusal,code):compare(*values,**OPTIONS)
 def test_v70_disagreement_shape_is_retained_without_admission(self):
  result=compare(*inputs(),**OPTIONS)
  self.assertEqual(result['status'],'PROVIDER_EXECUTOR_OBSERVATIONS_RECONCILED_ONLY')
  self.assertEqual(result['providerSetup']['Version'],'20261025.353.1');self.assertEqual(result['runtimeEnvironmentImageVersion'],'20261026.354.1')
  self.assertFalse(result['metadataAgreement']);self.assertEqual(result['discrepancyCause'],'UNRESOLVED')
  self.assertFalse(result['metadataDisagreementProvenHarmless']);self.assertFalse(result['imageBuildIdentityEstablished']);self.assertFalse(result['nativeAdmissionGranted']);self.assertFalse(result['applicationAcceptance'])
  self.assertEqual(result['providerJobConclusion'],'failure')
 def test_wrong_provider_run(self):self.reject(lambda v:v[3]['run'].update(id=999),'PROVIDER_RUN_JOB_BINDING')
 def test_wrong_provider_job(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(id=999),'PROVIDER_RUN_JOB_BINDING')
 def test_wrong_provider_repository(self):self.reject(lambda v:v[3]['run']['repository'].update(id=1),'PROVIDER_REPOSITORY_BINDING')
 def test_wrong_provider_job_repository(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(run_url='https://api.github.com/repos/other/repo/actions/runs/123'),'PROVIDER_REPOSITORY_BINDING')
 def test_wrong_workflow_source(self):self.reject(lambda v:v[3]['run'].update(head_sha='c'*40),'SOURCE_BINDING_MISMATCH')
 def test_wrong_workflow_file(self):self.reject(lambda v:v[3]['run'].update(path='.github/workflows/other.yml'),'WORKFLOW_PATH_EVENT_BINDING')
 def test_nonterminal_job(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(status='in_progress'),'TERMINAL_PROVIDER_RECORDS_REQUIRED')
 def test_missing_conclusion(self):self.reject(lambda v:v[3]['run'].update(conclusion=None),'TERMINAL_PROVIDER_RECORDS_REQUIRED')
 def test_second_attempt(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(run_attempt=2),'FIRST_ATTEMPT_REQUIRED')
 def test_wrong_runtime_job(self):self.reject(lambda v:v[1].update(jobId=999),'RUNTIME_RUN_JOB_BINDING')
 def test_wrong_session(self):self.reject(lambda v:v[1].update(sessionId='github-actions:123:1:999'),'RUNTIME_SESSION_BINDING')
 def test_wrong_runner_id(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(runner_id=1),'RUNNER_ID_BINDING')
 def test_wrong_runner_name(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(runner_name='wrong'),'RUNNER_NAME_BINDING')
 def test_self_hosted_substitution(self):self.reject(lambda v:v[3]['jobs']['jobs'][0].update(labels=['self-hosted']),'STANDARD_HOSTED_LABELS_REQUIRED')
 def test_changed_initial_run_branch(self):self.reject(lambda v:v[1]['serviceRunObserved'].update(head_branch='wrong'),'INITIAL_SERVICE_RUN_BINDING')
 def test_changed_initial_job_start(self):self.reject(lambda v:v[1]['serviceJobObserved'].update(started_at='wrong'),'INITIAL_SERVICE_JOB_BINDING')
 def test_missing_initial_service_records(self):self.reject(lambda v:v[1].pop('serviceRunObserved'),'INITIAL_SERVICE_OBSERVATIONS_REQUIRED')
 def test_provider_setup_tampering(self):
  def mutate(v):v[0]=v[0].replace(b'20261025.353',b'20261024.352')
  self.reject(mutate,'PROVIDER_RECORDED_SETUP_OBSERVATION_CHANGED')
 def test_changed_runtime_observation_binding(self):self.reject(lambda v:v[2].update(jobId=999),'IMAGE_PROVENANCE_RUN_BINDING')
 def test_suppressed_mismatch(self):self.reject(lambda v:v[2].update(diagnosticCode=None),'METADATA_DISAGREEMENT_MUST_REMAIN_VISIBLE')
 def test_claimed_harmless_mismatch(self):self.reject(lambda v:v[2].update(metadataDisagreementProvenHarmless=True),'UNSUPPORTED_IMAGE_BUILD_INFERENCE_REFUSED')
 def test_wrong_log_job_name(self):self.reject(lambda v:v.__setitem__(0,v[0].replace(b'Complete job name: Synthetic qualification job',b'Complete job name: Wrong job')),'PROVIDER_LOG_JOB_NAME_BINDING')
 def test_truncated_setup(self):self.reject(lambda v:v.__setitem__(0,v[0].split(b'Complete job name:')[0]),'COMPLETE_SETUP_HEADER_REQUIRED')
 def test_duplicate_setup_block(self):
  log,*_=inputs();block=log[log.index(b'2026-11-04T00:00:01.0000000Z ##[group]'):log.index(b'2026-11-04T00:00:01.0000000Z Complete')]
  self.reject(lambda v:v.__setitem__(0,block+v[0]),'ONE_RUNNER_IMAGE_BLOCK_REQUIRED')
 def test_later_step_output_cannot_override_setup(self):
  values=list(inputs());values[0]+=b'not a setup log line\nVersion: forged\n';result=compare(*values,**OPTIONS);self.assertEqual(result['providerSetup']['Version'],'20261025.353.1')
 def test_semantically_equal_encoded_release_link(self):
  values=list(inputs());values[0]=values[0].replace(b'releases/tag/ubuntu24/',b'releases/tag/ubuntu24%2F');result=compare(*values,**OPTIONS);self.assertFalse(result['metadataAgreement'])
 def test_cli_hash_mismatch_refuses_and_preserves_first_output(self):
  log,identity,observations,provider=inputs()
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);identity_raw=json.dumps(identity).encode();observations['runtimeIdentityReceipt']['sha256']=hashlib.sha256(identity_raw).hexdigest()
   contents={'job-log':log,'runtime-identity':identity_raw,'executor-observations':json.dumps(observations).encode(),'provider-receipt':json.dumps(provider).encode()}
   flags={'job-log':'log-sha256','runtime-identity':'identity-sha256','executor-observations':'observations-sha256','provider-receipt':'provider-sha256'}
   cmd=[sys.executable,'-B',str(pathlib.Path(__file__).resolve().parents[1]/'adapter/compare_executor_provenance.py')]
   for name,raw in contents.items():
    file=root/name;file.write_bytes(raw);cmd+=['--'+name,str(file),'--expected-'+flags[name],hashlib.sha256(raw).hexdigest()]
   out=root/'result.json';cmd+=['--output',str(out),'--expected-source-sha',W,'--expected-run-id','123','--expected-job-id','456','--expected-workflow-path',PATH]
   complete=subprocess.run(cmd,capture_output=True,timeout=10)
   self.assertEqual(complete.returncode,0,complete.stderr);receipt=json.loads(out.read_text());self.assertFalse(receipt['applicationAcceptance']);self.assertEqual(out.stat().st_mode&0o777,0o600)
   original=out.read_bytes();repeat=subprocess.run(cmd,capture_output=True,timeout=10);self.assertNotEqual(repeat.returncode,0);self.assertEqual(out.read_bytes(),original)
   cmd[cmd.index('--output')+1]=str(root/'refusal.json');cmd[cmd.index('--expected-log-sha256')+1]=H
   bad=subprocess.run(cmd,capture_output=True,timeout=10);self.assertEqual(bad.returncode,17);failure=json.loads((root/'refusal.json').read_text());self.assertEqual(failure['code'],'EVIDENCE_HASH_MISMATCH_providerLog');self.assertFalse(failure['nativeAdmissionGranted'])

if __name__=='__main__':unittest.main(verbosity=2)
