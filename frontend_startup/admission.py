#!/usr/bin/env python3
"""Read-only admission and exact retained input delivery for one future diagnostic.

Local preparation is never execution authority. No Docker, application process,
provider mutation, package build or Q01-Q05 execution is implemented here.
"""
import argparse
import base64
import datetime
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import signal
import stat
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parent.parent
REPOSITORY = 'empireaios/EmpireAI'
REPOSITORY_ID = 1275922460
OWNER_ID = 295548100
PARENT = '8e06e3a1637519842548d29e03a5cd38bd10f409'
BRANCH = 'work8/v97-frontend-startup-20261109'
REVIEW_BRANCH = 'work8/v97-review-20261109'
WORKFLOW = '.github/workflows/work8-v97-frontend-startup.yml'
RELEASE_PATH = 'frontend_startup/v97-release.json'
JOB_NAME = 'V97 isolated NORMAL and RECOVERY Docker startup'
MANIFEST_PATH = 'frontend_startup/source-manifest.json'
ARTIFACT_ID = 13340201255
ARTIFACT_RUN = 41860150363
ARTIFACT_NAME = 'v65-a5-candidates-41860150363-1'
ARTIFACT_COMMIT = '87428f7fd4977a0669e8cff90242a784e9947a34'
ARTIFACT_BYTES = 338251567
ARTIFACT_SHA256 = '39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755'
PACKAGE_MANIFEST_SHA256 = 'ec74f2565b34867d6164382a666f429ad998fec2bb57a98e540d19e1b9665fa4'
MAX_JOB_SECONDS = 1800
MAX_NATIVE_SECONDS = 1200
MAX_EXPOSURE_USD = '0.30'
RESERVATION_ID = 'V97-FRONTEND-STARTUP-ONCE-20261109'
SCOPE = 'one-isolated-normal-recovery-docker-startup-diagnostic'


class Refusal(ValueError):
    pass


def need(condition, code):
    if not condition:
        raise Refusal(code)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode()


def file_digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def read_json(path, maximum=1024 * 1024):
    path = Path(path)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(fd, 'rb') as stream:
        s = os.fstat(stream.fileno())
        need(path.is_absolute() and path.resolve() == path and stat.S_ISREG(s.st_mode) and
             s.st_nlink == 1 and 0 < s.st_size <= maximum, 'BOUNDED_REGULAR_JSON_REQUIRED')
        raw = stream.read(maximum + 1)
    need(len(raw) == s.st_size, 'JSON_SIZE_CHANGED')
    return json.loads(raw)


def atomic(path, value):
    raw = canonical(value) + b'\n'
    need(len(raw) <= 1024 * 1024, 'RECEIPT_BOUND')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(raw)
        stream.flush()
        os.fsync(stream.fileno())
    directory = os.open(Path(path).parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def source_inventory(root=SOURCE):
    root = Path(root)
    need(root.is_absolute() and root.resolve() == root, 'CANONICAL_SOURCE_REQUIRED')
    rows = []
    for p in sorted(root.rglob('*')):
        relative = p.relative_to(root)
        if relative.parts[0] == '.git':
            continue
        need('.git' not in relative.parts, 'NESTED_GIT_METADATA_REFUSED')
        s = p.lstat()
        need(not stat.S_ISLNK(s.st_mode), 'SOURCE_SYMLINK_REFUSED')
        if stat.S_ISDIR(s.st_mode):
            continue
        need(stat.S_ISREG(s.st_mode) and s.st_nlink == 1 and not s.st_mode & 0o6000,
             'SOURCE_SPECIAL_OR_SETID_REFUSED')
        need('__pycache__' not in relative.parts and p.suffix not in {'.pyc', '.pyo'},
             'SOURCE_BYTECODE_REFUSED')
        if relative.as_posix() == MANIFEST_PATH:
            continue
        rows.append({'path': relative.as_posix(), 'bytes': s.st_size,
                     'sha256': file_digest(p),
                     'mode': '100755' if s.st_mode & 0o111 else '100644'})
    return rows


def validate_source(root=SOURCE):
    root = Path(root)
    manifest = read_json(root / MANIFEST_PATH, 4 * 1024 * 1024)
    need(manifest.get('schema') == 'work8-v97-complete-source-manifest-v1' and
         manifest.get('exclusions') == [MANIFEST_PATH] and
         manifest.get('files') == source_inventory(root), 'COMPLETE_SOURCE_MANIFEST_CHANGED')
    config = read_json(root / 'frontend_startup/config.json')
    expected = {
        'schema': 'work8-v97-frontend-startup-preparation-v1',
        'status': 'PREPARATION_ONLY', 'localOwnerDecisionRecorded': False,
        'localReservationCommitted': False, 'requiresExternalRelease': True,
        'launchBranch': BRANCH, 'reviewBranch': REVIEW_BRANCH,
        'workflowPath': WORKFLOW, 'externalReleasePath': RELEASE_PATH,
        'requiredParent': PARENT, 'maximumAttempts': 1,
        'maximumJobSeconds': MAX_JOB_SECONDS, 'maximumNativeSeconds': MAX_NATIVE_SECONDS,
        'maximumExposureUSD': MAX_EXPOSURE_USD, 'maximumReservationUSD': MAX_EXPOSURE_USD,
        'artifactRetentionDays': 1, 'maximumArtifactBytes': 1024 * 1024,
        'retainedInputArtifactId': ARTIFACT_ID, 'retainedInputArtifactBytes': ARTIFACT_BYTES,
        'retainedInputArtifactSHA256': ARTIFACT_SHA256,
        'packageManifestSHA256': PACKAGE_MANIFEST_SHA256,
        'qualificationCampaignMayRepeat': False, 'businessLifecycleMayInitialize': False,
        'applicationPackagesMayRebuild': False, 'A5AcceptanceClaimed': False,
    }
    need(all(type(config.get(k)) is type(v) and config.get(k) == v for k, v in expected.items()),
         'FAIL_CLOSED_PREPARATION_CONFIG_CHANGED')
    need(config.get('currentAuthority') == {'additionalAttemptsAuthorized': 0,
         'newReservationUSD': '0.00', 'ownerDecisionRecorded': False,
         'reservationCommitted': False}, 'LOCAL_AUTHORITY_REFUSED')
    need(config.get('operatingLocks') == {'acceptedRequirements': 48,
         'outstandingRequirements': 16, 'PR113': 'DRAFT_UNMERGED', 'Pillow': 'NOT_BORN',
         'Commerce': 'LOCKED', 'Work9': 'INACTIVE', 'productionRailwayMutation': False,
         'protectedDataTransfer': False}, 'OPERATING_LOCKS_CHANGED')
    return {'sourceManifestSHA256': file_digest(root / MANIFEST_PATH),
            'workflowSHA256': file_digest(root / WORKFLOW),
            'filesVerified': len(manifest['files']) + 1}


def validate_release(record, source, commit):
    need(record.get('schema') == 'work8-v97-external-release-v1' and
         record.get('repository') == REPOSITORY and record.get('launchBranch') == BRANCH and
         record.get('workflowPath') == WORKFLOW and type(record.get('maximumAttempts')) is int and
         record.get('maximumAttempts') == 1,
         'EXTERNAL_OWNER_RELEASE_REQUIRED')
    binding = record.get('source', {})
    need(binding == {'tree': commit['tree']['sha'], 'parent': PARENT,
                     'manifestSHA256': source['sourceManifestSHA256'],
                     'workflowSHA256': source['workflowSHA256']} and
         re.fullmatch('[a-f0-9]{40}', str(binding.get('tree', ''))) and
         [p['sha'] for p in commit['parents']] == [PARENT], 'EXACT_RELEASE_SOURCE_REQUIRED')
    owner = record.get('ownerApprovalReceipt', {})
    reserve = record.get('reservationReceipt', {})
    owner_sha = digest(canonical(owner))
    need(record.get('ownerApprovalSHA256') == owner_sha and
         record.get('reservationReceiptSHA256') == digest(canonical(reserve)),
         'EXTERNAL_RECEIPT_HASH_REQUIRED')
    need(owner.get('schema') == 'work8-v97-owner-approval-v1' and
         owner.get('ownerDecisionRecorded') is True and
         owner.get('directive') == 'EMPIREAI_V97_SEPARATE_FRONTEND_DIAGNOSTIC_APPROVAL' and
         owner.get('scope') == SCOPE and type(owner.get('maximumAttempts')) is int and
         owner.get('maximumAttempts') == 1 and
         owner.get('maximumJobSeconds') == MAX_JOB_SECONDS and
         owner.get('maximumNativeSeconds') == MAX_NATIVE_SECONDS and
         owner.get('maximumAdditionalExposureUSD') == MAX_EXPOSURE_USD and
         owner.get('maximumReservationUSD') == MAX_EXPOSURE_USD and
         owner.get('noAutomaticRetry') is True and owner.get('approvedSource') == binding and
         owner.get('reservationId') == RESERVATION_ID and
         owner.get('A5AcceptanceAuthorized') is False and
         owner.get('businessLifecycleAuthorized') is False,
         'SEPARATE_DIAGNOSTIC_ONLY_OWNER_APPROVAL_REQUIRED')
    need(reserve.get('schema') == 'work8-v97-reservation-v1' and
         reserve.get('recordType') == 'ACCOUNTING_HOLD_NOT_PROVIDER_CHARGE' and
         reserve.get('status') == 'COMMITTED' and reserve.get('reservationId') == RESERVATION_ID and
         reserve.get('ownerApprovalSHA256') == owner_sha and reserve.get('approvedSource') == binding and
         reserve.get('reservationUSD') == MAX_EXPOSURE_USD and
         reserve.get('before') == {'aggregateHoldsUSD': '12.16', 'A5HoldsUSD': '2.21',
                                   'unreservedA5AuthorityUSD': '7.79'} and
         reserve.get('after') == {'aggregateHoldsUSD': '12.46', 'A5HoldsUSD': '2.51',
                                  'unreservedA5AuthorityUSD': '7.49'},
         'EXACT_UNIQUE_DIAGNOSTIC_RESERVATION_REQUIRED')
    return {'ownerApprovalSHA256': owner_sha,
            'reservationReceiptSHA256': digest(canonical(reserve)), 'source': binding}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def api(path):
    need(path.startswith('/repos/' + REPOSITORY + '/') or path == '/repos/' + REPOSITORY,
         'READ_ONLY_REPOSITORY_API_SCOPE_REQUIRED')
    token = os.environ.get('GH_TOKEN')
    need(isinstance(token, str) and token and not any(c in token for c in '\r\n'),
         'SCOPED_READ_TOKEN_REQUIRED')
    request = urllib.request.Request('https://api.github.com' + path, headers={
        'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'EmpireAI-V97-read-only'})
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=20) as response:
            raw = response.read(4 * 1024 * 1024 + 1)
        need(len(raw) <= 4 * 1024 * 1024, 'API_RESPONSE_BOUND')
        return json.loads(raw)
    except urllib.error.HTTPError as error:
        raise Refusal('READ_API_HTTP_' + str(error.code)) from None


def host_context(root, *, require_existing=False):
    root = Path(root)
    need(os.getuid() == os.geteuid() == os.getgid() == os.getegid() == 1001,
         'ORIGINAL_HOST_UID_GID_REQUIRED')
    run_id = os.environ.get('GITHUB_RUN_ID', '')
    temp = Path(os.environ.get('RUNNER_TEMP', '/invalid'))
    need(re.fullmatch('[1-9][0-9]{0,19}', run_id) and temp.is_absolute() and
         root.is_absolute() and root.resolve() == root and
         root == temp / ('v97-frontend-' + run_id), 'CURRENT_RUN_ROOT_REQUIRED')
    need(os.environ.get('GITHUB_ACTIONS') == 'true' and
         os.environ.get('GITHUB_REPOSITORY') == REPOSITORY and
         os.environ.get('GITHUB_REPOSITORY_ID') == str(REPOSITORY_ID) and
         os.environ.get('GITHUB_RUN_ATTEMPT') == '1' and
         os.environ.get('GITHUB_REF') == 'refs/heads/' + BRANCH and
         os.environ.get('GITHUB_EVENT_NAME') == 'create' and
         re.fullmatch('[a-f0-9]{40}', os.environ.get('GITHUB_SHA', '')) and
         os.environ.get('RUNNER_OS') == 'Linux' and os.environ.get('RUNNER_ARCH') == 'X64',
         'EXACT_FIRST_HOSTED_RUN_ROUTE_REQUIRED')
    if root.exists():
        s = root.lstat()
        need(stat.S_ISDIR(s.st_mode) and s.st_uid == s.st_gid == 1001 and
             stat.S_IMODE(s.st_mode) == 0o700, 'PRIVATE_ROOT_REQUIRED')
    else:
        need(not require_existing, 'ADMITTED_ROOT_REQUIRED')
    return root, run_id


def boot_identity():
    return digest(Path('/proc/sys/kernel/random/boot_id').read_bytes())


def git_value(*args):
    return subprocess.check_output(['git', '-C', str(SOURCE), *args], timeout=5,
        env={'PATH': '/usr/bin:/bin', 'LANG': 'C.UTF-8'}, stderr=subprocess.DEVNULL,
        text=True).strip()


def validate_single_launch(listing, run_id, source_commit):
    need(listing.get('total_count') == 1 and len(listing.get('workflow_runs', [])) == 1,
         'ONE_FRESH_LAUNCH_ONLY')
    current = listing['workflow_runs'][0]
    need(str(current.get('id')) == run_id and current.get('run_attempt') == 1 and
         current.get('head_branch') == BRANCH and current.get('head_sha') == source_commit and
         current.get('event') == 'create' and current.get('path') == WORKFLOW,
         'SOLE_CURRENT_LAUNCH_REQUIRED')


def workflow_runs_path(run):
    # A workflow introduced on the launch branch may not yet be addressable by
    # filename on the default branch. The current provider run supplies its ID.
    need(type(run.get('workflow_id')) is int and run['workflow_id'] > 0 and
         run.get('path') == WORKFLOW, 'CURRENT_WORKFLOW_SERVICE_ID_REQUIRED')
    return ('/repos/' + REPOSITORY + '/actions/workflows/' + str(run['workflow_id']) +
            '/runs?branch=' + urllib.parse.quote(BRANCH, safe='') + '&per_page=100')


def validate_launch_actor(run, environment=None):
    """Authenticate the provider launch event, never Git author attribution."""
    environment = os.environ if environment is None else environment
    expected = {'id': OWNER_ID, 'login': 'empireaios', 'type': 'User'}
    actors = {}
    for key in ('actor', 'triggering_actor'):
        actor = run.get(key)
        need(isinstance(actor, dict) and type(actor.get('id')) is int and
             all(actor.get(field) == value for field, value in expected.items()),
             'AUTHENTICATED_OWNER_LAUNCH_REQUIRED')
        actors[key] = {field: actor[field] for field in expected}
    for key, expected_value in [('GITHUB_ACTOR_ID', str(OWNER_ID)),
                                ('GITHUB_ACTOR', 'empireaios'),
                                ('GITHUB_TRIGGERING_ACTOR', 'empireaios')]:
        if key in environment:
            need(environment[key] == expected_value, 'OWNER_LAUNCH_ENVIRONMENT_DISAGREEMENT')
    return {**actors, 'authenticationBasis': 'CURRENT_PROVIDER_RUN_ACTOR_AND_TRIGGERING_ACTOR'}


def admit(root):
    root, run_id = host_context(root)
    need(not root.exists(), 'ONE_ADMISSION_ATTEMPT_ONLY')
    root.mkdir(mode=0o700)
    atomic(root / 'admission-attempt.json', {'schema': 'work8-v97-admission-attempt-v1',
           'runId': run_id, 'runAttempt': 1, 'startedAtEpoch': time.time()})
    source = validate_source()
    need(git_value('rev-parse', 'HEAD') == os.environ['GITHUB_SHA'], 'CHECKED_OUT_COMMIT_REQUIRED')
    repo = api('/repos/' + REPOSITORY)
    need(repo.get('id') == REPOSITORY_ID and repo.get('private') is False and
         repo.get('visibility') == 'public' and repo.get('archived') is False,
         'PUBLIC_STANDARD_RUNNER_COST_SCOPE_REQUIRED')
    run = api('/repos/' + REPOSITORY + '/actions/runs/' + run_id)
    need(str(run.get('id')) == run_id and run.get('run_attempt') == 1 and
         run.get('head_sha') == os.environ['GITHUB_SHA'] and run.get('head_branch') == BRANCH and
         run.get('event') == 'create' and run.get('path') == WORKFLOW and
         run.get('status') == 'in_progress', 'CURRENT_PROVIDER_RUN_REQUIRED')
    launch_actor = validate_launch_actor(run)
    jobs = api('/repos/' + REPOSITORY + '/actions/runs/' + run_id + '/attempts/1/jobs?per_page=100')
    need(jobs.get('total_count') == 1 and len(jobs.get('jobs', [])) == 1, 'ONE_JOB_ONLY')
    job = jobs['jobs'][0]
    need(job.get('name') == JOB_NAME and job.get('status') == 'in_progress' and
         job.get('run_id') == int(run_id) and job.get('labels') == ['ubuntu-24.04'] and
         type(job.get('runner_id')) is int and job['runner_id'] > 0 and
         job.get('runner_name') == os.environ.get('RUNNER_NAME'), 'STANDARD_UBUNTU_RUNNER_REQUIRED')
    started = datetime.datetime.fromisoformat(job['started_at'].replace('Z', '+00:00')).timestamp()
    need(started <= time.time() < started + 300, 'FRESH_JOB_REQUIRED')
    need(os.environ.get('ImageOS') == 'ubuntu24' and
         re.fullmatch('[0-9.]{5,40}', os.environ.get('ImageVersion', '')), 'RUNNER_IMAGE_IDENTITY_REQUIRED')
    listing = api(workflow_runs_path(run))
    validate_single_launch(listing, run_id, os.environ['GITHUB_SHA'])
    ref = api('/repos/' + REPOSITORY + '/git/ref/heads/' + REVIEW_BRANCH)
    release_commit = ref.get('object', {}).get('sha', '')
    need(re.fullmatch('[a-f0-9]{40}', release_commit) and release_commit != os.environ['GITHUB_SHA'],
         'DISTINCT_EXTERNAL_RELEASE_COMMIT_REQUIRED')
    author = api('/repos/' + REPOSITORY + '/commits/' + release_commit).get('author') or {}
    # This is attribution consistency only. Authenticated launch identity was
    # established above from the current provider actor and triggering_actor.
    need(author.get('id') == OWNER_ID and author.get('login') == 'empireaios',
         'TRUSTED_EXTERNAL_RELEASE_AUTHOR_REQUIRED')
    content = api('/repos/' + REPOSITORY + '/contents/' + RELEASE_PATH + '?ref=' + release_commit)
    need(content.get('type') == 'file' and content.get('encoding') == 'base64' and
         0 < content.get('size', 0) <= 65536, 'BOUNDED_EXTERNAL_RELEASE_REQUIRED')
    raw = base64.b64decode(content['content'], validate=False)
    need(len(raw) == content['size'], 'COMPLETE_EXTERNAL_RELEASE_REQUIRED')
    record = json.loads(raw)
    commit = api('/repos/' + REPOSITORY + '/git/commits/' + os.environ['GITHUB_SHA'])
    need(commit.get('sha') == os.environ['GITHUB_SHA'] and
         commit.get('tree', {}).get('sha') == git_value('rev-parse', 'HEAD^{tree}'),
         'EXACT_REMOTE_LOCAL_GIT_TREE_REQUIRED')
    authority = validate_release(record, source, commit)
    receipt = {'schema': 'work8-v97-frontend-startup-admission-v1',
        'status': 'AUTHORIZED_EXACT_SOURCE', 'scope': SCOPE, 'root': str(root),
        'repository': REPOSITORY, 'runId': run_id, 'runAttempt': 1, 'jobId': job['id'],
        'authenticatedLaunch': launch_actor,
        'runnerId': job['runner_id'], 'runnerName': job['runner_name'],
        'runnerImageVersion': os.environ['ImageVersion'], 'runnerImageOS': 'ubuntu24',
        'sourceCommit': commit['sha'], 'sourceTree': commit['tree']['sha'],
        **source, **authority, 'releaseCommit': release_commit,
        'externalReleaseSHA256': digest(raw), 'externalReleaseCanonicalSHA256': digest(canonical(record)), 'hostUID': 1001, 'hostGID': 1001,
        'bootIdSHA256': boot_identity(), 'startedAtEpoch': started, 'jobStartedAtEpoch': started,
        'deadlineEpoch': started + MAX_JOB_SECONDS, 'nativeDeadlineEpoch': started + MAX_NATIVE_SECONDS,
        'maximumJobSeconds': MAX_JOB_SECONDS, 'maximumNativeSeconds': MAX_NATIVE_SECONDS,
        'maximumExposureUSD': MAX_EXPOSURE_USD,
        'resourceLabel': 'work8-v97-frontend-' + run_id, 'campaignId': 'work8-v97-frontend-' + run_id,
        'packageManifestSHA256': PACKAGE_MANIFEST_SHA256,
        'qualificationRepeated': False, 'businessLifecycleAuthorized': False,
        'A5AcceptanceAuthorized': False, 'providerMutationsAuthorized': False,
        'serviceRunSHA256': digest(canonical(run)), 'serviceJobSHA256': digest(canonical(job))}
    atomic(root / 'external-release.json', record)
    atomic(root / 'admission.json', receipt)
    return receipt


def validate_admission(root, *, allow_terminal=False, require_token_free=True):
    root, run_id = host_context(root, require_existing=True)
    if require_token_free:
        need(not any(key in os.environ for key in ('GH_TOKEN', 'GITHUB_TOKEN')),
             'NATIVE_PROVIDER_TOKEN_REFUSED')
    receipt = read_json(root / 'admission.json')
    source = validate_source()
    actor_proof = receipt.get('authenticatedLaunch')
    need(isinstance(actor_proof, dict) and
         validate_launch_actor(actor_proof) == actor_proof,
         'ADMITTED_OWNER_LAUNCH_CHANGED')
    need(receipt.get('schema') == 'work8-v97-frontend-startup-admission-v1' and
         receipt.get('status') == 'AUTHORIZED_EXACT_SOURCE' and receipt.get('scope') == SCOPE and
         receipt.get('root') == str(root) and receipt.get('repository') == REPOSITORY and
         receipt.get('runId') == run_id and receipt.get('runAttempt') == 1 and
         receipt.get('sourceCommit') == os.environ['GITHUB_SHA'] == git_value('rev-parse', 'HEAD') and
         receipt.get('sourceTree') == git_value('rev-parse', 'HEAD^{tree}') and
         all(receipt.get(k) == v for k, v in source.items()) and
         receipt.get('bootIdSHA256') == boot_identity() and
         receipt.get('hostUID') == receipt.get('hostGID') == 1001 and
         receipt.get('runnerName') == os.environ.get('RUNNER_NAME') and
         receipt.get('runnerImageVersion') == os.environ.get('ImageVersion') and
         receipt.get('resourceLabel') == receipt.get('campaignId') == 'work8-v97-frontend-' + run_id and
         receipt.get('packageManifestSHA256') == PACKAGE_MANIFEST_SHA256,
         'ADMITTED_SOURCE_HOST_OR_RUN_CHANGED')
    started = receipt.get('startedAtEpoch')
    need(type(started) in (int, float) and receipt.get('jobStartedAtEpoch') == started and
         receipt.get('deadlineEpoch') == started + MAX_JOB_SECONDS and
         receipt.get('nativeDeadlineEpoch') == started + MAX_NATIVE_SECONDS and
         receipt.get('maximumJobSeconds') == MAX_JOB_SECONDS and
         receipt.get('maximumNativeSeconds') == MAX_NATIVE_SECONDS and
         started <= time.time() < receipt['deadlineEpoch' if allow_terminal else 'nativeDeadlineEpoch'],
         'DIAGNOSTIC_DEADLINE_OR_BOUNDS_CHANGED')
    record = read_json(root / 'external-release.json', 65536)
    authority = validate_release(record, source,
        {'tree': {'sha': receipt['sourceTree']}, 'parents': [{'sha': PARENT}]})
    need(all(receipt.get(k) == v for k, v in authority.items()) and
         receipt.get('externalReleaseCanonicalSHA256') == digest(canonical(record)) and
         receipt.get('maximumExposureUSD') == MAX_EXPOSURE_USD and
         receipt.get('qualificationRepeated') is False and
         receipt.get('businessLifecycleAuthorized') is False and
         receipt.get('A5AcceptanceAuthorized') is False and
         receipt.get('providerMutationsAuthorized') is False, 'ADMITTED_AUTHORITY_CHANGED')
    return receipt


require_native = validate_admission


def validate_download_url(url):
    parsed = urllib.parse.urlsplit(url)
    host = parsed.hostname or ''
    need(parsed.scheme == 'https' and not parsed.username and not parsed.password and
         parsed.port in (None, 443) and not parsed.fragment, 'ARTIFACT_HTTPS_REQUIRED')
    need(host.endswith('.blob.core.windows.net') or host.endswith('.actions.githubusercontent.com') or
         host.endswith('.githubusercontent.com'), 'ARTIFACT_PROVIDER_HOST_REQUIRED')
    return url


def artifact_metadata(value):
    need(value.get('id') == ARTIFACT_ID and value.get('name') == ARTIFACT_NAME and
         value.get('expired') is False and value.get('size_in_bytes') == ARTIFACT_BYTES and
         value.get('digest') == 'sha256:' + ARTIFACT_SHA256 and
         value.get('workflow_run', {}).get('id') == ARTIFACT_RUN and
         value.get('workflow_run', {}).get('head_sha') == ARTIFACT_COMMIT,
         'EXACT_RETAINED_ARTIFACT_REQUIRED')
    expiry = datetime.datetime.fromisoformat(value['expires_at'].replace('Z', '+00:00')).timestamp()
    need(time.time() + 2100 < expiry, 'ARTIFACT_EXPIRY_TOO_CLOSE')
    return value


def deliver_zip(path, root):
    """Verify the exact archive and all45 entries; materialize only four inputs."""
    path, root = Path(path), Path(root)
    need(path.is_file() and not path.is_symlink() and path.stat().st_nlink == 1 and
         path.stat().st_size == ARTIFACT_BYTES and file_digest(path) == ARTIFACT_SHA256,
         'EXACT_RETAINED_ZIP_REQUIRED')
    target = root / 'packages'
    need(not target.exists(), 'ONE_PACKAGE_DELIVERY_ONLY')
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        need(len(names) == len(set(names)) == 46, 'EXACT_ZIP_INVENTORY_REQUIRED')
        for item in z.infolist():
            name = item.filename
            need(PurePosixPath(name).as_posix() == name and not name.startswith('/') and
                 '..' not in PurePosixPath(name).parts and '\\' not in name and
                 not item.is_dir() and not stat.S_ISLNK(item.external_attr >> 16),
                 'ZIP_MEMBER_PATH_OR_TYPE_REFUSED')
        need(z.getinfo('checkpoint-export-index.json').file_size <= 65536 and
             z.getinfo('v65-packages.json').file_size <= 65536, 'PACKAGE_METADATA_BOUND')
        index = json.loads(z.read('checkpoint-export-index.json'))
        expected = {e['path']: e for e in index['files']}
        need(len(expected) == len(index['files']) == 45 and
             set(names) == set(expected) | {'checkpoint-export-index.json'}, 'EXACT_PACKAGE_INDEX_REQUIRED')
        manifest_raw = z.read('v65-packages.json')
        need(digest(manifest_raw) == PACKAGE_MANIFEST_SHA256, 'EXACT_PACKAGE_MANIFEST_REQUIRED')
        manifest = json.loads(manifest_raw)
        need(set(manifest['frontends']) == {'normal', 'recovery'}, 'BOTH_FRONTENDS_REQUIRED')
        pins = {p['file']: p for p in [manifest['backend'], *manifest['frontends'].values()]}
        need(len(pins) == 3, 'THREE_RETAINED_ARCHIVES_REQUIRED')
        total = 0
        for name, entry in expected.items():
            need(type(entry.get('bytes')) is int and 0 < entry['bytes'] <= 210 * 1024 * 1024 and
                 z.getinfo(name).file_size == entry['bytes'], 'INDEX_MEMBER_SIZE_BOUND')
            total += entry['bytes']
            need(total <= 350 * 1024 * 1024, 'TOTAL_PACKAGE_INPUT_BOUND')
            with z.open(name) as stream:
                need(hashlib.file_digest(stream, 'sha256').hexdigest() == entry['sha256'],
                     'INDEXED_INPUT_DIGEST_CHANGED')
            if name.startswith('archives/'):
                basename = PurePosixPath(name).name
                need(name == 'archives/' + basename and basename in pins and
                     entry['bytes'] == pins[basename]['bytes'] and
                     entry['sha256'] == pins[basename]['sha256'], 'EXACT_ARCHIVE_INDEX_PIN_REQUIRED')
        need({n for n in names if n.startswith('archives/')} == {'archives/' + f for f in pins},
             'COMPLETE_ARCHIVE_SET_REQUIRED')
        target.mkdir(mode=0o700)
        (target / 'archives').mkdir(mode=0o700)
        for name in ['v65-packages.json', *('archives/' + f for f in sorted(pins))]:
            destination = target / name
            with z.open(name) as stream, destination.open('xb') as out:
                while chunk := stream.read(1024 * 1024):
                    out.write(chunk)
                out.flush()
                os.fsync(out.fileno())
            destination.chmod(0o600)
            need(file_digest(destination) == expected[name]['sha256'], 'DELIVERED_INPUT_CHANGED')
    return {'packageManifestSHA256': PACKAGE_MANIFEST_SHA256, 'indexedEntriesVerified': 45,
            'archivesDelivered': 3, 'packagesRebuilt': False, 'businessLifecycleInitialized': False}


def download(root):
    root = Path(root)
    receipt = validate_admission(root, require_token_free=False)
    atomic(root / 'download-attempt.json', {'schema': 'work8-v97-download-attempt-v1',
           'runId': receipt['runId'], 'startedAtEpoch': time.time(), 'maximumSeconds': 360})
    started = time.monotonic()
    deadline = min(started + 350, started + receipt['nativeDeadlineEpoch'] - time.time())
    old_handler = signal.getsignal(signal.SIGALRM)
    need(signal.getitimer(signal.ITIMER_REAL) == (0.0, 0.0), 'NESTED_DEADLINE_REFUSED')
    def expire(_signal, _frame):
        raise Refusal('DOWNLOAD_TOTAL_DEADLINE')
    signal.signal(signal.SIGALRM, expire)
    signal.setitimer(signal.ITIMER_REAL, max(0.001, deadline - time.monotonic()))
    try:
        metadata = artifact_metadata(api('/repos/' + REPOSITORY + '/actions/artifacts/' + str(ARTIFACT_ID)))
        historical = api('/repos/' + REPOSITORY + '/actions/runs/' + str(ARTIFACT_RUN))
        need(historical.get('id') == ARTIFACT_RUN and historical.get('run_attempt') == 1 and
             historical.get('head_sha') == ARTIFACT_COMMIT and historical.get('status') == 'completed',
             'PRESERVED_ARTIFACT_ORIGIN_REQUIRED')
        token = os.environ.get('GH_TOKEN')
        need(token and not any(c in token for c in '\r\n'), 'READ_TOKEN_REQUIRED')
        endpoint = 'https://api.github.com/repos/' + REPOSITORY + '/actions/artifacts/' + str(ARTIFACT_ID) + '/zip'
        request = urllib.request.Request(endpoint, headers={'Authorization': 'Bearer ' + token,
            'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'EmpireAI-V97-read-only'})
        opener = urllib.request.build_opener(NoRedirect)
        try:
            with opener.open(request, timeout=20):
                raise Refusal('SIGNED_ARTIFACT_REDIRECT_REQUIRED')
        except urllib.error.HTTPError as error:
            need(error.code in (302, 303, 307, 308), 'ARTIFACT_REDIRECT_REQUIRED')
            url = validate_download_url(error.headers.get('Location', ''))
        for redirect in range(3):
            try:
                # The API token is deliberately absent from every CDN request.
                response = opener.open(urllib.request.Request(url, headers={
                    'User-Agent': 'EmpireAI-V97-read-only'}), timeout=20)
                break
            except urllib.error.HTTPError as error:
                need(error.code in (302, 303, 307, 308) and redirect < 2, 'ARTIFACT_CDN_HTTP_REFUSED')
                url = validate_download_url(error.headers.get('Location', ''))
        target = root / 'retained-candidates.zip'
        size, digestor = 0, hashlib.sha256()
        with response, target.open('xb') as out:
            while True:
                need(time.monotonic() < deadline, 'DOWNLOAD_TOTAL_DEADLINE')
                chunk = response.read(min(1024 * 1024, ARTIFACT_BYTES - size + 1))
                if not chunk:
                    break
                size += len(chunk)
                need(size <= ARTIFACT_BYTES, 'DOWNLOAD_BYTE_BOUND')
                out.write(chunk)
                digestor.update(chunk)
            out.flush()
            os.fsync(out.fileno())
        target.chmod(0o600)
        need(size == ARTIFACT_BYTES and digestor.hexdigest() == ARTIFACT_SHA256,
             'EXACT_DOWNLOADED_BYTES_REQUIRED')
        delivered = deliver_zip(target, root)
        result = {'schema': 'work8-v97-retained-package-download-v1',
            'status': 'PASS_EXACT_RETAINED_INPUT', 'artifactId': ARTIFACT_ID,
            'artifactBytes': size, 'artifactSHA256': ARTIFACT_SHA256,
            'historicalRunId': ARTIFACT_RUN, 'historicalCommit': ARTIFACT_COMMIT,
            'artifactExpiresAt': metadata['expires_at'], 'elapsedSeconds': round(time.monotonic() - started, 3),
            'providerTokenForwarded': False, 'signedURLRetained': False, **delivered}
        atomic(root / 'package-download.json', result)
        return result
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, old_handler)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('operation', choices=('admit', 'download'))
    parser.add_argument('--root', required=True)
    args = parser.parse_args()
    root = Path(args.root)
    try:
        result = admit(root) if args.operation == 'admit' else download(root)
        print(json.dumps({'operation': args.operation, 'status': result['status'],
                          'businessLifecycleInitialized': False, 'A5AcceptanceClaimed': False}))
    except Exception as error:
        code = str(error) if isinstance(error, Refusal) and re.fullmatch('[A-Z0-9_]{1,100}', str(error)) else 'ADMISSION_INTERNAL_REFUSAL'
        failure = {'schema': 'work8-v97-first-admission-failure-v1', 'firstFailure': True,
                   'operation': args.operation, 'code': code, 'rawOutputRetained': False,
                   'businessLifecycleInitialized': False, 'A5AcceptanceClaimed': False}
        try:
            host_context(root, require_existing=True)
            atomic(root / 'first-admission-failure.json', failure)
        except Exception:
            pass
        print(json.dumps(failure))
        raise SystemExit(12) from None


if __name__ == '__main__':
    main()
