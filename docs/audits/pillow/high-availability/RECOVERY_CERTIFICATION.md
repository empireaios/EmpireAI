# Recovery Certification

**Status:** PASS

## Mechanisms

1. **Executive Continuity Watchdog (Worker)** — independent of wedged event loop; exits process on heartbeat stall / sustained high lag so Railway `ON_FAILURE` restarts the Brain.  
2. **SQLite persist hardening** — avoids export-driven wedges under lag.  
3. **Soft client timeout** — aborted cockpit chat (800ms) left Brain healthy.

## Live evidence

- Watchdog online on deployment `62fb42e7-0a2e-4d76-a432-26d064cd6cdd`  
- Soft-timeout phase: `brainHealthyAfter: true`  
- Post-deploy Brain recovered from prior 502 wedge class to sustained PASS cert
