"""Local bounded Assurance preservation/activity diagnostics; never native acceptance."""
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

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(SOURCE/'v65/adapter'), str(SOURCE/'v65/foundation/runtime'), str(SOURCE/'v65/tests')]
import final_evidence as final
import runner
import test_final_evidence as fixture
from runtime_common import Refusal
fixture.RETAINED = Path(os.environ['V104_RETAINED_PREFLIGHT'])
fixture.ACK2 = Path(os.environ['V104_RETAINED_ACK'])
NATIVE = final.diagnostic_module('native_diagnostics')
CANARY = 'PRIVATE_INCIDENT_AND_ATTEMPT_CANARY'
PROJECTION = 'prior-cause-projections/evidence-full-first-native-failure.json'


def digest(value):
    return hashlib.sha256(str(value).encode()).hexdigest()


def context():
    return {'schema': NATIVE.ASSURANCE_SCHEMA, 'domain': 'assurance', 'store': 'cp_records',
        'invariant': 'NEW_RECOVERY_ATTEMPT', 'incidentKeySha256': digest('row-key'),
        'expectedType': 'NUMBER', 'expectedClass': 'UNCHANGED_BASELINE',
        'priorType': 'NULL', 'observedType': 'NULL', 'priorClass': 'NULL', 'observedClass': 'NULL',
        'priorBodySha256': digest('prior-body'), 'observedBodySha256': digest('current-body'),
        'priorIdentitySha256': digest('identity'), 'observedIdentitySha256': digest('identity'),
        'identityEqual': True, 'changeAttribution': 'EXISTING_INCIDENT_DIAGNOSTIC_FIELDS_ONLY',
        'readbackPhase': 'returned',
        'checkerSha256': final.sha((final.DIAGNOSTIC_ROOT/'whole-app-readback.mjs').read_bytes()),
        'rawIncidentRetained': False, 'applicationAcceptance': False}


def node_diagnostic(value):
    script = """
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const m=await import(pathToFileURL(process.argv[1]));
const c=JSON.parse(fs.readFileSync(0,'utf8'));
const e=new Error(['CONTROL_PLANE_RECORD_DELETED','INVALID_RECOVERY_ATTEMPT_COUNTER'].includes(c.invariant)?c.invariant:'NEW_RECOVERY_ATTEMPT');e.code='ERR_ASSERTION';
e.actual={private:process.argv[2]};e.expected=process.argv[2];e.assuranceContext=c;
e.stack='Error: NEW_RECOVERY_ATTEMPT\\n at checkCp (assurance-records.mjs:50:3)';
const a=m.safeNativeFailure(e,'WHOLE_APPLICATION_READBACK','COMPARE_DECLARED_CANONICAL_STATE',{},'INDEPENDENT_DATABASE_READER');
process.stdout.write(JSON.stringify({initial:a,roundtrip:m.sanitizeNativeRecord(a)}));
"""
    run = subprocess.run(['node', '--input-type=module', '-e', script,
        str(final.DIAGNOSTIC_ROOT/'native-diagnostic.mjs'), CANARY],
        input=json.dumps(value).encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return json.loads(run.stdout)


def node_produced_diagnostic(scenario='counter_change'):
    script = """
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const base=pathToFileURL(process.argv[1]+'/');
const {cpRecord,checkCp,recoveryActivity,checkRecoveryActivity}=await import(new URL('assurance-records.mjs',base));
const {safeNativeFailure,sanitizeNativeRecord}=await import(new URL('native-diagnostic.mjs',base));
const sha=x=>createHash('sha256').update(x).digest('hex');
const scenario=process.argv[3];
const context={incidentKeySha256:sha('synthetic-key'),readbackPhase:'returned',checkerSha256:sha(fs.readFileSync(new URL('whole-app-readback.mjs',base)))};
let invoke;
if(scenario.startsWith('activity_')){
 const type=scenario==='activity_admitted'?'RECOVERY_ADMITTED':'RECOVERY_RESULT';
 const original=[{seq:1,workspace:'synthetic',type,at:1,body:JSON.stringify({private:process.argv[2]})}];
 const current=[...original,{...original[0],seq:2,at:2}];
 invoke=()=>checkRecoveryActivity(recoveryActivity(original),recoveryActivity(current),context);
}else{
 const row={workspace:'synthetic',kind:'incident',id:'synthetic',body:JSON.stringify({attempts:scenario==='malformed'?null:1,firstAt:1,lastAt:2,recurrence:1,status:'UNRESOLVED',private:process.argv[2]})};
 const prior=cpRecord(row),current=cpRecord({...row,body:JSON.stringify({...JSON.parse(row.body),attempts:scenario==='malformed'?null:2,lastAt:3,recurrence:2})});
 invoke=()=>checkCp(prior,current,context);
}
try{invoke();throw Error('CONTROL_DID_NOT_FAIL');}
catch(error){if(!['NEW_RECOVERY_ATTEMPT','INVALID_RECOVERY_ATTEMPT_COUNTER','NEW_RECOVERY_ACTIVITY'].includes(error.message.split('\\n')[0]))throw error;const result=sanitizeNativeRecord(safeNativeFailure(error,'WHOLE_APPLICATION_READBACK','COMPARE_DECLARED_CANONICAL_STATE',{},'INDEPENDENT_DATABASE_READER'));process.stdout.write(JSON.stringify(result));}

"""
    run = subprocess.run(['node', '--input-type=module', '-e', script, str(final.DIAGNOSTIC_ROOT), CANARY, scenario],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return json.loads(run.stdout)


def node_activity_diagnostic(value):
    script = """
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const m=await import(pathToFileURL(process.argv[1]));
const e=new Error('NEW_RECOVERY_ACTIVITY');e.code='ERR_ASSERTION';
e.actual={private:process.argv[2]};e.assuranceActivityContext=JSON.parse(fs.readFileSync(0,'utf8'));
const initial=m.safeNativeFailure(e,'WHOLE_APPLICATION_READBACK','COMPARE_DECLARED_CANONICAL_STATE',{},'INDEPENDENT_DATABASE_READER');
process.stdout.write(JSON.stringify({initial,roundtrip:m.sanitizeNativeRecord(initial)}));
"""
    run = subprocess.run(['node', '--input-type=module', '-e', script,
        str(final.DIAGNOSTIC_ROOT/'native-diagnostic.mjs'), CANARY],
        input=json.dumps(value).encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return json.loads(run.stdout)


class AssuranceDiagnosticReturn(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = fixture.representative(Path(self.temp.name)/'campaign')
        self.full = self.root/'evidence/full'

    def tearDown(self):
        self.temp.cleanup()

    def source_bound_fixture(self, value=None, diagnostic=None):
        """Explicit synthetic source/run join, not a recovered hosted receipt."""
        value = context() if value is None else value
        names = ('whole-app-readback.mjs', 'assurance-records.mjs')
        manifest = {'schema': 'V111_LOCAL_SOURCE_BINDING_FIXTURE', 'files': [
            {'path': name, 'bytes': (final.DIAGNOSTIC_ROOT/name).stat().st_size,
             'sha256': final.sha((final.DIAGNOSTIC_ROOT/name).read_bytes())} for name in names]}
        path = self.root/'controller/scripts/work8/native-transition/controller-manifest.json'
        fixture.write(path, manifest)
        contract = fixture.read(self.root/'run-contract.json')
        contract['controllerManifestSHA256'] = final.sha(path.read_bytes())
        fixture.write(self.root/'run-contract.json', contract)
        start = fixture.read(self.full/'stage-start.json')
        start.update(controllerManifestSHA256=contract['controllerManifestSHA256'],
                     runContractSHA256=final.sha((self.root/'run-contract.json').read_bytes()))
        fixture.write(self.full/'stage-start.json', start)
        raw = diagnostic if diagnostic is not None else node_diagnostic(value)['roundtrip']
        fixture.write(self.full/'first-native-failure.json', raw)
        fixture.reindex(self.root)
        return raw

    def projection(self):
        return json.loads(final.native_failure_projections(self.root, runner.exporter(self.root))[PROJECTION])

    def archive(self):
        receipt = final.verify_final_directory(self.root/'final-export')
        path = self.root/'final-export/evidence-export.tar.gz'
        self.assertEqual(final.sha(path.read_bytes()), receipt['sha256'])
        with tarfile.open(path) as archive:
            files = {}
            for member in archive:
                self.assertTrue(member.isfile())
                self.assertFalse(member.name.startswith('/') or '..' in Path(member.name).parts)
                self.assertNotIn(member.name, files)
                files[member.name] = archive.extractfile(member).read()
        index = json.loads(files.pop('export-index.json'))
        self.assertEqual(index['files'], [{'path': name, 'bytes': len(raw), 'sha256': final.sha(raw)}
                                         for name, raw in sorted(files.items())])
        self.assertLessEqual(path.stat().st_size, final.MAX_FAILURE if receipt['label'] == 'failure' else final.MAX_ARCHIVE)
        self.assertFalse(index['applicationAcceptance'])
        return receipt, files

    def test_exact_js_python_roundtrip_and_private_values_omitted(self):
        value = context(); value['private'] = {'attempts': CANARY}
        result = node_diagnostic(value)
        self.assertEqual(result['initial'], result['roundtrip'])
        self.assertEqual(result['initial']['sourceFrames'], ['assurance-records.mjs:50:3'])
        expected = context()
        self.assertEqual(result['initial']['assuranceContext'], expected)
        self.assertEqual(NATIVE.sanitize(result['roundtrip'])['assuranceContext'], expected)
        self.assertNotIn(CANARY, json.dumps(result))

    def test_all_closed_type_and_value_classifications_survive(self):
        value = context()
        for typ in NATIVE.ASSURANCE_TYPES:
            for classified in NATIVE.ASSURANCE_CLASSES:
                value.update(priorType=typ, observedType=typ, priorClass=classified, observedClass=classified)
                observed = NATIVE.assurance_context(value, 'NEW_RECOVERY_ATTEMPT')
                if classified in NATIVE.ASSURANCE_PAIRS[typ]:
                    self.assertEqual(observed, value)
                else:
                    self.assertEqual(observed['status'], 'UNAVAILABLE_OR_INVALID')

    def test_expected_contract_and_type_class_pairs_are_pinned_in_both_languages(self):
        for change in ({'expectedType': 'ARRAY', 'expectedClass': 'EMPTY_COLLECTION'},
                       {'expectedClass': 'POSITIVE_INTEGER'},
                       {'observedType': 'STRING', 'observedClass': 'NUMERIC_ZERO'},
                       {'priorType': 'NUMBER', 'priorClass': 'EMPTY_COLLECTION'}):
            value = {**context(), **change}
            self.assertEqual(NATIVE.assurance_context(value, 'NEW_RECOVERY_ATTEMPT')['status'], 'UNAVAILABLE_OR_INVALID')
            self.assertEqual(node_diagnostic(value)['roundtrip']['assuranceContext']['status'], 'UNAVAILABLE_OR_INVALID')

    def test_new_and_existing_expected_classes_are_bound_to_baseline_presence(self):
        value = context()
        value.update(changeAttribution='NEW_INCIDENT', priorBodySha256=None, priorIdentitySha256=None,
                     identityEqual=None, priorType='MISSING', priorClass='MISSING', expectedClass='NUMERIC_ZERO')
        self.assertEqual(NATIVE.assurance_context(value, value['invariant']), value)
        self.assertEqual(node_diagnostic(value)['roundtrip']['assuranceContext'], value)
        for change in ({'expectedClass': 'UNCHANGED_BASELINE'}, {'priorBodySha256': digest('forged')},
                       {'identityEqual': True}, {'priorType': 'NULL', 'priorClass': 'NULL'}):
            bad = {**value, **change}
            self.assertEqual(NATIVE.assurance_context(bad, bad['invariant'])['status'], 'UNAVAILABLE_OR_INVALID')
            self.assertEqual(node_diagnostic(bad)['roundtrip']['assuranceContext']['status'], 'UNAVAILABLE_OR_INVALID')
        legacy = {**context(), 'expectedClass': 'NUMERIC_ZERO'}
        self.assertEqual(NATIVE.assurance_context(legacy, legacy['invariant']), legacy)
        self.assertEqual(node_diagnostic(legacy)['roundtrip']['assuranceContext'], legacy)

    def test_unknown_and_malformed_context_is_fixed_metadata(self):
        changes = [('observedType', CANARY), ('observedClass', CANARY), ('changeAttribution', []),
            ('checkerSha256', CANARY), ('invariant', 'ACTUAL_RUNTIME_EXITED'), ('identityEqual', 1),
            ('rawIncidentRetained', True), ('readbackPhase', CANARY)]
        for key, bad in changes:
            with self.subTest(key=key):
                value = context(); value[key] = bad
                expected = {'schema': NATIVE.ASSURANCE_SCHEMA, 'status': 'UNAVAILABLE_OR_INVALID'}
                self.assertEqual(NATIVE.assurance_context(value, 'NEW_RECOVERY_ATTEMPT'), expected)
                result = node_diagnostic(value)['roundtrip']
                self.assertEqual(result['assertion'], 'NEW_RECOVERY_ATTEMPT')
                self.assertEqual(result['assuranceContext'], expected)
                self.assertNotIn(CANARY, json.dumps(result))

    def test_missing_nullable_keys_do_not_raise_or_invent_operands(self):
        for key in ('priorBodySha256', 'priorIdentitySha256', 'identityEqual'):
            value = context(); del value[key]
            self.assertEqual(NATIVE.assurance_context(value, 'NEW_RECOVERY_ATTEMPT')['status'], 'UNAVAILABLE_OR_INVALID')

    def test_deleted_incident_nullable_observed_digests_require_matching_invariant(self):
        value = context()
        value.update(invariant='CONTROL_PLANE_RECORD_DELETED', observedType='MISSING', observedClass='MISSING',
                     observedBodySha256=None, observedIdentitySha256=None, identityEqual=None,
                     changeAttribution='UNESTABLISHED')
        self.assertEqual(NATIVE.assurance_context(value, value['invariant']), value)
        self.assertEqual(node_diagnostic(value)['roundtrip']['assuranceContext'], value)
        value['invariant'] = 'NEW_RECOVERY_ATTEMPT'
        self.assertEqual(NATIVE.assurance_context(value, value['invariant'])['status'], 'UNAVAILABLE_OR_INVALID')

    def test_first_failure_survives_parse_save_and_later_error(self):
        original = node_diagnostic(context())['roundtrip']
        parsed = NATIVE.parse_stream(NATIVE.PREFIX+json.dumps(original)+'\n')
        NATIVE.save_first(self.full, parsed)
        before = (self.full/'first-native-failure.json').read_bytes()
        later = copy.deepcopy(original); later['assertion'] = 'ACTUAL_RUNTIME_EXITED'
        NATIVE.save_first(self.full, later)
        self.assertEqual((self.full/'first-native-failure.json').read_bytes(), before)
        self.assertEqual(json.loads(before)['assuranceContext'], context())

    def test_legacy_absent_context_is_not_fabricated(self):
        value = NATIVE.from_error(AssertionError('NEW_RECOVERY_ATTEMPT'), 'WHOLE_APPLICATION_READBACK', 'COMPARE_DECLARED_CANONICAL_STATE')
        self.assertNotIn('assuranceContext', value)
        fixture.write(self.full/'first-native-failure.json', value); fixture.reindex(self.root)
        self.assertNotIn('assuranceSourceBinding', self.projection())

    def test_indexed_source_bound_context_projection(self):
        original = self.source_bound_fixture()
        result = self.projection()
        self.assertEqual(result['nativeDiagnostic']['assuranceContext'], original['assuranceContext'])
        self.assertEqual(result['assuranceSourceBinding']['status'], 'MATCH')
        self.assertEqual(result['assuranceSourceBinding']['workflowCommit'],
                         fixture.read(self.root/'run-contract.json')['executor']['workflowCommit'])
        self.assertEqual(result['crossProducerCausalOrder'], 'NOT_ESTABLISHED')

    def test_tampered_stage_index_marks_mismatch_without_replacing_cause(self):
        self.source_bound_fixture()
        index = fixture.read(self.full/'artifact-index.json')
        next(row for row in index['files'] if row['path'] == 'first-native-failure.json')['sha256'] = '0'*64
        fixture.write(self.full/'artifact-index.json', index)
        result = self.projection()
        self.assertEqual(result['code'], 'NEW_RECOVERY_ATTEMPT')
        self.assertEqual(result['assuranceSourceBinding']['stageIndexIdentity'], 'MISMATCH')
        self.assertEqual(result['assuranceSourceBinding']['status'], 'MISMATCH')

    def test_tampered_checker_digest_marks_mismatch(self):
        value = context(); value['checkerSha256'] = '0'*64
        self.source_bound_fixture(value)
        result = self.projection()
        self.assertEqual(result['assuranceSourceBinding']['checkerSourceIdentity'], 'MISMATCH')
        self.assertEqual(result['code'], 'NEW_RECOVERY_ATTEMPT')

    def test_tampered_helper_manifest_marks_mismatch(self):
        self.source_bound_fixture()
        path = self.root/'controller/scripts/work8/native-transition/controller-manifest.json'
        manifest = fixture.read(path); manifest['files'][1]['sha256'] = '0'*64; fixture.write(path, manifest)
        result = self.projection()
        self.assertEqual(result['assuranceSourceBinding']['controllerManifestIdentity'], 'MISMATCH')
        self.assertEqual(result['code'], 'NEW_RECOVERY_ATTEMPT')

    def test_missing_source_binding_never_synthesizes_match(self):
        self.source_bound_fixture()
        (self.root/'controller/scripts/work8/native-transition/controller-manifest.json').unlink()
        result = self.projection()
        self.assertEqual(result['assuranceSourceBinding']['status'], 'UNAVAILABLE_OR_INVALID')
        self.assertEqual(result['code'], 'NEW_RECOVERY_ATTEMPT')

    def test_composed_failure_export_preserves_context_and_independent_integrity(self):
        # Invoke the exact extracted production projection/checker, not a
        # hand-constructed context, then traverse both language sanitizers.
        produced = node_produced_diagnostic()
        self.assertEqual(produced['assertion'], 'NEW_RECOVERY_ATTEMPT')
        self.assertEqual(produced['assuranceContext']['observedType'], 'NUMBER')
        self.assertEqual(produced['assuranceContext']['expectedClass'], 'UNCHANGED_BASELINE')
        self.assertFalse(produced['assuranceContext']['identityEqual'])
        original = self.source_bound_fixture(diagnostic=NATIVE.sanitize(produced))
        (self.full/'browser-lifecycle.json').unlink(); fixture.reindex(self.root)
        with self.assertRaises(Refusal) as raised:
            final.finalize(self.root, runner.exporter(self.root))
        self.assertTrue(raised.exception.failureExportReady)
        receipt, files = self.archive()
        self.assertEqual(receipt['label'], 'failure')
        projection = json.loads(files[PROJECTION])
        self.assertEqual(projection['nativeDiagnostic']['assuranceContext'], original['assuranceContext'])
        self.assertEqual(projection['assuranceSourceBinding']['status'], 'MATCH')
        self.assertNotIn(CANARY.encode(), b''.join(files.values()))
        self.assertEqual(projection['fatalCauseAssociation'], 'NOT_ESTABLISHED_BY_DIAGNOSTIC_ALONE')

    def test_actual_invalid_counter_retains_baseline_semantics(self):
        produced = node_produced_diagnostic('malformed')
        self.assertEqual(produced['assertion'], 'INVALID_RECOVERY_ATTEMPT_COUNTER')
        self.assertEqual(produced['assuranceContext']['observedType'], 'NULL')
        self.assertEqual(produced['assuranceContext']['expectedClass'], 'UNCHANGED_BASELINE')
        self.assertEqual(NATIVE.sanitize(produced), produced)
        self.assertNotIn(CANARY, json.dumps(produced))

    def test_activity_actual_checker_roundtrip_and_bound_source(self):
        for scenario, event in (('activity_admitted', 'RECOVERY_ADMITTED'), ('activity_result', 'RECOVERY_RESULT')):
            with self.subTest(event=event):
                produced = node_produced_diagnostic(scenario)
                self.assertEqual(produced['assertion'], 'NEW_RECOVERY_ACTIVITY')
                value = copy.deepcopy(produced['assuranceActivityContext'])
                self.assertEqual(value['eventType'], event)
                self.assertEqual((value['priorCount'], value['observedCount']), (1, 2))
                self.assertEqual(NATIVE.sanitize(produced), produced)
                value['private'] = CANARY
                js = node_activity_diagnostic(value)
                self.assertEqual(js['initial'], js['roundtrip'])
                self.assertNotIn(CANARY, json.dumps(js))
                self.source_bound_fixture(diagnostic=produced)
                projection = self.projection()
                self.assertEqual(projection['nativeDiagnostic'], produced)
                self.assertEqual(projection['assuranceActivitySourceBinding']['status'], 'MATCH')
                self.assertEqual(projection['assuranceActivitySourceBinding']['contextKind'], 'RECOVERY_ACTIVITY')

    def test_activity_closed_schema_rejects_malformed_and_wrong_event_values(self):
        value = node_produced_diagnostic('activity_admitted')['assuranceActivityContext']
        changes = [('schema', CANARY), ('domain', CANARY), ('store', 'cp_records'),
                   ('invariant', 'NEW_RECOVERY_ATTEMPT'), ('eventType', 'INCIDENT_OBSERVED'),
                   ('priorCount', -1), ('observedCount', 50001), ('priorCount', True),
                   ('observedCount', 1.5), ('priorSha256', CANARY), ('observedSha256', None),
                   ('checkerSha256', []), ('readbackPhase', CANARY), ('rawEventsRetained', True),
                   ('applicationAcceptance', True)]
        expected = {'schema': NATIVE.ASSURANCE_ACTIVITY_SCHEMA, 'status': 'UNAVAILABLE_OR_INVALID'}
        for key, invalid in changes:
            with self.subTest(key=key, invalid=invalid):
                bad = {**value, key: invalid}
                self.assertEqual(NATIVE.assurance_activity_context(bad, 'NEW_RECOVERY_ACTIVITY'), expected)
                self.assertEqual(node_activity_diagnostic(bad)['roundtrip']['assuranceActivityContext'], expected)
        for key in value:
            bad = dict(value); del bad[key]
            self.assertEqual(NATIVE.assurance_activity_context(bad, 'NEW_RECOVERY_ACTIVITY'), expected)
        for count in (0, 50000):
            valid = {**value, 'priorCount': count, 'observedCount': count}
            self.assertEqual(NATIVE.assurance_activity_context(valid, 'NEW_RECOVERY_ACTIVITY'), valid)
            self.assertEqual(node_activity_diagnostic(valid)['roundtrip']['assuranceActivityContext'], valid)

    def test_activity_failure_survives_first_error_and_complete_archive_export(self):
        produced = node_produced_diagnostic('activity_result')
        parsed = NATIVE.parse_stream(NATIVE.PREFIX+json.dumps(produced)+'\n')
        self.source_bound_fixture(diagnostic=parsed)
        original = (self.full/'first-native-failure.json').read_bytes()
        later = NATIVE.from_error(RuntimeError('ACTUAL_RUNTIME_EXITED'), 'WHOLE_APPLICATION_READBACK', 'COMPARE_DECLARED_CANONICAL_STATE')
        NATIVE.save_first(self.full, later)
        self.assertEqual((self.full/'first-native-failure.json').read_bytes(), original)
        (self.full/'browser-lifecycle.json').unlink(); fixture.reindex(self.root)
        with self.assertRaises(Refusal) as raised:
            final.finalize(self.root, runner.exporter(self.root))
        self.assertTrue(raised.exception.failureExportReady)
        receipt, files = self.archive()
        self.assertEqual(receipt['label'], 'failure')
        projection = json.loads(files[PROJECTION])
        self.assertEqual(projection['code'], 'NEW_RECOVERY_ACTIVITY')
        self.assertEqual(projection['nativeDiagnostic'], produced)
        self.assertEqual(projection['assuranceActivitySourceBinding']['status'], 'MATCH')
        self.assertNotIn(CANARY.encode(), b''.join(files.values()))

    def test_activity_binding_mismatch_preserves_first_failure(self):
        produced = node_produced_diagnostic('activity_admitted')
        produced['assuranceActivityContext']['checkerSha256'] = '0'*64
        self.source_bound_fixture(diagnostic=produced)
        projection = self.projection()
        self.assertEqual(projection['code'], 'NEW_RECOVERY_ACTIVITY')
        self.assertEqual(projection['assuranceActivitySourceBinding']['checkerSourceIdentity'], 'MISMATCH')
        self.assertEqual(projection['assuranceActivitySourceBinding']['status'], 'MISMATCH')

    def test_legacy_v110_existing_numeric_zero_class_roundtrips(self):
        legacy = {**context(), 'expectedClass': 'NUMERIC_ZERO'}
        produced = node_diagnostic(legacy)['roundtrip']
        self.assertEqual(NATIVE.sanitize(produced)['assuranceContext'], legacy)
        self.source_bound_fixture(diagnostic=produced)
        self.assertEqual(self.projection()['nativeDiagnostic']['assuranceContext'], legacy)

    def test_both_optional_contexts_are_preserved_and_bound_separately(self):
        produced = node_produced_diagnostic('activity_admitted')
        produced['assuranceContext'] = {**context(), 'invariant': 'NEW_RECOVERY_ACTIVITY'}
        sanitized = NATIVE.sanitize(produced)
        self.source_bound_fixture(diagnostic=sanitized)
        projection = self.projection()
        self.assertEqual(projection['nativeDiagnostic'], sanitized)
        self.assertEqual(projection['assuranceSourceBinding']['status'], 'MATCH')
        self.assertEqual(projection['assuranceActivitySourceBinding']['status'], 'MATCH')

    def test_successful_transport_remains_complete(self):
        result = final.finalize(self.root, runner.exporter(self.root))
        self.assertEqual(result['label'], 'final')
        receipt, files = self.archive()
        self.assertTrue({final.FULL+name for name in final.REQUIRED_FULL} <= files.keys())
        self.assertNotIn(PROJECTION, files)


if __name__ == '__main__':
    unittest.main()
