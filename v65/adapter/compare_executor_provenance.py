#!/usr/bin/env python3
"""Independent V75 terminal provider/executor observation reconciliation.

No network access, native admission, owner approval or application acceptance.
The caller independently retrieves the exact run/job metadata and job log, binds
all four input hashes, and reviews this output with the native/whole-row evidence.
Provider setup metadata is compared to its recorded setup-file observation for
integrity. Environment labels remain separate diagnostics, never build attestation.
"""
import argparse
import hashlib
import json
import os
import pathlib
import re
import stat
import sys
from urllib.parse import unquote
from github_contract import validate_image_provenance, Refusal as AdmissionRefusal

MAX_LOG_BYTES=4*1024*1024
MAX_JSON_BYTES=1024*1024
TIMESTAMP=re.compile(r"^\ufeff?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z ")
VERSION=re.compile(r"\d{8}\.\d+\.\d+")
SHA256=re.compile(r"[0-9a-f]{64}")
COMMIT=re.compile(r"[0-9a-f]{40}")
REPOSITORY='empireaios/EmpireAI'
REPOSITORY_ID=1275922460

class Refusal(ValueError):pass

def require(condition,code):
 if not condition:raise Refusal(code)

def digest(data):return hashlib.sha256(data).hexdigest()

def unique_object(pairs):
 result={}
 for key,value in pairs:
  require(key not in result,'DUPLICATE_JSON_KEY');result[key]=value
 return result

def runner_image_block(log_bytes):
    require(0 < len(log_bytes) <= MAX_LOG_BYTES, "LOG_SIZE_BOUND")
    try:
        lines = log_bytes.decode("utf-8-sig").splitlines()
    except UnicodeDecodeError:
        raise Refusal("LOG_UTF8_REQUIRED") from None
    groups = []
    image_blocks = []
    block = None
    setup_end = False
    for line in lines:
        require(TIMESTAMP.match(line) is not None, "TIMESTAMPED_PROVIDER_LOG_REQUIRED")
        value = TIMESTAMP.sub("", line, count=1)
        if value.startswith("Complete job name:"):
            require(not groups, "SETUP_GROUP_UNTERMINATED")
            setup_end = True
            break
        if value.startswith("##[group]"):
            require(not groups, "NESTED_SETUP_GROUP_REFUSED")
            name = value.removeprefix("##[group]")
            groups.append(name)
            block = [] if name == "Runner Image" else None
        elif value == "##[endgroup]":
            require(len(groups) == 1, "UNBALANCED_SETUP_GROUP")
            if groups.pop() == "Runner Image":
                image_blocks.append(block)
            block = None
        elif block is not None:
            block.append(value)
    require(setup_end, "COMPLETE_SETUP_HEADER_REQUIRED")
    require(len(image_blocks) == 1, "ONE_RUNNER_IMAGE_BLOCK_REQUIRED")
    observed = {}
    for line in image_blocks[0]:
        key, separator, value = line.partition(": ")
        require(separator and key in ("Image", "Version", "Included Software", "Image Release"), "RUNNER_IMAGE_FIELD_REFUSED")
        require(key not in observed, "DUPLICATE_RUNNER_IMAGE_FIELD")
        observed[key] = value
    require(set(observed) == {"Image", "Version", "Included Software", "Image Release"}, "COMPLETE_RUNNER_IMAGE_FIELDS_REQUIRED")
    require(observed["Image"] == "ubuntu-24.04", "EXPECTED_UBUNTU24_IMAGE_REQUIRED")
    require(VERSION.fullmatch(observed["Version"]) is not None, "IMAGE_VERSION_FORMAT")
    release = observed["Version"].rsplit(".", 1)[0]
    require(observed["Included Software"] == f"https://github.com/actions/runner-images/blob/ubuntu24/{release}/images/ubuntu/Ubuntu2404-Readme.md", "SOFTWARE_MANIFEST_VERSION_MISMATCH")
    require(unquote(observed["Image Release"]) == f"https://github.com/actions/runner-images/releases/tag/ubuntu24/{release}", "IMAGE_RELEASE_VERSION_MISMATCH")
    return observed


def normalized_image(observed):
 value=dict(observed)
 value['Image Release']=unquote(value['Image Release'])
 return value


def compare(log_bytes,identity,observations,provider,*,run_id,job_id,source_sha,workflow_path):
 require(isinstance(source_sha,str) and COMMIT.fullmatch(source_sha),'EXPECTED_SOURCE_SHA_REQUIRED')
 require(type(run_id) is int and run_id>0 and type(job_id) is int and job_id>0,'EXPECTED_RUN_AND_JOB_REQUIRED')
 require(isinstance(workflow_path,str) and re.fullmatch(r'\.github/workflows/[A-Za-z0-9_.-]+\.ya?ml',workflow_path),'EXPECTED_WORKFLOW_PATH_REQUIRED')
 run=provider.get('run',{});jobs=provider.get('jobs',{})
 require(jobs.get('total_count')==1 and len(jobs.get('jobs',[]))==1,'ONE_PROVIDER_JOB_REQUIRED')
 job=jobs['jobs'][0]
 require(run.get('id')==run_id and job.get('id')==job_id and job.get('run_id')==run_id,'PROVIDER_RUN_JOB_BINDING')
 require(run.get('repository',{}).get('id')==REPOSITORY_ID and run.get('repository',{}).get('full_name')==REPOSITORY and job.get('run_url')==f'https://api.github.com/repos/{REPOSITORY}/actions/runs/{run_id}','PROVIDER_REPOSITORY_BINDING')
 require(run.get('run_attempt')==job.get('run_attempt')==identity.get('runAttempt')==1,'FIRST_ATTEMPT_REQUIRED')
 require(run.get('head_sha')==job.get('head_sha')==identity.get('workflowCommit')==source_sha,'SOURCE_BINDING_MISMATCH')
 require(run.get('path')==identity.get('workflowPath')==workflow_path and run.get('event')=='create','WORKFLOW_PATH_EVENT_BINDING')
 require(run.get('status')==job.get('status')=='completed' and isinstance(run.get('conclusion'),str) and bool(run['conclusion']) and isinstance(job.get('conclusion'),str) and bool(job['conclusion']),'TERMINAL_PROVIDER_RECORDS_REQUIRED')
 require(identity.get('provider')=='github-actions' and identity.get('repository')==REPOSITORY and str(identity.get('repositoryId'))==str(REPOSITORY_ID),'RUNTIME_REPOSITORY_BINDING')
 require(identity.get('runId')==str(run_id) and identity.get('jobId')==job_id,'RUNTIME_RUN_JOB_BINDING')
 require(identity.get('sessionId')==f'github-actions:{run_id}:1:{job_id}','RUNTIME_SESSION_BINDING')
 require(identity.get('runnerId')==job.get('runner_id') and type(job.get('runner_id')) is int and job['runner_id']>0,'RUNNER_ID_BINDING')
 require(identity.get('runnerName')==job.get('runner_name') and isinstance(job.get('runner_name'),str) and bool(job['runner_name']),'RUNNER_NAME_BINDING')
 require(identity.get('runnerGroupName')==job.get('runner_group_name')=='GitHub Actions','RUNNER_GROUP_BINDING')
 require(identity.get('labels')==job.get('labels')==['ubuntu-24.04'],'STANDARD_HOSTED_LABELS_REQUIRED')
 # Stable service fields must still match observations collected while this exact
 # job was running. Terminal status/conclusion and timestamps legitimately change.
 initial_run=identity.get('serviceRunObserved',{});initial_job=identity.get('serviceJobObserved',{})
 require(initial_run.get('status')==initial_job.get('status')=='in_progress','INITIAL_SERVICE_OBSERVATIONS_REQUIRED')
 require(all(initial_run.get(k)==run.get(k) for k in ('id','run_attempt','head_sha','head_branch','event','path')),'INITIAL_SERVICE_RUN_BINDING')
 require(all(initial_job.get(k)==job.get(k) for k in ('id','run_id','name','runner_id','runner_name','runner_group_id','runner_group_name','labels','started_at')),'INITIAL_SERVICE_JOB_BINDING')
 try:validate_image_provenance(observations,identity)
 except AdmissionRefusal as exc:raise Refusal(str(exc)) from None
 setup=runner_image_block(log_bytes)
 setup_name=next((TIMESTAMP.sub('',line,count=1).removeprefix('Complete job name:').strip() for line in log_bytes.decode('utf-8-sig').splitlines() if TIMESTAMP.sub('',line,count=1).startswith('Complete job name:')),None)
 require(setup_name==job.get('name'),'PROVIDER_LOG_JOB_NAME_BINDING')
 require(normalized_image(setup)==normalized_image(observations['observations']['setupInfo']),'PROVIDER_RECORDED_SETUP_OBSERVATION_CHANGED')
 return {'schema':'work8-v75-terminal-executor-observations-v1','status':'PROVIDER_EXECUTOR_OBSERVATIONS_RECONCILED_ONLY','runId':run_id,'jobId':job_id,'runAttempt':1,'workflowCommit':source_sha,'workflowPath':workflow_path,'runnerId':job['runner_id'],'runnerName':job['runner_name'],'providerRunConclusion':run['conclusion'],'providerJobConclusion':job['conclusion'],'providerSetup':setup,'recordedSetup':observations['observations']['setupInfo'],'recordedImageData':observations['observations']['imageData'],'runtimeEnvironmentImageVersion':observations['observations']['ImageVersion'],'metadataAgreement':observations['metadataAgreement'],'diagnosticCode':observations['diagnosticCode'],'discrepancyCause':observations['discrepancyCause'],'metadataDisagreementProvenHarmless':False,'imageBuildIdentityEstablished':False,'nativeAdmissionGranted':False,'applicationAcceptance':False,'limitation':'Provider job/source/runner and recorded setup observations only. Setup log is derived metadata, not independent image-build attestation. A preserved disagreement remains unexplained. Caller must independently attribute the retrieved log to this job; actual native security, lifecycle, drain and final whole-application readback remain separate mandatory evidence.'}


def read_bounded(path,maximum):
 fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW|os.O_CLOEXEC)
 try:
  before=os.fstat(fd);require(stat.S_ISREG(before.st_mode) and before.st_nlink==1,'REGULAR_EVIDENCE_FILE_REQUIRED')
  require(0<before.st_size<=maximum,'EVIDENCE_FILE_SIZE_BOUND')
  with os.fdopen(fd,'rb',closefd=False) as stream:raw=stream.read(maximum+1)
  after=os.fstat(fd)
  require(len(raw)==before.st_size and (before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns,before.st_ctime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns,after.st_ctime_ns),'EVIDENCE_CHANGED_DURING_READ')
  return raw
 finally:os.close(fd)


def write_result(path,result):
 path.parent.mkdir(parents=True,exist_ok=True)
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW|os.O_CLOEXEC,0o600)
 try:
  os.fchmod(fd,0o600)
  with os.fdopen(fd,'w',encoding='utf-8',closefd=False) as stream:
   json.dump(result,stream,sort_keys=True,indent=2);stream.write('\n');stream.flush();os.fsync(fd)
 finally:os.close(fd)
 directory=os.open(path.parent,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW|os.O_CLOEXEC)
 try:os.fsync(directory)
 finally:os.close(directory)


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 for field in ('job-log','runtime-identity','executor-observations','provider-receipt','output'):parser.add_argument('--'+field,required=True,type=pathlib.Path)
 for field in ('log-sha256','identity-sha256','observations-sha256','provider-sha256','source-sha'):parser.add_argument('--expected-'+field,required=True)
 parser.add_argument('--expected-run-id',required=True,type=int);parser.add_argument('--expected-job-id',required=True,type=int);parser.add_argument('--expected-workflow-path',required=True)
 args=parser.parse_args();hashes={}
 try:
  buffers={}
  for role,path,expected,bound in [('providerLog',args.job_log,args.expected_log_sha256,MAX_LOG_BYTES),('runtimeIdentity',args.runtime_identity,args.expected_identity_sha256,MAX_JSON_BYTES),('executorObservations',args.executor_observations,args.expected_observations_sha256,MAX_JSON_BYTES),('providerReceipt',args.provider_receipt,args.expected_provider_sha256,MAX_JSON_BYTES)]:
   require(SHA256.fullmatch(expected),'EXPECTED_EVIDENCE_HASH_REQUIRED');raw=read_bounded(path,bound);hashes[role]={'bytes':len(raw),'sha256':digest(raw)};require(digest(raw)==expected,'EVIDENCE_HASH_MISMATCH_'+role);buffers[role]=raw
  def parsed(role):return json.loads(buffers[role],object_pairs_hook=unique_object)
  require(parsed('executorObservations').get('runtimeIdentityReceipt',{}).get('sha256')==hashes['runtimeIdentity']['sha256'],'OBSERVATIONS_IDENTITY_BYTES_BINDING')
  result=compare(buffers['providerLog'],parsed('runtimeIdentity'),parsed('executorObservations'),parsed('providerReceipt'),run_id=args.expected_run_id,job_id=args.expected_job_id,source_sha=args.expected_source_sha,workflow_path=args.expected_workflow_path)
  require(result.get('nativeAdmissionGranted') is False and result.get('applicationAcceptance') is False,'OBSERVATION_SCOPE_REQUIRED');result['evidence']=hashes;code=0
 except (Refusal,json.JSONDecodeError,OSError,TypeError,KeyError,ValueError) as exc:
  result={'schema':'work8-v75-terminal-executor-observations-v1','status':'REFUSED','code':str(exc) if isinstance(exc,Refusal) else type(exc).__name__,'nativeAdmissionGranted':False,'applicationAcceptance':False,'evidence':hashes};code=17
 write_result(args.output,result)
 print(json.dumps({'status':result['status'],'code':result.get('code'),'nativeAdmissionGranted':False}));return code


if __name__=='__main__':sys.exit(main())
