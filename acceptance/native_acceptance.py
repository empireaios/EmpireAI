#!/usr/bin/env python3
"""One future A5 job: exact retained inputs, external authority and two ACKs.

This module never writes GitHub, creates an ACK, rebuilds a package, or executes
the historical Q01-Q05 campaign. Native application work is delegated unchanged
to the guarded adapter after independent acknowledgments on the same runner.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import urllib.parse
import sys
import time

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent
sys.path.insert(0, str(SOURCE / 'v65/adapter'))
sys.path.insert(0, str(SOURCE / 'v65/build'))
sys.path.insert(0, str(SOURCE / 'qualification'))
import github_contract as guard
import runner
import reuse_completed_candidates as reuse
import qualify_only as retained
from runtime_common import atomic
from retained_evidence import verify_retained_evidence

REPOSITORY = 'empireaios/EmpireAI'
LAUNCH_BRANCH = 'work8/v112-a5-20261111-a01'
REVIEW_BRANCH = 'work8/v112-review-20261111-a01'
WORKFLOW = '.github/workflows/work8-v112-a5.yml'
RELEASE_PATH = 'acceptance/v112-a01-release.json'
PARENT = 'ea4d0b57909e1c41249b9605e322da3a4d5b518c'
JOB_NAME = 'A5 V112 A01 coherent native acceptance'
RESERVATION = 'V112-A5-A01-20261111'
COMMANDS = ('identity', 'download', 'prepare', 'admission', 'review-export',
            'await-review', 'native', 'native-export', 'cleanup',
            'final-export', 'artifact-check')
MANIFEST_EXCLUSIONS = {'acceptance/source-manifest.json'}
UPLOAD_BUDGETS = {'packages-and-executor': 64 * 1024**2,
                  'preflight': 1024**2, 'final': 8 * 1024**2}
ENVELOPE_RESERVE = 16 * 1024**2
ARTIFACT_RETENTION_DAYS = 7
ACK_AUTHORITY = {'maximumOwnerEndorsements': 2, 'issueNumber': 113,
                 'stages': ['packages-and-executor', 'preflight'],
                 'scope': 'safe-artifact-acknowledgment-only',
                 'otherMessagesAuthorized': False}
OWNER_ID = 295548100
MAX_EXPOSURE_USD = '20.00'
LEDGER_BEFORE = {'masterCeilingCents': 100000, 'settledChargeCents': 0,
                 'remainingReservedExposureCents': 0, 'consumedExposureCents': 0,
                 'remainingAuthorityCents': 100000,
                 'priorAggregateHoldsUSD': '19.95', 'priorA5HoldsUSD': '10.00'}
LEDGER_AFTER = {**LEDGER_BEFORE, 'remainingReservedExposureCents': 2000,
                'consumedExposureCents': 2000, 'remainingAuthorityCents': 98000}
CREDENTIAL_ENV = ('GH_TOKEN', 'GITHUB_TOKEN', 'ACTIONS_RUNTIME_TOKEN')
DOCKER_OVERRIDE_ENV = ('DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_CONFIG',
                       'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH', 'DOCKER_API_VERSION')


def need(value, code):
    if not value:
        raise guard.Refusal(code)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def read_json(path, maximum=1024*1024):
    p = Path(path)
    fd = os.open(p, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as stream:
        observed = os.fstat(stream.fileno())
        need(p.is_absolute() and p.resolve() == p and
             stat.S_ISREG(observed.st_mode) and observed.st_nlink == 1 and
             0 < observed.st_size <= maximum, 'ACCEPTANCE_REGULAR_BOUNDED_JSON_REQUIRED')
        raw = stream.read(maximum + 1)
    need(len(raw) == observed.st_size, 'ACCEPTANCE_JSON_SIZE_CHANGED')
    return json.loads(raw)


def source_inventory(root=SOURCE):
    root = Path(root)
    need(root.is_absolute() and root.resolve() == root, 'CANONICAL_ACCEPTANCE_SOURCE_REQUIRED')
    rows = []
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if relative.parts[0] == '.git':
            continue
        need('.git' not in relative.parts, 'ACCEPTANCE_NESTED_GIT_REFUSED')
        need('__pycache__' not in relative.parts and path.suffix not in ('.pyc', '.pyo'),
             'ACCEPTANCE_SOURCE_CACHE_REFUSED')
        observed = path.lstat()
        mode = observed.st_mode
        need(not stat.S_ISLNK(mode), 'ACCEPTANCE_SOURCE_LINK_REFUSED')
        if stat.S_ISDIR(mode):
            continue
        need(stat.S_ISREG(mode) and observed.st_nlink == 1 and not mode & 0o6000,
             'ACCEPTANCE_SOURCE_SPECIAL_FILE_REFUSED')
        name = relative.as_posix()
        if name in MANIFEST_EXCLUSIONS:
            continue
        data = path.read_bytes()
        rows.append({'path': name, 'bytes': len(data), 'sha256': digest(data),
                     'mode': '100755' if mode & 0o111 else '100644'})
    return rows


def validate_source(root=SOURCE):
    root = Path(root)
    manifest_path = root / 'acceptance/source-manifest.json'
    manifest = read_json(manifest_path, 4*1024**2)
    need(manifest.get('schema') == 'work8-v99-exact-source-manifest-v1' and
         manifest.get('exclusions') == sorted(MANIFEST_EXCLUSIONS),
         'ACCEPTANCE_SOURCE_MANIFEST_SCHEMA')
    rows = source_inventory(root)
    need(manifest.get('files') == rows and len(rows) > 0,
         'ACCEPTANCE_COMPLETE_SOURCE_INVENTORY_CHANGED')
    config = read_json(root / 'acceptance/config.json')
    expected = {
        'schema': 'work8-v99-native-preparation-config-v1',
        'status': 'PREPARATION_ONLY_EXTERNAL_OWNER_RELEASE_REQUIRED',
        'localOwnerDecisionRecorded': False, 'localReservationCommitted': False,
        'requiresExternalRelease': True, 'launchBranch': LAUNCH_BRANCH,
        'reviewBranch': REVIEW_BRANCH, 'workflowPath': WORKFLOW,
        'externalReleasePath': RELEASE_PATH, 'requiredParent': PARENT,
        'maximumAttempts': 1, 'maximumJobSeconds': 18000,
        'maximumAdditionalExposureUSD': MAX_EXPOSURE_USD,
        'maximumReservationUSD': MAX_EXPOSURE_USD,
        'masterAuthoritySHA256': guard.MASTER_AUTHORITY_SHA256,
        'campaignId': guard.MASTER_CAMPAIGN_ID, 'attemptId': RESERVATION,
        'financialReviewSHA256': guard.FINANCIAL_REVIEW_SHA256,
        'artifactRetentionDays': ARTIFACT_RETENTION_DAYS,
        'maximumObservedArtifactRetentionSeconds': 169*3600,
        'maximumBillableArtifactHoursIncludingRounding': 170,
        'qualificationCampaignMayRepeat': False,
        'frontendStartupDiagnosticMayRepeat': False,
        'applicationPackagesMayRebuild': False,
        'retainedInputArtifactId': 13340201255,
        'retainedInputArtifactBytes': 338251567,
        'retainedInputArtifactSHA256': '39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755',
    }
    need(all(type(config.get(k)) is type(v) and config.get(k) == v
             for k, v in expected.items()), 'ACCEPTANCE_FAIL_CLOSED_CONFIG_REQUIRED')
    need(config.get('currentAuthority') == {
        'ownerDecisionRecorded': False, 'reservationCommitted': False,
        'additionalAttemptsAuthorized': 0, 'newReservationUSD': '0.00',
        'actualProviderChargeUSD': None}, 'LOCAL_EXECUTION_AUTHORITY_REFUSED')
    need(config.get('operatingLocks') == {
        'acceptedRequirements': 48, 'outstandingRequirements': 16, 'wholeRowTarget': 'A5',
        'PR113': 'DRAFT_UNMERGED', 'Pillow': 'NOT_BORN', 'Commerce': 'LOCKED',
        'Work9': 'INACTIVE', 'productionRailwayMutation': False,
        'originalVolumeAlteration': False, 'protectedDataTransfer': False,
        'commerceActivation': False}, 'ACCEPTANCE_OPERATING_LOCKS_CHANGED')
    return {'schema': 'work8-v99-source-admission-v1',
            'sourceManifestSHA256': digest(manifest_path.read_bytes()),
            'workflowSHA256': digest((root / WORKFLOW).read_bytes()),
            'filesVerified': len(rows), 'sourceBytesChanged': False,
            'applicationStarted': False}


def validate_release(record, source, remote_commit, launch_template):
    """Pure validation. Never treats a source template as owner authority."""
    need(record.get('schema') == 'work8-v99-external-release-v1',
         'EXTERNAL_V99_RELEASE_REQUIRED')
    need(record.get('repository') == REPOSITORY and
         record.get('launchBranch') == LAUNCH_BRANCH and
         record.get('workflowPath') == WORKFLOW and
         type(record.get('maximumAttempts')) is int and record.get('maximumAttempts') == 1,
         'EXTERNAL_RELEASE_EXACT_ROUTE_REQUIRED')
    binding = record.get('source', {})
    need(binding == {'tree': remote_commit['tree']['sha'], 'parent': PARENT,
                     'manifestSHA256': source['sourceManifestSHA256'],
                     'workflowSHA256': source['workflowSHA256']} and
         re.fullmatch('[a-f0-9]{40}', str(binding.get('tree', ''))) and
         [p['sha'] for p in remote_commit['parents']] == [PARENT],
         'EXTERNAL_RELEASE_EXACT_SOURCE_REQUIRED')
    owner = record.get('ownerApprovalReceipt', {})
    reservation = record.get('reservationReceipt', {})
    owner_sha = digest(canonical(owner))
    reservation_sha = digest(canonical(reservation))
    need(record.get('ownerApprovalSHA256') == owner_sha and
         record.get('reservationReceiptSHA256') == reservation_sha,
         'EXTERNAL_RECEIPT_CANONICAL_HASH_REQUIRED')
    need(owner.get('schema') == 'work8-v112-attempt-approval-v1' and
         owner.get('ownerDecisionRecorded') is True and
         owner.get('directive') == guard.OWNER_DIRECTIVE and
         owner.get('scope') == 'one-native-a5-08-09-attempt' and
         type(owner.get('maximumAttempts')) is int and owner.get('maximumAttempts') == 1 and
         owner.get('maximumJobSeconds') == 18000 and
         owner.get('maximumAdditionalExposureUSD') == MAX_EXPOSURE_USD and
         owner.get('maximumReservationUSD') == MAX_EXPOSURE_USD and
         owner.get('masterAuthorityId') == guard.MASTER_AUTHORITY_ID and
         owner.get('masterAuthoritySHA256') == guard.MASTER_AUTHORITY_SHA256 and
         owner.get('campaignId') == guard.MASTER_CAMPAIGN_ID and
         owner.get('attemptId') == RESERVATION and
         guard.valid_master_ledger_reference(owner.get('masterLedgerRecordReference')) and
         type(owner.get('masterCeilingCents')) is int and
         owner.get('masterCeilingCents') == guard.MASTER_CEILING_CENTS and
         owner.get('financialExposureBoundVerified') is True and
         owner.get('financialReviewSHA256') == guard.FINANCIAL_REVIEW_SHA256 and
         owner.get('accountBillingContextVerified') is False and
         owner.get('paidRunnerAuthorized') is False and
         owner.get('noAutomaticRetry') is True and
         owner.get('approvedSource') == binding and
         owner.get('reservationId') == RESERVATION and
         owner.get('independentAckAuthority') == ACK_AUTHORITY,
         'SEPARATE_FULL_NATIVE_OWNER_APPROVAL_REQUIRED')
    need(reservation.get('schema') == 'work8-v112-reservation-v1' and
         reservation.get('recordType') == 'ACCOUNTING_HOLD_NOT_PROVIDER_CHARGE' and
         reservation.get('status') == 'COMMITTED' and
         reservation.get('reservationId') == RESERVATION and
         reservation.get('ownerApprovalSHA256') == owner_sha and
         reservation.get('approvedSource') == binding and
         canonical(reservation.get('before')) == canonical(LEDGER_BEFORE) and
         canonical(reservation.get('after')) == canonical(LEDGER_AFTER) and
         reservation.get('reservationUSD') == MAX_EXPOSURE_USD and
         reservation.get('masterAuthoritySHA256') == guard.MASTER_AUTHORITY_SHA256 and
         reservation.get('campaignId') == guard.MASTER_CAMPAIGN_ID and
         reservation.get('attemptId') == RESERVATION and
         reservation.get('financialReviewSHA256') == guard.FINANCIAL_REVIEW_SHA256 and
         canonical(reservation.get('masterLedgerRecordReference')) == canonical(owner.get('masterLedgerRecordReference')),
         'EXACT_UNIQUE_NATIVE_RESERVATION_REQUIRED')
    plan = record.get('launchPlan', {})
    fixed = lambda item: {k: v for k, v in item.items() if k not in ('authority', 'status')}
    need(fixed(plan) == fixed(launch_template) and
         plan.get('status') == 'OWNER_APPROVED_EXTERNAL_RELEASE',
         'REVIEWED_PLAN_BOUNDS_UNCHANGED_REQUIRED')
    authority = plan['authority']
    need(authority.get('ownerApprovalReceiptSHA256') == owner_sha and
         authority.get('reservationReceiptSHA256') == reservation_sha and
         authority.get('financialReviewSHA256') == owner.get('financialReviewSHA256') and
         canonical(authority.get('masterLedgerRecordReference')) == canonical(owner.get('masterLedgerRecordReference')),
         'OPERATIVE_AUTHORITY_RECEIPTS_REQUIRED')
    guard.validate_authority(authority)
    return plan


def git_value(*args):
    return subprocess.check_output(['git', '-C', str(SOURCE), *args], timeout=5,
        env={'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8'}, stderr=subprocess.DEVNULL,
        text=True).strip()


def fetch_release(source):
    ref = runner.api('/repos/'+REPOSITORY+'/git/ref/heads/'+REVIEW_BRANCH,
                     allow_missing=True)
    need(ref is not None, 'EXTERNAL_RELEASE_REVIEW_BRANCH_MISSING')
    review_commit = ref['object']['sha']
    need(re.fullmatch('[a-f0-9]{40}', review_commit) and
         review_commit != os.environ.get('GITHUB_SHA'),
         'DISTINCT_EXTERNAL_RELEASE_COMMIT_REQUIRED')
    metadata = runner.api('/repos/'+REPOSITORY+'/commits/'+review_commit+'?per_page=1')
    author = metadata.get('author') or {}
    need(author.get('login') == 'empireaios' and author.get('id') == 295548100,
         'TRUSTED_EXTERNAL_RELEASE_AUTHOR_REQUIRED')
    item = runner.api('/repos/'+REPOSITORY+'/contents/'+RELEASE_PATH+'?ref='+review_commit,
                      allow_missing=True)
    need(item and item.get('type') == 'file' and item.get('encoding') == 'base64' and
         0 < item.get('size', 0) <= 65536, 'EXTERNAL_RELEASE_BOUNDED_FILE_REQUIRED')
    raw = base64.b64decode(item['content'], validate=False)
    need(len(raw) == item['size'], 'EXTERNAL_RELEASE_COMPLETE_BYTES_REQUIRED')
    record = json.loads(raw)
    commit = runner.api('/repos/'+REPOSITORY+'/git/commits/'+os.environ['GITHUB_SHA'])
    need(commit['sha'] == os.environ['GITHUB_SHA'] == git_value('rev-parse', 'HEAD') and
         commit['tree']['sha'] == git_value('rev-parse', 'HEAD^{tree}'),
         'ACTUAL_REMOTE_LOCAL_SOURCE_REQUIRED')
    plan = validate_release(record, source, commit, read_json(SOURCE/'v65/launch-plan.json'))
    return record, plan, {'reviewCommit': review_commit,
                         'reviewAuthorLogin': author['login'], 'reviewAuthorId': author['id'],
                         'externalRecordSHA256': digest(raw), 'actualSourceCommit': commit['sha'],
                         'sourceTree': commit['tree']['sha'], 'parent': PARENT}


def validate_launch_actor(run, environment=None):
    """Provider authentication, not forgeable commit author attribution."""
    environment = os.environ if environment is None else environment
    expected = {'id': OWNER_ID, 'login': 'empireaios', 'type': 'User'}
    actors = {}
    for key in ('actor', 'triggering_actor'):
        actor = run.get(key)
        need(isinstance(actor, dict) and type(actor.get('id')) is int and
             all(actor.get(field) == value for field, value in expected.items()),
             'AUTHENTICATED_OWNER_LAUNCH_REQUIRED')
        actors[key] = {field: actor[field] for field in expected}
    for key, value in [('GITHUB_ACTOR_ID', str(OWNER_ID)),
                       ('GITHUB_ACTOR', 'empireaios'),
                       ('GITHUB_TRIGGERING_ACTOR', 'empireaios')]:
        if key in environment:
            need(environment[key] == value, 'OWNER_LAUNCH_ENVIRONMENT_DISAGREEMENT')
    return {**actors, 'authenticationBasis': 'CURRENT_PROVIDER_RUN_ACTOR_AND_TRIGGERING_ACTOR'}


def single_launch_readback():
    """A new run attempt1 cannot reuse the grant after branch recreation."""
    current = runner.api('/repos/'+REPOSITORY+'/actions/runs/'+os.environ['GITHUB_RUN_ID'])
    need(str(current.get('id')) == os.environ['GITHUB_RUN_ID'] and
         current.get('run_attempt') == 1 and current.get('event') == 'create' and
         current.get('head_branch') == LAUNCH_BRANCH and
         current.get('head_sha') == os.environ['GITHUB_SHA'] and
         current.get('path') == WORKFLOW and current.get('status') == 'in_progress',
         'SOLE_CURRENT_LAUNCH_RUN_REQUIRED')
    actor = validate_launch_actor(current)
    need(type(current.get('workflow_id')) is int and current['workflow_id'] > 0,
         'CURRENT_WORKFLOW_SERVICE_ID_REQUIRED')
    # A fresh create-only workflow need not exist on the default branch.
    path = ('/repos/'+REPOSITORY+'/actions/workflows/'+str(current['workflow_id'])+
            '/runs?branch='+urllib.parse.quote(LAUNCH_BRANCH, safe='')+'&per_page=100')
    listing = runner.api(path)
    runs = listing.get('workflow_runs', [])
    need(type(listing.get('total_count')) is int and
         listing['total_count'] == 1 and isinstance(runs, list) and len(runs) == 1,
         'EXACTLY_ONE_LAUNCH_RUN_REQUIRED')
    listed = runs[0]
    need(all(listed.get(k) == current.get(k) for k in
             ('id', 'run_attempt', 'event', 'head_branch', 'head_sha', 'path', 'workflow_id')),
         'SOLE_CURRENT_LAUNCH_RUN_REQUIRED')
    need(validate_launch_actor(listed) == actor, 'LISTED_LAUNCH_ACTOR_CHANGED')
    return {'schema': 'work8-v99-single-launch-readback-v1',
            'workflowPath': WORKFLOW, 'workflowId': current['workflow_id'],
            'launchBranch': LAUNCH_BRANCH, 'runId': current['id'],
            'sourceCommit': current['head_sha'], 'runAttempt': 1, 'matchingRuns': 1,
            'authenticatedLaunch': actor,
            'completeProviderListingSHA256': digest(canonical(listing)),
            'providerRunSHA256': digest(canonical(current)),
            'observedAtEpoch': time.time(), 'automaticRetry': False}


def validate_root(root):
    need(root.is_absolute() and root.resolve() == root, 'CANONICAL_ACCEPTANCE_ROOT_REQUIRED')
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    temp = Path(os.environ.get('RUNNER_TEMP', '/invalid'))
    need(re.fullmatch('[1-9][0-9]*', run_id) and temp.is_absolute() and
         root == temp / ('v112-a01-a5-'+run_id), 'EXACT_CURRENT_RUN_ROOT_REQUIRED')
    need(os.getuid() == os.geteuid() == os.getgid() == os.getegid() == 1001,
         'ORIGINAL_HOST_PRINCIPAL_REQUIRED')
    need(os.environ.get('GITHUB_ACTIONS') == 'true' and
         os.environ.get('GITHUB_EVENT_NAME') == 'create' and
         os.environ.get('GITHUB_REPOSITORY') == REPOSITORY and
         os.environ.get('GITHUB_REPOSITORY_ID') == guard.REPOSITORY_ID and
         os.environ.get('GITHUB_REF') == 'refs/heads/'+LAUNCH_BRANCH and
         os.environ.get('GITHUB_RUN_ATTEMPT') == '1' and
         re.fullmatch('[a-f0-9]{40}', os.environ.get('GITHUB_SHA', '')),
         'EXACT_CURRENT_FIRST_RUN_ROUTE_REQUIRED')
    if root.exists():
        s = root.lstat()
        need(stat.S_ISDIR(s.st_mode) and s.st_uid == s.st_gid == 1001 and
             stat.S_IMODE(s.st_mode) == 0o700, 'PRIVATE_ACCEPTANCE_ROOT_REQUIRED')
    return root


def admitted_plan(root, source):
    record = read_json(root/'external-release.json', 65536)
    transport = read_json(root/'release-transport.json')
    identity = read_json(root/'runner-identity.json')
    commit = {'tree': {'sha': transport['sourceTree']}, 'parents': [{'sha': PARENT}]}
    plan = validate_release(record, source, commit, read_json(SOURCE/'v65/launch-plan.json'))
    launch = read_json(root/'single-launch-readback.json')
    proof = verify_retained_evidence(SOURCE)
    need(proof == read_json(root/'retained-evidence-admission.json'),
         'RETAINED_NATIVE_EVIDENCE_CHANGED')
    need(launch.get('schema') == 'work8-v99-single-launch-readback-v1' and
         str(launch.get('runId')) == os.environ['GITHUB_RUN_ID'] and
         launch.get('runAttempt') == launch.get('matchingRuns') == 1 and
         launch.get('sourceCommit') == os.environ['GITHUB_SHA'] and
         launch.get('workflowPath') == WORKFLOW and launch.get('launchBranch') == LAUNCH_BRANCH and
         launch.get('automaticRetry') is False and
         validate_launch_actor(launch.get('authenticatedLaunch', {})) == launch['authenticatedLaunch'],
         'ADMITTED_AUTHENTICATED_LAUNCH_CHANGED')
    need(git_value('rev-parse', 'HEAD') == os.environ['GITHUB_SHA'] and
         git_value('rev-parse', 'HEAD^{tree}') == transport['sourceTree'],
         'ADMITTED_GIT_SOURCE_CHANGED')
    need(identity['workflowCommit'] == os.environ.get('GITHUB_SHA') ==
         transport['actualSourceCommit'] and
         source == read_json(root/'acceptance-source-admission.json') and
         plan == read_json(root/'operative-launch-plan.json'),
         'ADMITTED_RELEASE_OR_SOURCE_CHANGED')
    return root/'operative-launch-plan.json'


def mark_attempt(root, command, stage=None):
    suffix = command + ('-'+stage if stage else '')
    need(re.fullmatch('[a-z-]+', suffix), 'ACCEPTANCE_COMMAND_SCOPE')
    path = root/'acceptance-attempts'/(suffix+'.json')
    need(not path.exists(), 'ACCEPTANCE_OPERATION_ALREADY_ATTEMPTED')
    atomic(path, {'schema': 'work8-v99-operation-attempt-v1', 'operation': suffix,
                  'runId': os.environ.get('GITHUB_RUN_ID'), 'attempt': 1,
                  'startedAtEpoch': time.time(), 'automaticRetry': False}, exclusive=True)


def drop_credentials():
    for name in CREDENTIAL_ENV + DOCKER_OVERRIDE_ENV:
        os.environ.pop(name, None)


def cleanup_identity(root):
    """No identity means no resource cleanup authority; never infer a campaign."""
    if not (root/'runner-identity.json').exists():
        return None
    identity = read_json(root/'runner-identity.json')
    need(str(identity.get('runId')) == os.environ['GITHUB_RUN_ID'] and
         identity.get('runAttempt') == 1 and
         identity.get('workflowCommit') == os.environ['GITHUB_SHA'] and
         identity.get('repository') == REPOSITORY and
         identity.get('hostUid') == identity.get('hostGid') == 1001,
         'CLEANUP_CURRENT_IDENTITY_REQUIRED')
    return identity


def artifact_return(root, artifact_id, artifact_digest):
    """Read-only provider attribution survives an early admission refusal.

    It creates no source/native admission and cannot unblock application stages.
    """
    run_id = os.environ['GITHUB_RUN_ID']
    repo = runner.api('/repos/'+REPOSITORY)
    need(str(repo['id']) == guard.REPOSITORY_ID and repo['visibility'] == 'public' and
         repo.get('private') is False and not repo['archived'], 'PUBLIC_ACTIVE_REPOSITORY_REQUIRED')
    run = runner.api('/repos/'+REPOSITORY+'/actions/runs/'+run_id)
    need(str(run['id']) == run_id and run['run_attempt'] == 1 and
         run['head_sha'] == os.environ['GITHUB_SHA'] and run['event'] == 'create' and
         run['path'] == WORKFLOW and run['head_branch'] == LAUNCH_BRANCH and
         run['status'] == 'in_progress', 'CURRENT_ARTIFACT_RETURN_RUN_REQUIRED')
    actor = validate_launch_actor(run)
    jobs = runner.api('/repos/'+REPOSITORY+'/actions/runs/'+run_id+'/attempts/1/jobs?per_page=100')
    need(jobs['total_count'] == len(jobs['jobs']) == 1, 'ONE_JOB_REQUIRED')
    job = jobs['jobs'][0]
    need(job['name'] == JOB_NAME and job['status'] == 'in_progress' and
         job.get('run_id') == int(run_id) and job['labels'] == ['ubuntu-24.04'] and
         job.get('runner_name') == os.environ.get('RUNNER_NAME') and
         type(job.get('runner_id')) is int and job['runner_id'] > 0,
         'CURRENT_ARTIFACT_RETURN_HOST_REQUIRED')
    executor = {'runId': run_id, 'workflowCommit': run['head_sha']}
    result = runner.service_artifact({'executor': executor}, artifact_id, artifact_digest)
    atomic(root/'artifact-return-provider.json', {
        'schema': 'work8-v99-artifact-return-provider-v1', **executor,
        'jobId': job['id'], 'runnerId': job['runner_id'], 'authenticatedLaunch': actor,
        'serviceRunSHA256': digest(canonical(run)),
        'serviceJobSHA256': digest(canonical(job)),
        'readOnlyProviderAttribution': True, 'nativeAdmissionGranted': False}, exclusive=True)
    atomic(root/'artifact-service-final.json', result, exclusive=True)
    return result


def preupload(root, label, directory):
    need(label in UPLOAD_BUDGETS and directory.resolve() == directory and directory.is_dir(),
         'REVIEW_UPLOAD_SCOPE')
    rows = []
    for path in sorted(directory.rglob('*')):
        mode = path.lstat().st_mode
        need(not stat.S_ISLNK(mode), 'UPLOAD_LINK_REFUSED')
        if stat.S_ISDIR(mode):
            continue
        need(stat.S_ISREG(mode) and path.stat().st_nlink == 1, 'UPLOAD_REGULAR_FILES_ONLY')
        name = path.relative_to(directory).as_posix()
        need(len(name.encode()) <= 1024, 'UPLOAD_PATH_BOUND')
        rows.append({'path': name, 'bytes': path.stat().st_size, 'sha256': digest(path.read_bytes())})
    size = sum(row['bytes'] for row in rows)
    need(0 < len(rows) <= 129 and 0 < size <= UPLOAD_BUDGETS[label], 'UPLOAD_PAYLOAD_BOUND')
    if label != 'packages-and-executor':
        need({row['path'] for row in rows} == {'evidence-export.tar.gz',
                                              'evidence-export-receipt.json'},
             'NATIVE_EXPORT_EXACT_TWO_FILES_REQUIRED')
    state = root/'upload-bounds'
    previous = [read_json(path) for path in state.glob('*.json')] if state.exists() else []
    need(label not in {row['label'] for row in previous} and len(previous) < 3,
         'UPLOAD_ONCE_MAXIMUM_THREE_OBJECTS')
    ceiling = size + ENVELOPE_RESERVE
    need(sum(row['maximumServiceZipBytes'] for row in previous)+ceiling <= 128*1024**2,
         'PREUPLOAD_CUMULATIVE_SERVICE_BOUND')
    receipt = {'schema': 'work8-v99-preupload-bound-v1', 'label': label,
               'files': rows, 'logicalBytes': size, 'maximumServiceZipBytes': ceiling,
               'retentionDays': ARTIFACT_RETENTION_DAYS, 'overwrite': False, 'packageArchivesIncluded': False}
    atomic(state/(label+'.json'), receipt, exclusive=True)
    return receipt


def final_source_check(root):
    """Revalidate source bytes, without renewing authority or starting work."""
    current = validate_source()
    admitted = read_json(root/'acceptance-source-admission.json')
    need(current == admitted, 'FINAL_CURRENT_SOURCE_ADMISSION_CHANGED')
    identity = read_json(root/'runner-identity.json')
    contract = read_json(root/'run-contract.json')
    need(str(identity.get('runId')) == os.environ.get('GITHUB_RUN_ID') and
         identity.get('runAttempt') == 1 and os.environ.get('GITHUB_RUN_ATTEMPT') == '1' and
         identity.get('workflowCommit') == os.environ.get('GITHUB_SHA') == git_value('rev-parse', 'HEAD') and
         identity.get('sessionId') == 'github-actions:'+str(identity.get('runId'))+':1:'+str(identity.get('jobId')) and
         all(contract.get('executor', {}).get(k) == identity.get(k)
             for k in ('runId', 'runAttempt', 'workflowCommit', 'sessionId', 'jobId')),
         'FINAL_CURRENT_EXECUTOR_SOURCE_MISMATCH')
    return current


def final_upload_ready(root, *, fallback=False):
    """Publish only a constant boolean after exact archive and budget checks."""
    if fallback or (root/'final-export/evidence-export-receipt.json').is_file() and \
            read_json(root/'final-export/evidence-export-receipt.json').get('schema') == 'work8-v101-final-export-receipt-v1':
        from final_evidence import verify_final_directory
        verify_final_directory(root/'final-export')
    preupload(root, 'final', root/'final-export')
    output = os.environ.get('GITHUB_OUTPUT')
    if output:
        path = Path(output)
        temp = Path(os.environ.get('RUNNER_TEMP', '/invalid'))
        need(path.is_absolute() and path.resolve() == path and temp in path.parents,
             'FINAL_OUTPUT_PATH_REFUSED')
        fd = os.open(path, os.O_WRONLY | os.O_APPEND | os.O_NOFOLLOW | os.O_NONBLOCK)
        try:
            observed = os.fstat(fd)
            need(stat.S_ISREG(observed.st_mode) and observed.st_nlink == 1 and
                 observed.st_uid == os.getuid() and observed.st_size <= 16384,
                 'FINAL_OUTPUT_REGULAR_FILE_REQUIRED')
            need(os.write(fd, b'export_ready=true\n') == 18, 'FINAL_OUTPUT_WRITE_INCOMPLETE')
            os.fsync(fd)
        finally:
            os.close(fd)


def execute(args):
    root = validate_root(Path(args.root))
    # Failure return is metadata-only. A missing/changed source manifest must
    # not erase the first refusal or authorize a new native operation.
    source = None if args.command in ('cleanup', 'final-export', 'artifact-check') else validate_source()
    if args.command == 'identity':
        need(os.environ.get('RUNNER_DEBUG') != '1', 'PROVIDER_RUNNER_DEBUG_REFUSED')
        need(os.environ.get('GITHUB_REF') == 'refs/heads/'+LAUNCH_BRANCH and
             os.environ.get('GITHUB_RUN_ATTEMPT') == '1' and not root.exists(),
             'NEW_BRANCH_FIRST_ATTEMPT_FRESH_ROOT_REQUIRED')
        launch_readback = single_launch_readback()
        record, plan, transport = fetch_release(source)
        retained_proof = verify_retained_evidence(SOURCE)
        control = root.parent/(root.name+'-release-admission')
        need(not control.exists(), 'RELEASE_ADMISSION_ALREADY_ATTEMPTED')
        control.mkdir(mode=0o700)
        authority_file = control/'operative-launch-plan.json'
        atomic(authority_file, plan, exclusive=True)
        result = runner.identity(root, JOB_NAME, authority_file=authority_file)
        for name, value in [('external-release.json', record), ('operative-launch-plan.json', plan),
                            ('release-transport.json', transport),
                            ('single-launch-readback.json', launch_readback),
                            ('retained-evidence-admission.json', retained_proof),
                            ('acceptance-source-admission.json', source)]:
            atomic(root/name, value, exclusive=True)
        for name in ('home', 'logs', 'reuse-evidence', 'runtime-evidence'):
            (root/name).mkdir(mode=0o700, exist_ok=True)
        mark_attempt(root, 'identity')
        return result
    if args.command not in ('cleanup', 'final-export', 'artifact-check'):
        authority_file = admitted_plan(root, source)
    else:
        authority_file = root/'operative-launch-plan.json'
    suffix = args.stage if args.command in ('await-review', 'native') else args.label if args.command in ('native-export', 'artifact-check') else None
    mark_attempt(root, args.command, suffix)
    if args.command == 'download':
        return {'status': 'EXACT_RETAINED_ARTIFACT_DOWNLOADED',
                'path': str(retained.download_candidate(root)), 'packagesRebuilt': False}
    if args.command not in ('await-review', 'artifact-check'):
        drop_credentials()
    if args.command == 'prepare':
        reuse.import_artifact(root, root/'retained-candidates.zip')
        result = runner.prepare(root)
        (root/'retained-candidates.zip').unlink()
        return result
    if args.command == 'admission':
        runner.guard_controls(root)
        retained.load_backend(root)
        return runner.qualify(root, authority_file, acceptance_admission=True)
    if args.command == 'review-export':
        result = runner.review_export(root)
        preupload(root, 'packages-and-executor', root/'review-exports/packages-and-executor')
        return result
    if args.command == 'await-review':
        need(args.stage in ('packages-and-executor', 'preflight'),
             'INDEPENDENT_ACK_STAGE_REQUIRED')
        return runner.await_review(root, args.stage, args.artifact_id, args.artifact_digest, 1500)
    if args.command == 'native':
        need(args.stage in ('preflight', 'full'), 'NATIVE_STAGE_REQUIRED')
        return runner.native(root, args.stage)
    if args.command == 'native-export':
        need(args.label == 'preflight', 'ONLY_PREFLIGHT_INTERMEDIATE_EXPORT')
        result = runner.native_export(root, 'preflight')
        preupload(root, 'preflight', root/'evidence-exports/preflight')
        return result
    if args.command == 'cleanup':
        cleanup_identity(root)
        return runner.cleanup(root)
    if args.command == 'final-export':
        try:
            result = runner.final_export(root, source_check=lambda: final_source_check(root))
        except runner.RuntimeRefusal as exc:
            if getattr(exc, 'failureExportReady', False) is True:
                final_upload_ready(root, fallback=True)
            raise
        final_upload_ready(root)
        return result
    if args.command == 'artifact-check':
        need(args.label == 'final', 'FINAL_ARTIFACT_CHECK_REQUIRED')
        return artifact_return(root, args.artifact_id, args.artifact_digest)
    raise guard.Refusal('ACCEPTANCE_COMMAND_REFUSED')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=COMMANDS)
    parser.add_argument('--root', required=True)
    parser.add_argument('--stage', choices=('packages-and-executor', 'preflight', 'full'))
    parser.add_argument('--label', choices=('preflight', 'final'))
    parser.add_argument('--artifact-id')
    parser.add_argument('--artifact-digest')
    args = parser.parse_args()
    try:
        result = execute(args)
        # Detailed evidence remains in bounded allowlisted artifacts, never logs.
        raw = canonical(result)
        summary = {'operation': args.command, 'status': 'PASS_OPERATION',
                   'resultSHA256': digest(raw), 'resultBytes': len(raw),
                   'rawOutputRetained': False, 'wholeRowsAccepted': []}
        line = json.dumps(summary, sort_keys=True)
        need(len(line.encode()) <= 2048, 'CONSOLE_SUMMARY_BOUND')
        print(line)
        return 0
    except Exception as exc:
        code = str(exc) if isinstance(exc, (guard.Refusal, retained.Refusal, runner.RuntimeRefusal)) and re.fullmatch('[A-Z0-9_]{1,100}', str(exc)) else 'ACCEPTANCE_'+type(exc).__name__.upper()
        root = Path(args.root)
        # Local metadata only: retain a first cause even if identity never formed.
        # This does not authorize cleanup of any unbound external resource.
        try:
            validate_root(root)
            if not root.exists():
                root.mkdir(mode=0o700)
            runner.preserve_first_failure(root, args.command, guard.Refusal(code))
        except Exception:
            pass
        print(json.dumps({'status': 'FAIL_CLOSED', 'code': code,
                          'operation': args.command, 'rawOutputRetained': False,
                          'wholeRowsAccepted': []}, sort_keys=True))
        return 23


if __name__ == '__main__':
    raise SystemExit(main())
