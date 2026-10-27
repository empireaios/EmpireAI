#!/usr/bin/env python3
"""New assembly-boundary tests with synthetic archives, not accepted artifact retests."""
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("prepare", Path(__file__).with_name("prepare-frontend.py"))
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class AssemblyBoundary(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        (self.source / "empireai-web/public").mkdir(parents=True)
        (self.source / "empireai-web/public/logo.txt").write_text("synthetic public")
        self.archive = self.root / "compiled.tar.gz"
        self.output = self.root / "assembled"
        self.receipt = self.root / "receipt.json"

    def tearDown(self):
        self.temporary.cleanup()

    def make_archive(self, extra=None):
        with tarfile.open(self.archive, "w:gz") as tar:
            for name, data in [(".next/standalone/server.js", b"// synthetic"),
                               (".next/standalone/package.json", b"{}"),
                               (".next/standalone/.next/BUILD_ID", b"synthetic-build"),
                               (".next/static/example.js", b"// static")]:
                member = tarfile.TarInfo(name)
                member.size = len(data)
                tar.addfile(member, io.BytesIO(data))
            if extra:
                tar.addfile(extra)

    def run_assembly(self, identity=None):
        values = identity or [prepare.SOURCE, prepare.TREE, prepare.PUBLIC, ""]
        with patch.object(prepare.subprocess, "check_output", side_effect=values):
            prepare.assemble(self.archive, self.source, self.output, self.receipt)

    def test_assembles_without_compilation(self):
        self.make_archive()
        self.run_assembly()
        self.assertEqual((self.output / "public/logo.txt").read_text(), "synthetic public")
        self.assertEqual(json.loads(self.receipt.read_text())["fileCount"], 5)

    def test_refuses_wrong_source_identity(self):
        self.make_archive()
        with self.assertRaisesRegex(ValueError, "identity mismatch"):
            self.run_assembly(["wrong", prepare.TREE, prepare.PUBLIC])

    def test_refuses_dirty_public_tree(self):
        self.make_archive()
        with self.assertRaisesRegex(ValueError, "clean source"):
            self.run_assembly([prepare.SOURCE, prepare.TREE, prepare.PUBLIC, " M logo.txt"])

    def test_refuses_path_traversal(self):
        self.make_archive(tarfile.TarInfo(".next/../../escape"))
        with self.assertRaisesRegex(ValueError, "outside"):
            self.run_assembly()

    def test_refuses_symbolic_link_escape(self):
        member = tarfile.TarInfo(".next/standalone/link")
        member.type = tarfile.SYMTYPE
        member.linkname = "../../../escape"
        self.make_archive(member)
        with self.assertRaisesRegex(ValueError, "Escaping"):
            self.run_assembly()

    def test_refuses_special_file(self):
        member = tarfile.TarInfo(".next/standalone/device")
        member.type = tarfile.CHRTYPE
        self.make_archive(member)
        with self.assertRaisesRegex(ValueError, "Unsupported"):
            self.run_assembly()

    def test_refuses_stale_output(self):
        self.make_archive()
        self.output.mkdir()
        with self.assertRaisesRegex(ValueError, "existing assembly"):
            self.run_assembly()


if __name__ == "__main__":
    unittest.main()
