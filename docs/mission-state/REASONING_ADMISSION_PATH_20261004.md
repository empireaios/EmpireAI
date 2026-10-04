# Targeted reasoning admission repair

Production baseline: backend PR47 `4a9581b564683f9e55ad86c619d1b9ef018b45c1`, frontend PR41 `8cc01caa74ae2b7cf68491f865535ecfd618e154`. NOT_BORN; commerce LOCKED. PR48 and PR44 are unrelated retained candidates and remain untouched. Work B remains closed.

## Fresh failed acceptance

Owner supplied request ID `pcr_b26e0626549545bd` and the server refusal: “Constitutional gate refused this request before model reasoning. The requested analysis remains incomplete. Existing authority limits and Assurance holds remain in force.”

This is a fresh failed acceptance. A-FAILURE remains REGRESSION / ENGINEERING OPEN. No owner question was retrieved, replayed, paraphrased or used as a fixture.

Source provenance establishes that this specific text comes from the `!constitutionalGate.allowed` branch in `PillowHost.routePrompt`, with `CONSTITUTIONAL_GATE_REFUSED`. That branch precedes the commerce classifier: PR47's commerce classifier could not have admitted this invocation before this refusal. The durable worker maps a returned constitutional refusal to BRAIN_FATAL without executing inference. That is the source-defined behavior, not a recovered database verdict for this request.

Exact finding/family/token and retained terminal record remain unconfirmed. Deployment logs filtered by request ID returned no entries. Railway's connected file reader cannot query SQLite or Redis. Existing CLI authentication returned Unauthorized; no authentication controls were changed. No absence of a JSON file is taken as proof that a Redis record is absent. The current source logs only a generic pre-inference reason and does not persist the compliance findings in the transcript. It records detailed diagnostics for post-inference rejection only. No diagnostic or production call was replayed.

## Admission-path map

| Layer / source | Intended protection and inputs | Scope and overlap | Terminal behavior / repair |
|---|---|---|---|
| Web client / BFF `app/api/pillow/[...path]/route.ts` | Session transport, bounded recent history, timeout; request JSON | Structural; truncates continuity, does not decide business semantics | Transport errors; no new frontend change required |
| `installLockedCommissioning` primary and worker | HTTP method/path allowlist, runtime profile | Capability boundary, independent of message words | Unauthorized write routes return 423; unchanged |
| Tier0 path classification | Canonical chat path, encoded/alternate endpoints; stream durability | Structural | Alternate chat denied; streaming cannot bypass durable queue; unchanged |
| `handleDurablePillowChat` | Authentication, founder/admin, workspace, input size/schema, request identity | Structural, not proposition-based | 401/403/400/503 or durable receipt; no completed answer |
| `admitChatRequestBody` | Full text/context size and valid JSON | Structural normalization | Invalid body denied; no model or effect |
| Redis durable claim | Durable input, session token, owner/workspace, idempotency, lease fencing | Typed `kind=reasoning`; no execution authority | 202 pending, retained failure or retained completed result; unchanged |
| Durable sweeper / `executeReasoningProxy` | Readiness, lease, bounded attempts, reasoning-kind-only forwarding | Structural | Calls real worker route; refuses other kinds; pre-inference failures remain BRAIN_FATAL |
| Worker chat route | Shared auth/workspace, pressure admission, host readiness; optional one-time session rebind | Structural availability controls | 401/403/503 or host result; retained |
| `isReasoningOnlyRequest` / host mode | Server runtime and internal transport kind | Previously depended on header alone | LOCKED runtime now always restricts chat to reasoning, even with absent/false client hint |
| Explicit `/pillow-request` parsing | Known capability/provider options, calculation bounds, JSON | Structural; metadata cannot create authority | Invalid envelope fails; no provider call; unchanged |
| Digital Soul availability | Constitution present and loaded | Structural prerequisite | Missing constitution remains incomplete refusal |
| Digital Soul conversation compliance | Previously user text + recent history passed as an executable recommendation; broad intent regex plus visible-answer rescans | Whole-message and proposition fallback; duplicates commerce/authority policy and confuses discussion with execution | Typed reasoning boundary now evaluates the actual allowed operation, read-only deliberation. Text and history remain untrusted model context. Legacy tool/command/memory/action gates stay strict. Typed reasoning cannot attest those purposes |
| Commerce-effect classifier | Previously vocabulary/grammar decides whether chat may infer | Proposition heuristics; duplicates actual effect locks | Used on executable/legacy path only. Reasoning path universally denies effects without rejecting useful discussion |
| Operating-authority fact projection | Previously message-global selection could replace multi-part reasoning with a canned factual reply | Duplicates model/context handling | Reasoning path bypasses projection and receives live truth as evidence instead |
| Exact-line response projection | Previously message-global recognition could complete or reject before inference | Duplicates requested output handling | Reasoning path leaves formatting to model plus output integrity checks; no fabricated pre-inference reasoning |
| Shadow CEO / command / operational context / observer | Real action-capable stages | Capability boundary | `runChatActionStage` stays disabled for reasoning. Only real `buildReadOnly` repository context runs |
| Scope / task / operating-mode selection | Context selection, budgets, epistemic framing | Message-wide classification; no authority grant | Cannot authorize an effect or replace reasoning; failures stay failures |
| Truth and Assurance evidence | Read-only state, source provenance, UNKNOWN/DEGRADED information | Evidence rather than permission to reason | Existing holds remain effective; missing evidence does not manufacture a healthy system |
| Read-only tools | Closed registry, owner workspace, bounded exact arithmetic | Capability boundary, not NLP | No general network/code/write dispatcher exists on this path |
| OpenAI integration assembly | Constitutional attestation, explicit provider/consultation, text context | Typed reasoning disables platform capabilities and artifact writes | New system contract allows analysis, requires refusing effects in mixed requests; no claim of execution |
| Brain adapter / LLMRouter | Allowed capability/provider/model, credentials, deadline, no implicit retry chain | Structural/provider policy | Missing config/budget fails; unchanged |
| Locked provider orchestration | Durable request dedup, health selection, priced reservation, ceiling, text-only payload | Financial/capability boundary | All required controls run before intercepted provider HTTP; no paid test calls |
| Model tool protocol | Exact JSON arithmetic protocol; only `calculate`, bounded one round | Closed schema; no free-form tool dispatch | Model-proposed effect tool rejected before handler and before follow-up inference |
| Post-inference visible-answer / truth gate | Actual draft constitutional claims, receipt-grounded integrity | Separate from admission; existing visible policy retained | Rejection is explicit incomplete failure, not a rewritten task answer |
| Host → durable settlement → BFF/UI | Typed completion, no degraded/pending/blocked result promoted | Structural classification | Host now explicitly emits brainCompleted/semanticSuccess only for provider-completed validated llm output; existing worker and UI reject false flags |

## Architectural contract

Reasoning about an action is not the action. The server capability set, never a user's vocabulary or assertion of approval, determines executable authority. This channel's effect admission is always DENIED for external effects, authority changes and Assurance overrides. A completed analysis is not completed execution. Pure effect requests may receive a model explanation of denial; mixed requests may receive the permitted analysis plus effect refusal. No model tool can execute the refused part.

The read-only gate evaluates the server operation rather than treating all user/history text as a recommendation to execute. Constitution availability and structured action gates are retained. This is not an allowlist of safe business words or a paraphrase-specific regex patch. Operating-fact and exact-output projections can no longer short-circuit the same reasoning path.

## Deterministic evidence

`backend/scripts/reasoning-admission-corpus.mjs` generates 1,950 independent cases: 960 reasoning, 80 polarity, 80 effect-only, 640 mixed, 45 governance reasoning, 5 projection, 140 formatting mutations. It crosses verbs, business objects, direct/hypothetical language, prohibitions, conditions, urgency, owner claims and independent clauses. It contains no owner-acceptance question.

`reasoning-admission-full-path.mjs` runs every case through real primary admission, real Redis session and queue, real durable claim/worker/settlement, registered worker route, host, Digital Soul, context builder, executive direction, OpenAI integration, Brain adapter, LLMRouter, locked provider selection, budget reservation and provider response reconciliation. Interception occurs at provider HTTP, with synthetic credentials, disabled external sockets and disposable databases. Bootstrap data/mission inventory are synthetic; host infrastructure is assembled without starting unrelated production services. This is production-equivalent source integration, not a claim of exercising the entire deployed boot lifecycle or model intelligence.

Every generated case reaches intercepted provider HTTP, retains an unchanged synthetic answer and explicit effect-denial metadata, and completes only the reasoning result. Model write-tool proposals fail; missing constitution fails before inference; unauthorized workspace/authentication and HTTP effect routes remain denied. Fresh test-owned inference ledgers isolate each semantic case; cumulative accounting remains covered by its separate mandatory tests. No production database, credential or allowance is used.

Existing legacy constitutional bypass, visible-answer Assurance, locked inference/accounting, workspace memory, order nonmutation and reconciliation tests remain mandatory. The deficient six-case host-only interception script is replaced in hosted CI by the real-path corpus.

## States and deployment boundary

ENGINEERED requires complete local and hosted evidence for the exact successor. PRODUCTION-VERIFIED requires the exact authorized deployed successor and preservation checks. OWNER-ACCEPTED remains PENDING until fresh independent evidence is supplied. Only that state may establish owner-facing resolution.

Rollback target is PR47. Frontend PR41 stays unchanged. PR48/PR44 are not merged, rebased, repinned or deployed by this mission. Later promotion of those candidates requires reconciliation with whichever backend is then authorized; their current pins cannot silently supersede the targeted successor.
