'use strict';
// O33's private filesystem layout. Runtime-owned envelopes include the sibling
// locks required by the real stores; volume/authority ancestors stay operator-owned.
const path=require('node:path');
const {STORES}=require('./work8-system-vault.cjs');
const NATIVE=Object.freeze({visual:'pillow-visual-memory',session:'pillow-session-continuity'});
const RUNTIME_DIRECTORIES=Object.freeze(['commissioning','finance','commerce',...Object.values(NATIVE),'.work8-executive-journal-locks']);
const SQL=Object.freeze({...STORES,brain:'commissioning/empireai-brain.db',missions:'commissioning/empireai-brain.db.missions.sqlite',execution:'commissioning/empireai-brain.db.mission-execution.sqlite',shadow:'commissioning/empireai-brain.db.shadow/shadow-ceo.db'});
const CONTROL=Object.freeze(['commissioning/empireai-brain.db.shadow/shadow-ceo-authority/authority-store.json','commissioning/empireai-brain.db.shadow/shadow-ceo-request-owners.json','commissioning/assurance.sqlite.watchdog',...Object.values(require('./work8-lifecycle-markers.cjs').MARKERS)]);
function nativeRoot(volume,kind){const name=NATIVE[kind];if(!name)throw Error('UNKNOWN_NATIVE_STORE');return path.join(volume,name,name);}
function paths(base){const volume=path.join(base,'volume');return {base,volume,operator:path.join(base,'operator'),capture:path.join(base,'capture'),temporary:path.join(base,'tmp'),authority:path.join(volume,'authority'),visual:nativeRoot(volume,'visual'),session:nativeRoot(volume,'session'),journalLocks:path.join(volume,'.work8-executive-journal-locks')};}
module.exports={NATIVE,RUNTIME_DIRECTORIES,SQL,CONTROL,nativeRoot,paths};
