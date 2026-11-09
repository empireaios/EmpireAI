#!/usr/bin/env python3
"""Offline receipt-transport controls; never native application acceptance.

Genuine V100 preflight payloads are retained byte-for-byte. Full-stage receipts
are explicitly representative structures made from original producer schemas
and retained readback structures. They are NOT recovered V100 observations.
"""
import base64
import copy
import gzip
import importlib.util
import json
from pathlib import Path
import shutil
import sys
import tarfile
import tempfile
import unittest

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SOURCE/'v65/adapter'))
sys.path.insert(0, str(SOURCE/'v65/foundation/runtime'))
import final_evidence as final
import runner
from runtime_common import Refusal

RETAINED = SOURCE.parents[1]/'v100/reviews/preflight-actual/payloads'
ACK2 = SOURCE.parents[1]/'v100/reviews/preflight-reviewed-ack.json'
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=')


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(value if isinstance(value, bytes) else final.encoded(value))


def read(path):
    return json.loads(path.read_bytes())


def reindex(root):
    d = root/'evidence/full'
    rows = [{'path': p.name, 'bytes': p.stat().st_size, 'sha256': final.sha(p.read_bytes())}
            for p in sorted(d.iterdir()) if p.name != 'artifact-index.json']
    write(d/'artifact-index.json', {'schema': 'work8-bounded-upload-v1',
        'exactGeneratedSecretCheck': True, 'files': rows})


def representative(root):
    """Transport fixture, never an assertion that these native events occurred."""
    shutil.copytree(RETAINED, root, dirs_exist_ok=True)
    (root/'export-index.json').unlink(missing_ok=True)
    write(root/'preflight-review.json', ACK2.read_bytes())
    contract = read(root/'run-contract.json')
    full = root/'evidence/full'
    shutil.copytree(root/'evidence/preflight', full)
    (full/'first-native-failure.json').unlink(missing_ok=True)
    for name in final.REQUIRED_FULL:
        if not (full/name).exists():
            write(full/name, PNG if name.endswith('.png') else {})
    start = read(full/'stage-start.json');start['stage'] = 'full';write(full/'stage-start.json', start)
    result = read(full/'runner-result.json')
    result.update(status='PASS_AWAITING_INDEPENDENT_TECHNICAL_REVIEW', phaseBStarted=True)
    write(full/'runner-result.json', result)
    supervisor = read(root/'controller-supervisor-preflight.json');supervisor['phase'] = 'full'
    write(root/'controller-supervisor-full.json', supervisor)
    capture = read(full/'live-brain-capture.json')
    capture.update(status='PASS_ACTUAL_LIVE_BRAIN_BASELINE', mode='BASELINE')
    # Distinct representative full instance, not the preflight instance.
    capture['ready']['instanceId'] = '00000000-0000-4000-8000-000000000101'
    capture['capture']['attestation']['instanceId'] = capture['ready']['instanceId']
    write(full/'live-brain-capture.json', capture)
    write(full/'live-brain-ready.json', capture['ready'])
    whole = read(full/'normal-whole-app-readback.json')
    whole['storeApplicability']['stage'] = 'full'
    whole['storeApplicability']['requiredPresentCount'] = 7
    whole['storeApplicability']['stores']['pillowMemory'].update(present=True, requiredPresent=True,
                                                              classification='ACTUAL_INITIALIZED_STORE')
    whole['stores']['pillowMemory'] = {'present': True, 'tables': {'representative_fixture': {'count': 1}}}
    whole['fullSchemas']['pillowMemory'] = {'present': True}
    whole['brainLiveBaseline']['instanceId'] = capture['ready']['instanceId']
    for phase in final.PHASES:
        value = copy.deepcopy(whole);value['phase'] = phase
        if phase != 'normal':
            value.update(unchangedNativeChildRoots=True, unchangedGenerationAuthority=True,
                         originalBusinessAndStaticRowsPreserved=True)
        write(full/(phase+'-whole-app-readback.json'), value)
        write(full/(phase+'-commerce-independent-readback.json'), {
            'phase': phase, 'status': 'PASS_INDEPENDENT_PROCESS_COMMERCE_READBACK_ONLY',
            'noDuplicateReplay': True, 'authorityRestored': False, 'actualCashMovement': 0,
            'liveCommerce': 'LOCKED', 'canonical': {'representativeFixture': True}})
        scripts = ['offline-commerce-readback.mjs', 'whole-app-readback.mjs']
        if phase in ('normal', 'returned', 'replayed'):
            scripts.append('capture-canonical-persistence.mjs')
        write(full/(phase+'-independent-gate.json'), {'phase': phase, 'allPassed': True,
            'attempts': 1, 'outcomes': {script: 'PASS' for script in scripts}})
    for phase in ('normal', 'returned', 'replayed'):
        write(full/(phase+'-persistence-capture.json'), {'phase': phase, 'status': 'PASS_PRIVATE_CANONICAL_CAPTURE'})
    for name in ('normal-replay-comparison.json', 'returned-comparison.json',
                 'replayed-comparison.json', 'recovery-schema-comparison.json'):
        write(full/name, {'pass': True, 'representativeFixture': True})
    phases = [{'phase': phase, 'commit': contract['sources'][role]['commit']}
              for phase, role in [('NORMAL', 'normal'), ('RECOVERY', 'recovery'), ('NORMAL_RETURN', 'normal')]]
    phases[1].update(readOnly=True, frontendWriteStatus=423, directAuthorityWriteStatus=423,
                     authenticatedSameOwnerContext=True)
    write(full/'transition-browser-result.json', {'status': 'PASS_AWAITING_INDEPENDENT_BUSINESS_REVIEW',
        'wholeRowsAccepted': [], 'productionEffects': False, 'phases': phases})
    labels = [contract['campaignId']+suffix for suffix in ('', '-preflight', '-full')]
    write(root/'runtime-evidence/receipt-cleanup.json', {'status': 'PASS_SCOPED_CLEANUP',
        'authorisedLabels': labels, 'independentEmptyInventoryReadback': True,
        'privateTemporaryDataRemoved': True, 'errorCount': 0, 'errors': [],
        'finalInventory': [{'type': typ, 'label': label, 'remainingCount': 0}
                           for typ in ('container', 'network') for label in labels]})
    reindex(root)
    return root


class FinalTransportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = representative(Path(self.temp.name)/'campaign')

    def tearDown(self):
        self.temp.cleanup()

    def execute(self):
        return final.finalize(self.root, runner.exporter(self.root))

    def modify(self, name, fn):
        p = self.root/'evidence/full'/name
        value = read(p);fn(value);write(p, value);reindex(self.root)

    def refused(self, expected):
        with self.assertRaisesRegex(Refusal, '^'+expected+'$'):
            self.execute()
        readback = final.verify_final_directory(self.root/'final-export')
        self.assertEqual(readback['label'], 'failure')
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            self.assertTrue({'first-export-failure.json', 'export-index.json'} <= set(archive.getnames()))
            self.assertTrue(all(name in {'first-export-failure.json', 'export-index.json', 'cleanup-projection.json'} or
                name.startswith('prior-cause-projections/') for name in archive.getnames()))
            failure = json.load(archive.extractfile('first-export-failure.json'))
        self.assertEqual(failure['code'], expected)
        self.assertFalse(failure['rawOutputRetained'])
        self.assertFalse(failure['applicationAcceptance'])
        return failure

    def test_complete_representative_native_receipt_sequence_roundtrip(self):
        result = self.execute()
        self.assertEqual(result['label'], 'final')
        self.assertFalse(result['applicationAcceptance'])
        receipt = final.verify_final_directory(self.root/'final-export')
        self.assertEqual(receipt['label'], 'final')
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            names = set(archive.getnames())
            for n in final.REQUIRED_FULL:
                self.assertEqual(archive.extractfile(final.FULL+n).read(), (self.root/final.FULL/n).read_bytes())
            self.assertTrue({final.FULL+n for n in final.REQUIRED_FULL} <= names)

    def test_missing_receipt_even_with_recomputed_stage_index_rejected(self):
        (self.root/'evidence/full/final-whole-app-readback.json').unlink();reindex(self.root)
        self.refused('EXPORT_REQUIRED_RECEIPT_MISSING')

    def test_modified_receipt_without_reindex_rejected(self):
        p = self.root/'evidence/full/runner-result.json';p.write_bytes(p.read_bytes()+b' ')
        self.refused('EXPORT_STAGE_IDENTITY_CHANGED')

    def test_wrong_source_reindexed_rejected(self):
        self.modify('stage-start.json', lambda x: x.update(runContractSHA256='0'*64))
        self.refused('EXPORT_RUN_SOURCE_LINEAGE')

    def test_wrong_instance_reindexed_rejected(self):
        self.modify('final-whole-app-readback.json', lambda x: x['brainLiveBaseline'].update(instanceId='wrong'))
        self.refused('EXPORT_WHOLE_APPLICATION_LINEAGE')

    def test_wrong_generation_reindexed_rejected(self):
        self.modify('native-drain-observation.json', lambda x: x.update(generation='wrong'))
        self.refused('EXPORT_NATIVE_DRAIN_REQUIRED')

    def test_malformed_json_rejected_with_readable_failure(self):
        write(self.root/'evidence/full/runner-result.json', b'{');reindex(self.root)
        self.refused('EXPORT_MALFORMED_JSON')

    def test_duplicate_json_key_rejected(self):
        write(self.root/'evidence/full/isolation.json', b'{"x":1,"x":2}');reindex(self.root)
        self.refused('EXPORT_DUPLICATE_JSON_KEY')

    def test_oversized_payload_rejected(self):
        write(self.root/'evidence/full/browser-container.log', b'x'*(final.MAX_FILE+1));reindex(self.root)
        self.refused('EXPORT_FILE_BOUND')

    def test_sensitive_payload_excluded_from_failure_archive(self):
        secret = b'Bearer '+b'a'*44
        write(self.root/'evidence/full/browser-container.log', secret);reindex(self.root)
        self.refused('EXPORT_SECRET_PATTERN_REFUSED')
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            self.assertTrue(all(secret not in archive.extractfile(p).read() for p in archive.getmembers()))

    def test_unlisted_private_files_not_read_or_exported(self):
        write(self.root/'private/credentials.env', b'Bearer '+b'b'*44)
        self.execute()
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            self.assertTrue(all(not p.name.startswith('private/') for p in archive.getmembers()))

    def test_complete_index_inventory_rejected(self):
        write(self.root/'evidence/full/unreviewed.json', {})
        self.refused('EXPORT_COMPLETE_STAGE_INVENTORY_REQUIRED')

    def test_wrong_store_count_rejected(self):
        self.modify('normal-whole-app-readback.json', lambda x: x['stores'].pop('pillowMemory'))
        self.refused('EXPORT_THIRTEEN_STORE_INVENTORY')

    def test_inactive_store_not_fabricated(self):
        self.execute()
        whole = read(self.root/'evidence/full/final-whole-app-readback.json')
        self.assertFalse(whole['stores']['shadow']['present'])

    def test_wrong_frontend_lineage_rejected(self):
        self.modify('transition-browser-result.json', lambda x: x['phases'][1].update(commit='0'*40))
        self.refused('EXPORT_FRONTEND_SOURCE_LINEAGE')

    def test_failed_comparison_rejected(self):
        self.modify('returned-comparison.json', lambda x: x.update(**{'pass': False}))
        self.refused('EXPORT_ORIGINAL_COMPARISON_REQUIRED')

    def test_failed_cleanup_rejected(self):
        p = self.root/'runtime-evidence/receipt-cleanup.json';j=read(p);j['finalInventory'][0]['remainingCount']=1;write(p,j)
        self.refused('EXPORT_SCOPED_CLEANUP_REQUIRED')

    def test_safe_first_failure_immutable_and_survives_private_cleanup(self):
        first = final.preserve_failure(self.root, Refusal('EXPORT_FILE_BOUND'), 'GATHER')
        second = final.preserve_failure(self.root, RuntimeError('secret text'), 'FINALIZE')
        self.assertEqual(first, second)
        private=self.root/'private';private.mkdir(exist_ok=True);shutil.rmtree(private)
        self.assertEqual((self.root/'runtime-evidence/first-export-failure.json').read_bytes(), first)

    def test_arbitrary_exception_text_never_returned(self):
        raw = final.preserve_failure(self.root, ValueError('password=private-value'), 'GATHER')
        self.assertNotIn(b'private-value', raw)
        self.assertEqual(json.loads(raw)['code'], 'EXPORT_UNCLASSIFIED_REFUSAL')

    def test_full_archive_mutation_independent_readback_refuses(self):
        self.execute();p=self.root/'final-export/evidence-export.tar.gz';p.write_bytes(p.read_bytes()+b'corruption')
        with self.assertRaisesRegex(Refusal, 'EXPORT_ARCHIVE_IDENTITY_CHANGED'):
            final.verify_final_directory(self.root/'final-export')

    def test_exact_output_inventory_rejects_extra_file(self):
        self.execute();write(self.root/'final-export/unexpected.json', {})
        with self.assertRaisesRegex(Refusal, 'EXPORT_EXACT_TWO_FILES_REQUIRED'):
            final.verify_final_directory(self.root/'final-export')

    def test_source_validation_failure_returns_safe_metadata(self):
        def no():
            raise ValueError('provider-token-secret')
        with self.assertRaisesRegex(Refusal, 'EXPORT_SOURCE_ADMISSION_REFUSED'):
            final.finalize(self.root, runner.exporter(self.root), source_check=no)
        self.assertEqual(final.verify_final_directory(self.root/'final-export')['label'], 'failure')

    def test_empty_full_stage_index_is_not_complete_success(self):
        shutil.rmtree(self.root/'evidence/full');(self.root/'evidence/full').mkdir()
        reindex(self.root)
        self.refused('EXPORT_REQUIRED_RECEIPT_MISSING')

    def test_preflight_copied_as_full_cannot_replace_original_lifecycle(self):
        shutil.rmtree(self.root/'evidence/full')
        shutil.copytree(self.root/'evidence/preflight', self.root/'evidence/full')
        self.refused('EXPORT_REQUIRED_RECEIPT_MISSING')

    def test_missing_independent_gate_even_with_index_recomputed_rejected(self):
        (self.root/'evidence/full/final-independent-gate.json').unlink();reindex(self.root)
        self.refused('EXPORT_REQUIRED_RECEIPT_MISSING')

    def test_failed_independent_gate_rejected(self):
        self.modify('final-independent-gate.json', lambda x: x.update(allPassed=False))
        self.refused('EXPORT_INDEPENDENT_GATE_REQUIRED')

    def test_storage_generation_lineage_rejected(self):
        self.modify('native-storage-child-bindings.json', lambda x: x.update(generation='wrong'))
        self.refused('EXPORT_NATIVE_STORAGE_LINEAGE')

    def test_malformed_receipt_schema_rejected(self):
        write(self.root/'evidence/full/runner-result.json', []);reindex(self.root)
        self.refused('EXPORT_RECEIPT_SCHEMA_REFUSED')

    def test_preflight_instance_cannot_be_relabelled_full(self):
        instance = read(self.root/'evidence/preflight/live-brain-ready.json')['instanceId']
        self.modify('live-brain-ready.json', lambda x: x.update(instanceId=instance))
        def change(x):
            x['ready']['instanceId'] = instance
            x['capture']['attestation']['instanceId'] = instance
        self.modify('live-brain-capture.json', change)
        self.refused('EXPORT_SEPARATE_FULL_INSTANCE_REQUIRED')

    def test_indexed_symlink_never_read_or_exported(self):
        target = self.root/'evidence/full/browser-container.log'
        write(self.root/'private/credential.txt', b'Bearer '+b'c'*44)
        target.unlink(missing_ok=True)
        target.symlink_to(self.root/'private/credential.txt')
        reindex(self.root)
        self.refused('EXPORT_INPUT_REGULAR_FILE_REQUIRED')

    def test_malformed_stage_index_first_error_precise(self):
        write(self.root/'evidence/full/artifact-index.json', b'{')
        self.refused('EXPORT_MALFORMED_JSON')

    def test_empty_sanitized_browser_log_preserved(self):
        write(self.root/'evidence/full/browser-container.log', b'');reindex(self.root)
        self.execute()
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            self.assertEqual(archive.extractfile('evidence/full/browser-container.log').read(), b'')

    def test_actual_handoff_failure_survives_cleanup_and_fallback_export(self):
        script = SOURCE/'v65/foundation/controller/scripts/work8/native-transition/evidence_handoff.py'
        spec = importlib.util.spec_from_file_location('handoff_test_subject', script)
        handoff = importlib.util.module_from_spec(spec);spec.loader.exec_module(handoff)
        self.assertEqual(set(handoff.ERROR_CODES), set(final.HANDOFF_CODES))
        private = self.root/'private/evidence';private.mkdir(parents=True)
        name = 'final-whole-app-readback.json'
        write(private/name, b'x'*handoff.MAX_MEMBER)
        (self.root/'evidence/full'/name).unlink()
        result = handoff.transfer(private, self.root/'evidence/full', stage='full',
            redact=lambda x: x, generated=[], save_first=lambda *args: None, sanitize=lambda x: x)
        self.assertEqual(result['status'], 'FAIL_SANITIZED_PRIVATE_EVIDENCE_HANDOFF')
        receipt = self.root/'evidence/full/first-evidence-handoff-failure.json'
        before = receipt.read_bytes();shutil.rmtree(self.root/'private');reindex(self.root)
        with self.assertRaisesRegex(Refusal, 'EXPORT_REQUIRED_RECEIPT_MISSING'):
            self.execute()
        self.assertEqual(final.verify_final_directory(self.root/'final-export')['label'], 'failure')
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            raw = archive.extractfile('evidence/full/first-evidence-handoff-failure.json').read()
            self.assertEqual(raw, before)
            self.assertEqual(json.loads(raw)['code'], 'HANDOFF_MEMBER_SIZE_BOUND')

    def test_unrecognized_typed_uppercase_error_is_suppressed(self):
        raw = final.preserve_failure(self.root, Refusal('EXPORT_SECRET_VALUE_NOT_A_REVIEWED_CODE'), 'GATHER')
        self.assertEqual(json.loads(raw)['code'], 'EXPORT_UNCLASSIFIED_REFUSAL')
        self.assertNotIn(b'SECRET_VALUE', raw)

    def test_malformed_handoff_diagnostic_never_exported(self):
        write(self.root/'evidence/full/first-evidence-handoff-failure.json', {'password': 'confidential'})
        (self.root/'evidence/full/final-whole-app-readback.json').unlink();reindex(self.root)
        self.refused('EXPORT_REQUIRED_RECEIPT_MISSING')

    def test_failed_export_retains_safe_cleanup_inventory_and_prior_cause(self):
        (self.root/'evidence/full/final-whole-app-readback.json').unlink();reindex(self.root)
        self.refused('EXPORT_REQUIRED_RECEIPT_MISSING')
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            cleanup = json.load(archive.extractfile('cleanup-projection.json'))
            self.assertEqual(cleanup['status'], 'PASS_SCOPED_CLEANUP')
            self.assertEqual(len(cleanup['finalInventory']), 6)
            first = json.load(archive.extractfile('prior-cause-projections/evidence-preflight-first-native-failure.json'))
            self.assertEqual(first['code'], 'UNCLASSIFIED_NATIVE_STARTUP_ERROR')
            self.assertFalse(first['applicationAcceptance'])

    def test_malformed_cleanup_details_are_not_exported(self):
        write(self.root/'runtime-evidence/receipt-cleanup.json', {'status': 'confidential-secret-value'})
        self.refused('EXPORT_SCOPED_CLEANUP_REQUIRED')
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            raw = archive.extractfile('cleanup-projection.json').read()
            self.assertNotIn(b'confidential-secret-value', raw)
            self.assertEqual(json.loads(raw)['status'], 'UNAVAILABLE_OR_INVALID')

    def test_compressed_trailing_bytes_refused_even_if_receipt_rehashed(self):
        self.execute();directory=self.root/'final-export';p=directory/'evidence-export.tar.gz'
        p.write_bytes(p.read_bytes()+b'unexpected-tail')
        receipt=read(directory/'evidence-export-receipt.json');receipt.update(bytes=p.stat().st_size,sha256=final.sha(p.read_bytes()))
        write(directory/'evidence-export-receipt.json',receipt)
        with self.assertRaisesRegex(Refusal, 'EXPORT_ARCHIVE_STREAM_REFUSED'):
            final.verify_final_directory(directory)

    def test_internal_tar_trailing_bytes_refused_even_if_receipt_rehashed(self):
        self.execute();directory=self.root/'final-export';p=directory/'evidence-export.tar.gz'
        raw=gzip.decompress(p.read_bytes())+b'unexpected-tail'
        with p.open('wb') as stream:
            with gzip.GzipFile(filename='',mode='wb',fileobj=stream,mtime=0) as zipped:
                zipped.write(raw)
        receipt=read(directory/'evidence-export-receipt.json');receipt.update(bytes=p.stat().st_size,sha256=final.sha(p.read_bytes()))
        write(directory/'evidence-export-receipt.json',receipt)
        with self.assertRaisesRegex(Refusal, 'EXPORT_ARCHIVE_CANONICAL_BYTES_REQUIRED'):
            final.verify_final_directory(directory)


if __name__ == '__main__':
    unittest.main()
