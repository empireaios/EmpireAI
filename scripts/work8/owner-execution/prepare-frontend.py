#!/usr/bin/env python3
"""Assemble retained Next standalone files; never installs or compiles application code."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tarfile
import tempfile

SOURCE = "42dfd0aa9d69a74d237f17555e6a1aeb343c59b9"
TREE = "6d7d834b45964dadf3dab24818467ba6b5187e94"
PUBLIC = "3ad543debfd8821c3b3413729903ab177fea4fc8"


def digest(path):
    with open(path, "rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def assemble(archive, source, output, receipt):
    def git(*args):
        return subprocess.check_output(["git", "-C", str(source), *args], text=True).strip()
    if (git("rev-parse", "HEAD"), git("rev-parse", "HEAD^{tree}"),
            git("rev-parse", "HEAD:empireai-web/public")) != (SOURCE, TREE, PUBLIC):
        raise ValueError("Frontend source identity mismatch")
    if git("status", "--porcelain", "--untracked-files=all", "--", "empireai-web/public"):
        raise ValueError("Frontend public files are not the exact clean source")
    if output.exists():
        raise ValueError("Refusing to replace existing assembly")
    with tempfile.TemporaryDirectory(prefix="owner-frontend-") as scratch:
        root = Path(scratch)
        with tarfile.open(archive, "r:gz") as tar:
            members = tar.getmembers()
            seen = set()
            for member in members:
                p = PurePosixPath(member.name)
                if p.is_absolute() or ".." in p.parts or not p.parts or p.parts[0] != ".next":
                    raise ValueError("Archive path outside .next")
                if member.name in seen:
                    raise ValueError("Duplicate archive path")
                seen.add(member.name)
                if not (member.isfile() or member.isdir() or member.issym()):
                    raise ValueError("Unsupported archive member")
                if member.issym():
                    target = PurePosixPath(member.linkname)
                    resolved = os.path.normpath(str(p.parent / target))
                    if target.is_absolute() or resolved == ".." or resolved.startswith("../"):
                        raise ValueError("Escaping symbolic link")
            # Python's data filter rejects links through escaping paths and special files.
            tar.extractall(root, filter="data")
        standalone = root / ".next/standalone"
        static = root / ".next/static"
        public = source / "empireai-web/public"
        for required in [standalone / "server.js", standalone / "package.json",
                         standalone / ".next/BUILD_ID"]:
            if not required.is_file():
                raise ValueError("Missing retained standalone file")
        if not static.is_dir() or not public.is_dir():
            raise ValueError("Missing retained static/public directory")
        shutil.copytree(standalone, output, symlinks=True)
        shutil.copytree(static, output / ".next/static", dirs_exist_ok=True, symlinks=True)
        shutil.copytree(public, output / "public", symlinks=True)
    for path in output.rglob("*"):
        if path.is_symlink() and not path.resolve().is_relative_to(output.resolve()):
            raise ValueError("Assembled symlink escapes standalone root")
    entries = []
    for path in sorted(output.rglob("*")):
        if path.is_file() and not path.is_symlink():
            entries.append({"path": path.relative_to(output).as_posix(), "sha256": digest(path)})
    receipt.write_text(json.dumps({"classification": "NO_BUILD_ASSEMBLY_IDENTITY",
        "sourceCommit": SOURCE, "sourceTree": TREE, "publicTree": PUBLIC,
        "compiledArchiveSha256": digest(archive), "buildId": (output / ".next/BUILD_ID").read_text().strip(),
        "manifestSha256": hashlib.sha256(json.dumps(entries, separators=(",", ":")).encode()).hexdigest(),
        "fileCount": len(entries), "reexaminesAcceptedPackaging": False}, indent=2) + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("receipt", type=Path)
    args = parser.parse_args()
    assemble(args.archive, args.source, args.output, args.receipt)
