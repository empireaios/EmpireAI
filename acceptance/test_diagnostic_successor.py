"""Isolated admission fixtures: never reviewer receipts or native acceptance."""
import copy
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest import mock

import retained_evidence as evidence


SCOPE = {'historicalEvidenceChanged': False, 'hostedQualificationRepeated': False,
         'frontendDiagnosticsRepeated': False, 'nativeExecution': False,
         'currentNativeAcceptance': False, 'executionAuthority': False}


class DiagnosticSuccessorControls(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.repo = Path(self.temp.name)/'synthetic-admission-fixture'
        self.source = Path(__file__).resolve().parent.parent
        for name in ('acceptance', 'v65/foundation/controller', 'v65/foundation/runtime',
                     'v65/adapter', 'v65/tests', 'frontend_startup'):
            shutil.copytree(self.source/name, self.repo/name, ignore=shutil.ignore_patterns('__pycache__'))
        self.controller = self.repo/evidence.CONTROLLER
        self.records = {name: evidence.json_bytes((self.repo/'acceptance'/name).read_bytes())
                        for name in evidence.EVIDENCE_SHA if name.endswith('.json')}
        self.history = self.records['retained-v94/diagnostic-operands.json']
        self.sources = {name: evidence.digest((self.repo/name).read_bytes()) for name in evidence.V111_SOURCE_PATHS}
        self.pins = dict(evidence.V111_EVIDENCE_SHA)
        successor = {'schema': 'work8-v111-diagnostic-successor-v1', 'status': 'LOCAL_DIAGNOSTIC_SUCCESSOR',
            'replaces': sorted(evidence.V111_REPLACEMENTS),
            'historicalOperandSHA256': {name: self.history['files'][name] for name in sorted(evidence.V111_REPLACEMENTS)},
            'historicalEvidenceSHA256': evidence.EVIDENCE_SHA,
            'v110EvidenceSHA256': {name: self.pins[name] for name in self.pins if '/v110-' in name},
            'scope': SCOPE, 'sourceSHA256': self.sources}
        validation = {'schema': 'work8-v111-local-diagnostic-validation-v1', 'status': 'PASS',
            'sourceSHA256': self.sources, 'scope': SCOPE, 'testsPassed': 1, 'testsFailed': 0,
            'actualCheckerThroughArchive': True, 'independentArchiveIntegrity': True,
            'fixtureOnly': True}
        self.write('diagnostic-successor.json', successor)
        self.write('focused-validation.json', validation)
        for role in ('source', 'security'):
            self.write(role+'-review.json', {'status': 'PASS', 'sourceSHA256': self.sources,
                                            'openFindings': [], 'fixtureOnly': True})
        review = {'schema': 'work8-v111-independent-diagnostic-review-v1', 'status': 'PASS',
            'reviewType': 'INDEPENDENT_LOCAL_SOURCE_AND_SECURITY', 'sourceSHA256': self.sources,
            'successorSHA256': self.pins['retained-v111/diagnostic-successor.json'],
            'validationSHA256': self.pins['retained-v111/focused-validation.json'],
            'reviewEvidenceSHA256': {role: self.pins['retained-v111/'+role+'-review.json'] for role in ('source', 'security')},
            'scope': SCOPE, 'openFindings': [], 'fixtureOnly': True}
        self.write('independent-review.json', review)

    def tearDown(self):
        self.temp.cleanup()

    def write(self, name, value, repin=True):
        path = self.repo/'acceptance/retained-v111'/name
        path.write_text(json.dumps(value, sort_keys=True, indent=2)+'\n')
        if repin:
            self.pins['retained-v111/'+name] = evidence.digest(path.read_bytes())

    def verify(self):
        with mock.patch.object(evidence, 'V111_EVIDENCE_SHA', self.pins):
            return evidence.verify_retained_evidence(self.repo)

    def change(self, name, update, repin=False):
        path = self.repo/'acceptance/retained-v111'/name
        value = json.loads(path.read_bytes()); update(value); self.write(name, value, repin)

    def test_exact_successor_admitted_without_inflating_historical_scope(self):
        proof = self.verify()
        self.assertEqual(proof['currentDiagnosticSuccessor']['sourceSHA256'], self.sources)
        self.assertFalse(proof['currentNativeLifecycleAccepted'])
        self.assertFalse(proof['currentExecutionAuthority'])
        self.assertFalse(proof['qualificationRepeated'])
        self.assertFalse(proof['frontendDiagnosticRepeated'])
        self.assertEqual(proof['diagnosticSuccessor']['focusedControls'], 18)
        self.assertEqual(proof, self.verify())

    def test_unchanged_historical_pair_requires_no_successor_record(self):
        for name in evidence.V111_REPLACEMENTS:
            old = (self.repo/'acceptance/retained-v111'/('historical-'+name+'.txt')).read_bytes()
            self.assertEqual(evidence.digest(old), self.history['files'][name])
            (self.controller/name).write_bytes(old)
        shutil.rmtree(self.repo/'acceptance/retained-v111')
        proof = self.verify()
        self.assertIsNone(proof['currentDiagnosticSuccessor'])
        self.assertFalse(proof['currentNativeLifecycleAccepted'])

    def test_pending_review_pin_cannot_admit_successor(self):
        self.pins['retained-v111/independent-review.json'] = None
        with self.assertRaisesRegex(ValueError, 'V111_DIAGNOSTIC_REVIEW_REQUIRED'):
            self.verify()

    def test_missing_review_is_rejected(self):
        (self.repo/'acceptance/retained-v111/independent-review.json').unlink()
        with self.assertRaises(FileNotFoundError):
            self.verify()

    def test_changed_receipt_is_rejected(self):
        self.change('independent-review.json', lambda value: value.update(status='PASS_CHANGED'))
        with self.assertRaisesRegex(ValueError, 'V111_DIAGNOSTIC_RECEIPT_CHANGED'):
            self.verify()

    def test_unreviewed_current_source_is_rejected(self):
        for relative in self.sources:
            path = self.repo/relative; original = path.read_bytes()
            try:
                path.write_bytes(original+b'\n')
                with self.subTest(relative=relative), self.assertRaisesRegex(ValueError, 'V111_DIAGNOSTIC_SOURCE_CHANGED'):
                    self.verify()
            finally:
                path.write_bytes(original)

    def test_unlisted_historical_operand_change_remains_rejected(self):
        path = self.controller/'child-diagnostic-collector.mjs'; path.write_bytes(path.read_bytes()+b'\n')
        with self.assertRaisesRegex(ValueError, 'RETAINED_DIAGNOSTIC_OPERAND_CHANGED'):
            self.verify()

    def test_mixed_historical_and_successor_pair_is_rejected(self):
        name = 'native-diagnostic.mjs'
        (self.controller/name).write_bytes((self.repo/'acceptance/retained-v111'/('historical-'+name+'.txt')).read_bytes())
        with self.assertRaisesRegex(ValueError, 'V111_MIXED_DIAGNOSTIC_SUCCESSOR'):
            self.verify()

    def test_review_source_disagreement_rejected_even_with_matching_record_digest(self):
        self.change('independent-review.json', lambda value: value.update(sourceSHA256={}), repin=True)
        with self.assertRaisesRegex(ValueError, 'V111_INDEPENDENT_DIAGNOSTIC_REVIEW_REQUIRED'):
            self.verify()

    def test_scope_inflation_rejected_even_if_receipt_hash_matches(self):
        self.change('independent-review.json', lambda value: value.update(scope={**SCOPE, 'nativeExecution': True}), repin=True)
        with self.assertRaisesRegex(ValueError, 'V111_DIAGNOSTIC_SCOPE_INFLATION'):
            self.verify()

    def test_open_findings_are_not_approved(self):
        self.change('independent-review.json', lambda value: value.update(openFindings=['unresolved']), repin=True)
        with self.assertRaisesRegex(ValueError, 'V111_INDEPENDENT_DIAGNOSTIC_REVIEW_REQUIRED'):
            self.verify()

    def test_separate_review_evidence_must_match_combined_attestation(self):
        self.change('security-review.json', lambda value: value.update(sourceSHA256={}), repin=True)
        self.change('independent-review.json', lambda value: value.update(
            reviewEvidenceSHA256={role: self.pins['retained-v111/'+role+'-review.json']
                                  for role in ('source', 'security')}), repin=True)
        with self.assertRaisesRegex(ValueError, 'V111_REVIEW_EVIDENCE_BINDING'):
            self.verify()

    def test_prepared_controller_must_use_identical_reviewed_pair(self):
        prepared = Path(self.temp.name)/'prepared'
        shutil.copytree(self.controller, prepared)
        path = prepared/'native_diagnostics.py'; path.write_bytes(path.read_bytes()+b'\n')
        with mock.patch.object(evidence, 'V111_EVIDENCE_SHA', self.pins), self.assertRaisesRegex(ValueError, 'V111_PREPARED_DIAGNOSTIC_SOURCE_CHANGED'):
            evidence.verify_diagnostic_operands(self.repo, prepared, self.records)

    def test_prepared_historical_downgrade_cannot_skip_successor_review(self):
        prepared = Path(self.temp.name)/'historical-prepared'
        shutil.copytree(self.controller, prepared)
        for name in evidence.V111_REPLACEMENTS:
            (prepared/name).write_bytes((self.repo/'acceptance/retained-v111'/('historical-'+name+'.txt')).read_bytes())
        with self.assertRaisesRegex(ValueError, 'V111_PREPARED_DIAGNOSTIC_SOURCE_CHANGED'):
            evidence.verify_diagnostic_operands(self.repo, prepared, self.records)

    def test_prepared_imported_helper_and_checker_must_match_reviewed_sources(self):
        prepared = Path(self.temp.name)/'prepared-with-imports'
        shutil.copytree(self.controller, prepared)
        for name in ('assurance-records.mjs', 'whole-app-readback.mjs'):
            path = prepared/name; original = path.read_bytes()
            try:
                path.write_bytes(original+b'\n')
                with self.subTest(name=name), self.assertRaisesRegex(ValueError, 'V111_PREPARED_DIAGNOSTIC_SOURCE_CHANGED'):
                    evidence.verify_diagnostic_operands(self.repo, prepared, self.records)
            finally:
                path.write_bytes(original)

    def test_v94_v96_v98_evidence_stays_byte_identical(self):
        self.verify()
        for name, expected in evidence.EVIDENCE_SHA.items():
            self.assertEqual(evidence.digest((self.repo/'acceptance'/name).read_bytes()), expected)


if __name__ == '__main__':
    unittest.main()
