"""Complete local final-export CLI composition; no native or hosted execution."""
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
SOURCE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SOURCE/'acceptance'))
sys.path.insert(0, str(SOURCE/'v65/tests'))
import native_acceptance as entry
from test_final_evidence import representative, reindex, write
import final_evidence


class FinalReturnComposition(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.root = representative(self.base/'campaign')
        self.output = self.base/'github-output'
        self.output.touch()
        write(self.root/'acceptance-source-admission.json', entry.validate_source())

    def tearDown(self):
        self.temp.cleanup()

    def cli(self):
        out = io.StringIO()
        identity = entry.read_json(self.root/'runner-identity.json')
        with mock.patch.object(entry, 'validate_root', return_value=self.root), \
             mock.patch.dict(os.environ, GITHUB_OUTPUT=str(self.output), RUNNER_TEMP=str(self.base),
                             GITHUB_RUN_ID=str(identity['runId']), GITHUB_RUN_ATTEMPT='1',
                             GITHUB_SHA=identity['workflowCommit']), \
             mock.patch.object(entry, 'git_value', return_value=identity['workflowCommit']), \
             mock.patch.object(sys, 'argv', ['native_acceptance.py', 'final-export', '--root', str(self.root)]), \
             mock.patch.object(entry.runner, 'run', side_effect=AssertionError('native execution forbidden')), \
             contextlib.redirect_stdout(out):
            code = entry.main()
        return code, json.loads(out.getvalue())

    def test_complete_positive_cli_archive_budget_output_and_readback(self):
        code, console = self.cli()
        self.assertEqual(code, 0)
        self.assertEqual(console['status'], 'PASS_OPERATION')
        self.assertEqual(self.output.read_text(), 'export_ready=true\n')
        self.assertEqual(final_evidence.verify_final_directory(self.root/'final-export')['label'], 'final')
        bound = entry.read_json(self.root/'upload-bounds/final.json')
        self.assertLessEqual(bound['logicalBytes'], 8*1024**2)
        self.assertEqual(len(bound['files']), 2)
        self.assertEqual(console['wholeRowsAccepted'], [])

    def test_missing_receipt_cli_stays_failed_but_failure_artifact_ready(self):
        (self.root/'evidence/full/final-whole-app-readback.json').unlink()
        reindex(self.root)
        code, console = self.cli()
        self.assertEqual(code, 23)
        self.assertEqual(console['code'], 'EXPORT_REQUIRED_RECEIPT_MISSING')
        self.assertEqual(self.output.read_text(), 'export_ready=true\n')
        self.assertEqual(final_evidence.verify_final_directory(self.root/'final-export')['label'], 'failure')
        self.assertEqual(entry.read_json(self.root/'runtime-evidence/first-export-failure.json')['code'], console['code'])
        self.assertEqual(entry.read_json(self.root/'runtime-evidence/first-runtime-failure.json')['code'], console['code'])

    def test_actual_source_admission_mismatch_returns_safe_failure(self):
        write(self.root/'acceptance-source-admission.json', {'sourceManifestSHA256': '0'*64})
        code, console = self.cli()
        self.assertEqual(code, 23)
        self.assertEqual(console['code'], 'EXPORT_SOURCE_ADMISSION_REFUSED')
        self.assertEqual(self.output.read_text(), 'export_ready=true\n')
        self.assertEqual(final_evidence.verify_final_directory(self.root/'final-export')['label'], 'failure')

    def test_existing_first_runtime_failure_immutable(self):
        target = self.root/'runtime-evidence/first-runtime-failure.json'
        entry.runner.preserve_first_failure(self.root, 'native', entry.guard.Refusal('FIRST_NATIVE_CAUSE'))
        before = target.read_bytes()
        (self.root/'evidence/full/final-whole-app-readback.json').unlink();reindex(self.root)
        self.assertEqual(self.cli()[0], 23)
        self.assertEqual(target.read_bytes(), before)

    def test_coherent_historical_receipts_rejected_against_current_provider_run(self):
        identity = entry.read_json(self.root/'runner-identity.json')
        with mock.patch.dict(os.environ, GITHUB_RUN_ID='999999999', GITHUB_RUN_ATTEMPT='1',
                             GITHUB_SHA=identity['workflowCommit']), \
             mock.patch.object(entry, 'git_value', return_value=identity['workflowCommit']):
            with self.assertRaisesRegex(entry.guard.Refusal, 'FINAL_CURRENT_EXECUTOR_SOURCE_MISMATCH'):
                entry.final_source_check(self.root)

    def test_cleanup_does_not_need_private_state_for_final_export(self):
        self.assertFalse((self.root/'private').exists())
        self.assertEqual(self.cli()[0], 0)

    def test_corrupted_archive_cannot_publish_ready(self):
        final_evidence.finalize(self.root, entry.runner.exporter(self.root))
        archive = self.root/'final-export/evidence-export.tar.gz'
        archive.write_bytes(archive.read_bytes()+b'modified')
        with mock.patch.dict(os.environ, GITHUB_OUTPUT=str(self.output), RUNNER_TEMP=str(self.base)):
            with self.assertRaises(entry.runner.RuntimeRefusal):
                entry.final_upload_ready(self.root, fallback=True)
        self.assertEqual(self.output.read_bytes(), b'')
        self.assertFalse((self.root/'upload-bounds/final.json').exists())

    def test_output_symlink_is_refused_without_writing_target(self):
        target = self.base/'never-written';target.touch()
        self.output.unlink();self.output.symlink_to(target)
        code, console = self.cli()
        self.assertEqual(code, 23)
        self.assertEqual(console['code'], 'FINAL_OUTPUT_PATH_REFUSED')
        self.assertEqual(target.read_bytes(), b'')

    def test_workflow_returns_bounded_failure_without_success_mask(self):
        text = (SOURCE/entry.WORKFLOW).read_text()
        self.assertIn("if: ${{ always() && steps.final_export.outputs.export_ready == 'true' }}", text)
        self.assertNotIn('continue-on-error', text)
        self.assertEqual(text.count('uses: actions/upload-artifact@'), 3)
        self.assertNotIn('|| true', text)
        self.assertIn('timeout-minutes: 300', text)
        self.assertIn('retention-days: 7', text)


if __name__ == '__main__':
    unittest.main(verbosity=2)
