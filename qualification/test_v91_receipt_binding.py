#!/usr/bin/env python3
"""Offline regressions on real reviewed bytes; never native/UID1001 acceptance."""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'v65/build'))
import qualify_only as q
import reuse_completed_candidates as reuse

CTL = HERE.parent / 'v65/foundation/controller/scripts/work8/native-transition'
STALE_V90_PIN = 'daa27901f6f19e62c1f2069c7843cbc2806c9b6e77b050082e7e38507b214e04'


class ReceiptBinding(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='v91-receipt-')
        self.root = Path(self.tmp.name) / 'controller'
        shutil.copytree(CTL, self.root)
        self.receipt = self.root / 'controller-manifest.json'

    def tearDown(self):
        self.tmp.cleanup()

    def verify(self, pin=None):
        return reuse.guard.verify_manifest(self.root, self.receipt, pin or reuse.CONTROLLER_SHA)

    def test_real_positive_shared_external_pin(self):
        self.assertEqual(reuse.CONTROLLER_SHA, q.runner.CONTROLLER_SHA)
        self.assertEqual(len(self.verify()['files']), 101)

    def test_original_v90_failure_is_reproduced(self):
        with self.assertRaisesRegex(reuse.guard.Refusal, '^PINNED_RECEIPT_CHANGED$'):
            self.verify(STALE_V90_PIN)

    def test_changed_receipt_refused(self):
        self.receipt.write_bytes(self.receipt.read_bytes() + b' ')
        with self.assertRaisesRegex(reuse.guard.Refusal, '^PINNED_RECEIPT_CHANGED$'):
            self.verify()

    def test_reserialization_is_not_silently_canonicalized(self):
        self.receipt.write_text(json.dumps(json.loads(self.receipt.read_bytes()), separators=(',', ':')))
        with self.assertRaisesRegex(reuse.guard.Refusal, '^PINNED_RECEIPT_CHANGED$'):
            self.verify()

    def test_missing_receipt_refused(self):
        self.receipt.unlink()
        with self.assertRaises(FileNotFoundError):
            self.verify()

    def test_substituted_receipt_refused(self):
        self.receipt.write_bytes((HERE.parent / 'v65/foundation/driver/controller-manifest.json').read_bytes())
        with self.assertRaisesRegex(reuse.guard.Refusal, '^PINNED_RECEIPT_CHANGED$'):
            self.verify()

    def test_duplicated_receipt_refused(self):
        shutil.copyfile(self.receipt, self.root / 'controller-copy.json')
        with self.assertRaisesRegex(reuse.guard.Refusal, '^UNINDEXED_OR_MISSING_FILE$'):
            self.verify()

    def test_duplicate_manifest_entries_refused_even_with_fixture_pin(self):
        value = json.loads(self.receipt.read_bytes())
        value['files'].append(value['files'][0])
        self.receipt.write_text(json.dumps(value))
        fixture_pin = hashlib.sha256(self.receipt.read_bytes()).hexdigest()
        with self.assertRaisesRegex(reuse.guard.Refusal, '^DUPLICATE_MANIFEST_PATH$'):
            self.verify(fixture_pin)

    def test_cache_file_refused(self):
        (self.root / '__pycache__').mkdir()
        (self.root / '__pycache__/probe.pyc').write_bytes(b'not bytecode')
        with self.assertRaisesRegex(reuse.guard.Refusal, '^UNINDEXED_OR_MISSING_FILE$'):
            self.verify()

    def test_receipt_symlink_refused(self):
        self.receipt.unlink()
        self.receipt.symlink_to(CTL / 'controller-manifest.json')
        with self.assertRaisesRegex(reuse.guard.Refusal, '^CANONICAL_REGULAR_FILE_REQUIRED$'):
            self.verify()

    def test_receipt_hardlink_refused(self):
        os.link(self.receipt, self.root / 'linked')
        with self.assertRaisesRegex(reuse.guard.Refusal, '^CANONICAL_REGULAR_FILE_REQUIRED$'):
            self.verify()


class AuthorityBoundary(unittest.TestCase):
    def test_candidate_is_inert(self):
        config = json.loads((HERE / 'config.json').read_bytes())
        approval = json.loads((HERE / 'owner-approval.json').read_bytes())
        self.assertIs(config['released'], False)
        self.assertIs(approval['recordedOwnerApproval'], False)
        self.assertIs(config['authority']['reservationCommitted'], False)
        self.assertEqual(config['authority']['reservationUSD'], '0.00')
        with self.assertRaisesRegex(q.Refusal, '^QUALIFICATION_NOT_RELEASED$'):
            q.validate_authority(config, approval, '0' * 64)

    def test_local_principal_is_not_substituted(self):
        if (os.getuid(), os.geteuid(), os.getgid(), os.getegid()) == (1001,) * 4:
            self.skipTest('Compatible principal; separate actual handoff is required.')
        with self.assertRaisesRegex(reuse.guard.Refusal, '^REVIEWED_PREPARATION_PRINCIPAL_REQUIRED$'):
            reuse.observation('offline-refusal-control')


if __name__ == '__main__':
    unittest.main(verbosity=2)
