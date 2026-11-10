"""V107 local comparison/failure transport controls, never native acceptance.

Reuse authenticated retained preflight bytes via V104_RETAINED_PREFLIGHT and
V104_RETAINED_ACK. Full lifecycle receipts remain representative test fixtures.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(SOURCE/'v65/adapter'), str(SOURCE/'v65/foundation/runtime'), str(SOURCE/'v65/tests')]
import final_evidence as final
import runner
import test_final_evidence as fixture
from runtime_common import Refusal
fixture.RETAINED = Path(os.environ['V104_RETAINED_PREFLIGHT'])
fixture.ACK2 = Path(os.environ['V104_RETAINED_ACK'])
PROJECTION = 'prior-cause-projections/first-comparison-failure.json'
CANARY = 'PRIVATE_OWNER_RECORD_AND_EXCEPTION_CANARY'


def digest(seed):
    return hashlib.sha256(str(seed).encode()).hexdigest()


def comparison(observed='NORMAL_REPLAY'):
    state = {'sessionVersion': 3, 'authorityVersion': 2, 'recordVersions': [10, 10],
             'sessionStatus': 'PAUSED', 'authorityStatus': 'REVOKED'}
    return {'schema': 'WORK8_V28_CANONICAL_COMPARISON_V1', 'pass': False, 'canonicalEqual': False,
        'persistenceEqual': True, 'canonicalSha256': digest(1), 'observedCanonicalSha256': digest(2),
        'persistenceSha256': digest(3), 'observedPersistenceSha256': digest(3), 'sourceIdentitySha256': digest(4),
        'diagnostics': [{'code': 'VALUE_CHANGED', 'path': '$.session.version',
            'classification': 'CANONICAL_CONTROL_OR_PERSISTED_PROJECTION',
            'expectedSha256': digest(5), 'observedSha256': digest(6)}],
        'totalIssues': 1, 'diagnosticsTruncated': False, 'observations': [],
        'independentReview': 'REQUIRED_BEFORE_ACCEPTANCE',
        'comparisonContext': {'comparatorId': 'WORK8_V28_CANONICAL_COMPARISON_V1',
            'originalPredicate': 'A5-09_CANONICAL_AND_PERSISTED_STATE_PRESERVATION',
            'expectedPhase': 'NORMAL_FROZEN', 'observedPhase': observed, 'expected': state, 'observed': copy.deepcopy(state),
            'completedSequence': list(final.COMPARISON_SEQUENCE), 'replayScope': 'NORMAL_BEFORE_RECOVERY',
            'replayClassification': 'EXACT_DUPLICATE_RESPONSES_IDENTICAL',
            'persistenceReads': {'expected': 'READ_OK', 'observed': 'READ_OK'}}}


class ComparisonFailureReturn(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = fixture.representative(Path(self.temp.name)/'campaign')
        self.full = self.root/'evidence/full'

    def tearDown(self):
        self.temp.cleanup()

    def receipt(self, value, label='normal-replay', node=False):
        value = copy.deepcopy(value)
        value.pop('receiptPayloadSha256', None)
        if node:
            script = "const fs=require('fs'),c=require('crypto');const v=JSON.parse(fs.readFileSync(0,'utf8'));v.receiptPayloadSha256=c.createHash('sha256').update(JSON.stringify(v)).digest('hex');process.stdout.write(JSON.stringify(v,null,2)+'\\n');"
            raw = subprocess.run(['node', '-e', script], input=json.dumps(value, ensure_ascii=True).encode(),
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout
        else:
            value['receiptPayloadSha256'] = final.sha(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode())
            raw = (json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode()
        fixture.write(self.full/(label+'-comparison.json'), raw)
        return raw

    def cause(self, code='NORMAL_REPLAY_CANONICAL_COMPARISON_FAILED'):
        stage = 'CANONICAL_PAUSE_AND_REVOKE' if code.startswith('NORMAL_') else 'NORMAL_RETURN_CANONICAL_EQUALITY'
        row = {'stage': stage, 'firstFailure': True, 'name': 'AssertionError', 'code': code,
            'sourceFrames': ['browser.mjs:20:35', 'browser.mjs:80:2'], 'browserConnected': True,
            'ownerPageClosed': False, 'arbitraryErrorValuesRetained': False}
        native = final.diagnostic_module('native_diagnostics')
        first = native.from_error(AssertionError('BROWSER_FIRST_FAILURE:'+code), 'actual-live-brain-baseline', 'EXAMINATION_ASSERTION')
        fixture.write(self.full/'first-controller-failure.json', {'schema': 'work8-v104-controller-first-failure-v1',
            'phase': 'full', 'firstFailure': True, 'operation': 'OBSERVE_BROWSER_FAILURE',
            'stage': 'actual-live-brain-baseline', 'safeFirstFailure': first, 'browserFailure': row,
            'rawOutputRetained': False, 'applicationAcceptance': False})
        fixture.write(self.full/'first-native-failure.json', first)
        fixture.write(self.full/'browser-stderr-sanitized.json', {'schema': 'work8-browser-sanitized-stderr-v1',
            'stream': 'stderr', 'diagnostics': [row], 'unclassifiedLinesOmitted': 0, 'arbitraryStderrRetained': False})
        fixture.write(self.full/'transition-browser-result.json', {'schema': 'work8-v28-canonical-business-transition-v1',
            'status': 'FAIL', 'wholeRowsAccepted': [], 'productionEffects': False, 'failedStage': stage,
            'failure': {k: v for k, v in row.items() if k not in ('stage', 'firstFailure')}})
        return first

    def context(self, phase='normal', failed=False):
        fixture.write(self.full/(phase+'-independent-gate.json'), {'phase': phase, 'allPassed': not failed, 'attempts': 1,
            'outcomes': {'capture-canonical-persistence.mjs': 'FAIL' if failed else 'PASS',
                'offline-commerce-readback.mjs': 'PASS', 'whole-app-readback.mjs': 'PASS'}})
        fixture.write(self.full/(phase+'-persistence-capture.json'), {'schema': 'work8-v29-private-canonical-capture-v1',
            'phase': phase, 'status': 'FAIL' if failed else 'PASS_PRIVATE_CANONICAL_CAPTURE',
            'readOnlySqlite': True, 'rawRecordsPublished': False, 'readStartedAtMs': 100, 'readCompletedAtMs': 200,
            'canonicalSha256': digest(99), 'privateValue': CANARY,
            'safeFailure': {'operation': 'OPEN_READ_ONLY_COMMERCE_DATABASE', 'errno': 'EACCES',
                'rule': 'PRIVATE_READER_FAILED', 'classification': phase.upper()+'_CANONICAL_PERSISTENCE', 'raw': CANARY}})

    def projection(self):
        fixture.reindex(self.root)
        return json.loads(final.comparison_failure_projection(self.root, runner.exporter(self.root))[PROJECTION])

    def archive(self):
        receipt = final.verify_final_directory(self.root/'final-export')
        raw = (self.root/'final-export/evidence-export.tar.gz').read_bytes()
        self.assertEqual(final.sha(raw), receipt['sha256'])
        with tarfile.open(self.root/'final-export/evidence-export.tar.gz') as archive:
            files = {m.name: archive.extractfile(m).read() for m in archive}
        index = json.loads(files.pop('export-index.json'))
        self.assertEqual(index['files'], [{'path': n, 'bytes': len(b), 'sha256': final.sha(b)} for n,b in sorted(files.items())])
        self.assertEqual(final.archive_size(files, receipt['label']), len(raw))
        self.assertFalse(index['applicationAcceptance'])
        return receipt, files

    def fail_export(self):
        (self.full/'browser-lifecycle.json').unlink(missing_ok=True)
        fixture.reindex(self.root)
        with self.assertRaises(Refusal) as raised:
            final.finalize(self.root, runner.exporter(self.root))
        self.assertTrue(raised.exception.failureExportReady)
        receipt, files = self.archive()
        self.assertEqual(receipt['label'], 'failure')
        self.assertNotIn('evidence/full/browser-lifecycle.json', files)
        return files

    def test_success_transport_unchanged_and_exact_archive_size(self):
        result = final.finalize(self.root, runner.exporter(self.root))
        self.assertEqual(result['label'], 'final')
        receipt, files = self.archive()
        self.assertNotIn(PROJECTION, files)
        self.assertTrue({final.FULL+n for n in final.REQUIRED_FULL} <= files.keys())

    def test_controlled_comparison_fault_cleanup_and_export_preserve_first_cause(self):
        first = self.cause(); raw = self.receipt(comparison()); self.context()
        runner.preserve_first_failure(self.root, 'native', Refusal('NATIVE_CONTROLLER_FIRST_FAILURE'))
        original = (self.root/'runtime-evidence/first-runtime-failure.json').read_bytes()
        with mock.patch.object(runner, 'run', return_value=b''):
            self.assertEqual(runner.cleanup(self.root)['status'], 'PASS_SCOPED_CLEANUP')
        files = self.fail_export(); result = json.loads(files[PROJECTION])
        self.assertEqual(result['originalReceiptSHA256'], final.sha(raw))
        self.assertEqual(result['stageIndexIdentity'], 'MATCH')
        self.assertEqual(result['comparison']['payloadHashStatus'], 'MATCH')
        self.assertEqual(result['comparison']['diagnostics'], comparison()['diagnostics'])
        self.assertEqual(result['comparison']['comparisonContext']['completedSequence'], list(final.COMPARISON_SEQUENCE))
        self.assertEqual(result['crossProducerCausalOrder'], 'NOT_ESTABLISHED')
        self.assertEqual(original, (self.root/'runtime-evidence/first-runtime-failure.json').read_bytes())
        self.assertEqual(json.loads(files['prior-cause-projections/evidence-full-first-native-failure.json'])['nativeDiagnostic'], first)
        self.assertFalse(result['applicationAcceptance'])
        self.assertNotIn(CANARY.encode(), b''.join(files.values()))

    def test_all_six_first_assertions_select_only_matching_receipt(self):
        for code, (label, phase, capture) in final.COMPARISON_FAILURES.items():
            with self.subTest(code=code):
                self.cause(code); self.receipt(comparison(phase), label); self.context(capture)
                result = self.projection()
                self.assertEqual(result['sourcePath'], 'evidence/full/'+label+'-comparison.json')
                self.assertEqual(result['firstBrowserAssertion'], code)
                self.assertEqual(result['comparison']['comparisonContext']['observedPhase'], phase)
                self.assertEqual(result['comparison']['comparisonContext']['replayScope'], 'NORMAL_BEFORE_RECOVERY')
                self.assertEqual([row['phase'] for row in result['priorReadbackContext']], ['normal']*2+([] if capture=='normal' else [capture]*2))

    def test_failed_capture_precedes_comparison_without_inventing_global_first_cause(self):
        self.cause('NORMAL_INDEPENDENT_READBACK_FAILED'); value = comparison()
        value['comparisonContext']['persistenceReads'] = {'expected': 'MISSING', 'observed': 'MISSING'}
        self.receipt(value); self.context(failed=True)
        result = json.loads(self.fail_export()[PROJECTION])
        gate,capture = result['priorReadbackContext']
        self.assertFalse(gate['allPassed']); self.assertTrue(gate['outcomeConsistency'])
        self.assertEqual(capture['safeFailure']['operation'], 'OPEN_READ_ONLY_COMMERCE_DATABASE')
        self.assertEqual(capture['safeFailure']['errno'], 'EACCES')
        self.assertEqual(result['comparison']['comparisonContext']['persistenceReads']['observed'], 'MISSING')
        self.assertEqual(result['priorReadbackOrder'], 'GATE_BEFORE_COMPARISON_SOURCE_SEQUENCE_NOT_GLOBAL_FIRST_CAUSE')

    def test_node_payload_hash_unicode_escaping_and_tamper(self):
        self.cause(); value = comparison(); value['unknown'] = {'12': 'é\u2028\n"\\', '2': CANARY, 'text': '𝄞'}
        raw = self.receipt(value, node=True)
        result = self.projection(); self.assertEqual(result['comparison']['payloadHashStatus'], 'MATCH')
        self.assertNotIn(CANARY, json.dumps(result)); self.assertNotIn('unknown', result['comparison'])
        changed = json.loads(raw); changed['canonicalEqual'] = True
        fixture.write(self.full/'normal-replay-comparison.json', (json.dumps(changed, ensure_ascii=False)+'\n').encode())
        self.assertEqual(self.projection()['comparison']['payloadHashStatus'], 'MISMATCH')

    def test_legacy_missing_context_and_missing_receipt_do_not_synthesize_success(self):
        self.cause(); value = comparison(); value.pop('comparisonContext')
        fixture.write(self.full/'normal-replay-comparison.json', value)
        result = self.projection()
        self.assertEqual(result['comparison']['payloadHashStatus'], 'UNAVAILABLE_LEGACY_OR_INVALID')
        self.assertEqual(result['comparison']['comparisonContext']['status'], 'UNAVAILABLE_OR_INVALID')
        (self.full/'normal-replay-comparison.json').unlink()
        result = json.loads(self.fail_export()[PROJECTION]); self.assertEqual(result['status'], 'UNAVAILABLE_OR_INVALID')
        self.assertNotIn('comparison', result)

    def test_unknown_values_paths_keys_and_nested_private_data_are_redacted(self):
        self.cause(); value = comparison()
        value['diagnostics'][0].update(code=CANARY, path='$.'+CANARY, classification=CANARY,
            expectedValue=CANARY, observedValue=CANARY, private={CANARY: CANARY})
        value['comparisonContext']['expected'].update(sessionStatus=CANARY, authorityStatus=CANARY, sessionVersion=CANARY)
        self.receipt(value); result = self.projection()
        self.assertNotIn(CANARY, json.dumps(result))
        self.assertEqual(result['comparison']['diagnostics'][0]['code'], 'UNCLASSIFIED_COMPARATOR_CODE')
        self.assertIsNone(result['comparison']['diagnostics'][0]['path'])
        self.assertIsNone(result['comparison']['comparisonContext']['expected']['sessionVersion'])

    def test_invalid_or_conflicting_first_producers_cannot_claim_association(self):
        for change in ('schema', 'marker', 'conflict', 'status'):
            with self.subTest(change=change):
                self.cause(); self.receipt(comparison())
                path = self.full/('transition-browser-result.json' if change=='status' else 'browser-stderr-sanitized.json')
                value = fixture.read(path)
                if change=='schema': value['schema']='UNREVIEWED'
                elif change=='marker': value['diagnostics'][0]['firstFailure']=False
                elif change=='conflict': value['diagnostics'][0]['code']='RETURN_REPLAY_MUTATED_CANONICAL_STATE'
                else: value['status']='PASS'
                fixture.write(path,value)
                result = self.projection()
                self.assertEqual(result['associationStatus'], 'CONFLICTING_OR_UNAVAILABLE_FIRST_BROWSER_COMPARISON_CAUSE')
                self.assertNotIn('comparison', result)

    def test_malformed_symlink_oversized_and_missing_module_preserve_primary_archive(self):
        self.cause(); self.receipt(comparison())
        path = self.full/'normal-replay-comparison.json'
        for kind in ('malformed', 'symlink', 'oversized'):
            with self.subTest(kind=kind):
                path.unlink(missing_ok=True)
                if kind=='malformed': path.write_bytes(b'{bad')
                elif kind=='symlink': path.symlink_to(self.root/'run-contract.json')
                else: path.write_bytes(b' '*(final.MAX_FILE+1))
                result = final.comparison_failure_projection(self.root, runner.exporter(self.root))
                self.assertEqual(json.loads(result[PROJECTION])['status'], 'UNAVAILABLE_OR_INVALID')
        path.unlink(); self.receipt(comparison()); self.context(failed=True)
        with mock.patch.object(final, 'diagnostic_module', side_effect=FileNotFoundError(CANARY)):
            files = self.fail_export()
        self.assertIn('first-export-failure.json',files); self.assertNotIn(CANARY.encode(),b''.join(files.values()))

    def test_auxiliary_projection_exception_cannot_replace_first_export_failure(self):
        self.cause(); self.receipt(comparison())
        with mock.patch.object(final, 'comparison_failure_projection', side_effect=OSError(CANARY)):
            files = self.fail_export()
        self.assertEqual(json.loads(files[PROJECTION])['status'],'UNAVAILABLE_OR_INVALID')
        self.assertEqual(json.loads(files['first-export-failure.json'])['code'],'EXPORT_REQUIRED_RECEIPT_MISSING')

    def test_index_identity_mismatch_is_explicit(self):
        self.cause(); self.receipt(comparison()); fixture.reindex(self.root)
        path=self.full/'artifact-index.json'; value=fixture.read(path)
        next(row for row in value['files'] if row['path']=='normal-replay-comparison.json')['sha256']='0'*64
        fixture.write(path,value)
        result=json.loads(final.comparison_failure_projection(self.root,runner.exporter(self.root))[PROJECTION])
        self.assertEqual(result['stageIndexIdentity'],'MISMATCH')

    def test_optional_metadata_cannot_overflow_a_preexisting_nearly_full_archive(self):
        # Transport-only inventory saturates the existing cap. This is not an
        # application receipt or a claim that this producer output occurred.
        hashes = ''.join(digest(('saturation', i)) for i in range(1000))
        low, high = 0, len(hashes)
        def base(length):
            return {'first-export-failure.json': final.encoded({'code': 'EXPORT_REQUIRED_RECEIPT_MISSING'}),
                'prior-cause-projections/existing-producer.json': final.encoded({'sha256Sequence': hashes[:length]})}
        while high-low > 1:
            middle = (low+high)//2
            if final.archive_size(base(middle), 'failure') <= final.MAX_FAILURE:
                low = middle
            else:
                high = middle
        original = base(low)
        for metadata in ({'status': 'UNAVAILABLE_OR_INVALID'}, {'comparison': {'diagnostics': [{'code': 'VALUE_CHANGED'}], 'observations': []}}):
            with self.subTest(metadata=metadata):
                files = {**original, PROJECTION: final.encoded(metadata)}
                self.assertGreater(final.archive_size(files, 'failure'), final.MAX_FAILURE)
                final.fit_comparison_transport(files)
                self.assertEqual(files, original)
                self.assertLessEqual(final.archive_size(files, 'failure'), final.MAX_FAILURE)

    def test_maximum_high_entropy_comparison_and_producer_inventory_fit_existing_bound(self):
        first=self.cause(); value=comparison(); value['totalIssues']=32
        value['diagnostics']=[{'code':'VALUE_CHANGED','classification':'CANONICAL_PERSISTED',
            'path':'$'+''.join('[key-sha256:'+digest(('path',i,j))+']' for j in range(13)),
            'expectedSha256':digest(('expected',i)),'observedSha256':digest(('observed',i))} for i in range(32)]
        value['observations']=[{'phase':'RETURNED_NORMAL','recordIndex':i%16,'displayedStatus':'IN_PROGRESS','verifiedStatus':'IN_PROGRESS',
            **{k:1000000+i for k in ('requestStartedAtMs','financialCutoffAtMs','requestCompletedAtMs','nextPlannedEventAtMs')},
            **{k:digest((k,i)) for k in ('missionSha256','planSha256','committedEventsSha256','sourceReceiptSha256')}} for i in range(32)]
        self.receipt(value); self.context(failed=True)
        fixture.write(self.full/'command-first-exception.json',{'schema':'work8-v61-command-output-metadata-v1','safeFirstFailure':first,
            'exception':{'exceptionClass':'TimeoutExpired','numericErrno':13,'configuredDeadlineMs':2147483647,'elapsedMonotonicMs':2147483647},'exitCode':-255})
        fixture.write(self.root/'controller-supervisor-full.json',{'schema':'work8-v65-controller-supervisor-v1','phase':'full','controllerExitCode':1,
            'firstNativeFailure':first,'firstObservedFailureKind':'NATIVE_DIAGNOSTIC','firstSupervisorCause':None,'nativeFailureObservationSequence':1})
        for filename,schema in [('host-private-handoff-first-failure.json','WORK8_HOST_PRIVATE_HANDOFF_FAILURE_V1'),('private-handoff-first-failure.json','WORK8_PRIVATE_HANDOFF_FAILURE_V1')]:
            fixture.write(self.full/filename,{'schema':schema,'operation':'HOST_OPEN_PRIVATE_PARENT','errno':'EACCES','numericErrno':13})
        # Maximal closed-schema prior producers, with independent digest and
        # frame entropy. This is permitted schema data, not historical causes.
        native = final.diagnostic_module('native_diagnostics')
        docker = final.diagnostic_module('docker_diagnostics')
        def maximal_native(seed):
            identity = {'pid': 2147483647, 'effectiveUid': 2147483647, 'effectiveGid': 2147483647,
                'capabilities': {k: digest((seed, k))[:16] for k in ('CapInh', 'CapPrm', 'CapEff', 'CapBnd', 'CapAmb')},
                'noNewPrivileges': True, 'seccomp': 2147483647}
            return native.sanitize({'schema': native.SCHEMA, 'stage': max(native.CODES, key=len),
                'assertion': 'BROWSER_FIRST_FAILURE', 'operation': 'EXAMINATION_ASSERTION', 'errno': 'EACCES',
                'sourceFrames': [max(native.SAFE_FILES, key=len)+':'+str(900000+i)+':'+str(800000+i) for i in range(8)],
                'identity': identity, 'state': {k: True for k in native.BOOL_KEYS},
                'containerLifecycle': {'role': 'backend', 'status': 'restarting', 'exitCode': -255, 'oomKilled': True},
                'commandException': {'exceptionClass': 'TimeoutExpired', 'numericErrno': 2147483647,
                    'configuredDeadlineMs': 2147483647, 'elapsedMonotonicMs': 2147483647},
                'origin': {'role': 'admitted-child', 'pid': 2147483647, 'parentPid': 2147483647,
                    'startTicks': '9'*30, 'entrypoint': 'index.js', 'entrySha256': digest((seed, 'entry')),
                    'source': digest((seed, 'source'))[:40], 'generationSha256': digest((seed, 'generation')),
                    'observedMonotonicNs': '8'*30, 'messageSha256': digest((seed, 'message'))}})
        for phase in ('preflight', 'full'):
            fixture.write(self.root/'evidence'/phase/'first-native-failure.json', maximal_native(phase))
        first = maximal_native('full')
        for filename, key in [('first-controller-failure.json', 'safeFirstFailure'), ('command-first-exception.json', 'safeFirstFailure')]:
            path = self.full/filename; producer = fixture.read(path); producer[key] = maximal_native(filename); fixture.write(path, producer)
        path = self.root/'controller-supervisor-full.json'; producer = fixture.read(path)
        producer['firstNativeFailure'] = maximal_native('supervisor'); fixture.write(path, producer)
        for filename, source, args in [('first-docker-failure.json', 'DOCKER_CLI_STDERR', ['docker', 'run', '-d']),
                ('first-docker-state-error.json', 'CONTAINER_STATE_ERROR', ['docker', 'inspect'])]:
            fixture.write(self.full/filename, docker.classify('Error response from daemon: mount mkdir /frontend/app/.next/cache: permission denied', source=source, args=args))
        for phase in ('preflight', 'full'):
            fixture.write(self.root/'evidence'/phase/'first-evidence-handoff-failure.json', {
                'schema': 'work8-v101-evidence-handoff-first-failure-v1', 'firstFailure': True, 'stage': phase,
                'operation': 'SANITIZED_PRIVATE_EVIDENCE_HANDOFF', 'code': sorted(final.HANDOFF_CODES)[0],
                'memberName': 'normal-replay-comparison.json', 'observedBytes': 2147483647,
                'maximumMemberBytesExclusive': final.MAX_FILE, 'errno': 4095, 'rawErrorOrRecordsRetained': False,
                'nativeAcceptanceClaimed': False})
        runner.preserve_first_failure(self.root, 'native', Refusal('NATIVE_CONTROLLER_FIRST_FAILURE'))
        fixture.write(self.root/'runtime-evidence/first-runtime-command-failure.json', {'code': 'COMMAND_DEADLINE', 'stage': 'full', 'errno': 4095})
        fixture.reindex(self.root)
        before=final.failure_projections(self.root,runner.exporter(self.root))
        self.assertGreater(final.archive_size(before,'failure'),final.MAX_FAILURE)
        files=self.fail_export(); result=json.loads(files[PROJECTION])
        self.assertLessEqual((self.root/'final-export/evidence-export.tar.gz').stat().st_size,16384)
        self.assertEqual(result['comparison']['totalIssues'],32)
        self.assertGreater(result['transportReduction']['diagnosticRowsOmitted'],0)
        self.assertEqual(result['transportReduction']['observationRowsOmitted'],32)
        self.assertEqual(result['comparison']['diagnostics'][0],value['diagnostics'][0])
        self.assertEqual(json.loads(files['prior-cause-projections/evidence-full-first-native-failure.json'])['nativeDiagnostic'],first)


if __name__ == '__main__':
    unittest.main(verbosity=2)
