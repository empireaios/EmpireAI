# Work 7 Android continuation — 11 October 2026

The owner directive is preserved verbatim in owner-continuation-android-20261011.txt. It supplements the complete consolidated directive, original100 requirements, all20 modules, all15 safety guards and existing evidence. Production release is not authorised.

## Owner acceptance retained

The two Android images were independently inspected. At ~01:50 SGT an older saved exchange is displayed; the real keyboard, unsent short draft, visible composer/Send and readable conversation are accepted by the owner. Reduced keyboard reading space is acceptable. No repeated screenshot or acceptance is requested for those behaviours. Unobserved multiline, scroll and resize cases are not inferred.

1000033507.jpg SHA256 d79815ff62d7338b9d6df9ce3925a666507850a33a42ffb340236ac433caf677.
1000033508.jpg SHA256 7e39a50825f1df4c055a5544dd2b9088edcd69e1084330aba52c849a958c809b.

The overlap is visually present in the reduced-viewport image. Item37 now legitimately PASS for existing saved-exchange selection with original turns; other chat obligations retain their separate statuses. Counts17 PASS/74 PENDING/9 BLOCKED. All original item numbers and requirement texts remain unchanged.

## Toolbar repair and verification

The compact owner shell absolutely positioned Other pages over the conversation toolbar. The correction reserves normal flow space and keeps the expanded menu in flow. Status & evidence now anchors its panel below the conversation toolbar rather than at a fixed screen coordinate which could cover its own toggle. Desktop and composer behaviour are preserved. The existing expand operation also avoids a redundant state update when already expanded, eliminating the observed development render loop without changing session or inference paths.

The new test reproduced the predecessor failure at344px under visualViewport-only reduction to400px: Jump to latest x239.14/y3/w99.86/h44 intersects Other pages x261.89/y4/w74.11/h36. Layout-only resizing had not reproduced that specific Android case; that earlier passing observation was not accepted as defect reproduction.

Corrected targeted tests PASS: 320/344/390/400/1440 widths; saved older exchange, Jump, Other pages expansion/collapse, Status & evidence, 464/400/300/740 layout heights, visualViewport-only reduction and unsent short/multiline drafts. Existing five-viewport history/table/keyboard regression PASS, as does category UI390/1440. No /api/pillow/chat requests. Fixture400×464 retains277px/eight complete16px lines; simulated keyboard161px/five lines and multiline145px/four lines. These are isolated fixtures, not new native-device receipts. Local typecheck and affected lint PASS.

## Standalone cost categories

New backend draft PR111 e6d98fb57537c893c85afc552626235a38ba874c starts from deployed backend51830f9f, separate from PR110. It adds owner-only cost_category and provider_category events to the existing append-only journal, with stable identities, duplicate-name checks, revision fencing and idempotent retries. Archive retains existing assignments/history; new mappings require active categories. Numeric records, currency, approval and provider commissioning remain untouched.

PR109 adds category creation/edit/archive, vendor assignment and original-category restoration. Editing is explicitly disabled when the connected backend does not advertise the new contract. Potential taxonomy remains a checklist, not invented subscriptions. Backend durable reopen, amounts/history preservation, stale/duplicate rejection and real authenticated owner/foreign-origin tests pass; seven protected routes remain423. Frontend isolated create/edit/archive/reload/mapping tests pass. Live category persistence is NOT accepted on the old deployed backend; a separately authorised candidate backend is still required.

## Legacy reads and navigation

The deployed locked profile denies POST /brain/dispatch before dispatch. Legacy store, launch and workspace readers use that route. They now explain an observed423 as an authority restriction and disable futile Retry, with functional return links to current Products/Listings. This classifies the source-backed cause; it does not enable dispatch, fabricate company IDs or prove the fourteenth workspace detail route. Marketplace404 and remaining legacy read/control gaps stay open. Thirteen of fourteen contexts previously observed and all168 source routes remain retained. Static references are not a live interaction denominator.

## Recovery, preservation and remaining gates

PR109 recovered at5d986d78 with all four workflows PASS and READY preview dpl_9u2DsjdUCKGP616tqeLnRNS7d53T. Existing authenticated preview and production sessions were independently reused. Backend readback confirms51830f9f / Railway37ae1731-7399-4861-b5af-0d413157303d, NOT_BORN/LOCKED. At18:10:58UTC accounting224, journal3 and historical7 records retain original digests; zero inference. See preservation-android-20261011.json.

This containing frontend commit requires exact-head hosted CI and authenticated preview verification. Backend PR111 hosted CI and live candidate-backend acceptance remain distinct. PR110 stays separate and its stale-evidence incident is not falsely closed. Remaining nested controls/workspace detail, distinct native states, production release authority and independent closure are not passed by these tests. No lease, merge, production deployment, subscription, provider write or paid inference occurred.

Full fixed progress table: progress-matrix-20261011.md. Machine-readable tracker and UX register remain authoritative companions. WORK7 BLOCKED until required gates are legitimately satisfied.
