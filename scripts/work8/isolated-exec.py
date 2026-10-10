#!/usr/bin/env python3
"""Run local Work8 exams under inherited kernel network denial, with no provider credentials.
Requires Linux libseccomp; fails closed if unavailable. This does not provision infrastructure.
"""
import ctypes, ctypes.util, errno, os, sys
if len(sys.argv)<2: raise SystemExit('usage: isolated-exec.py executable [args...]')
libname=ctypes.util.find_library('seccomp')
if not libname: raise SystemExit('ISOLATION_UNAVAILABLE_LIBSECCOMP')
lib=ctypes.CDLL(libname,use_errno=True)
lib.seccomp_init.argtypes=[ctypes.c_uint32];lib.seccomp_init.restype=ctypes.c_void_p
lib.seccomp_syscall_resolve_name.argtypes=[ctypes.c_char_p];lib.seccomp_syscall_resolve_name.restype=ctypes.c_int
lib.seccomp_rule_add.argtypes=[ctypes.c_void_p,ctypes.c_uint32,ctypes.c_int,ctypes.c_uint]
lib.seccomp_load.argtypes=[ctypes.c_void_p];lib.seccomp_release.argtypes=[ctypes.c_void_p]
ctx=lib.seccomp_init(0x7fff0000)
if not ctx: raise SystemExit('ISOLATION_INIT_FAILED')
try:
 for name in ['socket','connect','sendto','sendmsg','sendmmsg','io_uring_setup']:
  number=lib.seccomp_syscall_resolve_name(name.encode())
  if number>=0 and lib.seccomp_rule_add(ctx,0x00050000|errno.EPERM,number,0)!=0: raise SystemExit('ISOLATION_RULE_FAILED:'+name)
 if lib.seccomp_load(ctx)!=0: raise SystemExit('ISOLATION_LOAD_FAILED')
finally: lib.seccomp_release(ctx)
# Do not pass provider tokens, proxy configuration or inherited network descriptors.
env={k:v for k,v in os.environ.items() if k in ['PATH','LANG','LC_ALL','TZ','TMPDIR']}
env['WORK8_KERNEL_EGRESS']='DENIED';env['NODE_NO_WARNINGS']='1'
os.closerange(3,65536)
os.execvpe(sys.argv[1],sys.argv[1:],env)
