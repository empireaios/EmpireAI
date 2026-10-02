import fs from 'node:fs';
import {inspectAssurance} from './independent-assurance.mjs';
import {observeDemo} from './owner-demo.mjs';
import {recordOwnerAssurance} from './owner-evidence.mjs';

export function runInspectorPass(database, now=Date.now()) {
  const verdict=inspectAssurance(database,{now,epoch:0,intervalMs:300000,graceMs:120000});
  observeDemo(database,now);
  recordOwnerAssurance(database,now);
  // A heartbeat proves the complete observer pass succeeded. Failed observers
  // must not continuously renew freshness while silently skipping findings.
  fs.writeFileSync(database+'.watchdog.tmp',JSON.stringify({observedAt:now,status:verdict.status}),{mode:0o600});
  fs.renameSync(database+'.watchdog.tmp',database+'.watchdog');
  return verdict;
}
