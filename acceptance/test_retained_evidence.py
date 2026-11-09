"""Offline binding controls. No Docker, hosted qualification or app execution."""
import ast
import copy
import json
from pathlib import Path
import shutil
import tempfile
import unittest

import retained_diagnostics
import retained_evidence as evidence


class RetainedEvidenceControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = Path(__file__).resolve().parent.parent
        cls.temp = tempfile.TemporaryDirectory()
        cls.repo = Path(cls.temp.name) / 'source'
        for name in ('acceptance', 'v65/foundation/controller', 'v65/foundation/runtime', 'frontend_startup'):
            shutil.copytree(cls.source / name, cls.repo / name, ignore=shutil.ignore_patterns('__pycache__'))
        cls.records = {name: evidence.json_bytes((cls.repo / 'acceptance' / name).read_bytes())
                       for name in evidence.EVIDENCE_SHA if name.endswith('.json')}
        cls.zip_bytes = (cls.repo / 'acceptance/retained-v98/native-startup.zip').read_bytes()
        cls.payloads = evidence.read_native_archive(cls.zip_bytes)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def verify_payloads(self, payloads=None, provider=None, review=None, packages=None):
        evidence.validate_native_payloads(
            payloads if payloads is not None else self.payloads,
            provider if provider is not None else self.records['retained-v98/provider-readback.json'],
            review if review is not None else self.records['retained-v98/independent-review.json'],
            packages if packages is not None else self.records['retained-v98/package-identities.json'])

    def changed_payload(self, name, changes):
        payloads = dict(self.payloads)
        value = evidence.json_bytes(payloads[name])
        for path, replacement in changes:
            target = value
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = replacement
        payloads[name] = json.dumps(value).encode()
        return payloads

    def test_complete_retained_proof_is_deterministic_and_scoped(self):
        a = evidence.verify_retained_evidence(self.repo)
        self.assertEqual(a, evidence.verify_retained_evidence(self.repo))
        self.assertEqual(a['status'], 'VERIFIED_HISTORICAL_EVIDENCE_ONLY')
        self.assertEqual(a['frontendStartup']['indexedPayloadsVerified'], 28)
        for key in ('qualificationRepeated', 'frontendDiagnosticRepeated',
                    'currentNativeLifecycleAccepted', 'currentExecutionAuthority'):
            self.assertIs(a[key], False)
        self.assertIs(a['historicalBrainInitialization']['currentInstanceReusable'], False)
        self.assertIs(a['historicalBrainInitialization']['originalCaptureAccepted'], False)
        self.assertIs(a['historicalQualification']['currentHostAttested'], False)
        self.assertIs(a['frontendStartup']['originalA5Acceptance'], False)
        self.assertEqual(a['diagnosticSuccessor']['focusedControls'], 18)

    def test_complete_native_archive_and_semantics(self):
        self.assertEqual(len(self.payloads), 29)
        self.verify_payloads()

    def test_changed_or_truncated_zip_rejected(self):
        for raw in (self.zip_bytes[:-1], self.zip_bytes + b'x', b'x' + self.zip_bytes[1:]):
            with self.subTest(length=len(raw)), self.assertRaises(ValueError):
                evidence.read_native_archive(raw)

    def test_duplicate_json_keys_rejected(self):
        with self.assertRaisesRegex(ValueError, 'DUPLICATE_JSON'):
            evidence.json_bytes(b'{"status":"FAIL","status":"PASS"}')

    def test_unsafe_archive_names_rejected(self):
        for name in ('../outside', '/absolute', 'a/../b', 'a\\b', 'a//b', './a', ''):
            with self.subTest(name=name), self.assertRaises(ValueError):
                evidence.safe_name(name)

    def test_wrong_provider_run_job_artifact_or_tree_rejected(self):
        for root, key, wrong in [('run', 'id', 1), ('job', 'id', 1), ('artifact', 'id', 1),
                                 ('run', 'head_sha', '0' * 40), ('job', 'conclusion', 'failure')]:
            provider = copy.deepcopy(self.records['retained-v98/provider-readback.json'])
            provider[root][key] = wrong
            with self.subTest(root=root, key=key), self.assertRaises(ValueError):
                self.verify_payloads(provider=provider)

    def test_provider_success_without_independent_readback_rejected(self):
        review = copy.deepcopy(self.records['retained-v98/independent-review.json'])
        review['provider']['independentProviderReadbackSHA256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'REVIEW_BINDING'):
            self.verify_payloads(review=review)

    def test_partial_role_receipt_rejected(self):
        payloads = dict(self.payloads)
        del payloads['evidence/recovery-running.json']
        with self.assertRaises(KeyError):
            self.verify_payloads(payloads=payloads)

    def test_security_and_readiness_regressions_rejected(self):
        variants = [
            ('normal-running', [('readonlyRootfs',)], False),
            ('recovery-running', [('privileged',)], True),
            ('normal-running', [('uidGid',)], '0:0'),
            ('recovery-running', [('appArmorProfile',)], ''),
            ('normal-running', [('capDrop',)], []),
            ('normal-running', [('mounts', 0, 'readOnly')], False),
            ('normal-process', [('cache', 'mode')], '0777'),
            ('recovery-process', [('self', 'seccomp')], 0),
            ('normal-process', [('main', 'capEff')], '0000000000000001'),
            ('normal-process', [('readonlyErrors', 'root')], 'NONE'),
            ('recovery-readiness', [('status',)], 503),
            ('recovery-removed', [('independentFreshInventoryEmpty',)], False),
        ]
        for filename, paths, value in variants:
            payloads = self.changed_payload('evidence/' + filename + '.json', [(p, value) for p in paths])
            with self.subTest(filename=filename, paths=paths), self.assertRaises(ValueError):
                self.verify_payloads(payloads=payloads)

    def test_native_source_mismatch_rejected(self):
        payloads = self.changed_payload('admission.json', [(('sourceCommit',), '0' * 40)])
        with self.assertRaisesRegex(ValueError, 'SOURCE_BINDING'):
            self.verify_payloads(payloads=payloads)

    def test_historical_scope_cannot_be_promoted(self):
        for field, value in [('A5_08', 'PASS'), ('A5_09', 'PASS'), ('brainInitialized', True),
                             ('applicationAcceptance', True), ('Q01_Q05Repeated', True)]:
            payloads = self.changed_payload('evidence/runner-result.json', [((field,), value)])
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, 'SCOPE_INFLATION'):
                self.verify_payloads(payloads=payloads)

    def test_package_identity_mismatch_rejected(self):
        packages = copy.deepcopy(self.records['retained-v98/package-identities.json'])
        packages['frontends']['normal']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'PACKAGE_BINDING'):
            self.verify_payloads(packages=packages)

    def test_first_failure_mutation_rejected(self):
        payloads = self.changed_payload('evidence/negative/first-docker-failure.json',
                                        [(('safeErrorCode',), 'UNKNOWN')])
        with self.assertRaisesRegex(ValueError, 'FIRST_FAILURE_BINDING'):
            self.verify_payloads(payloads=payloads)

    def test_cleanup_not_empty_rejected(self):
        payloads = self.changed_payload('evidence/cleanup-independent-readback.json', [(('containers',), 1)])
        with self.assertRaisesRegex(ValueError, 'INDEPENDENT_CLEANUP'):
            self.verify_payloads(payloads=payloads)

    def test_changed_retained_receipt_and_source_rejected(self):
        paths = ['acceptance/retained-v94/diagnostic-controls.json',
                 'acceptance/retained-v96/diagnostic-test-summary.json',
                 'acceptance/retained-v98/independent-review.json',
                 str(evidence.CONTROLLER / 'command_diagnostics.py'),
                 str(evidence.CONTROLLER / 'current_packages.py')]
        for name in paths:
            path = self.repo / name
            original = path.read_bytes()
            try:
                path.write_bytes(original + b'\n')
                with self.subTest(name=name), self.assertRaises(ValueError):
                    evidence.verify_retained_evidence(self.repo)
            finally:
                path.write_bytes(original)

    def test_missing_retained_receipt_rejected(self):
        path = self.repo / 'acceptance/retained-v98/independent-review.json'
        data = path.read_bytes()
        path.unlink()
        try:
            with self.assertRaises(FileNotFoundError):
                evidence.verify_retained_evidence(self.repo)
        finally:
            path.write_bytes(data)

    def test_linked_receipts_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'receipt.json'
            p.symlink_to(self.repo / 'acceptance/retained-v98/independent-review.json')
            with self.assertRaisesRegex(ValueError, 'REGULAR_BOUNDED'):
                evidence.regular_bytes(p)

    def test_prepared_controller_permits_only_exact_package_rebinding(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / 'controller'
            shutil.copytree(self.repo / evidence.CONTROLLER, target)
            path = target / 'current_packages.py'
            text = path.read_text()
            lines = text.splitlines(keepends=True)
            pins = self.records['retained-v98/package-identities.json']
            replacement = {'BACKEND': pins['backend'], 'FRONTENDS': pins['frontends']}
            edits = [(n.lineno - 1, n.end_lineno, n.targets[0].id) for n in ast.parse(text).body
                     if isinstance(n, ast.Assign) and len(n.targets) == 1
                     and isinstance(n.targets[0], ast.Name) and n.targets[0].id in replacement]
            for start, end, name in sorted(edits, reverse=True):
                lines[start:end] = [name + ' = ' + repr(replacement[name]) + '\n']
            path.write_text(''.join(lines))
            evidence.verify_retained_evidence(self.repo, target)
            path.write_text(path.read_text().replace('"--read-only"', '"--privileged"'))
            with self.assertRaisesRegex(ValueError, 'PREPARED_STARTUP_CONTRACT_CHANGED'):
                evidence.verify_retained_evidence(self.repo, target)

    def test_v94_legacy_receipt_returned_unchanged(self):
        actual = retained_diagnostics.verify_operands(self.source / evidence.CONTROLLER)
        self.assertEqual(actual, self.records['retained-v94/diagnostic-operands.json']['historicalEvidence'])


if __name__ == '__main__':
    unittest.main()
