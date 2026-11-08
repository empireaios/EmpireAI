# V95 native examination candidate

This is preparation only. It creates no owner decision, reservation, provider
object, run, or application acceptance. V94 Q01–Q05 remains historical PASS;
the single V93/V94 qualification approval is consumed. The tracker remains 48 accepted /
16 outstanding until its original whole-application acceptance is adjudicated.

The proposed job reuses exactly artifact 13340201255, 338251567 bytes,
SHA-256 `39f904154764d2e70413045c7ebefbd4c04f38d0e09360ea19b2834fcc3ef755`.
It imports the three complete packages once, prepares the changed controller,
loads the pinned backend, checks the current host boundary, and imports the
source-pinned V94 diagnostic receipts. It does not run the Q01–Q05 campaign,
repeat protected handoffs, reconstruct application packages, or upload another
package artifact. Current source rejection tests and current host admission
observations are distinguished from historical qualification evidence.

## Source and external authority

After all candidate edits are complete, run `python3 -B acceptance/bind_source.py`
locally to freeze the complete regular-file bytes and Git modes. Its only
manifest exclusion is the manifest itself; the external record pins that file
separately. `--check` compares the exact frozen bytes without rewriting them.
This operation creates no authority. The required single parent is
`f5b1ab0da64f38f1a0503f5eb7ebf516bfd77ba8`.

Only after a separate owner decision and distinct accounting reservation may
the nonoperative `external-release.template.json` become an external record at
`acceptance/v95-release.json` on `work8/v95-review-20261108`. Do not edit the
candidate to record approval. The record must bind the independently read-back
complete tree, exact sole parent, complete source manifest SHA-256, and workflow
SHA-256. Commit metadata may vary only while these bindings remain identical.
The read-back review commit must have the API-linked author `empireaios` /
`295548100`; arbitrary Git author strings do not satisfy the transport gate.

The operative record requires one attempt, one 300-minute job, maximum additional
exposure US$0.01, maximum reservation US$0.01, and no automatic retry. Its
`launchPlan` must equal the reviewed `v65/launch-plan.json` except for `status`
(`OWNER_APPROVED_EXTERNAL_RELEASE`) and the separately validated `authority`.
The authority must cite the hashes of both embedded receipts. Receipt hashes
use SHA-256 over UTF-8 `json.dumps(receipt, sort_keys=True,
separators=(',', ':'))`, **without a trailing newline**. The reservation receipt
binds the owner receipt hash and the same approved source; its record type is
`ACCOUNTING_HOLD_NOT_PROVIDER_CHARGE`. Current authority is determined by these
external receipts and the operative `authority`, not proposal snapshots in the
source template.

The distinct future reservation ID is `V95-A5-NATIVE-ONCE-20261108`. Its proposed
US$0.01 would move holds from 12.15/2.20 to 12.16/2.21 and unreserved A5 authority
from 7.80 to 7.79. These are proposed values, not a committed hold or an observed
provider charge. Preserve the prior consumed qualification reservation.

Never create `work8/v95-a5-20261108` until independent provider readback verifies
all release gates and confirms no prior matching run. Its creation launches the
one job. Unknown provider state is not permission to repeat a write. Never
delete, move, recreate, or rerun the launch branch or job.

## Same-host sequence and evidence return

The workflow has one standard `ubuntu-24.04` job with a 300-minute ceiling. All 17
step timeout maxima sum to 210 minutes. It waits at most 1500 seconds for each
independent acknowledgment; a deadline cannot substitute for an ACK.

The existing external ACK transport remains unchanged. First acknowledge the
current package/executor metadata artifact at
`v65-review/<runId>/packages-and-executor.json` on the review branch. Only then
may actual initialized Brain preflight run. Independently read back and
acknowledge its artifact at `v65-review/<runId>/preflight.json` before the single
full native lifecycle. The job cannot create either acknowledgment.

At most three current artifacts are uploaded: executor metadata, preflight,
and final-or-first-failure evidence. Retention is seven days so an interrupted
Work session does not immediately lose the independently retrievable evidence.
Preupload bounds are
64 MiB/1 MiB/1 MiB with 16 MiB reserved per ZIP envelope, at most 129 metadata files and
exactly two files in each native export. Declared payload plus envelopes is at
most 114 MiB, below the 128 MiB cumulative service ZIP cap. Provider readback checks
actual bytes, digest, count, current run/commit binding, and at most 169 hours
observed retention; the financial proposal reserves a further hourly boundary.
At the full 128 MiB cap, 170 billable hours has a base storage estimate of
US$0.00790551. Including the conservative allowance for two monthly rounding
boundaries, the total bound is US$0.00814965, within the unchanged US$0.01
proposed authority.

First failure stops subsequent normal workflow stages. Cleanup only touches the
current identity-bound campaign and has a 600-second global budget inside an
11-minute workflow step, leaving time to persist its receipt. No identity
means no resource cleanup authority. Source admission failures still permit
strictly bounded sanitized first-failure export and read-only provider-bound
artifact verification; that path never grants source or native admission.

Local verification is limited to `python3 -B acceptance/test_orchestration.py -v`
and other explicitly scoped candidate checks. These tests use synthetic
in-memory authority and temporary metadata files; they do not obtain authority,
contact providers, load packages, start Docker, initialize Brain, or execute
A5-08/A5-09. Final whole-row adjudication remains independent of a green job.
