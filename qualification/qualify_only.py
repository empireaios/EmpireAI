#!/usr/bin/env python3
"""Inert-by-default, one-job V81 capability and handoff orchestration.

This wrapper cannot run Brain, an application examination, package rebuilding,
package export, independent ACK creation, or a full A5 launch contract. Provider
credentials exist only during identity/input download and artifact readback.
"""
import argparse
import datetime
from decimal import Decimal, InvalidOperation
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
sys.path.insert(0, str(SOURCE / 'v65/adapter'))
import runner
import github_contract as guard
from collect_runtime_image_provenance import collect as collect_provenance
from runtime_common import atomic, bounded_process
import frontend_packages
import original_contract
import package_applicability
import backend_resolution

ARTIFACT_ID = 13340201255
ARTIFACT_RUN = 41860150363
ARTIFACT_BYTES = 338251567
ARTIFACT_SHA = '39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
ARTIFACT_COMMIT = '87428f7fd4977a0669e8cff90242a784e9947a34'
ARTIFACT_NAME = 'v65-a5-candidates-41860150363-1'
MANIFEST_EXCLUSIONS = {'qualification/source-manifest.json', 'qualification/owner-approval.json'}
CONFIG_PATH = HERE / 'config.json'
STAGES = {'admission', 'identity', 'download', 'driver', 'handoff', 'repeat', 'original-contract', 'package-applicability', 'backend-resolution', 'frontend-extraction', 'frontend-loading', 'manifest-controls', 'identity-handoff', 'guard-controls', 'image-load', 'native-qualification', 'cleanup', 'export', 'artifact-check'}
RECEIPT_NAMES = {
    'identity/runner-identity.json', 'identity/runtime-image-provenance.json',
    'identity/source-admission.json', 'identity/authority-admission.json',
    'candidate-artifact-service.json', 'candidate-download.json', 'driver-receipt.json',
    'first-failure.json', 'cleanup.json', 'qualification-result.json',
    'stage.json',
    'admission-failure-custody.json',
    'manifest-negative-controls.json', 'repeated-preparation.json',
    'source-inventory-final.json', 'artifact-service-receipt.json',
}
PREPARED_NAMES = {
    'runner-identity.json', 'runtime-image-provenance.json',
    'qualification-only-authority.json', 'package-origin.json',
    'package-delivery.json', 'source-identities.json',
    'critical-image-readback.json', 'sqljs-packaging-smoke.json',
    'native-qualification.json', 'backend-image-import.json',
    'independent-prepared-inventory.json', 'v65-packages.json',
    'controller/scripts/work8/native-transition/controller-manifest.json',
    'native-transition-driver/controller-manifest.json',
    'runtime-evidence/guard-controls.json',
    'runtime-evidence/first-runtime-failure.json',
    'runtime-evidence/first-runtime-command-failure.json',
    'runtime-evidence/native-capability-observation.json',
    'runtime-evidence/qualification-cleanup.json',
    'runtime-evidence/dumpability-observer-build.json',
    'runtime-evidence/receipt-cleanup.json',
    'diagnostic-controls/negative-control-result.json',
    'reuse-evidence/sequential-handoff.json',
    'reuse-evidence/first-reuse-failure.json',
    'reuse-evidence/backend-child.json', 'reuse-evidence/backend-grandchild.json',
    'reuse-evidence/frontends-child.json', 'reuse-evidence/frontends-grandchild.json',
    'original-contract-q01-q03.json', 'package-applicability-static.json', 'package-applicability.json',
    'backend-resolution-observation.json', 'backend-resolution.json', 'backend-resolution-cleanup.json',
    'frontend-extraction.json', 'frontend-normal-inventory.json', 'frontend-recovery-inventory.json',
    'frontend-normal-loading.json', 'frontend-recovery-loading.json',
    'frontend-normal-cleanup.json', 'frontend-recovery-cleanup.json',
    'frontend-qualification.json', 'frontend-scope-cleanup.json',
}
FORBIDDEN_CONTRACTS = ('run-contract.json', 'launch-contract.json', 'source-review.json', 'preflight-review.json')
REPEAT_NAMES = {name for name in PREPARED_NAMES if name.startswith('reuse-evidence/') or name in ('independent-prepared-inventory.json','controller/scripts/work8/native-transition/controller-manifest.json','native-transition-driver/controller-manifest.json')}


class Refusal(ValueError):
    pass


def need(ok, code):
    if not ok:
        raise Refusal(code)


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def read_json(path, maximum=1024 * 1024):
    path = Path(path)
    s = path.lstat()
    need(path.is_absolute() and path.resolve() == path and stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'REGULAR_CANONICAL_JSON_REQUIRED')
    need(0 < s.st_size <= maximum, 'JSON_SIZE_BOUND')
    return json.loads(path.read_bytes())


def amount(value):
    try:
        need(isinstance(value, str), 'DECIMAL_STRING_REQUIRED')
        result = Decimal(value)
        need(result.is_finite(), 'FINITE_AMOUNT_REQUIRED')
        return result
    except InvalidOperation:
        raise Refusal('DECIMAL_AMOUNT_REQUIRED') from None


def validate_authority(config, approval=None, manifest_sha=None):
    """Pure admission: false/zero defaults refuse before any provider/process action."""
    need(config.get('schema') == 'work8-v81-qualification-only-config-v1', 'QUALIFICATION_CONFIG_REQUIRED')
    need(config.get('released') is True, 'QUALIFICATION_NOT_RELEASED')
    a = config.get('authority', {})
    need(a.get('scope') == 'one-qualification-only-attempt' and a.get('ownerDecisionRecorded') is True and a.get('maximumAttempts') == 1, 'SEPARATE_QUALIFICATION_APPROVAL_REQUIRED')
    need(a.get('reservationCommitted') is True and a.get('providerBillingBoundVerified') is True, 'QUALIFICATION_RESERVATION_AND_BILLING_REQUIRED')
    need({k: a.get(k) for k in ('work8CeilingUSD', 'priorOverallHoldsUSD', 'priorA5HoldsUSD', 'availableBeforeReservationUSD')} == {'work8CeilingUSD':'100.00', 'priorOverallHoldsUSD':'12.12', 'priorA5HoldsUSD':'2.17', 'availableBeforeReservationUSD':'7.83'}, 'CURRENT_LEDGER_REQUIRED')
    reserve, exposure = amount(a.get('reservationUSD')), amount(a.get('maximumProspectiveUSD'))
    need(Decimal('0.000152') <= exposure <= reserve <= Decimal('0.01'), 'QUALIFICATION_FINANCIAL_CAP_REQUIRED')
    need(amount(a.get('currentOverallHoldsUSD')) == Decimal('12.12') + reserve and amount(a.get('currentA5HoldsUSD')) == Decimal('2.17') + reserve and amount(a.get('remainingUnreservedUSD')) == Decimal('7.83') - reserve, 'QUALIFICATION_LEDGER_ARITHMETIC')
    need(all(a.get(k) is False for k in ('automaticRetries','applicationExecutionAuthorized','packageRebuildAuthorized','packageReuploadAuthorized','productionOperations','protectedDataTransfer','commerceActivation')), 'QUALIFICATION_SCOPE_LOCKS_REQUIRED')
    need(guard.digest_string(a.get('billingEvidenceSHA256')), 'CURRENT_BILLING_EVIDENCE_REQUIRED')
    need(guard.digest_string(config.get('packageApplicabilityProofSHA256')), 'REVIEWED_COMPLETE_PACKAGE_APPLICABILITY_REQUIRED')
    need(isinstance(approval, dict) and approval.get('schema') == 'work8-v81-owner-qualification-approval-v1' and approval.get('recordedOwnerApproval') is True, 'OWNER_APPROVAL_RECEIPT_REQUIRED')
    need(approval.get('scope') == a['scope'] and approval.get('maximumAttempts') == 1 and approval.get('applicationExecutionAuthorized') is False, 'OWNER_QUALIFICATION_SCOPE_REQUIRED')
    need(guard.digest_string(manifest_sha) and approval.get('sourceManifestSHA256') == manifest_sha and approval.get('reservationUSD') == a['reservationUSD'] and approval.get('maximumProspectiveUSD') == a['maximumProspectiveUSD'], 'APPROVAL_SOURCE_AND_EXPOSURE_BINDING_REQUIRED')
    need(config.get('repository') == guard.REPOSITORY and config.get('repositoryId') == guard.REPOSITORY_ID and config.get('workflowPath') == '.github/workflows/work8-v81-qualification.yml' and config.get('launchRef') == 'refs/heads/work8/v86-qualification-20261107' and config.get('jobName') == 'A5 V86 security and handoff qualification', 'EXACT_QUALIFICATION_ROUTE_REQUIRED')
    limits = config.get('limits', {})
    need(limits == {'jobTimeoutSeconds':3600,'runStepSeconds':2580,'cleanupSeconds':480,'uploadSeconds':180,'artifactVerificationSeconds':120,'exportLogicalBytes':8388608,'exportFiles':128,'maximumServiceZipBytes':16777216,'artifactObjects':1,'retentionDays':1}, 'QUALIFICATION_EXPOSURE_LIMITS_REQUIRED')
    return a


def source_inventory(root):
    root = Path(root)
    need(root.is_absolute() and root.resolve() == root, 'CANONICAL_SOURCE_REQUIRED')
    rows = []
    for path in sorted(root.rglob('*')):
        name = path.relative_to(root).as_posix()
        if name == '.git' or name.startswith('.git/'):
            continue
        s = path.lstat()
        need(not stat.S_ISLNK(s.st_mode), 'SOURCE_SYMLINK_REFUSED')
        if stat.S_ISDIR(s.st_mode):
            continue
        need(stat.S_ISREG(s.st_mode) and s.st_nlink == 1, 'SOURCE_NONREGULAR_REFUSED')
        if name not in MANIFEST_EXCLUSIONS:
            rows.append({'path':name,'bytes':s.st_size,'sha256':digest(path)})
    return rows


def validate_source(root):
    root = Path(root)
    manifest = root / 'qualification/source-manifest.json'
    expected = read_json(manifest)
    need(expected.get('schema') == 'work8-v81-qualification-source-manifest-v1', 'SOURCE_MANIFEST_SCHEMA')
    actual = source_inventory(root)
    need(expected.get('files') == actual and len(actual) > 141, 'QUALIFICATION_SOURCE_INVENTORY_CHANGED')
    guard.verify_manifest(root/'v65/foundation/controller/scripts/work8/native-transition', root/'v65/foundation/controller/scripts/work8/native-transition/controller-manifest.json', runner.CONTROLLER_SHA)
    return {'sourceManifestSHA256':digest(manifest),'sourceFileCount':len(actual),'sourceFilesSHA256':hashlib.sha256(json.dumps(actual,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'strictControllerManifestSHA256':runner.CONTROLLER_SHA}


def private_directory(path):
    path = Path(path)
    s = path.lstat()
    need(path.is_absolute() and path.resolve() == path and stat.S_ISDIR(s.st_mode) and s.st_uid == s.st_gid == 1001 and stat.S_IMODE(s.st_mode) == 0o700, 'PRIVATE_UID1001_DIRECTORY_REQUIRED')
    return path


def expected_campaign(path):
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    need(re.fullmatch('[1-9][0-9]{0,19}', run_id) is not None, 'CURRENT_RUN_ID_REQUIRED')
    parent = Path(os.environ.get('RUNNER_TEMP', '/missing-runner-temp'))
    expected = parent / ('v81-qualification-' + run_id)
    need(parent.is_absolute() and parent.resolve() == parent and Path(path) == expected and expected.resolve() == expected, 'EXACT_PRIVATE_CAMPAIGN_PATH_REQUIRED')
    return expected


def clean_env(root):
    return {'PATH':'/usr/sbin:/usr/bin:/sbin:/bin','LANG':'C.UTF-8','PYTHONDONTWRITEBYTECODE':'1','HOME':str(Path(root)/'home')}


def sanitize_failure(stage, exc):
    typed = (Refusal, guard.Refusal, runner.RuntimeRefusal, frontend_packages.Refusal, original_contract.Refusal, package_applicability.Refusal, backend_resolution.Refusal)
    code = str(exc) if isinstance(exc, typed) and re.fullmatch('[A-Z0-9_]{1,100}', str(exc)) else 'QUALIFICATION_' + type(exc).__name__.upper()
    if isinstance(exc, subprocess.TimeoutExpired): code = 'COMMAND_DEADLINE'
    elif isinstance(exc, OSError): code = 'COMMAND_OS_ERROR'
    number=getattr(exc,'errno',None)
    return {'schema':'work8-v81-qualification-first-failure-v1','stage':stage if stage in STAGES else 'admission','code':code,'errno':number if type(number) is int else None,'rawOutputRetained':False,'applicationStarted':False,'applicationExecutionAuthorized':False}


def child_cause(value):
    """Only typed public codes, never raw exception messages or output."""
    if not isinstance(value, dict): return None
    for key in ('firstCause', 'firstCausalFailure', 'code'):
        item = value.get(key)
        if isinstance(item, str) and re.fullmatch('[A-Z0-9_]{1,100}', item): return item
        if isinstance(item, dict):
            found = child_cause(item)
            if found: return found
    return None


def nested_first_cause(campaign, stage):
    names = []
    if stage == 'identity': names = ['identity/runtime-image-provenance.json']
    elif stage in ('handoff', 'repeat'):
        prefix = 'repeat-prepared/' if stage == 'repeat' else 'prepared/'
        names = [prefix+'reuse-evidence/first-reuse-failure.json', prefix+'runtime-evidence/first-runtime-command-failure.json', prefix+'runtime-evidence/first-runtime-failure.json']
    elif stage in ('guard-controls', 'image-load', 'native-qualification', 'backend-resolution', 'frontend-loading'):
        names = ['prepared/runtime-evidence/first-runtime-command-failure.json','prepared/runtime-evidence/first-runtime-failure.json']
    for name in names:
        path = campaign/name
        if path.exists():
            value = read_json(path, 65536); code = child_cause(value)
            if code: return {'code':code,'sourceReceipt':name,'sourceReceiptSHA256':digest(path)}
    return None


def diagnostic_custody(campaign):
    """Sanitized failure-only custody; never substitutes for principal admission."""
    campaign = expected_campaign(campaign)
    parent = campaign.parent; s = parent.lstat()
    need(stat.S_ISDIR(s.st_mode) and parent.resolve() == parent and s.st_uid == os.getuid(), 'FAILURE_CUSTODY_PARENT_REQUIRED')
    if not campaign.exists() and not campaign.is_symlink(): campaign.mkdir(mode=0o700)
    s = campaign.lstat()
    need(stat.S_ISDIR(s.st_mode) and campaign.resolve() == campaign and s.st_uid == os.getuid() and s.st_gid == os.getgid() and stat.S_IMODE(s.st_mode) == 0o700, 'FAILURE_CUSTODY_REQUIRED')
    return campaign


def preserve_early_failure(campaign, stage, exc):
    need(stage in ('admission','identity'), 'EARLY_FAILURE_SCOPE_REQUIRED')
    campaign = diagnostic_custody(campaign)
    need(not (campaign/'prepared').exists() and not (campaign/'repeat-prepared').exists(), 'EARLY_FAILURE_NO_RESOURCES_REQUIRED')
    marker = campaign/'admission-failure-custody.json'
    if not marker.exists():
        atomic(marker, {'schema':'work8-v84-failure-only-custody-v1','runId':os.environ.get('GITHUB_RUN_ID'),'workflowCommit':os.environ.get('GITHUB_SHA'),'observedUid':os.getuid(),'observedGid':os.getgid(),'nativeAdmissionGranted':False,'applicationStarted':False,'noNativeResourcesCreated':True}, exclusive=True)
    if not (campaign/'first-failure.json').exists():
        record = sanitize_failure(stage,exc)
        observed = nested_first_cause(campaign,stage)
        if observed: record.update(code=observed['code'],firstObservedChildCause=observed)
        atomic(campaign/'first-failure.json',record,exclusive=True)


def preserve_first_failure(campaign, stage, exc):
    campaign = private_directory(campaign)
    target = campaign/'first-failure.json'
    if not target.exists():
        record=sanitize_failure(stage, exc)
        observed=nested_first_cause(campaign,stage)
        if observed:record.update(code=observed['code'],firstObservedChildCause=observed)
        atomic(target, record, exclusive=True)
    else:
        read_json(target, 16384)
    return digest(target)


def run_bounded(argv, env, seconds, stage, campaign):
    need(stage in STAGES and 0 < seconds <= 1200, 'COMMAND_SCOPE_BOUND')
    # No raw stdout/stderr is printed or exported. Nested first-failure receipts
    # remain in their source directory and are separately allowlisted.
    try:
        result = bounded_process(argv, env, seconds, 1024*1024)
    except subprocess.TimeoutExpired:
        raise Refusal('COMMAND_DEADLINE') from None
    except runner.RuntimeRefusal as exc:
        raise Refusal('COMMAND_OUTPUT_BOUND' if str(exc)=='COMMAND_OUTPUT_BOUND' else 'BOUNDED_COMMAND_REFUSED') from None
    except OSError as exc:
        error=Refusal('COMMAND_OS_ERROR');error.errno=exc.errno
        raise error from None
    if result.returncode != 0:
        code = 'QUALIFICATION_SUBPROCESS_FAILED'
        try:
            payload = json.loads(result.stdout)
            code = child_cause(payload) or code
        except Exception:
            pass
        raise Refusal(code)
    return result.stdout


def identity(campaign, config, source, approval_sha):
    need(os.getuid() == os.geteuid() == os.getgid() == os.getegid() == 1001, 'ORIGINAL_HOST_PRINCIPAL_REQUIRED')
    need(os.environ.get('GITHUB_ACTIONS') == 'true' and os.environ.get('GITHUB_RUN_ATTEMPT') == '1' and os.environ.get('GITHUB_REF') == config['launchRef'], 'FRESH_QUALIFICATION_JOB_REQUIRED')
    need(os.environ.get('GITHUB_REPOSITORY') == config['repository'] and os.environ.get('GITHUB_REPOSITORY_ID') == config['repositoryId'] and os.environ.get('GITHUB_JOB') == 'qualification', 'QUALIFICATION_REPOSITORY_JOB_REQUIRED')
    need(not campaign.exists(), 'FRESH_QUALIFICATION_CAMPAIGN_REQUIRED')
    repo = runner.api('/repos/' + guard.REPOSITORY)
    need(repo.get('id') == int(guard.REPOSITORY_ID) and repo.get('visibility') == 'public' and repo.get('archived') is False, 'PUBLIC_STANDARD_COMPUTE_REQUIRED')
    run_id = os.environ['GITHUB_RUN_ID']
    r = runner.api('/repos/'+guard.REPOSITORY+'/actions/runs/'+run_id)
    need(str(r.get('id')) == run_id and r.get('run_attempt') == 1 and r.get('head_sha') == os.environ.get('GITHUB_SHA') and r.get('event') == 'create' and r.get('path') == config['workflowPath'] and r.get('head_branch') == config['launchRef'].removeprefix('refs/heads/') and r.get('status') == 'in_progress', 'CURRENT_QUALIFICATION_SERVICE_RUN_REQUIRED')
    jobs = runner.api('/repos/'+guard.REPOSITORY+'/actions/runs/'+run_id+'/attempts/1/jobs?per_page=100')
    need(jobs.get('total_count') == 1 and len(jobs.get('jobs',[])) == 1, 'SINGLE_QUALIFICATION_JOB_REQUIRED')
    j = jobs['jobs'][0]
    need(j.get('name') == config['jobName'] and j.get('status') == 'in_progress' and j.get('labels') == ['ubuntu-24.04'] and type(j.get('runner_id')) is int and j['runner_id'] > 0 and j.get('runner_name') == os.environ.get('RUNNER_NAME'), 'ACTUAL_STANDARD_RUNNER_REQUIRED')
    started = datetime.datetime.fromisoformat(j['started_at'].replace('Z','+00:00')).timestamp()
    need(started <= time.time() < started+300, 'FRESH_QUALIFICATION_START_REQUIRED')
    os.umask(0o077)
    campaign.mkdir(mode=0o700)
    (campaign/'identity').mkdir(mode=0o700)
    (campaign/'home').mkdir(mode=0o700)
    image = os.environ.get('ImageVersion')
    need(os.environ.get('ImageOS') == 'ubuntu24' and re.fullmatch(r'\d{8}\.\d+\.\d+', image or ''), 'ACTUAL_UBUNTU24_IMAGE_REQUIRED')
    e = {'schema':'work8-v65-current-github-identity-v1','provider':'github-actions','repository':guard.REPOSITORY,'repositoryId':guard.REPOSITORY_ID,'runId':run_id,'runAttempt':1,'jobId':j['id'],'jobKey':'qualification','workflowCommit':r['head_sha'],'sessionId':'github-actions:'+run_id+':1:'+str(j['id']),'jobStartedAtEpoch':started,'timeoutSeconds':3600,'expiresAtEpoch':started+3600,'runnerImageVersion':image,'runnerName':j['runner_name'],'runnerId':j['runner_id'],'runnerGroupName':j.get('runner_group_name'),'labels':j['labels'],'hostUid':1001,'hostGid':1001,'architecture':'amd64','hostArtifactEgress':'github-provider-endpoints','nativeNetworkPolicy':'docker-internal-no-published-ports','ports':[],'productionMounts':[],'serviceRunSHA256':hashlib.sha256(json.dumps(r,sort_keys=True).encode()).hexdigest(),'serviceJobSHA256':hashlib.sha256(json.dumps(j,sort_keys=True).encode()).hexdigest(),'observedAtEpoch':time.time(),'applicationStarted':False,'workflowPath':config['workflowPath'],'serviceRunObserved':{k:r.get(k) for k in ('id','run_attempt','head_sha','head_branch','event','path','status')},'serviceJobObserved':{k:j.get(k) for k in ('id','run_id','name','status','runner_id','runner_name','runner_group_id','runner_group_name','labels','started_at')}}
    atomic(campaign/'identity/runner-identity.json', e, exclusive=True)
    code, provenance = collect_provenance(campaign/'identity/runtime-image-provenance.json')
    need(code == 0, 'ACTUAL_RUNNER_PROVENANCE_REQUIRED')
    guard.validate_image_provenance(provenance,e)
    atomic(campaign/'identity/source-admission.json', source, exclusive=True)
    atomic(campaign/'identity/authority-admission.json', {'schema':'work8-v81-qualification-only-authority-v1','sessionId':e['sessionId'],'workflowCommit':e['workflowCommit'],'maximumAttempts':1,'applicationExecutionAuthorized':False,'approvalReceiptSHA256':approval_sha,'sourceManifestSHA256':source['sourceManifestSHA256'],'authority':config['authority']}, exclusive=True)
    return e


def validate_artifact_metadata(value):
    need(value.get('id') == ARTIFACT_ID and value.get('name') == ARTIFACT_NAME and value.get('expired') is False and value.get('size_in_bytes') == ARTIFACT_BYTES and value.get('digest') == 'sha256:'+ARTIFACT_SHA, 'EXACT_RETAINED_ARTIFACT_REQUIRED')
    w = value.get('workflow_run',{})
    need(w.get('id') == ARTIFACT_RUN and w.get('head_sha') == ARTIFACT_COMMIT, 'RETAINED_ARTIFACT_RUN_BINDING_REQUIRED')
    expires = datetime.datetime.fromisoformat(value['expires_at'].replace('Z','+00:00')).timestamp()
    need(time.time() < expires, 'RETAINED_ARTIFACT_EXPIRED')
    return {k:value[k] for k in ('id','name','expired','size_in_bytes','digest','created_at','expires_at','workflow_run')}


def validate_download_url(url):
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname or ''
    need(parsed.scheme == 'https' and not parsed.username and not parsed.password and parsed.port in (None,443) and not parsed.fragment, 'DOWNLOAD_HTTPS_REQUIRED')
    need(host.endswith('.blob.core.windows.net') or host.endswith('.actions.githubusercontent.com') or host.endswith('.githubusercontent.com'), 'DOWNLOAD_PROVIDER_HOST_REQUIRED')
    return url


def download_candidate(campaign):
    metadata = validate_artifact_metadata(runner.api('/repos/'+guard.REPOSITORY+'/actions/artifacts/'+str(ARTIFACT_ID)))
    old_run = runner.api('/repos/'+guard.REPOSITORY+'/actions/runs/'+str(ARTIFACT_RUN))
    need(old_run.get('id') == ARTIFACT_RUN and old_run.get('run_attempt') == 1 and old_run.get('head_sha') == ARTIFACT_COMMIT and old_run.get('status') == 'completed', 'HISTORICAL_FIRST_ATTEMPT_REQUIRED')
    atomic(campaign/'candidate-artifact-service.json', metadata, exclusive=True)
    endpoint = 'https://api.github.com/repos/'+guard.REPOSITORY+'/actions/artifacts/'+str(ARTIFACT_ID)+'/zip'
    token = os.environ.get('GH_TOKEN')
    need(token and '\n' not in token, 'SCOPED_PROVIDER_READ_TOKEN_REQUIRED')
    req = urllib.request.Request(endpoint,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'EmpireAI-V81-qualification'})
    # The read token is NEVER forwarded to the signed storage redirect.
    class CaptureRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs):
            return None
    opener = urllib.request.build_opener(CaptureRedirect)
    try:
        with opener.open(req,timeout=30):
            raise Refusal('SIGNED_ARTIFACT_REDIRECT_REQUIRED')
    except urllib.error.HTTPError as exc:
        need(exc.code in (302,303,307,308), 'ARTIFACT_REDIRECT_RESPONSE_REQUIRED')
        url = validate_download_url(exc.headers.get('Location',''))
    target = campaign/'retained-candidates.zip'
    start = time.monotonic()
    # Every additional redirect is independently checked; no credential headers.
    for redirects in range(3):
        try:
            response = opener.open(urllib.request.Request(url,headers={'User-Agent':'EmpireAI-V81-qualification'}),timeout=30)
            break
        except urllib.error.HTTPError as exc:
            need(exc.code in (302,303,307,308) and redirects < 2, 'ARTIFACT_DOWNLOAD_HTTP_REFUSED')
            url = validate_download_url(exc.headers.get('Location',''))
    size = 0
    h = hashlib.sha256()
    with response, target.open('xb') as out:
        while True:
            need(time.monotonic()-start < 480, 'ARTIFACT_DOWNLOAD_DEADLINE')
            data = response.read(min(1024*1024,ARTIFACT_BYTES-size+1))
            if not data:
                break
            size += len(data)
            need(size <= ARTIFACT_BYTES, 'ARTIFACT_DOWNLOAD_SIZE_BOUND')
            h.update(data);out.write(data)
        out.flush();os.fsync(out.fileno())
    target.chmod(0o600)
    need(size == ARTIFACT_BYTES and h.hexdigest() == ARTIFACT_SHA, 'ARTIFACT_DOWNLOAD_IDENTITY_CHANGED')
    atomic(campaign/'candidate-download.json', {'schema':'work8-v81-exact-retained-download-v1','artifactId':ARTIFACT_ID,'runId':ARTIFACT_RUN,'bytes':size,'sha256':h.hexdigest(),'signedURLExported':False,'providerTokenForwarded':False,'packagesRebuilt':False}, exclusive=True)
    return target


def remaining(identity_value, seconds):
    need(time.time() + seconds < identity_value['expiresAtEpoch'], 'QUALIFICATION_CLEANUP_EXPORT_RESERVE_REQUIRED')


def materialize_driver(campaign):
    stage = campaign/'driver-stage';stage.mkdir(mode=0o700)
    # Existing acquisition imports the exact2 public registry archives, then
    # verifies the unchanged174-file driver manifest. No package manager/build.
    code = "import sys,pathlib;sys.path.insert(0,sys.argv[1]);import runner;runner.fetch_driver(pathlib.Path(sys.argv[2]));print('DRIVER_MATERIALIZED')"
    run_bounded(['/usr/bin/python3','-B','-c',code,str(SOURCE/'v65/adapter'),str(stage)],clean_env(campaign),180,'driver',campaign)
    driver = stage/'native-transition-driver'
    guard.verify_manifest(driver,driver/'controller-manifest.json',runner.DRIVER_SHA)
    atomic(campaign/'driver-receipt.json', {'schema':'work8-v81-public-driver-materialization-v1','manifestSHA256':runner.DRIVER_SHA,'indexedFiles':174,'sourcePinsSHA256':digest(SOURCE/'v65/foundation/driver/sources.json'),'applicationPackagesRebuilt':False,'existingHostedDriverArtifactClaimed':False}, exclusive=True)
    return driver


def handoff(campaign, artifact, driver, name):
    prepared = campaign/name
    need(name in ('prepared','repeat-prepared') and not prepared.exists(), 'FRESH_PREPARATION_ROOT_REQUIRED')
    argv = ['/usr/bin/python3','-B',str(SOURCE/'v65/build/reuse_completed_candidates.py'),'prepare','--root',str(prepared),'--candidate-artifact',str(artifact),'--retained-driver',str(driver)]
    run_bounded(argv,clean_env(campaign),900,'handoff' if name == 'prepared' else 'repeat',campaign)
    result = read_json(prepared/'reuse-evidence/sequential-handoff.json')
    need(result.get('status') == 'PASS_COMPLETE_RETAINED_PACKAGE_TO_CONTROLLER_PREPARATION' and result.get('sourceInventoryUnchanged') is True and result.get('cacheFilesCreated') == 0 and result.get('packagesRebuilt') is False and result.get('originalReconstructionMainExecuted') is False and result.get('applicationStarted') is False, 'ACTUAL_RETAINED_HANDOFF_REQUIRED')
    independent_prepared_inventory(prepared,result)
    return prepared,result


def canonical_prepared_inventory(rows):
    """Validate the complete file map, then order canonical POSIX path keys.

    Filesystem traversal and manifest serialization may have different orders.
    Neither operand is trusted: reject malformed or duplicate entries before
    comparing the full path/size/SHA256 map under the same ordering contract.
    """
    need(isinstance(rows, list) and 0 < len(rows) <= 20000,
         'PREPARED_INVENTORY_SIZE_BOUND')
    indexed = {}
    for row in rows:
        need(isinstance(row, dict) and set(row) == {'path', 'bytes', 'sha256'},
             'PREPARED_INVENTORY_ENTRY_SCHEMA')
        name = guard.relative_name(row['path'])
        need(name not in indexed, 'PREPARED_DUPLICATE_INVENTORY_PATH')
        need(type(row['bytes']) is int and row['bytes'] >= 0 and
             guard.digest_string(row['sha256']), 'PREPARED_INVENTORY_ENTRY_IDENTITY')
        indexed[name] = {'path': name, 'bytes': row['bytes'], 'sha256': row['sha256']}
    return [indexed[name] for name in sorted(indexed)]


def independent_prepared_inventory(prepared, handoff_result):
    """Second filesystem walk independent of adapter's admission implementation.

    Export actual manifests and independently recomputed per-file inventories,
    enabling an external reviewer to verify the resulting prepared handoff.
    """
    observations={}
    for label,relative,manifest_sha in (
        ('controller','controller/scripts/work8/native-transition',handoff_result['controller']['controllerManifestSHA256']),
        ('driver','native-transition-driver',runner.DRIVER_SHA),
    ):
        root=prepared/relative;need(root.resolve()==root,'PREPARED_ROOT_LINK_REFUSED')
        manifest=root/'controller-manifest.json'
        expected=read_json(manifest)
        need(digest(manifest)==manifest_sha,'PREPARED_MANIFEST_DIGEST_CHANGED')
        rows=[]
        for p in sorted(root.rglob('*')):
            s=p.lstat();need(not stat.S_ISLNK(s.st_mode),'PREPARED_INVENTORY_LINK_REFUSED')
            if stat.S_ISDIR(s.st_mode):continue
            need(stat.S_ISREG(s.st_mode) and s.st_nlink==1,'PREPARED_INVENTORY_NONREGULAR_REFUSED')
            if p==manifest:continue
            name=p.relative_to(root).as_posix()
            need(not name.endswith(('.pyc','.pyo')) and '__pycache__' not in p.relative_to(root).parts,'PREPARED_CACHE_FILE_REFUSED')
            rows.append({'path':name,'bytes':s.st_size,'sha256':digest(p)})
        rows = canonical_prepared_inventory(rows)
        expected_rows = canonical_prepared_inventory(expected['files'])
        need(rows == expected_rows, 'PREPARED_EXACT_INDEXED_INVENTORY_CHANGED')
        observations[label]={'manifestSHA256':manifest_sha,'filesVerified':len(rows),'inventory':rows,'cacheFilesCreated':0,'symlinksAccepted':0}
    receipt={'schema':'work8-v81-independent-prepared-inventory-v1','status':'PASS_SECOND_FILESYSTEM_WALK','method':'lstat plus SHA256 every regular file, exact manifest/inventory equality, no links/cache files','observations':observations,'applicationStarted':False,'wholeRowAcceptanceClaimed':False}
    atomic(prepared/'independent-prepared-inventory.json',receipt,exclusive=True)
    return receipt


def manifest_controls(campaign):
    source = SOURCE/'v65/foundation/controller/scripts/work8/native-transition'
    root = campaign/'manifest-controls';root.mkdir(mode=0o700)
    rows=[]
    expected = read_json(source/'controller-manifest.json')['files']
    name = expected[0]['path']
    for defect in ('missing','extra','modified','symlink'):
        dest = root/defect;shutil.copytree(source,dest)
        target = dest/name
        if defect == 'missing':target.unlink()
        elif defect == 'extra':(dest/'V81_UNKNOWN_FIXTURE').write_text('fixture\n')
        elif defect == 'modified':target.write_bytes(target.read_bytes()+b'\n')
        else:
            target.unlink();target.symlink_to('/nonexistent-v81-fixture')
        try:
            runner.verify_manifest_diagnostic(dest,dest/'controller-manifest.json',runner.CONTROLLER_SHA,'historical-controller')
        except (guard.Refusal, FileNotFoundError) as exc:
            diagnostic=getattr(exc,'manifestDiagnostic',{})
            need(diagnostic.get('schema') == 'work8-manifest-failure-diagnostic-v2' and diagnostic.get('rawContentsExported') is False and diagnostic.get('unknownRawPathsExported') is False, 'SANITIZED_ACTUAL_MANIFEST_DIAGNOSTIC_REQUIRED')
            field={'missing':'missingFiles','extra':'extraFiles','modified':'modifiedFiles','symlink':'symlinks'}[defect]
            need(type(diagnostic.get(field)) is int and diagnostic[field]>0,'EXPECTED_MANIFEST_DEFECT_DIAGNOSTIC_REQUIRED')
            rows.append({'defect':defect,'refused':True,'code':str(exc) if isinstance(exc,guard.Refusal) else type(exc).__name__,'diagnostic':diagnostic})
        else:raise Refusal('MANIFEST_DEFECT_SILENTLY_ACCEPTED')
    atomic(campaign/'manifest-negative-controls.json', {'schema':'work8-v81-hosted-manifest-controls-v1','controls':rows,'applicationStarted':False,'positiveHandoffSubstitute':False}, exclusive=True)


def copy_identity(campaign, prepared):
    private_directory(prepared)
    for name in ('runner-identity.json','runtime-image-provenance.json'):
        src=campaign/'identity'/name;read_json(src)
        dst=prepared/name;need(not dst.exists(),'FRESH_IDENTITY_HANDOFF_REQUIRED')
        with dst.open('xb') as out:out.write(src.read_bytes());out.flush();os.fsync(out.fileno())
        dst.chmod(0o600);need(digest(dst)==digest(src),'IDENTITY_COPY_HASH_CHANGED')
    marker=read_json(campaign/'identity/authority-admission.json')
    atomic(prepared/'qualification-only-authority.json',marker,exclusive=True)
    e=read_json(prepared/'runner-identity.json');p=read_json(prepared/'runtime-image-provenance.json')
    guard.validate_image_provenance(p,e);guard.validate_current_executor_continuity(p,e)


def load_backend(prepared):
    module=runner.load_module('v81_qualified_packages',prepared/'controller/scripts/work8/native-transition/current_packages.py')
    def bounded(argv,timeout=60):
        return runner.run(prepared,argv,seconds=min(timeout,240),maximum=1024*1024)
    result=module.load_backend(prepared/'artifacts'/module.BACKEND['file'],bounded)
    atomic(prepared/'backend-image-import.json',{'schema':'work8-v81-retained-backend-import-v1','result':result,'image':module.BACKEND['image'],'packageSHA256':module.BACKEND['sha256'],'rebuilt':False,'applicationStarted':False},exclusive=True)


def run_campaign(campaign):
    stage='admission';created=False
    try:
        config=read_json(CONFIG_PATH,32768)
        # Refuse before even trying to read absent approval or source manifests.
        need(config.get('released') is True,'QUALIFICATION_NOT_RELEASED')
        source=validate_source(SOURCE)
        approval=read_json(HERE/'owner-approval.json',32768)
        validate_authority(config,approval,source['sourceManifestSHA256'])
        # Complete static differences must be resolved before any provider or
        # native operation. This does not grant the required runtime checks.
        package_applicability.read_static_proof(HERE/'package-applicability-proof.json.gz',config.get('packageApplicabilityProofSHA256'))
        alias_spec=read_json(HERE/'backend-alias-probe-spec.json',32768)
        stage='identity';e=identity(campaign,config,source,digest(HERE/'owner-approval.json'));created=True
        remaining(e,2700)
        stage='download';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});artifact=download_candidate(campaign)
        # Drop bearer credentials before any dependency/reuse/native subprocess.
        for key in ('GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN'):
            os.environ.pop(key,None)
        stage='driver';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});driver=materialize_driver(campaign)
        remaining(e,2100)
        stage='handoff';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});prepared,first=handoff(campaign,artifact,driver,'prepared')
        remaining(e,1500)
        stage='repeat';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});repeat,second=handoff(campaign,artifact,driver,'repeat-prepared')
        need(first['controller']==second['controller'] and first['sourceFileSetSHA256']==second['sourceFileSetSHA256'] and first['sourceFileCount']==second['sourceFileCount'],'SUCCESSFUL_PREPARATION_REPEAT_DRIFT')
        atomic(campaign/'repeated-preparation.json',{'schema':'work8-v81-successful-preparation-repeat-v1','status':'PASS_TWO_FRESH_REAL_PREPARATIONS','firstReceiptSHA256':digest(prepared/'reuse-evidence/sequential-handoff.json'),'repeatReceiptSHA256':digest(repeat/'reuse-evidence/sequential-handoff.json'),'controller':first['controller'],'sourceFileSetSHA256':first['sourceFileSetSHA256'],'filesystemDrift':False,'applicationStarted':False},exclusive=True)
        stage='original-contract';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False})
        original_inputs=original_contract.verify_reused_reconstruction(prepared)
        need(original_inputs.get('status')=='PASS_RETAINED_RECONSTRUCTION_AND_CURRENT_PACKAGE_INPUTS','ORIGINAL_RECONSTRUCTION_INPUTS_REQUIRED')
        stage='package-applicability';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False})
        applicability=package_applicability.admit_applicability(prepared,HERE/'package-applicability-proof.json.gz',config.get('packageApplicabilityProofSHA256'))
        need(applicability.get('status')=='PASS_COMPLETE_REVIEWED_DIFFERENCES_AND_CURRENT_BYTES','COMPLETE_PACKAGE_APPLICABILITY_REQUIRED')
        atomic(prepared/'package-applicability-static.json',applicability,exclusive=True)
        stage='manifest-controls';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});manifest_controls(campaign)
        stage='identity-handoff';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});copy_identity(campaign,prepared)
        remaining(e,1800)
        stage='guard-controls';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});runner.guard_controls(prepared)
        stage='image-load';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False});load_backend(prepared)
        cp=runner.load_module('v84_prepared_current_packages',prepared/'controller/scripts/work8/native-transition/current_packages.py')
        stage='frontend-extraction';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False})
        extraction=frontend_packages.extract_frontends(prepared,cp)
        need(extraction.get('status')=='PASS_BOTH_COMPLETE_EXTRACTIONS' and set(extraction.get('roles',{}))=={'normal','recovery'},'BOTH_COMPLETE_FRONTEND_EXTRACTIONS_REQUIRED')
        stage='native-qualification';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False})
        result=runner.qualify(prepared,None,qualification_only=True)
        need(result.get('status')=='CURRENT_NATIVE_CAPABILITY_OBSERVED_NO_APPLICATION_AUTHORITY' and result.get('applicationExecutionAuthorized') is False,'QUALIFICATION_ONLY_RESULT_REQUIRED')
        stage='backend-resolution';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False})
        remaining(e,1000)
        alias_result=backend_resolution.qualify_backend_aliases(prepared,cp,runner,result,alias_spec)
        applicability=package_applicability.finalize_applicability(applicability,alias_result,digest(HERE/'backend-alias-probe-spec.json'))
        need(applicability.get('status')=='PASS_COMPLETE_STATIC_AND_REQUIRED_NATIVE_APPLICABILITY','COMPLETE_NATIVE_PACKAGE_APPLICABILITY_REQUIRED')
        atomic(prepared/'package-applicability.json',applicability,exclusive=True)
        stage='frontend-loading';atomic(campaign/'stage.json',{'stage':stage,'status':'STARTED','applicationStarted':False})
        remaining(e,900)
        frontend_result=frontend_packages.qualify_frontends(prepared,cp,runner,result)
        need(frontend_result.get('status')=='PASS_BOTH_COMPLETE_FRONTENDS_CURRENT_RUNNER' and set(frontend_result.get('roles',{}))=={'normal','recovery'},'BOTH_COMPLETE_FRONTEND_LOADING_RESULTS_REQUIRED')
        need(not any((prepared/name).exists() for name in FORBIDDEN_CONTRACTS),'FULL_APPLICATION_CONTRACT_REFUSED')
        need(validate_source(SOURCE)==source,'QUALIFICATION_SOURCE_DRIFT')
        atomic(campaign/'source-inventory-final.json',source,exclusive=True)
        final={'schema':'work8-v84-hosted-qualification-only-result-v1','status':'COMPLETE_PACKAGE_HANDOFF_AND_NATIVE_CAPABILITY_OBSERVED_INDEPENDENT_REVIEW_REQUIRED','sessionId':e['sessionId'],'workflowCommit':e['workflowCommit'],'sourceManifestSHA256':source['sourceManifestSHA256'],'sequentialHandoffSHA256':digest(prepared/'reuse-evidence/sequential-handoff.json'),'originalContractInputsSHA256':digest(prepared/'original-contract-q01-q03.json'),'packageApplicabilitySHA256':digest(prepared/'package-applicability.json'),'frontendExtractionSHA256':digest(prepared/'frontend-extraction.json'),'frontendQualificationSHA256':digest(prepared/'frontend-qualification.json'),'nativeQualificationSHA256':digest(prepared/'native-qualification.json'),'backendResolutionSHA256':digest(prepared/'backend-resolution.json'),'Q01':'SOURCE_RECONSTRUCTION_ATTRIBUTION_REUSED','Q02':'CURRENT_LOCK_AND_PINNED_BUILD_INPUT_BYTES_VERIFIED','Q03':'ACCEPTED_HISTORICAL_REMEDY_AND_CURRENT_ISOLATED_LOADING_OBSERVED','Q04':'COMPLETE_CURRENT_EXTRACTIONS_IMAGE_LOAD_AND_SECURITY_OBSERVED','Q05':'COMPLETE_STATIC_AND_REQUIRED_NATIVE_APPLICABILITY_VERIFIED','applicationStarted':False,'applicationExecutionAuthorized':False,'A5':'PENDING','A5-08':'NOT_EXECUTED','A5-09':'NOT_EXECUTED','wholeRowsAccepted':[],'packagesRebuilt':False,'packagesReuploaded':False,'currentRunnerOnly':True,'futureRunnerRequalificationRequired':True}
        atomic(campaign/'qualification-result.json',final,exclusive=True)
        return final
    except Exception as exc:
        exc.qualification_stage=stage
        if stage in ('admission','identity'):
            try:preserve_early_failure(campaign,stage,exc)
            except Exception:pass
        elif campaign.exists():
            try:preserve_first_failure(campaign,stage,exc)
            except Exception:pass
        raise


def safe_export_bytes(path):
    # Reuse the existing secret patterns and first-failure byte bound; never
    # include arbitrary logs, package archives or application private paths.
    exporter=runner.load_module('v81_export_safety',SOURCE/'v65/foundation/runtime/export-evidence.py')
    return exporter.safe_bytes(path)


def gather_export(campaign):
    campaign=diagnostic_custody(campaign) if (campaign/'admission-failure-custody.json').exists() else private_directory(campaign)
    names=set(RECEIPT_NAMES)
    names.update('prepared/'+name for name in PREPARED_NAMES)
    names.update('repeat-prepared/'+name for name in REPEAT_NAMES)
    result={}
    for name in sorted(names):
        p=campaign/name
        if p.exists() or p.is_symlink():
            result[name]=safe_export_bytes(p)
            need(len(result)<=127 and sum(map(len,result.values()))<=8*1024*1024-65536,'QUALIFICATION_EXPORT_BOUND')
    need(result,'QUALIFICATION_EXPORT_EMPTY')
    return result


def failure_preserver(campaign, early):
    return (lambda stage, exc: preserve_early_failure(campaign,'admission',exc)) if early else (lambda stage, exc: preserve_first_failure(campaign,stage,exc))


def finalize(campaign):
    if not campaign.exists():
        return {'status':'NO_CAMPAIGN_NO_RESOURCES','exportReady':False}
    early=(campaign/'admission-failure-custody.json').exists()
    if early:
        diagnostic_custody(campaign)
        marker=read_json(campaign/'admission-failure-custody.json',16384)
        need(marker.get('schema')=='work8-v84-failure-only-custody-v1' and marker.get('runId')==os.environ.get('GITHUB_RUN_ID') and marker.get('workflowCommit')==os.environ.get('GITHUB_SHA') and marker.get('nativeAdmissionGranted') is False and marker.get('noNativeResourcesCreated') is True,'FAILURE_CUSTODY_BINDING_REQUIRED')
        need(not (campaign/'prepared').exists() and not (campaign/'repeat-prepared').exists(),'EARLY_FAILURE_NO_RESOURCES_REQUIRED')
    else:private_directory(campaign)
    preserve=failure_preserver(campaign,early)
    identity_path=campaign/'identity/runner-identity.json'
    identity_value=read_json(identity_path) if identity_path.exists() else None
    if identity_value is not None:
        need(identity_value.get('runId')==os.environ.get('GITHUB_RUN_ID') and identity_value.get('workflowCommit')==os.environ.get('GITHUB_SHA') and identity_value.get('jobKey')=='qualification','CLEANUP_CURRENT_IDENTITY_REQUIRED')
    # A killed workflow step may have no wrapper terminal receipt. Preserve the
    # earliest available actual child cause; otherwise record interruption as
    # unknown/incomplete, never manufacture an underlying technical cause.
    if not early and not (campaign/'first-failure.json').exists() and not (campaign/'qualification-result.json').exists():
        stage_value=read_json(campaign/'stage.json',16384).get('stage','identity') if (campaign/'stage.json').exists() else 'identity'
        stage_value=stage_value if stage_value in STAGES else 'identity'
        observed=None
        for name in ('prepared/reuse-evidence/first-reuse-failure.json','repeat-prepared/reuse-evidence/first-reuse-failure.json','prepared/runtime-evidence/first-runtime-failure.json','prepared/runtime-evidence/first-runtime-command-failure.json'):
            p=campaign/name
            if p.exists():
                value=read_json(p,16384)
                code=child_cause(value)
                if isinstance(code,str) and re.fullmatch('[A-Z0-9_]{1,100}',code):
                    observed={'code':code,'sourceReceipt':name,'sourceReceiptSHA256':digest(p)}
                    break
        record=sanitize_failure(stage_value,Refusal(observed['code'] if observed else 'QUALIFICATION_INTERRUPTED_OR_INCOMPLETE'))
        record.update(firstObservedChildCause=observed,interruptionCauseKnown=observed is not None)
        atomic(campaign/'first-failure.json',record,exclusive=True)
    before=digest(campaign/'first-failure.json') if (campaign/'first-failure.json').exists() else None
    prepared=campaign/'prepared'
    errors=[]
    native_cleanup_attempted=False
    remaining_containers=None;remaining_networks=None
    try:
        if identity_value is not None and (prepared/'runner-identity.json').exists():
            need(digest(prepared/'runner-identity.json')==digest(campaign/'identity/runner-identity.json'),'CLEANUP_IDENTITY_COPY_CHANGED')
            native_cleanup_attempted=True
            runner.cleanup(prepared)
            private=prepared/'qualification-private'
            if private.exists() or private.is_symlink():
                private_directory(private)
                need(all(not p.is_symlink() for p in private.rglob('*')),'QUALIFICATION_PRIVATE_CLEANUP_SYMLINK_REFUSED')
                # The verified UID1001-owned directory contains only this
                # qualification nonce exchange. Its children are never exported.
                shutil.rmtree(private)
                need(not private.exists(),'QUALIFICATION_PRIVATE_CLEANUP_INCOMPLETE')
    except Exception as exc:
        errors.append(sanitize_failure('cleanup',exc))
        preserve('cleanup',exc)
    try:
        if (prepared/'backend-resolution-private').exists() or (prepared/'backend-resolution-private').is_symlink():
            backend_resolution.cleanup_backend_resolution(prepared)
    except Exception as exc:
        errors.append(sanitize_failure('cleanup',exc));preserve('cleanup',exc)
    if native_cleanup_attempted:
        try:
            label='label=work8.native=work8-v65-a5-'+identity_value['runId']
            remaining_containers=runner.run(prepared,['docker','ps','-aq','--filter',label],seconds=10,maximum=16384).decode().split()
            remaining_networks=runner.run(prepared,['docker','network','ls','-q','--filter',label],seconds=10,maximum=16384).decode().split()
            need(all(re.fullmatch('[a-f0-9]{12,64}',x) for x in remaining_containers+remaining_networks),'CLEANUP_REMAINING_ID_REFUSED')
            need(not remaining_containers and not remaining_networks,'QUALIFICATION_SCOPED_RESOURCES_REMAIN')
        except Exception as exc:
            errors.append(sanitize_failure('cleanup',exc));preserve('cleanup',exc)
    try:
        if (prepared/'frontend-qualification').exists() or (prepared/'frontend-qualification').is_symlink():
            frontend_packages.cleanup_frontends(prepared)
    except Exception as exc:
        errors.append(sanitize_failure('cleanup',exc))
        preserve('cleanup',exc)
    if before is not None:
        need(digest(campaign/'first-failure.json')==before,'FIRST_FAILURE_OVERWRITTEN')
    atomic(campaign/'cleanup.json',{'schema':'work8-v81-qualification-cleanup-v1','status':('NOT_APPLICABLE_NO_NATIVE_RESOURCES' if early else 'PASS') if not errors else 'FAIL','errors':errors,'firstCausalFailurePreserved':(campaign/'first-failure.json').exists(),'firstFailureBeforeCleanupSHA256':before,'firstFailureAtCleanupSHA256':digest(campaign/'first-failure.json') if (campaign/'first-failure.json').exists() else None,'admissionFailureOnly':early,'nativeCleanupAttempted':native_cleanup_attempted,'remainingScopedContainers':remaining_containers,'remainingScopedNetworks':remaining_networks,'frontendScopeRemoved':not (prepared/'frontend-qualification').exists(),'privateExchangeRemoved':not (prepared/'qualification-private').exists(),'backendResolutionScopeRemoved':not (prepared/'backend-resolution-private').exists(),'applicationStarted':False},exclusive=True)
    export_failed=False
    try:
        files=gather_export(campaign)
    except Exception as exc:
        export_failed=True
        preserve('export',exc)
        files={'first-failure.json':safe_export_bytes(campaign/'first-failure.json'),'cleanup.json':safe_export_bytes(campaign/'cleanup.json')}
        # Retain the bounded successful-stage summary, without treating it as
        # independently proven when its detailed evidence could not export.
        if (campaign/'qualification-result.json').exists():
            files['qualification-result.json']=safe_export_bytes(campaign/'qualification-result.json')
        atomic(campaign/'export-refusal.json',sanitize_failure('export',exc),exclusive=True)
        files['export-refusal.json']=safe_export_bytes(campaign/'export-refusal.json')
    destination=campaign/'export';need(not destination.exists(),'EXPORT_ALREADY_ATTEMPTED');destination.mkdir(mode=0o700)
    index={'schema':'work8-v81-sanitized-qualification-export-v1','files':[{'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in sorted(files.items())],'maximumLogicalBytes':8*1024*1024,'maximumServiceZipBytes':16*1024*1024,'applicationStarted':False,'acceptanceClaimed':False,'packageArchivesIncluded':False,'privateDataIncluded':False}
    files['export-index.json']=(json.dumps(index,sort_keys=True,separators=(',',':'))+'\n').encode()
    need(len(files)<=128 and len(files['export-index.json'])<=65536 and sum(map(len,files.values()))<=8*1024*1024,'QUALIFICATION_FINAL_EXPORT_BOUND')
    for name,data in sorted(files.items()):
        target=destination/name;target.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
        with target.open('xb') as out:out.write(data)
        target.chmod(0o600)
    # With <=128 bounded relative names and <=8MiB payload, ZIP envelope and
    # artifact metadata fit conservatively beneath the independently verified
    # 16MiB service cap. Service size/retention is checked after upload.
    return {'status':'SANITIZED_QUALIFICATION_EVIDENCE_READY','exportReady':True,'exportComplete':not export_failed,'files':len(files),'logicalBytes':sum(map(len,files.values())),'firstFailureSHA256':digest(campaign/'first-failure.json') if (campaign/'first-failure.json').exists() else None,'cleanupPassed':not errors}


def artifact_check(campaign, artifact_id, artifact_digest):
    early=(campaign/'admission-failure-custody.json').exists()
    if early:
        diagnostic_custody(campaign)
        marker=read_json(campaign/'admission-failure-custody.json',16384)
        need(marker.get('schema')=='work8-v84-failure-only-custody-v1' and marker.get('nativeAdmissionGranted') is False,'FAILURE_CUSTODY_BINDING_REQUIRED')
        e={'runId':marker['runId'],'workflowCommit':marker['workflowCommit']}
    else:
        private_directory(campaign)
        e=read_json(campaign/'identity/runner-identity.json')
    need(e['runId']==os.environ.get('GITHUB_RUN_ID') and e['workflowCommit']==os.environ.get('GITHUB_SHA'),'ARTIFACT_CURRENT_RUN_REQUIRED')
    need(re.fullmatch('[1-9][0-9]*',artifact_id or '') and guard.digest_string((artifact_digest or '').removeprefix('sha256:')),'ARTIFACT_OUTPUT_IDENTIFIERS_REQUIRED')
    a=runner.api('/repos/'+guard.REPOSITORY+'/actions/artifacts/'+artifact_id)
    listing=runner.api('/repos/'+guard.REPOSITORY+'/actions/runs/'+e['runId']+'/artifacts?per_page=100')
    need(listing.get('total_count')==1 and len(listing.get('artifacts',[]))==1 and listing['artifacts'][0].get('id')==int(artifact_id),'ONE_METADATA_ARTIFACT_REQUIRED')
    need(a.get('id')==int(artifact_id) and a.get('name')=='v81-qualification-'+e['runId']+'-1' and a.get('expired') is False and a.get('digest')=='sha256:'+artifact_digest.removeprefix('sha256:') and a.get('workflow_run',{}).get('id')==int(e['runId']) and a.get('workflow_run',{}).get('head_sha')==e['workflowCommit'],'CURRENT_QUALIFICATION_ARTIFACT_REQUIRED')
    created=datetime.datetime.fromisoformat(a['created_at'].replace('Z','+00:00')).timestamp();expires=datetime.datetime.fromisoformat(a['expires_at'].replace('Z','+00:00')).timestamp()
    need(type(a.get('size_in_bytes')) is int and 0<a['size_in_bytes']<=16*1024*1024 and 0<expires-created<=25*3600,'QUALIFICATION_ARTIFACT_EXPOSURE_BOUND')
    receipt={'schema':'work8-v81-qualification-artifact-service-v1','artifactId':a['id'],'bytes':a['size_in_bytes'],'digest':a['digest'],'createdAtUTC':a['created_at'],'expiresAtUTC':a['expires_at'],'runId':e['runId'],'runAttempt':1,'workflowCommit':e['workflowCommit'],'cumulativeArtifacts':1,'admissionFailureOnly':early,'nativeQualificationClaimed':False,'independentDownloadAndIndexReadbackRequired':True,'wholeRowsAccepted':[],'actualProviderChargeUSD':None}
    atomic(campaign/'artifact-service-receipt.json',receipt,exclusive=True)
    return receipt


def main():
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=('run','finalize','artifact-check'));parser.add_argument('--campaign',required=True);parser.add_argument('--artifact-id');parser.add_argument('--artifact-digest');args=parser.parse_args()
    try:
        campaign=expected_campaign(args.campaign)
        if args.command=='run':result=run_campaign(campaign)
        elif args.command=='finalize':
            result=finalize(campaign)
            output=os.environ.get('GITHUB_OUTPUT')
            if output:
                with open(output,'a',encoding='utf8') as stream:stream.write('export_ready='+str(result['exportReady']).lower()+'\n')
        else:result=artifact_check(campaign,args.artifact_id,args.artifact_digest)
        print(json.dumps(result,sort_keys=True))
        if args.command=='finalize' and (result.get('cleanupPassed') is False or result.get('exportComplete') is False):
            return 24
        return 0
    except Exception as exc:
        print(json.dumps(sanitize_failure('artifact-check' if args.command=='artifact-check' else getattr(exc,'qualification_stage','admission'),exc),sort_keys=True))
        return 23


if __name__=='__main__':
    raise SystemExit(main())
