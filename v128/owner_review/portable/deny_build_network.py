#!/usr/bin/env python3
"""Deny IPv4/IPv6 socket creation across this build process tree; Unix IPC allowed."""
import ctypes,ctypes.util,errno,os,socket,sys
class Compare(ctypes.Structure):_fields_=[('arg',ctypes.c_uint),('op',ctypes.c_int),('a',ctypes.c_uint64),('b',ctypes.c_uint64)]
lib=ctypes.CDLL(ctypes.util.find_library('seccomp'),use_errno=True)
lib.seccomp_init.argtypes=[ctypes.c_uint32];lib.seccomp_init.restype=ctypes.c_void_p
lib.seccomp_syscall_resolve_name.argtypes=[ctypes.c_char_p];lib.seccomp_syscall_resolve_name.restype=ctypes.c_int
lib.seccomp_rule_add_array.argtypes=[ctypes.c_void_p,ctypes.c_uint32,ctypes.c_int,ctypes.c_uint,ctypes.POINTER(Compare)]
lib.seccomp_load.argtypes=[ctypes.c_void_p];lib.seccomp_release.argtypes=[ctypes.c_void_p]
ctx=lib.seccomp_init(0x7fff0000);assert ctx
for syscall in [b'socket',b'socketpair']:
 number=lib.seccomp_syscall_resolve_name(syscall);assert number>=0
 for family in [socket.AF_INET,socket.AF_INET6]:
  cmp=Compare(0,4,family,0);assert lib.seccomp_rule_add_array(ctx,0x50000|errno.EPERM,number,1,ctypes.byref(cmp))==0
assert lib.seccomp_load(ctx)==0;lib.seccomp_release(ctx)
for family in [socket.AF_INET,socket.AF_INET6]:
 try:socket.socket(family,socket.SOCK_STREAM)
 except OSError as e:assert e.errno==errno.EPERM
 else:raise AssertionError('NETWORK_FILTER_DID_NOT_APPLY')
assert len(sys.argv)>1;os.execv(sys.argv[1],sys.argv[1:])
