#!/usr/bin/env python3
"""Freeze a local candidate inventory; this creates no execution authority."""
import argparse
import json
from pathlib import Path
import sys

sys.dont_write_bytecode = True
from native_acceptance import SOURCE, MANIFEST_EXCLUSIONS, source_inventory


def build(root=SOURCE):
    return {'schema': 'work8-v99-exact-source-manifest-v1',
            'exclusions': sorted(MANIFEST_EXCLUSIONS),
            'files': source_inventory(Path(root))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    target = SOURCE/'acceptance/source-manifest.json'
    data = (json.dumps(build(), sort_keys=True, indent=2)+'\n').encode()
    if args.check:
        if not target.is_file() or target.read_bytes() != data:
            raise SystemExit('SOURCE_MANIFEST_CHANGED')
    else:
        target.write_bytes(data)
        target.chmod(0o644)
    print(json.dumps({'status': 'EXACT_LOCAL_SOURCE_MANIFEST_VERIFIED' if args.check
                     else 'EXACT_LOCAL_SOURCE_MANIFEST_FROZEN',
                     'ownerApprovalCreated': False, 'reservationCreated': False,
                     'providerWrites': 0, 'applicationExecuted': False}))


if __name__ == '__main__':
    main()
