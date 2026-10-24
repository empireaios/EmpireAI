# Shared-runtime sustained examination

The runner `scripts/work8/shared-runtime-soak.mjs` adds coverage beyond the earlier resource sampler: one persistent intelligence database, commerce database and Assurance control plane are reused for all120 slices. No scenario database is recreated between samples. Seed1800 and the injected provider payloads are fixed; archived IDs may include existing module randomness.

The full run is deliberately pending source freeze and root launch. Its declared cadence is5 seconds for the actual commerce worker and durable simulated-finance tick, and30 seconds for the actual acquisition/enrichment planners, four-job drain and Assurance observations. It orchestrates module entry points in one loop; this does not certify deployed timers, concurrent hosted traffic or Railway resource limits.

The short smoke executes those120 logical slices with compressed wall timing, expressly labelled `PASS_SHORT_SMOKE_NOT_ENDURANCE`. It verifies100 injected catalogue identities, three truthful enrichment deferrals including one actual injected HTTP429, a canonical19-step commercial task, the actual committed-receipt/task-cursor gap and bounded control-plane recovery without a new commercial receipt, and durable simulated settlement with a fresh healthy financial probe. The source fixtures are explicitly synthetic protocol products and provide no real-product visibility evidence. No paid inference or external transport is permitted by the kernel-isolation wrapper.

At slice90, the simulated business clock advances one day for the declared payout hold. This is independent of measured elapsed wall time and is recorded in the trace. Acquisition continues on the next simulated day, so the report retains the prior day's100-candidate checkpoint rather than misrepresenting the new day's partial count.

Predeclared full-run gates are600000ms elapsed,120 samples, p99 core slice≤2000ms, maximum core slice≤5000ms, peak RSS≤512MiB, RSS growth≤128MiB and process CPU≤120seconds. Core slice timing excludes report serialization and timer waiting; process CPU and total elapsed include them. Runtime source files plus runner/isolation wrapper are SHA256-bound before and after; any difference fails the examination. Reports include every slice's canonical history digest, task cursor, resource measurements, fresh probe statuses and exact fault traces. SQLite stores remain at the recorded isolated path for inspection.

Launch from repository root after freeze:

```
python scripts/work8/isolated-exec.py /workspace/scratch/e0a785458d28/test-deps/node_modules/node/bin/node --import /workspace/scratch/e0a785458d28/test-deps/node_modules/tsx/dist/loader.mjs scripts/work8/shared-runtime-soak.mjs
```

The full report is `docs/work8/shared-runtime-soak.json`; the short smoke report is separate. Passing this scoped run does not close remaining mandatory examinations or authorize production release, live commerce, Pillow birth or Work9.
