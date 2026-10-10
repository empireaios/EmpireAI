# Integrated model protocol and session adapter fault examination

`backend/src/validation/tests/work8-model-session-faults.test.ts` runs only when the full kernel network-denial marker is present. It uses Node 22.23.2, fresh temporary stores, fake non-provider keys, injected in-process HTTP responses, and a controlled 2026-10-01 clock inside the existing model price-policy period. No real provider requests, paid inference, production sessions or production files are used.

The first examination calls actual `completeLockedRouted` with explicit OpenAI selection for three independent failures: HTTP429, HTTP503 and malformed negative usage. Each failure admits exactly one injected transport, retains an uncertain reservation, and cannot replay during or after cooldown. Actual `readProviderHealth` passively reads those ledger rows and drives a real AssuranceControlPlane incident. Continued failure cannot close the incident. A separately identified successful injected response, with validated model/usage, creates a new accounting receipt and only then allows passive health to recover the incident. All earlier failed accounting rows remain identical and actual invoices remain unknown. Six injected transport invocations occur across three failure/recovery pairs. No autonomous runbook repair is claimed: the provider's restoration is externally injected and independently detected.

The second examination uses actual `SessionStore`, Fastify cookie registration and authentication middleware with an injected Redis-compatible adapter. Failed GET returns typed503 before the protected handler. Repeated failure remains unresolved. Restored adapter access requires a new successful GET and authenticated handler invocation before Assurance recovers. This verifies adapter/authorization fail-closed behavior and fresh-read recovery; it does not test an actual Redis daemon restart, Redis persistence, network reconnect or host failover.

Reproduce from backend repository root:

```sh
python scripts/work8/isolated-exec.py /path/to/node22 --import /path/to/tsx/dist/loader.mjs --test backend/src/validation/tests/work8-model-session-faults.test.ts
```

Result: 2 tests passed under kernel network denial. Focused strict TypeScript uses `--module esnext --moduleResolution bundler --strict --noUncheckedIndexedAccess --skipLibCheck --target es2022 --esModuleInterop`; cookie plugin type augmentation is imported explicitly. This is bounded integrated mock evidence, not live provider recovery or Work8 closure.
