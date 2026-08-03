# EmpireAI Operations Worker

PILLOW-OPSW-001 / Q7-09 provides the Operations Worker inside the Local Business Factory.

The Operations Worker consumes approved Q7-04 Booking Worker confirmations (`bookingStatus: "confirmed"`) and designs structural service delivery workflows: end-to-end operational stages, technician assignment design, fulfilment checklists, QA checkpoints, escalation workflows, completion workflows, and follow-up workflows. It produces machine-readable Operations Reports consumable by Q7-10.

The Operations Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links workflows to Local Business Factory Core projects via `businessProjectId`, to bookings via `sourceBookingId`, and, when available, to Lead Generation context via `sourceLeadGenReportId`. Booking, CRM, and Lead Generation are never replaced.

## Workflow

1. Consume an approved booking (`fixtureBooking`, `bookingReport`, or `bookingId` + injected Booking Worker). A booking is only accepted when `bookingStatus === "confirmed"`; any other status is rejected.
2. Generate an end-to-end service delivery workflow from the confirmed booking context.
3. Define the ordered operational stages for the workflow (extensible beyond the default sequence).
4. Define a technician assignment workflow — design only, never a real assignment or dispatch.
5. Define a fulfilment checklist tied to the workflow stages.
6. Define QA checkpoints tied to the workflow stages.
7. Define an escalation workflow describing trigger stages, conditions, and routing.
8. Define a completion workflow requiring customer sign-off before lifecycle closure.
9. Define a follow-up workflow with post-service touchpoints.
10. Produce a machine-readable Operations Report (`OPSW-RPT-v1` / `OPSW-001-v1`) with `consumableByQ710: true`. Confidence reflects artifact completeness only — it never claims that a job was actually performed.
11. Submit findings through the Executive Reporting Runtime and preserve workflow audit history.

## Integrations

The worker integrates with:

- Local Business Factory Core
- Booking Worker
- CRM Worker
- WhatsApp Worker
- Lead Generation Worker
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Performance Review (optional)
- Worker Recovery System

## Boundaries

The Operations Worker:

- **does** design service delivery workflows, operational stages, technician assignment, fulfilment checklists, QA checkpoints, escalation/completion/follow-up workflows, and produce Operations Reports
- does **not** perform customer services
- does **not** replace the Booking Worker
- does **not** replace the CRM Worker
- does **not** replace the Lead Generation Worker
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** fabricate operational evidence
- does **not** bypass Grand King approval
- does **not** implement Q7-10 or later

## Evidence discipline

Every workflow produced by the Operations Worker is a **structural design** derived from an approved (`bookingStatus: "confirmed"`) booking fixture. The worker never asserts that a job was executed, that a technician was actually dispatched, or that a customer sign-off was actually collected — it only designs the workflow that governs how such execution would be structured and audited.

## Operations Report

Each report includes: reportId, timestamp, businessProjectId, workflowId, serviceType, operationalStages, assignmentWorkflow, fulfilmentChecklist, qaCheckpoints, escalationWorkflow, completionWorkflow, followUpWorkflow, exceptionManagement, auditStatus, outstandingIssues, confidenceScore, metadataVersion, reportVersion, workerId, sourceBookingId, sourceLeadGenReportId, validation, runTimestamp, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, and `consumableByQ710: true`.

## Safety

Credentials are never exposed. Complete operational traceability and workflow audit history are preserved. Sensitive values are masked in logs. Structural signals only.
