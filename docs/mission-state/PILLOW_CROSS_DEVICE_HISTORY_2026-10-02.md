# Cross-device Pillow history integration — 2026-10-02

Status: certification-blocking Class B implementation defect; owner actual-device evidence preserved. Cutover remains CLOSED.

King observed persisted multiple exchanges on phone but an empty authenticated desktop Pillow Centre. Mobile appearance is the preferred Owner UX design reference. Desktop whitespace/navigation/layout redesign is deferred to Owner UX; do not redesign mobile to match desktop.

Proven code defects:
- Browser-local host session ID bypassed server history hydration.
- Backend GET /api/pillow/history returns history at top level; client expected session.conversationHistory. Errors were swallowed.
- Ordinary session reuse expired after30minutes; fresh devices could allocate another conversation.
- Durable reasoning transcripts introduced4eb cover newly captured transcripts. Older phone-local saved displays must not be silently relabelled server/provider evidence.

Scoped correction:
- Native SQLite canonical_conversations binds ordinary workspace devices transactionally to one persisted ID, independent of expiry. forceNew remains isolated and cannot take over the canonical pointer.
- Authenticated existing session creation accepts bounded historicalBrowserTurns; stores them idempotently in owner+workspace-scoped browser_history, with verified=false/grantsAuthority=false/source=historical_browser_cache. No new mutation route/lock exemption.
- Browser archives are NOT imported into reasoning transcripts, knowledge, approvals or authority. Server transcripts and archival records remain distinct. No records deleted.
- Client normalizes the real history response, resolves server canonical ID at bootstrap/before sending, refreshes on focus/online/visibility and after reauthentication/remount. History failure is visible; never fake empty success.
- Before switching active cache, server archival acknowledgement is required. Original local-only records retained separately. No paid inference needed for migration.
- Only provenance text changes in UI; no visual redesign.
- Original OpenAI and multiprovider accounting/locks unchanged.

Verification: targeted backend canonical/restart/isolated-session and archive/idempotency/owner-scope tests; actual app two fresh authenticated logins resolve same ID and read same archive, unauthorized read401, protectedPOSTs/DELETE423 NOT_BORN/LOCKED; native child-process continuity. Frontend real response normalization and archive acknowledgement regression tests. Backend/full frontend typechecks pass. Production browser proof remains pending after deployment, including refreshing original phone cache once so its historical records can enter the server archive, then same-owner desktop reread.
This is not certification or live closure. Provider credentials/live receipts still pending; sharedUS$20 unchanged; I1 remains consumed and preserved.
