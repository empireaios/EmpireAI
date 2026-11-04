"""Retained parser/metadata rejection controls; synthetic operands only."""
import json
import os
import stat
import pathlib
import tempfile
import unittest
import sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'adapter'))
from collect_runtime_image_provenance import compare_metadata, image_group, read_stable_metadata, bind_current_identity, write_receipt, Refusal


def fixture(version='20261025.353.1'):
    release = version.rsplit('.', 1)[0]
    return json.dumps([
        {'group': 'Runner Image Provisioner', 'detail': 'Hosted Compute Agent\nVersion: 20261021.618'},
        {'group': 'Operating System', 'detail': 'Ubuntu\n24.04.5\nLTS'},
        {'group': 'Runner Image', 'detail': f'Image: ubuntu-24.04\nVersion: {version}\nIncluded Software: https://github.com/actions/runner-images/blob/ubuntu24/{release}/images/ubuntu/Ubuntu2404-Readme.md\nImage Release: https://github.com/actions/runner-images/releases/tag/ubuntu24%2F{release}'},
        {'group': '_internal_telemetry', 'detail': 'NOT_EXPORTED'},
    ]).encode()


class RuntimeControls(unittest.TestCase):
    def bindings(self):
        env = {'GITHUB_ACTIONS': 'true', 'GITHUB_REPOSITORY': 'empireaios/EmpireAI', 'GITHUB_REPOSITORY_ID': '1275922460', 'GITHUB_RUN_ATTEMPT': '1', 'GITHUB_RUN_ID': '123', 'GITHUB_SHA': 'a' * 40, 'GITHUB_JOB': 'a5', 'ImageVersion': '20261025.353.1'}
        identity = {'provider': 'github-actions', 'repository': 'empireaios/EmpireAI', 'repositoryId': '1275922460', 'runAttempt': 1, 'runId': '123', 'jobId': 456, 'workflowCommit': 'a' * 40, 'jobKey': 'a5', 'runnerImageVersion': '20261025.353.1', 'sessionId': 'github-actions:123:1:456','runnerId':789,'runnerName':'synthetic-fixture','serviceRunSHA256':'a'*64,'serviceJobSHA256':'a'*64}
        return identity, env

    def test_private_durable_receipt_mode_and_bytes(self):
        with tempfile.TemporaryDirectory() as d:
            output=pathlib.Path(d)/'receipt.json'; old=os.umask(0o022)
            try:write_receipt(output,{'status':'FIXTURE_ONLY'})
            finally:os.umask(old)
            self.assertEqual(stat.S_IMODE(output.stat().st_mode),0o600)
            self.assertEqual(json.loads(output.read_text()),{'status':'FIXTURE_ONLY'})

    def test_receipt_overwrite_refused(self):
        with tempfile.TemporaryDirectory() as d:
            output=pathlib.Path(d)/'receipt.json';write_receipt(output,{})
            with self.assertRaises(FileExistsError):write_receipt(output,{})

    def test_receipt_symlink_refused(self):
        with tempfile.TemporaryDirectory() as d:
            output=pathlib.Path(d)/'receipt.json';target=pathlib.Path(d)/'target';target.write_text('preserved');output.symlink_to(target)
            with self.assertRaises(FileExistsError):write_receipt(output,{})
            self.assertEqual(target.read_text(),'preserved')

    def test_current_run_binding(self):
        identity, env = self.bindings()
        self.assertEqual(bind_current_identity(identity, env)['jobId'], 456)

    def test_old_run_receipt_is_refused(self):
        identity, env = self.bindings(); identity['runId'] = '99'
        with self.assertRaisesRegex(Refusal, 'IDENTITY_CURRENT_RUN_BINDING'):
            bind_current_identity(identity, env)

    def test_image_env_change_after_identity_is_refused(self):
        identity, env = self.bindings(); env['ImageVersion'] = '20261026.354.1'
        with self.assertRaisesRegex(Refusal, 'IDENTITY_ENV_IMAGE_VERSION_CHANGED'):
            bind_current_identity(identity, env)

    def test_fixture_equal_metadata_only(self):
        observations, equal = compare_metadata(fixture(), fixture(), 'ubuntu24', '20261025.353.1')
        self.assertTrue(equal)
        self.assertEqual(set(observations['setupInfo']), {'Image', 'Version', 'Included Software', 'Image Release'})
        self.assertNotIn('NOT_EXPORTED', json.dumps(observations))

    def test_original_shape_of_discrepancy_preserved(self):
        observations, equal = compare_metadata(fixture(), fixture(), 'ubuntu24', '20261026.354.1')
        self.assertFalse(equal)
        self.assertEqual(observations['setupInfo']['Version'], '20261025.353.1')
        self.assertEqual(observations['ImageVersion'], '20261026.354.1')

    def test_two_files_mismatch(self):
        _, equal = compare_metadata(fixture(), fixture('20261026.354.1'), 'ubuntu24', '20261025.353.1')
        self.assertFalse(equal)

    def test_case_insensitive_schema_is_supported(self):
        data = json.loads(fixture())
        data = [{k.title(): v for k, v in x.items()} for x in data]
        self.assertEqual(image_group(json.dumps(data).encode())['Version'], '20261025.353.1')

    def test_ambiguous_case_key_refused(self):
        data = json.loads(fixture())
        data[2]['Group'] = 'Runner Image'
        with self.assertRaisesRegex(Refusal, 'AMBIGUOUS_METADATA_PROPERTY'):
            image_group(json.dumps(data).encode())

    def test_duplicate_group_refused(self):
        data = json.loads(fixture()); data.append(data[2])
        with self.assertRaisesRegex(Refusal, 'ONE_RUNNER_IMAGE_GROUP_REQUIRED'):
            image_group(json.dumps(data).encode())

    def test_duplicate_json_key_refused(self):
        with self.assertRaisesRegex(Refusal, 'DUPLICATE_JSON_KEY'):
            image_group(b'[{"group":"Runner Image","group":"Runner Image"}]')

    def test_symlink_refused(self):
        with tempfile.TemporaryDirectory() as d:
            target = pathlib.Path(d) / 'real'; target.write_bytes(fixture())
            link = pathlib.Path(d) / 'link'; link.symlink_to(target)
            with self.assertRaises(OSError):
                read_stable_metadata(link)

    def test_group_writable_refused(self):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d) / 'metadata'; p.write_bytes(fixture()); p.chmod(0o666)
            with self.assertRaisesRegex(Refusal, 'METADATA_OWNER_MODE_REFUSED'):
                read_stable_metadata(p)

    def test_file_receipt_contains_hash_not_raw_metadata(self):
        with tempfile.TemporaryDirectory() as d:
            p = pathlib.Path(d) / 'metadata'; p.write_bytes(fixture()); p.chmod(0o600)
            raw, metadata = read_stable_metadata(p)
            self.assertEqual(raw, fixture()); self.assertFalse(metadata['rawContentsExported'])
            self.assertNotIn('NOT_EXPORTED', json.dumps(metadata))

    def test_environment_version_injection_refused(self):
        with self.assertRaisesRegex(Refusal, 'ENV_IMAGE_VERSION_FORMAT'):
            compare_metadata(fixture(), fixture(), 'ubuntu24', '20261025.353.1\nvalue')

    def test_oversize_input_refused(self):
        with self.assertRaisesRegex(Refusal, 'METADATA_SIZE_BOUND'):
            image_group(b' ' * 262145)


if __name__ == '__main__':
    unittest.main(verbosity=2)
