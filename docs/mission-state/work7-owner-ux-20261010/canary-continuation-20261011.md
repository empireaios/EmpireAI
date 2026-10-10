# Work 7 conditional canary continuation

Observed 11 October 2026, 02:37 SGT. WORK 7 BLOCKED. Owner directive read in full and preserved in owner-canary-authorisation-20261011.txt. No production release authority granted or exercised.

| Checkpoint | Verified result |
|---|---|
| Frontend PR109 | d24b7adc8fbbc6e67b739e94a74253e7cbe35c62; open draft; four CI workflows PASS |
| Categories PR111 | e6d98fb57537c893c85afc552626235a38ba874c; open draft; all three workflows PASS, including runtime38074592272 |
| Separate PR110 | ff2feffb2907959ef03014617ade2690ae888ab8; open draft; three CI PASS; incident recovery not claimed |
| Candidate | dpl_HZsZ6XmZMQVnEWNxCvFTN2JpR31N; READY; exact PR109 SHA and branch alias verified via Vercel |
| Authenticated observation | Existing session reused without credentials; Home, Cost Centre and saved Pillow conversation observed |
| Canary project | empireai-canary-20260923; feb90d26-c54b-4435-ac32-f666e3e25447 |
| Canary environment | 3b0664a3-8655-4fc1-b9cf-113034a81e0a, named production within the isolated canary project |
| Existing resources | Zero services, volumes, buckets, shared variables or staged changes |
| Provisioning | NOT PERFORMED: enforceable isolated cumulative US$10 cap not established |
| Additional cost | No billable resource created or started. Measured billed/unbilled charge unavailable; not asserted as measured zero |
| Local HTTP persistence | PASS across terminated process and separate new process; synthetic temporary database; not Railway or live preview acceptance |
| Tracker | Original 100 items and 15 UX amendments retained; 17 PASS / 74 PENDING / 9 BLOCKED |

## Spending-cap decision

Railway's current Cost Control documentation describes a workspace-level usage limit per billing cycle. Canary and production share workspace a4962933-0870-4df7-bb46-3625ed800be1. Changing that limit could stop production workloads and is outside this authorisation. The documented mechanism does not establish a separate lifetime allowance for this canary exercise. It also permits automatic restart in a new cycle. Storage Buckets Billing explicitly says stored data continues billing after hard-limit suspension. No documented guarantee covering every applicable charge and stopping strictly within this isolated cumulative US$10 ceiling was established.

Sources retrieved via the official Railway plugin: https://docs.railway.com/pricing/cost-control and https://docs.railway.com/storage-buckets/billing . This is a failure to establish the required guarantee, not a claim that Railway lacks all hard limits. No budget settings changed. No subscription, service, database, volume or bucket created. A minimal backend plus persistent storage remains a proposed resource set only; no bounded maximum exposure is claimed.

## No-cost evidence obtained

The exact PR111 finance route ran in a loopback-only Fastify process with fresh synthetic sessions, clean environment, no production keys, temporary database paths and external fetch disabled. Actual HTTP owner create/read succeeded; anonymous access returned401 and foreign workspace403. The process was killed and a new process read identical journal entries and category/vendor mappings. Rename, stale409, archive and idempotent archive passed. Totals/costs and historical entries remained unchanged. All seven protected routes returned423 with NOT_BORN/LOCKED. Both processes were stopped and temporary data removed. Runtime Node24.19.0; hosted exact-head CI separately verifies the repository's required runtime. Initial harness launch used an unsupported log level and exited before listening; correcting the harness to fatal allowed the test to run. No application fix was needed.

Authenticated Cost Centre observation confirmed disabled category add/assignment against the old backend; 17 providers over two pages; page2 search for Railway reset to1–1 of1; unknown forecast dates and annual run rate remain explicit. Vercel USD0.140117 stays accrued unbilled, shared-team allocation unknown, FX unavailable. Six exceptions remain visible. No mapping or financial write submitted. These are bounded observations, not full UX acceptance.

Legacy source investigation confirms marketplace's BFF points to /commerce/marketplace-integration/cockpit, registered in the backend extension-route group. The production early-listen path conditionally skips that group unless EMPIRE_ENABLE_EXTENSION_ROUTES is enabled. This is a source-supported explanation candidate for the observed404, not a newly verified environment setting; no production variables were read or changed. Workspace/Store/Launch dispatch denial remains intentional under the locked profile. No dispatch bypass or fabricated workspace identity was introduced.

Fresh independent King's Advisor readback confirms backend51830f9f76d3a5b81250c0f5d2b4ce84b44b39c7, deployment37ae1731-7399-4861-b5af-0d413157303d, NOT_BORN/LOCKED. Accounting224, journal3 and historical7 retain all three baseline digests. Readback incurred zero inference. See canary-preflight-20261011.json for exact identities, run IDs and digests.

## Remaining gates and next authorised steps

| Requirement | Status and actual blocker | Responsible party | Evidence and next step |
|---|---|---|---|
| Hosted category lifecycle | BLOCKED: no permitted hosted candidate with enforceable cumulative cap | Engineering/platform dependency | Local HTTP restart PASS. Establish compliant isolated hosting before provisioning; do not relax the cap |
| Legacy reads / workspace detail | PENDING/BLOCKED: dispatch intentionally denied; marketplace extension registration unverified; no actual returned workspace ID | Engineering | Preserve routes and locks; verify read-only contracts on an authorised isolated runtime. Do not create fake live IDs |
| Remaining nested controls | PENDING: complete live control denominator still not established | Engineering | New cost-centre observations credited only within their scope; continue remaining read-only controls |
| Corrected native toolbar | BLOCKED: supported browser has no native Android keyboard/viewport | Owner device evidence | Previous history/keyboard/composer acceptance remains credited. Only corrected overlap and distinct unobserved states need evidence |
| PR110 incident | Separate unresolved lineage | Engineering under separate governance | Passing CI is not fresh collector evidence; keep HIGH incident open |
| Release and independent closure | BLOCKED: mandatory acceptance incomplete and separate release authority absent | Engineering, then owner release decision | No lease/merge/deploy; never reuse finished fence17. Prepare release proposal only after mandatory gates |

No production source, environment, credentials, journal, approval or authority was changed. No Pillow message sent. No inference, supplier/marketplace/payment call, commerce unlock, birth, lease, merge or deployment performed. This continuation does not claim all remaining no-cost acceptance is exhausted or Work7 complete.
