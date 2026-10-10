# Autonomous repair retains seven live-effect locks

Supplemental evidence-only test: `scripts/work8/autonomous-locks.test.ts`. Existing candidate runtime files are unchanged.

Actual Fastify locked commissioning middleware, actual session store/auth middleware and actual durable AssuranceControlPlane run together in an isolated temporary synthetic workspace. An authenticated founder session is positively verified on a protected read route; anonymous access fails. Each route below returns 423 both during ordinary operation and from inside an actually admitted authority-A recovery callback:

- `/amazon/publish`
- `/amazon/inventory`
- `/amazon/price`
- `/cj/orders`
- `/fulfilment`
- `/pillow-commissioning/birth`
- `/api/pillow/mission-runtime/execute`

All 14 responses retain NOT_BORN/LOCKED. Instrumented business handlers execute zero times. The A callback executes once; its verifier independently checks the captured responses and handler count before VERIFIED. A separate authority-C callback executes zero times and leaves its incident UNRESOLVED. A separate A callback returning a success message but failing its verifier produces FAILED and never RECOVERED or verifiedAt.

Node 22.23.2 kernel-denied-network execution: 1/1 PASS, duration 550.901027 ms. No provider calls, production access, financial writes or inference. The first actual run was correctly rejected by SYNTHETIC_ISOLATION because the synthetic probe used a nonsynthetic workspace; test fixture corrected to a synthetic workspace, without changing the control plane.

Reproduce from backend package directory:

```sh
python ../scripts/work8/isolated-exec.py /workspace/scratch/e0a785458d28/test-deps/node_modules/node/bin/node --import tsx --test ../scripts/work8/autonomous-locks.test.ts
node_modules/.bin/tsc --strict --noUncheckedIndexedAccess --module preserve --moduleResolution bundler --target ES2022 --skipLibCheck --noEmit --esModuleInterop ../scripts/work8/autonomous-locks.test.ts node_modules/@fastify/cookie/types/plugin.d.ts
```

Strict supplemental compilation PASS with explicit Fastify cookie augmentation and bundler module resolution. A standalone NodeNext invocation encountered existing imported logger/pino interop and omitted cookie augmentation errors; this supplemental file sits outside the backend build. Runtime validation uses actual Node22/tsx imports. This is an in-process authenticated middleware examination, not a deployment or external network test. The injected route handlers are counters behind the real middleware; no real business effects are installed.
