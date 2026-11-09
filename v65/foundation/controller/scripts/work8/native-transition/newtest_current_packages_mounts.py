"""Exact retained-archive mount controls. No Docker/native PASS is claimed.

Set WORK8_V97_PACKAGE_DIR to the already retained archive directory containing
v65-packages.json and the exact NORMAL/RECOVERY archives. No package is built.
"""
import hashlib
import json
import os
import pathlib
import shutil
import stat
import tarfile
import tempfile
import unittest
from unittest.mock import patch

import current_packages as packages


class MountContractControls(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inputs = pathlib.Path(os.environ['WORK8_V97_PACKAGE_DIR']).resolve()
        cls.pins = json.loads((cls.inputs / 'v65-packages.json').read_text())
        cls.original_backend, cls.original_frontends = packages.BACKEND, packages.FRONTENDS
        packages.BACKEND = cls.pins['backend']
        packages.FRONTENDS = cls.pins['frontends']
        cls.temporary = tempfile.TemporaryDirectory(prefix='v97-mount-contract-')
        cls.root = pathlib.Path(cls.temporary.name).resolve()
        cls.targets = {}
        cls.results = {}
        for role, pin in packages.FRONTENDS.items():
            target = cls.root / role
            cls.results[role] = packages.verify_frontend(cls.inputs / pin['file'], role, target)
            cls.targets[role] = target
        cls.scripts = cls.root / 'scripts'
        cls.scripts.mkdir(mode=0o755)

    @classmethod
    def tearDownClass(cls):
        for p in cls.root.rglob('*'):
            if p.is_dir() and not p.is_symlink():
                p.chmod(0o755)
        cls.temporary.cleanup()
        packages.BACKEND, packages.FRONTENDS = cls.original_backend, cls.original_frontends

    def verify(self, role='normal'):
        return packages.verify_extracted_frontend(
            self.inputs / packages.FRONTENDS[role]['file'], role, self.targets[role])

    def argv(self, role='normal', **overrides):
        values = dict(name='work8-v97-test-frontend', anchor='work8-v97-test-anchor',
                      label='work8-v97-test', script_dir=self.scripts)
        values.update(overrides)
        return packages.frontend_argv(role, self.targets[role], **values)

    def test_exact_normal_and_recovery_archives_unmodified(self):
        for role, pin in packages.FRONTENDS.items():
            path = self.inputs / pin['file']
            self.assertEqual(path.stat().st_size, pin['bytes'])
            with path.open('rb') as f:
                self.assertEqual(hashlib.file_digest(f, 'sha256').hexdigest(), pin['sha256'])
            self.assertFalse(self.results[role]['packageRebuilt'])
            self.assertEqual(self.verify(role)['extractedMembersVerified'], pin['members'] + 1)

    def test_original_archive_has_no_cache_and_new_empty_target_only(self):
        for role, pin in packages.FRONTENDS.items():
            with tarfile.open(self.inputs / pin['file']) as archive:
                names = archive.getnames()
            self.assertFalse(any(n == packages.FRONTEND_CACHE_DIRECTORY or
                                 n.startswith(packages.FRONTEND_CACHE_DIRECTORY + '/') for n in names))
            target = self.targets[role] / packages.FRONTEND_CACHE_DIRECTORY
            self.assertTrue(target.is_dir())
            self.assertEqual(list(target.iterdir()), [])
            self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o555)
            self.assertEqual((target.stat().st_uid, target.stat().st_gid), (os.geteuid(), os.getegid()))

    def test_complete_assembled_argv_security_and_sources_both_roles(self):
        for role, pin in packages.FRONTENDS.items():
            expected = [
                'docker', 'run', '-d', '--name', 'work8-v97-test-frontend',
                '--label', 'work8.native=work8-v97-test',
                '--network', 'container:work8-v97-test-anchor', '--pull', 'never', '--read-only',
                '--user', '65534:65534', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
                '--memory', '1g', '--cpus', '1', '--pids-limit', '128',
                '--env', 'PORT=43117', '--env', 'HOSTNAME=localhost',
                '--env', 'NODE_OPTIONS=--dns-result-order=ipv4first', '--env', 'NODE_ENV=production',
                '--env', 'BRAIN_API_URL=http://native-backend:43100',
                '--env', 'VERCEL_GIT_COMMIT_SHA=' + pin['commit'],
                '--env', 'NEXT_TELEMETRY_DISABLED=1',
                '--mount', 'type=bind,src=' + str(self.scripts) + ',dst=/examination,readonly',
                '--mount', 'type=bind,src=' + str(self.targets[role]) + ',dst=/frontend,readonly',
                '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
                '--tmpfs', '/frontend/app/.next/cache:rw,noexec,nosuid,nodev,size=64m,mode=0700,uid=65534,gid=65534',
                '--entrypoint', '/frontend/runtime/bin/node', '--workdir', '/frontend/app',
                self.pins['backend']['image'], '/frontend/app/server.js']
            self.assertEqual(self.argv(role), expected)

    def test_missing_cache_refused_before_docker_argv(self):
        parent = self.targets['normal'] / 'app/.next'
        cache = parent / 'cache'
        parent.chmod(0o755)
        cache.rmdir()
        parent.chmod(0o555)
        try:
            with self.assertRaisesRegex(ValueError, '^FRONTEND_MOUNT_DIRECTORY_MISSING$'):
                self.argv()
        finally:
            parent.chmod(0o755)
            cache.mkdir(mode=0o555)
            parent.chmod(0o555)

    def test_cache_symlink_refused(self):
        parent = self.targets['normal'] / 'app/.next'
        cache = parent / 'cache'
        parent.chmod(0o755)
        cache.rmdir()
        cache.symlink_to(self.scripts, target_is_directory=True)
        parent.chmod(0o555)
        try:
            with self.assertRaises(ValueError):
                self.argv()
        finally:
            parent.chmod(0o755)
            cache.unlink()
            cache.mkdir(mode=0o555)
            parent.chmod(0o555)

    def test_nonempty_cache_refused(self):
        cache = self.targets['normal'] / packages.FRONTEND_CACHE_DIRECTORY
        cache.chmod(0o755)
        rogue = cache / 'unexpected'
        rogue.write_bytes(b'controlled')
        cache.chmod(0o555)
        try:
            with self.assertRaisesRegex(ValueError, '^FRONTEND_CACHE_MOUNTPOINT_NOT_EMPTY$'):
                self.argv()
        finally:
            cache.chmod(0o755)
            rogue.unlink()
            cache.chmod(0o555)

    def test_writable_directory_refused(self):
        cache = self.targets['normal'] / packages.FRONTEND_CACHE_DIRECTORY
        cache.chmod(0o777)
        try:
            with self.assertRaisesRegex(ValueError, '^FRONTEND_MOUNT_DIRECTORY_MODE$'):
                self.argv()
        finally:
            cache.chmod(0o555)

    def test_changed_owner_model_refused(self):
        # Exercise admission mismatch without pretending to assume UID1001.
        with patch.object(packages.os, 'geteuid', return_value=os.geteuid() + 1):
            with self.assertRaisesRegex(ValueError, '^FRONTEND_MOUNT_DIRECTORY_OWNER$'):
                self.argv()

    def test_extra_empty_directory_refused(self):
        target = self.targets['normal']
        target.chmod(0o755)
        rogue = target / 'unindexed-empty-directory'
        rogue.mkdir(mode=0o555)
        target.chmod(0o555)
        try:
            with self.assertRaisesRegex(ValueError, '^EXTRACTED_DIRECTORY_SET_CHANGED$'):
                self.verify()
        finally:
            target.chmod(0o755)
            rogue.rmdir()
            target.chmod(0o555)

    def test_fifo_refused_without_open(self):
        target = self.targets['normal']
        target.chmod(0o755)
        rogue = target / 'unindexed-fifo'
        os.mkfifo(rogue)
        target.chmod(0o555)
        try:
            with self.assertRaisesRegex(ValueError, '^EXTRACTED_NONREGULAR_ENTRY_REFUSED$'):
                self.verify()
        finally:
            target.chmod(0o755)
            rogue.unlink()
            target.chmod(0o555)

    def test_changed_application_bytes_refused(self):
        path = self.targets['normal'] / 'app/server.js'
        data = path.read_bytes()
        path.chmod(0o644)
        path.write_bytes(bytes([data[0] ^ 1]) + data[1:])
        path.chmod(0o444)
        try:
            with self.assertRaisesRegex(ValueError, '^EXTRACTED_FILE_DIGEST_CHANGED$'):
                self.verify()
        finally:
            path.chmod(0o644)
            path.write_bytes(data)
            path.chmod(0o444)

    def test_setid_application_file_refused(self):
        path = self.targets['normal'] / 'app/server.js'
        path.chmod(0o4444)
        try:
            with self.assertRaisesRegex(ValueError, '^EXTRACTED_FILE_WRITABLE_OR_MODE_CHANGED$'):
                self.verify()
        finally:
            path.chmod(0o444)

    def test_invalid_bind_source_and_resource_name_refused(self):
        with self.assertRaises(ValueError):
            self.argv(script_dir=self.root / 'missing')
        with self.assertRaises(ValueError):
            self.argv(name='arbitrary-unscoped-container')

    def test_repeat_extraction_refused(self):
        pin = packages.FRONTENDS['normal']
        with self.assertRaisesRegex(ValueError, '^FRESH_ABSOLUTE_DESTINATION_REQUIRED$'):
            packages.verify_frontend(self.inputs / pin['file'], 'normal', self.targets['normal'])

    def test_final_layout_still_exact_and_hosted_only(self):
        for role in packages.FRONTENDS:
            self.verify(role)
            receipt = packages.verify_frontend_mount_layout(self.targets[role])
            self.assertEqual(receipt['status'], 'PRE_DISPATCH_PASS')
            self.assertEqual(receipt['actualDockerStartup'], 'HOSTED_ONLY')
            self.assertFalse(receipt['nativeAcceptanceClaimed'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
