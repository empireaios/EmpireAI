#!/usr/bin/env python3
"""Verify/import the existing V55 distributions. Never build or publish packages.

All paths are local to the authorised isolated executor. This module supplies
argv to the reviewed controller; it does not start an application itself.
"""
import hashlib
import json
import os
import pathlib
import re
import tarfile

BACKEND = {
    "commit": "6c1e63ba20619ee480742fd87dc810ca93152e22",
    "tree": "a78aa0e0a91c1e765afb23e70fe05c75cddc836e",
    "file": "backend-6c1e63b-derived-image.tar.gz",
    "bytes": 201715406,
    "sha256": "8aa72fac4c3a99a1b1013f0d30349298616a00dc526d881a6bf0f7f1abe20863",
    "image": "sha256:65382b8f19482851212fe7a21746ca7ad7bf5af5708fec8f083165ac42e61573",
    "manifest": "sha256:53dd052ecaaf822e8495af91418cb656eea3fa6f713563c54c9a37dbc510ba08",
}
FRONTENDS = {
    "normal": {
        "commit": "750483b3152f2c9c65a65b6381c8c94f081b9eb1",
        "tree": "f589a8f0f94fbcdf113f162abac11d03c19acc25",
        "file": "EmpireAI_V55_NORMAL_750483b3152f_node22_linux_x64.tar.gz",
        "bytes": 65287594,
        "sha256": "61b6418b72436c065decb2defcba1df683b449e87cd97c53fce32cfe55a3c9bb",
        "membersSHA256": "109d494dae99ad9f4d136c4f51a474e1246f0119b26e7877851c3d6402b5a808",
        "members": 4988,
        "buildId": "8xgGke5XlX7SFVby1dU_R",
    },
    "recovery": {
        "commit": "94d34cab7b0739849839ea3c66e50c8fdd3a2b27",
        "tree": "5da61811a035b9504d74f699df8b164cc7f9f0ac",
        "file": "EmpireAI_V55_RECOVERY_94d34cab7b07_node22_linux_x64.tar.gz",
        "bytes": 65305287,
        "sha256": "c2baf7edaa135c7722e424bbe13e2cb47c7b0b46ef06b6fcc42fe8718a9cd000",
        "membersSHA256": "9567000bacdf9eebc0c56050ef3e01c886eb8bcc903fac108267bdf1ab263ae6",
        "members": 4996,
        "buildId": "Gq38YbCivo8W4ILm0TcZx",
    },
}


def require(condition, code):
    if not condition:
        raise ValueError(code)


def digest(stream):
    return hashlib.file_digest(stream, "sha256").hexdigest()


def archive_identity(path, pin):
    path = pathlib.Path(path)
    require(path.is_file() and not path.is_symlink(), "REGULAR_ARCHIVE_REQUIRED")
    require(path.stat().st_size == pin["bytes"], "ARCHIVE_SIZE_MISMATCH")
    with path.open("rb") as stream:
        require(digest(stream) == pin["sha256"], "ARCHIVE_DIGEST_MISMATCH")


def member_name(name):
    parts = pathlib.PurePosixPath(name).parts
    require(bool(parts) and not name.startswith("/") and ".." not in parts and "\\" not in name,
            "UNSAFE_MEMBER_NAME")
    require(str(pathlib.PurePosixPath(name)) == name, "NONCANONICAL_MEMBER_NAME")
    return name


def verify_frontend(path, role, destination=None):
    """Validate every package member, optionally extracting into a fresh directory.

    The package only contains regular files. Links/devices/duplicate paths and
    set-id files are refused. Original bytes and executable bits are preserved.
    No existing destination is overwritten, including a prior failed extraction.
    """
    require(role in FRONTENDS, "UNKNOWN_FRONTEND_ROLE")
    pin = FRONTENDS[role]
    archive_identity(path, pin)
    with tarfile.open(path, "r:gz") as archive:
        members = archive.getmembers()
        names = [member_name(m.name) for m in members]
        require(len(names) == len(set(names)), "DUPLICATE_MEMBER")
        require(all(m.isfile() and not m.mode & 0o6000 for m in members), "NONREGULAR_OR_SETID_MEMBER")
        index_bytes = archive.extractfile("MEMBERS.json").read()
        require(hashlib.sha256(index_bytes).hexdigest() == pin["membersSHA256"], "MEMBER_INDEX_MISMATCH")
        index = json.loads(index_bytes)
        require(index["schema"] == "EMPIREAI_RELEASE_MEMBERS_V1" and index["selfExcluded"] == "MEMBERS.json", "INDEX_SCHEMA")
        entries = index["members"]
        expected = {member_name(x["path"]): x for x in entries}
        require(len(entries) == len(expected) == pin["members"], "INDEX_COUNT")
        require(set(names) == set(expected) | {"MEMBERS.json"}, "MEMBER_SET_MISMATCH")
        for m in members:
            if m.name == "MEMBERS.json":
                continue
            e = expected[m.name]
            require(m.size == e["bytes"], "MEMBER_SIZE_MISMATCH")
            require(digest(archive.extractfile(m)) == e["sha256"], "MEMBER_DIGEST_MISMATCH")
        release = json.load(archive.extractfile("release.json"))
        require(release["schema"] == "EMPIREAI_V55_FRONTEND_STANDALONE_RELEASE_V1", "RELEASE_SCHEMA")
        require(release["component"] == role.upper() and release["nodeVersion"] == "22.23.2", "RELEASE_ROLE_RUNTIME")
        require(release["source"]["commit"] == pin["commit"] and release["source"]["tree"] == pin["tree"], "SOURCE_BINDING")
        require(release["source"]["backendBinding"] == BACKEND["commit"] and release["backendImageRequired"] == BACKEND["image"], "BACKEND_BINDING")
        require(release["nextBuildId"] == pin["buildId"] and archive.extractfile("app/.next/BUILD_ID").read().decode().strip() == pin["buildId"], "BUILD_ID")
        require(release["ownerDataIncluded"] is False and release["ownerCredentialsIncluded"] is False, "OWNER_DATA_REFUSED")
        if destination is not None:
            target = pathlib.Path(destination)
            require(target.is_absolute() and not target.exists(), "FRESH_ABSOLUTE_DESTINATION_REQUIRED")
            target.mkdir(mode=0o755)
            for m in members:
                dest = target / m.name
                dest.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                with dest.open("xb") as out:
                    stream = archive.extractfile(m)
                    while chunk := stream.read(1024 * 1024):
                        out.write(chunk)
                dest.chmod(0o555 if m.mode & 0o111 else 0o444)
            # All parent directories remain non-writable to runtime UID 65534.
            for directory in sorted(target.rglob("*"), reverse=True):
                if directory.is_dir():
                    directory.chmod(0o555)
            target.chmod(0o555)
    return {"role": role, "archiveSHA256": pin["sha256"], "source": pin["commit"],
            "tree": pin["tree"], "membersVerified": pin["members"], "packageRebuilt": False,
            "extracted": destination is not None, "node": "22.23.2", "applicationStarted": False,
            "artifactKind": "standalone-archive", "buildId": pin["buildId"]}


def verify_backend(path):
    """Verify unchanged Docker/OCI archive and all content addressed layers."""
    archive_identity(path, BACKEND)
    hashes, small = {}, {}
    with tarfile.open(path, "r|gz") as archive:
        for m in archive:
            member_name(m.name)
            require(m.isfile() and m.name not in hashes, "BACKEND_MEMBER_REFUSED")
            stream = archive.extractfile(m)
            if m.size < 131072:
                data = stream.read()
                hashes[m.name] = hashlib.sha256(data).hexdigest()
                small[m.name] = data
            else:
                hashes[m.name] = digest(stream)
            if m.name.startswith("blobs/sha256/"):
                require(hashes[m.name] == m.name.rsplit("/", 1)[1], "OCI_BLOB_MISMATCH")
    manifest = json.loads(small["manifest.json"])
    require(len(manifest) == 1, "SINGLE_BACKEND_IMAGE_REQUIRED")
    image = manifest[0]
    config = json.loads(small[image["Config"]])
    require("sha256:" + hashes[image["Config"]] == BACKEND["image"], "BACKEND_IMAGE_MISMATCH")
    require(config["os"] == "linux" and config["architecture"] == "amd64", "BACKEND_PLATFORM")
    labels = config["config"]["Labels"]
    require(labels["org.opencontainers.image.revision"] == BACKEND["commit"] and labels["io.empireai.source-tree"] == BACKEND["tree"], "BACKEND_SOURCE_BINDING")
    require(config["config"]["User"] == "0:0" and config["config"]["Entrypoint"] == ["node", "/app/deployment/locked-runtime.cjs"], "BACKEND_OPERATOR_ENTRYPOINT")
    require("NODE_VERSION=22.23.2" in config["config"]["Env"], "BACKEND_NODE")
    require(["sha256:" + hashes[n] for n in image["Layers"]] == config["rootfs"]["diff_ids"], "BACKEND_LAYER_CHAIN")
    manifest_path = "blobs/sha256/" + BACKEND["manifest"].split(":")[1]
    require(manifest_path in hashes, "OCI_MANIFEST_REQUIRED")
    return {"image": BACKEND["image"], "source": BACKEND["commit"], "tree": BACKEND["tree"],
            "archiveSHA256": BACKEND["sha256"], "layersVerified": len(image["Layers"]),
            "platform": "linux/amd64", "packageRebuilt": False, "applicationStarted": False}


def frontend_argv(role, package_dir, *, name, anchor, label, script_dir):
    """Use exact backend filesystem as a pinned carrier; override only entrypoint.

    /app is unused. V55's unchanged bundled Node + server are read-only binds.
    The Docker carrier is NOT an assertion that a frontend is an OCI image.
    The controller must have verified backend image load and internal anchor.
    """
    require(role in FRONTENDS, "UNKNOWN_FRONTEND_ROLE")
    for value in (name, anchor, label):
        require(re.fullmatch(r"work8-[a-z0-9-]{1,100}", value) is not None, "INVALID_ISOLATED_RESOURCE_NAME")
    package_dir, script_dir = pathlib.Path(package_dir), pathlib.Path(script_dir)
    for path in (package_dir, script_dir):
        require(path.is_absolute() and path.resolve() == path and "," not in str(path), "BIND_PATH_REQUIRED")
    return ["docker", "run", "-d", "--name", name, "--label", "work8.native=" + label,
            "--network", "container:" + anchor, "--pull", "never", "--read-only",
            "--user", "65534:65534", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--memory", "1g", "--cpus", "1", "--pids-limit", "128",
            "--env", "PORT=43117", "--env", "HOSTNAME=localhost",
            "--env", "NODE_OPTIONS=--dns-result-order=ipv4first",
            "--env", "NODE_ENV=production", "--env", "BRAIN_API_URL=http://native-backend:43100",
            "--env", "VERCEL_GIT_COMMIT_SHA=" + FRONTENDS[role]["commit"],
            "--env", "NEXT_TELEMETRY_DISABLED=1",
            "--mount", "type=bind,src=" + str(script_dir) + ",dst=/examination,readonly",
            "--mount", "type=bind,src=" + str(package_dir) + ",dst=/frontend,readonly",
            "--tmpfs", "/tmp:rw,noexec,nosuid,size=32m",
            "--tmpfs", "/frontend/app/.next/cache:rw,noexec,nosuid,size=64m",
            "--entrypoint", "/frontend/runtime/bin/node", "--workdir", "/frontend/app",
            BACKEND["image"], "/frontend/app/server.js"]


def load_backend(path, run):
    """Import verified bytes through the controller's diagnostic/timeout wrapper."""
    receipt = verify_backend(path)
    run(["docker", "load", "--input", str(path)], timeout=180)
    actual = json.loads(run(["docker", "image", "inspect", BACKEND["image"]]))[0]
    require(actual["Id"] == BACKEND["image"] and actual["Architecture"] == "amd64" and actual["Os"] == "linux", "LOADED_IMAGE_IDENTITY")
    require(actual["Config"]["Labels"]["org.opencontainers.image.revision"] == BACKEND["commit"], "LOADED_SOURCE_IDENTITY")
    receipt["loaded"] = True
    return receipt


def verify_extracted_frontend(archive_path, role, destination):
    """Bind reused read-only extraction to the exact existing archive index."""
    require(role in FRONTENDS, 'UNKNOWN_FRONTEND_ROLE')
    archive_identity(archive_path, FRONTENDS[role])
    target = pathlib.Path(destination)
    require(target.is_absolute() and target.resolve() == target and target.is_dir()
            and not target.is_symlink(), 'CANONICAL_EXTRACTED_DIRECTORY_REQUIRED')
    paths = list(target.rglob('*'))
    require(not any(p.is_symlink() for p in paths), 'EXTRACTED_SYMLINK_REFUSED')
    with tarfile.open(archive_path, 'r:gz') as archive:
        members = archive.getmembers()
        expected = {member_name(m.name): m for m in members}
        require(len(members) == len(expected), 'DUPLICATE_MEMBER')
        actual = {str(p.relative_to(target)) for p in paths if p.is_file()}
        require(actual == set(expected), 'EXTRACTED_FILE_SET_CHANGED')
        for name, member in expected.items():
            p = target / name
            st = p.lstat()
            require(p.is_file() and st.st_nlink == 1 and st.st_size == member.size,
                    'EXTRACTED_FILE_METADATA_CHANGED')
            require(st.st_mode & 0o777 == (0o555 if member.mode & 0o111 else 0o444),
                    'EXTRACTED_FILE_WRITABLE_OR_MODE_CHANGED')
            with p.open('rb') as stream:
                require(digest(stream) == digest(archive.extractfile(member)), 'EXTRACTED_FILE_DIGEST_CHANGED')
    require(all(p.stat().st_mode & 0o777 == 0o555 for p in [target,*paths] if p.is_dir()),
            'EXTRACTED_DIRECTORY_WRITABLE')
    return {'role':role,'archiveSHA256':FRONTENDS[role]['sha256'],
            'extractedMembersVerified':len(expected),'applicationStarted':False}
