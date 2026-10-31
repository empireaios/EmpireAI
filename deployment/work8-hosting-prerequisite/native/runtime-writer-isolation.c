#define _GNU_SOURCE
#include <errno.h>
#include <stddef.h>
#include <stdint.h>
#include <unistd.h>
#include <sys/prctl.h>
#include <sys/syscall.h>
#include <linux/audit.h>
#include <linux/filter.h>
#include <linux/sched.h>
#include <linux/seccomp.h>

/* Loaded by the dynamic linker before Node/application threads or imports.
 * A thread shares this admitted writer's address space; a new process does not.
 * This filter is irreversible and inherited by all threads. The independent
 * operator/guard never loads this library. No path or credential is logged. */
#if defined(__x86_64__)
#define EXPECTED_ARCH AUDIT_ARCH_X86_64
#elif defined(__aarch64__)
#define EXPECTED_ARCH AUDIT_ARCH_AARCH64
#else
#error Unsupported writer-isolation architecture
#endif
#define DENY (SECCOMP_RET_ERRNO | (EPERM & SECCOMP_RET_DATA))
#define CHECK_DENY(n) BPF_JUMP(BPF_JMP+BPF_JEQ+BPF_K,(n),0,1), BPF_STMT(BPF_RET+BPF_K,DENY)

static void refuse(void) {
    static const char message[] = "WRITER_ISOLATION_INSTALL_REFUSED\n";
    if (write(STDERR_FILENO, message, sizeof(message)-1) < 0) _exit(126);
    _exit(126);
}
__attribute__((constructor)) static void isolate_writer(void) {
    struct sock_filter filter[] = {
        BPF_STMT(BPF_LD+BPF_W+BPF_ABS, offsetof(struct seccomp_data, arch)),
        BPF_JUMP(BPF_JMP+BPF_JEQ+BPF_K, EXPECTED_ARCH, 1, 0),
        BPF_STMT(BPF_RET+BPF_K, SECCOMP_RET_KILL_PROCESS),
        BPF_STMT(BPF_LD+BPF_W+BPF_ABS, offsetof(struct seccomp_data, nr)),
#if defined(__x86_64__)
        /* Reject x32 ABI aliases rather than leaving a second syscall surface. */
        BPF_JUMP(BPF_JMP+BPF_JSET+BPF_K, 0x40000000U, 0, 1),
        BPF_STMT(BPF_RET+BPF_K, SECCOMP_RET_KILL_PROCESS),
        /* Older kernels expose untagged x32 syscall aliases in this range. */
        BPF_JUMP(BPF_JMP+BPF_JGE+BPF_K, 512U, 0, 2),
        BPF_JUMP(BPF_JMP+BPF_JGT+BPF_K, 547U, 1, 0),
        BPF_STMT(BPF_RET+BPF_K, DENY),
#endif
#ifdef __NR_fork
        CHECK_DENY(__NR_fork),
#endif
#ifdef __NR_vfork
        CHECK_DENY(__NR_vfork),
#endif
        CHECK_DENY(__NR_execve),
#ifdef __NR_execveat
        CHECK_DENY(__NR_execveat),
#endif
        CHECK_DENY(__NR_setsid),
        CHECK_DENY(__NR_setpgid),
        CHECK_DENY(__NR_unshare),
        CHECK_DENY(__NR_setns),
        CHECK_DENY(__NR_ptrace),
#ifdef __NR_process_vm_writev
        CHECK_DENY(__NR_process_vm_writev),
#endif
#ifdef __NR_process_vm_readv
        CHECK_DENY(__NR_process_vm_readv),
#endif
#ifdef __NR_pidfd_getfd
        CHECK_DENY(__NR_pidfd_getfd),
#endif
#ifdef __NR_clone3
        /* clone3's flags are pointed-to memory, unavailable to classic BPF.
         * ENOSYS makes glibc pthread creation use inspectable legacy clone. */
        BPF_JUMP(BPF_JMP+BPF_JEQ+BPF_K, __NR_clone3, 0, 1),
        BPF_STMT(BPF_RET+BPF_K, SECCOMP_RET_ERRNO | ENOSYS),
#endif
        BPF_JUMP(BPF_JMP+BPF_JEQ+BPF_K, __NR_clone, 0, 3),
        BPF_STMT(BPF_LD+BPF_W+BPF_ABS, offsetof(struct seccomp_data, args[0])),
        BPF_JUMP(BPF_JMP+BPF_JSET+BPF_K, CLONE_THREAD, 1, 0),
        BPF_STMT(BPF_RET+BPF_K, DENY),
        BPF_STMT(BPF_RET+BPF_K, SECCOMP_RET_ALLOW)
    };
    struct sock_fprog program = { (unsigned short)(sizeof(filter)/sizeof(filter[0])), filter };
    if (prctl(PR_SET_DUMPABLE, 0, 0, 0, 0) != 0 ||
        prctl(PR_SET_NO_NEW_PRIVS, 1, 0, 0, 0) != 0 ||
        syscall(SYS_seccomp, SECCOMP_SET_MODE_FILTER, SECCOMP_FILTER_FLAG_TSYNC, &program) != 0) refuse();
}
