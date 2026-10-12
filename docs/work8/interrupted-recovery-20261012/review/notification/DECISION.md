# Independent notification acceptance

Verdict: SCOPED ACCEPT. Requirement 30 remains PENDING.

Final reviewed source: 37d4e789f1fb93ea03456fe5d3914719fef3af4f
Final reviewed tree: e200d0047a7e27b1540adf936757b6f8d76d39d1
Predecessor runtime-reviewed source: f7c8089dad9f4a0d6eb5db2493f2b08e8cf1b829
Predecessor tree: 0db7d4ff6b5d55f95a0c5d7d014b4e74a00a563e

The final delta changes only the two test/fixture imports from static cross-root imports to dynamic pathToFileURL imports of the same Pillow engine. No production behavior changes. Independently reran all seven transport/restart tests on the exact final successor; seven passed, zero failed. Log: final-focused-tests.tap. Independently reran four thrown/rejected reserve/finish oracles; reserve failures had zero synthetic effects, finish failures one, all UNKNOWN, retry did not dispatch. Oracle and receipt: ledger-failure-oracle.mjs and ledger-failure-oracle.json.

Accepted assertions:
- Thrown, hung, malformed and late-success transport outcomes do not become false sent outcomes or repeated dispatch.
- Mandatory PillowHost binding occurs before the host becomes operational; the session bootstrap initializes but does not dispatch the worker before binding.
- Existing Brain critical persistence fsyncs the UNKNOWN reservation before transport. Failed reservation prevents dispatch.
- Database reopen and actual process exit after a synthetic effect preserve UNKNOWN; same-ID replay does not dispatch. Conflicting identity rejects. Sent identity also survives reopen.
- Same-process competing worker engines serialize reservation before awaiting persistence; one dispatch.
- Hung reserve and finish await deadlines produce UNKNOWN; late reserve cannot start dispatch. Thrown/rejected persistence paths verified independently.
- Existing authenticated workspace inbox and notice acknowledgement survive reopen; acknowledgement does not resolve incident. That unchanged test was independently passed on predecessor2ba9ff2a. Notice storage is not independent push delivery.

Normal topology verified in source: index.ts returns through isolated primary before loading app graph; tier0-isolated-primary.ts spawnWorker refuses when a child exists or is starting, and normal replacement follows child exit. Acceptance therefore covers the normal supervised single Brain-owning process. Ledger is optional for standalone engines; those are still in-memory. Multiple independent primaries/monoliths/deployment overlap are not atomically excluded by the SQL.js ledger. No general cross-process exactly-once guarantee is claimed. Authenticated inbox is workspace scoped, not proven founder-exclusive.

Original concrete rejected predecessor oracle: two fresh unbound worker instances using identical messageId; synthetic transport incremented an effect counter then threw. Both ended UNKNOWN attempts1, aggregate effects2. Corrected bound-ledger test and physical-crash test demonstrate effect count1 across restart.

Requirement30 remains PENDING because independent operational delivery and full watchdog/degraded-runtime acceptance are not established by this scoped test batch. No real sends, network effects, paid effects, production changes, or reviewer engineering edits.
