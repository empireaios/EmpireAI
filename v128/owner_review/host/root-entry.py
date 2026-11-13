#!/usr/bin/python3
"""Exec the fixed root watchdog before any expensive work or listener."""
import os

if os.geteuid() != 0 or os.getpid() != 1:
    raise SystemExit('A09_ROOT_PID1_ENTRY_REQUIRED')
os.execv('/usr/bin/python3', ['/usr/bin/python3', '-I', '-B', '/control/owner_review/host/root-watchdog.py'])
