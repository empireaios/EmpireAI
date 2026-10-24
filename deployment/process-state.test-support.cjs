'use strict';
const fs=require('node:fs');
function running(pid) {
  // Work's PID namespace can expose a host-mounted /proc. A child PID then
  // names an unrelated host process; match its namespace before reading stat.
  let procPid = pid;
  if (Number(fs.readlinkSync('/proc/self')) !== process.pid) {
    const namespaceIds = status => status.match(/^NSpid:\s+(.+)$/m)?.[1].trim().split(/\s+/).map(Number);
    procPid = undefined;
    for (const entry of fs.readdirSync('/proc').filter(name => /^\d+$/.test(name))) {
      try {
        const ids = namespaceIds(fs.readFileSync(`/proc/${entry}/status`, 'utf8'));
        if (ids?.at(-1) === pid) {
          // The outer PID differs per process; the namespace itself must match.
          if (fs.readlinkSync(`/proc/${entry}/ns/pid`) === fs.readlinkSync('/proc/self/ns/pid')) { procPid = entry; break; }
        }
      } catch (error) { if (!['ENOENT', 'ESRCH'].includes(error.code)) throw error; }
    }
    if (procPid === undefined) {
      try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') return false; throw error; }
      throw Error('Live child PID has no verifiable matching /proc identity');
    }
  }
  try {
    // A reaped-or-pending-reap zombie cannot execute work or retain open files.
    return fs.readFileSync(`/proc/${procPid}/stat`, 'utf8').split(') ')[1][0] !== 'Z';
  } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

module.exports={running};
