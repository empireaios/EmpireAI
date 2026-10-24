#!/usr/bin/env python3
"""Local browser exam backend: accept inbound HTTP, deny all outbound connects.
The target must initialise its isolated fixture configuration from arguments;
the shared launcher removes inherited credentials and network descriptors.
"""
import runpy,sys
from pathlib import Path
sys.argv.insert(1,'--listen-only')
runpy.run_path(str(Path(__file__).with_name('isolated-exec.py')),run_name='__main__')
