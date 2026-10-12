# Replacement Redis inspection continuation

Candidate: 466c09896c21ef2cd8beceddf19a732aeda3aab4
Tree: ce2f5acbe09a15ac27b2cbc088769997d7d212a9
Base: 8277718e03a0e5d9b612dbe1240bb4a005e56856

Extends the existing historical inspection API; no operational activation. Distinct replacement source/target identities are explicitly pinned. Lua rechecks server run ID and selects the pinned database atomically before checking emptiness or writing. Existing partial restore persistent fence behavior remains fail-closed.

Existing integrated replay examiner passes against this exact candidate: original source Redis process stopped; distinct password-protected replacement; surviving labelled inventory logical values equivalent; AOF appendfsync-always, SIGKILL, no RDB; auth still required; queue paused and producer refused; pending readonly mission once; historical receipt unchanged; changed dispatch rejected. Redis logical values, not arbitrary binary hash/stream inputs, are the tested corpus. This does not prove restored owner application authentication; earlier actual-topology owner-session restart evidence remains separately scoped.

Preserved completeLiveState:false, bootAllowed:false, fullRuntimeRestored:false, NOT_BORN and LOCKED. Off-host independent custody, global exclusion of legacy/external writers, and guarded complete operational activation remain outstanding. No full requirement33/39 closure claimed.

Initial f1d6494b was superseded after independent reviewer demonstrated target identity TOCTOU. A strengthened initial oracle also rejected DUMP byte equality because hash serialization order changes; corrected to canonical typed content equivalence. Accidental overlapping preliminary runs hit SQLjs ownership refusal; final exact candidate ran alone. Only this final directory is candidate evidence.
