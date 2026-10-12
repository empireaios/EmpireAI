#!/usr/bin/env python3
"""Short synthetic descendant-writer fixture, not the application watchdog."""
import json, os, pathlib, socket, sqlite3, subprocess, sys, time
root = pathlib.Path('/evidence')
if len(sys.argv) > 1 and sys.argv[1] == 'egress':
    denied = []
    for family in (socket.AF_INET, socket.AF_INET6):
        try:
            s = socket.socket(family, socket.SOCK_STREAM)
        except PermissionError:
            denied.append(family)
        else:
            s.close()
            raise SystemExit('NONLOCAL_SOCKET_NOT_DENIED')
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as s:
        s.bind(str(root/'probe.sock')); s.listen(1)
    (root/'probe.sock').unlink()
    print(json.dumps({'unixListen':True,'internetSocketFamiliesDenied':denied}))
    raise SystemExit(0)
index = int(sys.argv[1]) if len(sys.argv) > 1 else 0
children = []
if index == 0:
    children = [subprocess.Popen([sys.executable, __file__, str(i)]) for i in (1,2)]
db = sqlite3.connect(root/f'writer-{index}.sqlite')
db.execute('PRAGMA journal_mode=WAL')
db.execute('CREATE TABLE IF NOT EXISTS records(n INTEGER PRIMARY KEY, label TEXT)')
n = 0
while True:
    n += 1
    db.execute('INSERT INTO records VALUES(?,?)',(n,'LABELLED_SYNTHETIC')); db.commit()
    (root/f'heartbeat-{index}.json').write_text(json.dumps({'pid':os.getpid(),'n':n,'at':time.time()}))
    time.sleep(.1)

