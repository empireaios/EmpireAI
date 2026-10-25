#define _GNU_SOURCE
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <sys/wait.h>
#include <linux/sched.h>
static long call(const char *name) {
#if defined(__x86_64__)
 if(!strcmp(name,"legacy-x32"))return syscall(512);
 if(!strcmp(name,"x32-abi"))return syscall(0x40000000U);
#endif
#ifdef __NR_fork
 if(!strcmp(name,"fork"))return syscall(__NR_fork);
#endif
#ifdef __NR_vfork
 if(!strcmp(name,"vfork"))return syscall(__NR_vfork);
#endif
 if(!strcmp(name,"clone"))return syscall(__NR_clone,0,0,0,0,0);
#ifdef __NR_clone3
 if(!strcmp(name,"clone3")){struct clone_args args={.flags=CLONE_THREAD|CLONE_VM|CLONE_SIGHAND};return syscall(__NR_clone3,&args,sizeof(args));}
#endif
 if(!strcmp(name,"execve")){char *const argv[]={"/bin/true",NULL};char *const env[]={NULL};return syscall(__NR_execve,"/bin/true",argv,env);}
#ifdef __NR_execveat
 if(!strcmp(name,"execveat")){char *const argv[]={"/bin/true",NULL};char *const env[]={NULL};return syscall(__NR_execveat,-100,"/bin/true",argv,env,0);}
#endif
 if(!strcmp(name,"setsid"))return syscall(__NR_setsid);
 if(!strcmp(name,"setpgid"))return syscall(__NR_setpgid,0,0);
 if(!strcmp(name,"unshare"))return syscall(__NR_unshare,CLONE_NEWUSER);
 if(!strcmp(name,"setns"))return syscall(__NR_setns,-1,0);
 if(!strcmp(name,"ptrace"))return syscall(__NR_ptrace,0,0,0,0);
#ifdef __NR_process_vm_writev
 if(!strcmp(name,"process_vm_writev"))return syscall(__NR_process_vm_writev,getpid(),0,0,0,0,0);
#endif
#ifdef __NR_process_vm_readv
 if(!strcmp(name,"process_vm_readv"))return syscall(__NR_process_vm_readv,getpid(),0,0,0,0,0);
#endif
#ifdef __NR_pidfd_getfd
 if(!strcmp(name,"pidfd_getfd"))return syscall(__NR_pidfd_getfd,-1,0,0);
#endif
 errno=EINVAL;return -2;
}
int main(int argc,char **argv){
 if(argc!=2)return 90;
 errno=0;long result=call(argv[1]);int error=errno;
 if((!strcmp(argv[1],"fork")||!strcmp(argv[1],"vfork")||!strcmp(argv[1],"clone"))&&result>=0){if(result==0)_exit(91);(void)waitpid((pid_t)result,NULL,0);return 92;}
 const int expected=!strcmp(argv[1],"clone3")?ENOSYS:EPERM;
 if(result!=-1||error!=expected)return 93;
 printf("DENIED:%s:%d\n",argv[1],error);return 0;
}
