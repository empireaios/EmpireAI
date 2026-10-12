#!/usr/bin/env python3
"""Examination-only Unix sockets; kernel denies all other socket families and io_uring."""
import ctypes, ctypes.util, errno, os, socket, sys
if len(sys.argv) < 2:
    raise SystemExit('usage: isolated-unix-exec.py executable [args...]')
libname = ctypes.util.find_library('seccomp')
if not libname:
    raise SystemExit('ISOLATION_UNAVAILABLE_LIBSECCOMP')
lib = ctypes.CDLL(libname, use_errno=True)
class ArgCmp(ctypes.Structure):
    _fields_ = [('arg', ctypes.c_uint), ('op', ctypes.c_uint), ('datum_a', ctypes.c_uint64), ('datum_b', ctypes.c_uint64)]
lib.seccomp_init.argtypes = [ctypes.c_uint32]
lib.seccomp_init.restype = ctypes.c_void_p
lib.seccomp_syscall_resolve_name.argtypes = [ctypes.c_char_p]
lib.seccomp_syscall_resolve_name.restype = ctypes.c_int
lib.seccomp_rule_add_array.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int, ctypes.c_uint, ctypes.POINTER(ArgCmp)]
lib.seccomp_load.argtypes = [ctypes.c_void_p]
lib.seccomp_release.argtypes = [ctypes.c_void_p]
ctx = lib.seccomp_init(0x7fff0000)
if not ctx:
    raise SystemExit('ISOLATION_INIT_FAILED')
try:
    for name in ['socket', 'socketpair']:
        number = lib.seccomp_syscall_resolve_name(name.encode())
        condition = ArgCmp(0, 1, socket.AF_UNIX, 0)  # SCMP_CMP_NE
        if number < 0 or lib.seccomp_rule_add_array(ctx, 0x00050000 | errno.EPERM, number, 1, ctypes.byref(condition)) != 0:
            raise SystemExit('ISOLATION_RULE_FAILED:' + name)
    number = lib.seccomp_syscall_resolve_name(b'io_uring_setup')
    if number >= 0 and lib.seccomp_rule_add_array(ctx, 0x00050000 | errno.EPERM, number, 0, None) != 0:
        raise SystemExit('ISOLATION_RULE_FAILED:io_uring_setup')
    if lib.seccomp_load(ctx) != 0:
        raise SystemExit('ISOLATION_LOAD_FAILED')
finally:
    lib.seccomp_release(ctx)
env = {k: v for k, v in os.environ.items() if k in ['PATH', 'LANG', 'LC_ALL', 'TZ', 'TMPDIR']}
env['WORK8_KERNEL_EGRESS'] = 'AF_UNIX_ONLY'
env['NODE_NO_WARNINGS'] = '1'
os.closerange(3, 65536)
os.execvpe(sys.argv[1], sys.argv[1:], env)
