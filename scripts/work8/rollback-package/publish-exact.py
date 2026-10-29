#!/usr/bin/env python3
"""Import reviewed Git bundles without changing any commit metadata.

Only the two exact manifest identities may be published. Empty expected-head
leases are create-only compare-and-swap guards, never permission to overwrite an
existing ref. Existing exact heads are accepted; any other head stops the job.
Git credentials remain checkout-owned and are never read, printed or archived.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUTPUT = ROOT / 'publication-output'
EXPECTED = {
    'backend': ('98970018d579e5a7c720d25293cdddbe294856c0', 'work8/rollback-gate-20261029'),
    'frontend': ('42dfd0aa9d69a74d237f17555e6a1aeb343c59b9', 'work8/rollback-view-20261029'),
}
HEX40 = re.compile(r'^[a-f0-9]{40}$')
HEX64 = re.compile(r'^[a-f0-9]{64}$')


def git(*args: str) -> str:
    result = subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, text=True)
    if result.returncode:
        # Do not echo command stderr: credential helpers and URLs are untrusted.
        raise RuntimeError('Git operation failed: ' + args[0])
    return result.stdout.strip()


def check(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def remote_head(ref: str) -> str | None:
    result = git('ls-remote', '--heads', 'origin', ref)
    if not result:
        return None
    lines = result.splitlines()
    check(len(lines) == 1, 'Ambiguous remote head')
    sha, name = lines[0].split('\t')
    check(name == ref and bool(HEX40.fullmatch(sha)), 'Unexpected remote ref')
    return sha


def check_commit(entry: dict) -> None:
    commit, base, tree = (entry[k] for k in ('commit', 'base', 'tree'))
    check(git('cat-file', '-t', commit) == 'commit', 'Candidate is not a commit')
    check(git('rev-parse', commit + '^{tree}') == tree, 'Complete tree mismatch')
    git('merge-base', '--is-ancestor', base, commit)
    # Restrict the successor chain; do not accept hidden merges/new histories.
    chain = git('rev-list', '--parents', commit, '^' + base).splitlines()
    check(0 < len(chain) <= 8, 'Unexpected successor chain length')
    check(all(len(line.split()) == 2 for line in chain), 'Merge commit not permitted')


def main() -> None:
    receipt: dict = {'schema': 'work8-exact-publication-v1', 'status': 'STARTED',
                     'productionDeployment': False, 'ciRetry': False, 'candidates': {}}
    OUTPUT.mkdir(exist_ok=True)
    try:
        check(os.environ.get('GITHUB_EVENT_NAME') == 'push', 'Push event required')
        check(os.environ.get('GITHUB_REF') == 'refs/heads/work8/rollback-package-20261029', 'Controller branch mismatch')
        check(os.environ.get('GITHUB_RUN_ATTEMPT') == '1', 'Retries forbidden')
        check(os.environ.get('GITHUB_RUN_NUMBER') == '1', 'Only first controller run authorised')
        expected_controller = os.environ.get('EXPECTED_CONTROLLER', '')
        check(bool(HEX40.fullmatch(expected_controller)), 'Exact controller commit required')
        check(git('rev-parse', 'HEAD') == expected_controller, 'Controller checkout mismatch')
        receipt['controller'] = {'commit': expected_controller, 'tree': git('rev-parse', 'HEAD^{tree}')}
        manifest = json.loads((HERE / 'exact-manifest.json').read_text())
        check(set(manifest) == set(EXPECTED) | {'reviewSha256'}, 'Manifest must contain two candidates and review digest')
        review_digest = manifest.pop('reviewSha256')
        check(isinstance(review_digest, str) and bool(HEX64.fullmatch(review_digest)), 'Invalid review digest')
        review_path = HERE / 'assets' / 'independent-review.json'
        check(review_path.is_file() and not review_path.is_symlink(), 'Missing regular independent review')
        check(hashlib.sha256(review_path.read_bytes()).hexdigest() == review_digest, 'Independent review digest mismatch')
        review = json.loads(review_path.read_text())
        check(review.get('decision') == 'PASS_FOR_PUBLICATION', 'Independent review has not passed publication')
        check(set(review.get('candidates', {})) == set(EXPECTED), 'Independent review candidate scope mismatch')
        for role in EXPECTED:
            binding = review['candidates'][role]
            check(all(binding.get(key) == manifest[role].get(key) for key in ('commit', 'tree', 'bundleSha256')), 'Independent review identity mismatch')
        receipt['independentReview'] = {'sha256': review_digest, 'decision': 'PASS_FOR_PUBLICATION', 'prePublicationVerified': True}
        pending: list[tuple[str, dict]] = []
        for role, (base, destination) in EXPECTED.items():
            entry = manifest[role]
            check(set(entry) == {'base', 'commit', 'tree', 'destination', 'bundleSha256'}, 'Unexpected manifest fields')
            check(entry['base'] == base and entry['destination'] == destination, 'Manifest authority scope mismatch')
            check(all(isinstance(entry[k], str) and HEX40.fullmatch(entry[k]) for k in ('base', 'commit', 'tree')), 'Invalid Git identity')
            check(isinstance(entry['bundleSha256'], str) and bool(HEX64.fullmatch(entry['bundleSha256'])), 'Invalid bundle digest')
            bundle = HERE / 'assets' / (role + '.bundle')
            check(bundle.is_file() and not bundle.is_symlink(), 'Missing regular bundle')
            check(hashlib.sha256(bundle.read_bytes()).hexdigest() == entry['bundleSha256'], 'Bundle digest mismatch')
            git('fetch', '--no-tags', '--depth=1', 'origin', base)
            git('bundle', 'verify', str(bundle))
            heads = git('bundle', 'list-heads', str(bundle)).splitlines()
            check(len(heads) == 1, 'Bundle must expose one exact head')
            sha, bundle_ref = heads[0].split(' ', 1)
            check(sha == entry['commit'] and bundle_ref.startswith('refs/heads/work8/'), 'Bundle head mismatch')
            git('fetch', '--no-tags', str(bundle), bundle_ref)
            check_commit(entry)
            ref = 'refs/heads/' + destination
            previous = remote_head(ref)
            check(previous in (None, entry['commit']), 'Destination has an unapproved head')
            receipt['candidates'][role] = {**entry, 'previousHead': previous, 'prePublicationVerified': True}
            if previous is None:
                pending.append((ref, entry))
        # One atomic transaction for all absent refs. The empty lease requires
        # nonexistence at receive time, closing the inspection/push race.
        if pending:
            leases = ['--force-with-lease=' + ref + ':' for ref, _ in pending]
            refspecs = [entry['commit'] + ':' + ref for ref, entry in pending]
            git('push', '--atomic', *leases, 'origin', *refspecs)
        for role, entry in manifest.items():
            ref = 'refs/heads/' + entry['destination']
            check(remote_head(ref) == entry['commit'], 'Published head mismatch')
            git('fetch', '--no-tags', 'origin', ref)
            check(git('rev-parse', 'FETCH_HEAD') == entry['commit'], 'Fetched published commit mismatch')
            check_commit(entry)
            receipt['candidates'][role]['postPublicationVerified'] = True
        check(hashlib.sha256(review_path.read_bytes()).hexdigest() == review_digest, 'Independent review changed during publication')
        receipt['independentReview']['postPublicationVerified'] = True
        receipt['status'] = 'PASS'
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            for role, entry in manifest.items():
                output.write(role + '_commit=' + entry['commit'] + '\n')
    except Exception as error:
        receipt['status'] = 'FAIL'
        receipt['failure'] = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        raise
    finally:
        (OUTPUT / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Exact publication stopped; inspect secret-free publication receipt.', file=sys.stderr)
        sys.exit(1)
