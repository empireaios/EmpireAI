#!/usr/bin/env python3
"""Synthetic shell-control regressions. No Docker or privileged host command runs."""
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest

SOURCE = Path(__file__).with_name("run-hosted.sh").read_text()
HELPER = SOURCE.split("# BEGIN PRIVATE CLEANUP CONTRACT\n", 1)[1].split("# END PRIVATE CLEANUP CONTRACT", 1)[0]
TRAP = "cleanup() {" + SOURCE.split("cleanup() {", 1)[1].split("trap cleanup EXIT", 1)[0]
RUN_CHECKS = "run_checks() {" + SOURCE.split("run_checks() {", 1)[1].split("\nrun_checks initial", 1)[0]


class CleanupRegression(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.private = self.root / "work8-owner.synthetic"
        (self.private / "data/commissioning").mkdir(parents=True)
        (self.private / "data/commissioning/example.db").write_text("synthetic data")
        self.out = self.root / "evidence"
        self.out.mkdir()
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.log = self.root / "sudo-arguments.json"
        self.env = dict(os.environ, PATH=str(self.bin) + ":" + os.environ["PATH"],
                        CLEANUP_ARG_LOG=str(self.log))
        self.write_tool("id", "#!/bin/sh\necho 1001\n")
        self.write_tool("docker", "#!/bin/sh\nexit 0\n")

    def tearDown(self):
        self.temp.cleanup()

    def write_tool(self, name, text):
        path = self.bin / name
        path.write_text(text)
        path.chmod(0o755)

    def sudo(self, succeeds):
        # The mock deliberately runs no sudo. It records the exact constrained
        # removal argv, then invokes ordinary rm on this test-owned directory.
        self.write_tool("sudo", "#!/usr/bin/env python3\nimport json,os,subprocess,sys\n"
            "json.dump(sys.argv[1:],open(os.environ['CLEANUP_ARG_LOG'],'w'))\n"
            + ("assert sys.argv[1:3]==['-n','--']\nsys.exit(subprocess.call(sys.argv[3:]))\n"
               if succeeds else "sys.exit(1)\n"))

    def run_trap(self, examination_status):
        values = {"private": self.private, "private_parent": self.root, "out": self.out,
                  "backend": "synthetic-backend", "web": "synthetic-frontend",
                  "redis": "synthetic-redis", "browser": "synthetic-browser",
                  "network": "synthetic-network", "label": "synthetic"}
        script = "set +e\n" + "\n".join(k + "=" + shlex.quote(str(v)) for k, v in values.items())
        script += "\n" + HELPER + "\n" + TRAP + "\n(exit " + str(examination_status) + ")\ncleanup\n"
        return subprocess.run(["bash", "-c", script], env=self.env, capture_output=True, text=True)

    def test_nonroot_branch_removes_only_private_data_and_preserves_receipt(self):
        self.sudo(True)
        result = self.run_trap(0)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(self.log.read_text()),
            ["-n", "--", "rm", "-rf", "--one-file-system", "--", str(self.private / "data")])
        self.assertFalse(self.private.exists())
        receipt = json.loads((self.out / "runner-result.json").read_text())
        self.assertTrue(receipt["cleanup"]["privateDataRemoved"])
        self.assertEqual(receipt["examinationExitCode"], 0)

    def test_cleanup_failure_preserves_result_and_fails_successful_exam(self):
        self.sudo(False)
        result = self.run_trap(0)
        self.assertEqual(result.returncode, 1)
        receipt = json.loads((self.out / "runner-result.json").read_text())
        self.assertFalse(receipt["cleanup"]["privateDataRemoved"])
        self.assertEqual(receipt["examinationExitCode"], 0)
        self.assertTrue((self.private / "data/commissioning/example.db").exists())

    def test_cleanup_failure_does_not_hide_original_examination_failure(self):
        self.sudo(False)
        result = self.run_trap(42)
        self.assertEqual(result.returncode, 42)
        receipt = json.loads((self.out / "runner-result.json").read_text())
        self.assertEqual(receipt["exitCode"], 42)
        self.assertEqual(receipt["examinationExitCode"], 42)

    def test_path_outside_private_prefix_is_refused(self):
        self.sudo(True)
        path = self.root / "unrelated"
        path.mkdir()
        command = HELPER + "\ncleanup_private_directory " + shlex.quote(str(path)) + " " + shlex.quote(str(self.root))
        result = subprocess.run(["bash", "-c", command], env=self.env)
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(path.exists())
        self.assertFalse(self.log.exists())

    def test_browser_uses_host_uid_gid_for_readable_evidence(self):
        self.write_tool("docker", "#!/usr/bin/env python3\nimport json,os,sys\njson.dump(sys.argv[1:],open(os.environ['CLEANUP_ARG_LOG'],'w'))\n")
        values = {"browser": "synthetic-browser", "label": "synthetic", "web": "synthetic-web",
                  "private": self.private, "script": self.root, "tooling": self.root,
                  "out": self.out, "browser_image": "immutable-synthetic-image"}
        command = "\n".join(k + "=" + shlex.quote(str(v)) for k, v in values.items())
        result = subprocess.run(["bash", "-c", command + "\n" + RUN_CHECKS + "\nrun_checks initial"], env=self.env)
        self.assertEqual(result.returncode, 0)
        args = json.loads(self.log.read_text())
        self.assertEqual(args[args.index("--user") + 1], "1001:1001")
        self.assertIn("HOME=/tmp", args)
        self.assertEqual(args[args.index("--network") + 1], "container:synthetic-web")
        self.assertEqual(args[-3:], ["immutable-synthetic-image", "checks.mjs", "initial"])


if __name__ == "__main__":
    unittest.main()
