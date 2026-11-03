"""Small shared source-byte identity functions; no environment or content logging."""
import hashlib
import os
import pathlib
import re
import stat


def file_sha256(path):
    path=pathlib.Path(path)
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW)
    with os.fdopen(fd,'rb') as stream:
        before=os.fstat(stream.fileno())
        assert stat.S_ISREG(before.st_mode),'SOURCE_IDENTITY_NONREGULAR_FILE'
        value=hashlib.file_digest(stream,'sha256').hexdigest()
        after=os.fstat(stream.fileno())
        assert (before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns),'SOURCE_IDENTITY_CHANGED_DURING_READ'
        return value


def verify_bound_file(root,entry):
    root=pathlib.Path(root).resolve()
    name=entry['path']
    assert isinstance(name,str) and '\\' not in name,'SOURCE_IDENTITY_RELATIVE_PATH_REQUIRED'
    relative=pathlib.PurePosixPath(name)
    assert not relative.is_absolute() and name==relative.as_posix() and '..' not in relative.parts and '.' not in relative.parts,'SOURCE_IDENTITY_RELATIVE_PATH_REQUIRED'
    path=root/relative
    assert path.resolve().is_relative_to(root),'SOURCE_IDENTITY_ESCAPE_REFUSED'
    current=root
    for part in relative.parts:
        current=current/part
        assert not current.is_symlink(),'SOURCE_IDENTITY_SYMLINK_REFUSED'
    assert type(entry['bytes']) is int and entry['bytes']>=0,'SOURCE_IDENTITY_SIZE_REQUIRED'
    assert re.fullmatch('[a-f0-9]{64}',entry['sha256']) is not None,'SOURCE_IDENTITY_HASH_REQUIRED'
    assert path.stat().st_size==entry['bytes'] and file_sha256(path)==entry['sha256'],'REVIEWED_SOURCE_CHANGED'
    return path
