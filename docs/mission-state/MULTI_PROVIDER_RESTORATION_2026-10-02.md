# Pillow multi-provider restoration — engineering checkpoint

Certification is paused by King. Cutover baseline 41b897950fd83199bcf0e2d36d30d501aff628b1 remains CLOSED. NOT_BORN / commerce LOCKED remain unchanged. Owner UX backlog remains deferred.

## Original architecture, independently found

- PILLOW_RUNTIME_INTEGRATION_PLAN.md (2026-06-29), sections 1, 2.2 and 3.5: Pillow delegates through the existing Brain LLMRouter supporting OpenAI/Anthropic/Gemini; server-only credentials and separate policy/budget.
- docs/architecture/EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md section 6.6: all LLM calls through Brain router, never frontend; OpenAI primary, Anthropic/Gemini alternates.
- docs/architecture/EMPIREAI_BRAIN_ARCHITECTURE.md: provider layer through LLMRouter only.
- Existing provider.ts, llm-router.ts, openai-provider.ts, anthropic-provider.ts, gemini-provider.ts; Pillow Brain adapter already provider-neutral.
- Historical shutdown/provider repair added abort propagation, deadlines, zero hidden SDK retries and refusal of unapproved implicit provider substitution.

The commissioning branch introduced a dedicated OpenAI-only guard. Its router bypassed other providers; launcher refused their keys. The general adapters contained older model defaults and did not implement current model-specific reasoning/usage contracts. API keys alone would not repair this.

## Minimum extension

Keep the same Brain router and Pillow adapter. Locked text provider policy pins OpenAI gpt-6.1-sol, Claude claude-sonnet-5-5 and Gemini gemini-3.8-flash. Requests name reasoning, analysis, summarization or critique; explicit authenticated provider requests remain available. Reasoning stays OpenAI-primary. Summarization prefers Gemini; critique prefers Claude. This is routing policy, not a claim of comparative competence.

Use the ORIGINAL /data/commissioning/openai-october-2026.sqlite, initialization marker, fsync transaction and cumulative US$20 guard. Do not rename/reset/release the ledger. Historical rows without provider metadata count as OpenAI. Add provider/request attribution tables without deleting or rewriting existing calls. Every outcome retains its conservative reservation. Actual invoice amounts remain unknown until reconciled.

Provider sublimits are OpenAI US$20, Anthropic US$5, Gemini US$5, all subordinate to the SAME shared US$20 ceiling. These are caps, not allocations or spending targets. Price expiry remains 2026-10-08 UTC; commissioning window remains October Singapore time. Unknown price/model/usage or exhausted cap fails closed.

At most two sequential provider attempts, and only after HTTP 429/503/529 temporary refusal. No fallback on timeout, unknown network outcome, malformed usage, invalid credentials or budget failure. One overall 120-second deadline. Each actual attempt reserves independently, including failed/uncertain attempts. Provider health/cooldown persists. A durable hashed workspace/request key prevents retry/restart from launching another paid chain. The durable transport request ID now reaches the router; the old host retry is suppressed for reasoning-only requests.

Explicit crossCheck requires two distinct providers and a justification; ordinary complete never invokes it. Results stay separate with provider/model provenance, not invented consensus. This function is an internal controlled interface, not an autonomous instruction parsed from prose.

Only bounded text endpoints are admitted. No tools, search grounding, cache resources, stored previous-response handles, agent commands or commerce writes are requested. Existing HTTP mutation denials are unchanged. Separate secret names: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY. Credentials are server-only and must be provisioned privately AFTER compatible runtime deployment.

## Official model/price verification (2026-10-02 Singapore)

- OpenAI gpt-6.1-sol integration and reviewed conservative rates retained unchanged from 2026-10-01 verification.
- https://platform.claude.com/docs/en/models/sonnet-5-5/overview — active, released September 28, 2026; adaptive thinking, claude-sonnet-5-5. Standard input/output US$2/US$10 per million. https://platform.claude.com/docs/en/about-claude/pricing — one-hour cache writes US$4/M; US-only 10% premium. Reserve US$4.40/US$11/M conservatively. No non-default temperature, tools or fast mode.
- https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash — stable identifier, thinking medium supported, 65,536 maximum output. https://ai.google.dev/gemini-api/docs/pricing — standard input/output US$0.75/US$3.75/M through December 31, 2026. Thinking included in billable output. Reserve full documented output capacity conservatively; reconcile candidates plus thoughts. Use paid-tier production credential; no free-tier data assumptions.
- API contracts checked at https://platform.claude.com/docs/en/api/messages/create and https://ai.google.dev/api/generate-content . Gemini standard service tier is lowercase standard.

## Evidence preserved and unresolved

Examiner-only branch cert/pillow-unseen-20261002, freeze 9501d9b363592bcdaee39f107f86d50fee21c02b. Original I1 observation preserved b0c1cd8edf69a1c1fac5cc280828fad57033af84; confirmed implementation trace and pause e0fd5ce847c53100e1b6126a13cd6a4e9285f42a. I1 cannot count as an unseen retest.

Production request 21885e42-a857-490a-9745-eb834a5d3ed0, 2026-10-01 16:49 UTC: OpenAI succeeded in 7030ms, retry=false. Release gate replaced response after GOAL_SOLUTION_CAUSAL_LEAP and UNVERIFIED_SOLUTION_FROM_VERIFIED_GOAL; exact stock commercial paragraph visible. Class B confirmed. Raw provider draft was not captured, so model competence is not inferred. No repair to that semantic layer has yet been made or reverted.

Offline checks validate contracts and spending controls only, not live provider connectivity or Pillow certification. New providers lack private credentials and have not made live calls. No additional paid inference during this restoration. Before paid unseen retests, obtain fresh ledger readback including I1. Last verified pre-I1 reservations US$1.951842, conservative usage estimate US$0.441130; invoice actual unknown. Certification resumes only after provider integration and live bounded evidence, with materially new unseen cases and preserved old evidence.
