#!/usr/bin/env python3
"""Collect only public image metadata before dependency/application execution.

Runner v2.338.2 JobExtension reads runner-root/.setup_info and prints public
groups in Set up job. This collector reads that same metadata file, located
through an actual Runner.Worker ancestor; it does not claim to read the provider
log. A final independent provider-log comparison is still required.
"""
import argparse
import hashlib
import json
import os
import pathlib
import re
import stat
import sys
import time
from urllib.parse import unquote

MAX_METADATA_BYTES = 262144
MAX_GROUPS = 32
MAX_DETAIL_BYTES = 4096
MAX_ANCESTORS = 16
VERSION_RE = re.compile(r"\d{8}\.\d+\.\d+")
FIELDS = {"Image", "Version", "Included Software", "Image Release"}


class Refusal(ValueError):
    pass


def require(condition, code):
    if not condition:
        raise Refusal(code)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def read_stable_metadata(path):
    """No symlink, executable content, subprocess, or raw-output export."""
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC)
    try:
        before = os.fstat(fd)
        require(stat.S_ISREG(before.st_mode), "REGULAR_METADATA_FILE_REQUIRED")
        require(before.st_uid in (0, os.getuid()) and not before.st_mode & 0o022, "METADATA_OWNER_MODE_REFUSED")
        require(0 < before.st_size <= MAX_METADATA_BYTES, "METADATA_SIZE_BOUND")
        with os.fdopen(fd, "rb", closefd=False) as stream:
            raw = stream.read(MAX_METADATA_BYTES + 1)
        after = os.fstat(fd)
        require(len(raw) == before.st_size <= MAX_METADATA_BYTES, "METADATA_READ_SIZE_CHANGED")
        require((before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) == (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), "METADATA_CHANGED_DURING_READ")
        metadata = {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(), "ownerUid": before.st_uid, "mode": oct(stat.S_IMODE(before.st_mode)), "rawContentsExported": False}
        return raw, metadata
    finally:
        os.close(fd)


def image_group(raw):
    require(0 < len(raw) <= MAX_METADATA_BYTES, "METADATA_SIZE_BOUND")
    groups = json.loads(raw, object_pairs_hook=unique_object)
    require(isinstance(groups, list) and 0 < len(groups) <= MAX_GROUPS, "BOUNDED_METADATA_GROUP_LIST_REQUIRED")
    selected = []
    for item in groups:
        require(isinstance(item, dict), "METADATA_GROUP_OBJECT_REQUIRED")
        # Newtonsoft property binding is case-insensitive; reject aliases that
        # would otherwise make the selected public group ambiguous.
        folded = {}
        for key, value in item.items():
            require(isinstance(key, str), "METADATA_PROPERTY_NAME_REQUIRED")
            key = key.lower()
            require(key not in folded, "AMBIGUOUS_METADATA_PROPERTY")
            folded[key] = value
        if folded.get("group") == "Runner Image":
            require(set(folded) == {"group", "detail"}, "RUNNER_IMAGE_PROPERTY_ALLOWLIST")
            selected.append(folded["detail"])
    require(len(selected) == 1, "ONE_RUNNER_IMAGE_GROUP_REQUIRED")
    detail = selected[0]
    require(isinstance(detail, str) and 0 < len(detail.encode()) <= MAX_DETAIL_BYTES, "RUNNER_IMAGE_DETAIL_BOUND")
    values = {}
    for line in detail.replace("\r\n", "\n").rstrip("\n").split("\n"):
        key, separator, value = line.partition(": ")
        require(separator and key in FIELDS and key not in values, "RUNNER_IMAGE_FIELDS_REFUSED")
        require(not any(ord(c) < 32 for c in value), "RUNNER_IMAGE_CONTROL_CHARACTER")
        values[key] = value
    require(set(values) == FIELDS, "COMPLETE_RUNNER_IMAGE_FIELDS_REQUIRED")
    require(values["Image"] == "ubuntu-24.04", "UBUNTU24_IMAGE_REQUIRED")
    require(VERSION_RE.fullmatch(values["Version"]) is not None, "RUNNER_IMAGE_VERSION_FORMAT")
    release = values["Version"].rsplit(".", 1)[0]
    require(values["Included Software"] == f"https://github.com/actions/runner-images/blob/ubuntu24/{release}/images/ubuntu/Ubuntu2404-Readme.md", "RUNNER_IMAGE_SOFTWARE_LINK_MISMATCH")
    require(unquote(values["Image Release"]) == f"https://github.com/actions/runner-images/releases/tag/ubuntu24/{release}", "RUNNER_IMAGE_RELEASE_LINK_MISMATCH")
    return values


def ancestor_runner_root():
    pid = os.getppid()
    visited = set()
    for _ in range(MAX_ANCESTORS):
        require(pid > 1 and pid not in visited, "RUNNER_WORKER_ANCESTOR_UNAVAILABLE")
        visited.add(pid)
        proc = pathlib.Path("/proc") / str(pid)
        executable = pathlib.Path(os.readlink(proc / "exe"))
        # Read only parent identifiers, never command lines or environments.
        raw = (proc / "stat").read_bytes()
        require(len(raw) <= 8192 and b") " in raw, "PROCESS_STAT_BOUND")
        parent_fields = raw.rsplit(b") ", 1)[1].split()
        if executable.name == "Runner.Worker":
            require(executable.is_absolute() and executable.parent.name == "bin", "RUNNER_WORKER_PATH_REFUSED")
            require(not str(executable).endswith(" (deleted)"), "RUNNER_WORKER_DELETED")
            return executable.parent.parent, {"discoveredThrough": "actual-ancestor-proc-exe", "ancestorDepth": len(visited), "executableBasename": "Runner.Worker"}
        require(len(parent_fields) > 1, "PROCESS_PARENT_REQUIRED")
        pid = int(parent_fields[1])
    raise Refusal("RUNNER_WORKER_ANCESTOR_BOUND")


def compare_metadata(setup_bytes, imagedata_bytes, image_os, image_version):
    require(image_os == "ubuntu24", "IMAGE_OS_REQUIRED")
    require(isinstance(image_version, str) and VERSION_RE.fullmatch(image_version) is not None, "ENV_IMAGE_VERSION_FORMAT")
    setup = image_group(setup_bytes)
    image = image_group(imagedata_bytes)
    observations = {"setupInfo": setup, "imageData": image, "ImageOS": image_os, "ImageVersion": image_version}
    matches = setup == image and setup["Version"] == image_version
    return observations, matches


def bind_current_identity(identity, env):
    require(env.get('GITHUB_ACTIONS') == 'true' and env.get('GITHUB_REPOSITORY') == 'empireaios/EmpireAI' and env.get('GITHUB_REPOSITORY_ID') == '1275922460', 'ACTUAL_ACTIONS_REPOSITORY_REQUIRED')
    require(env.get('GITHUB_RUN_ATTEMPT') == '1', 'FIRST_ATTEMPT_REQUIRED')
    run_id = env.get('GITHUB_RUN_ID', '')
    source = env.get('GITHUB_SHA', '')
    require(re.fullmatch(r'[1-9][0-9]{0,19}', run_id) and re.fullmatch(r'[0-9a-f]{40}', source), 'CURRENT_RUN_SOURCE_FORMAT')
    job_id = identity.get('jobId')
    require(type(job_id) is int and job_id > 0, 'SERVICE_JOB_ID_REQUIRED')
    require(identity.get('provider') == 'github-actions' and identity.get('repository') == env['GITHUB_REPOSITORY'] and identity.get('repositoryId') == env['GITHUB_REPOSITORY_ID'], 'IDENTITY_REPOSITORY_BINDING')
    require(identity.get('runId') == run_id and identity.get('runAttempt') == 1 and identity.get('workflowCommit') == source and identity.get('jobKey') == env.get('GITHUB_JOB'), 'IDENTITY_CURRENT_RUN_BINDING')
    require(identity.get('sessionId') == f'github-actions:{run_id}:1:{job_id}', 'IDENTITY_SESSION_BINDING')
    require(identity.get('runnerImageVersion') == env.get('ImageVersion'), 'IDENTITY_ENV_IMAGE_VERSION_CHANGED')
    return {'runId': run_id, 'runAttempt': 1, 'jobId': job_id, 'workflowCommit': source, 'sessionId': identity['sessionId']}


def collect(output):
    result = {"schema": "work8-runtime-image-provenance-v1", "status": "REFUSED", "recordedAtEpoch": time.time(), "nativeAdmissionGranted": False, "applicationAcceptance": False, "providerSetupLogObserved": False, "independentArtifactReviewRequiredBeforeNative": True, "terminalProviderSetupLogComparisonRequiredBeforeAcceptance": True, "oldV65DiscrepancyResolved": False}
    try:
        identity_raw, identity_meta = read_stable_metadata(output.parent / 'runner-identity.json')
        identity = json.loads(identity_raw, object_pairs_hook=unique_object)
        result.update(bind_current_identity(identity, os.environ))
        result['runtimeIdentityReceipt'] = identity_meta
        root, discovery = ancestor_runner_root()
        setup_raw, setup_meta = read_stable_metadata(root / ".setup_info")
        image_raw, image_meta = read_stable_metadata(pathlib.Path("/imagegeneration/imagedata.json"))
        observations, matches = compare_metadata(setup_raw, image_raw, os.environ.get("ImageOS"), os.environ.get("ImageVersion"))
        result.update(observations=observations, files={"runnerSetupInfo": setup_meta, "imageData": image_meta}, workerDiscovery=discovery)
        require(matches, "CURRENT_RUNTIME_IMAGE_METADATA_DISAGREEMENT")
        result.update(status="PASS_CURRENT_RUNTIME_METADATA_AGREEMENT_ONLY", code=None)
        code = 0
    except (Refusal, OSError, ValueError, TypeError, KeyError) as exc:
        result["code"] = str(exc) if isinstance(exc, Refusal) else type(exc).__name__
        code = 17
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, sort_keys=True, indent=2)
        stream.write("\n")
    return code, result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=pathlib.Path, required=True)
    args = parser.parse_args()
    code, result = collect(args.output)
    print(json.dumps({"status": result["status"], "code": result["code"], "providerSetupLogObserved": False, "nativeAdmissionGranted": False}))
    return code


if __name__ == "__main__":
    sys.exit(main())
