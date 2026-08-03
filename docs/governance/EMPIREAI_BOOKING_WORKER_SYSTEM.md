# EmpireAI Booking Worker

PILLOW-BKW-001 / Q7-04 provides the Booking Worker inside the Local Business Factory.

The Booking Worker consumes Q7-03 Service Offer Reports and produces structural booking records, calendar availability, worker assignments, conflict checks, and booking confirmations. It produces machine-readable Booking Reports consumable by Q7-05. The Booking Worker never performs the service, processes payments, or replaces CRM.

The Booking Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links bookings to Local Business Factory Core projects via `businessProjectId` and to approved offers via `sourceOfferReportId`.

## Workflow

1. Consume validated service offers from `serviceOfferReport`, `reportId` + Service Offer Worker, or `fixtureServiceOffer` (deterministic tests). Only approved catalogue/package offerings may be booked.
2. Manage calendars and set availability windows for technicians/workers.
3. Allocate time slots deterministically from availability windows.
4. Create bookings with availability validation against calendar and conflict index.
5. Assign workers with hard-fail on double-book (same assignedWorker overlapping intervals). Same customer+slot yields a soft warning only.
6. Modify, reschedule, or cancel bookings. Cancelling frees the slot.
7. Generate confirmations only for valid non-cancelled bookings — never fabricate confirmations.
8. Produce a machine-readable Booking Report (`BKW-RPT-v1` / `BKW-001-v1`) with `consumableByQ705: true`.
9. Submit findings through the Executive Reporting Runtime and preserve booking audit history.

## Booking statuses

Extensible statuses: `draft`, `pending_confirmation`, `confirmed`, `modified`, `rescheduled`, `cancelled`, `completed_booking_record`, `failed`, `unknown`.

`completed_booking_record` means the booking lifecycle is closed — **not** that service fulfilment was executed.

## Integrations

The worker integrates with:

- Local Business Factory Core
- Local Market Research Worker
- Service Offer Worker
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The Booking Worker:

- **does** consume Q7-03 approved offers, create/manage bookings and calendars, assign workers, prevent conflicts, generate valid confirmations, and produce booking reports
- does **not** perform the service
- does **not** process payments
- does **not** replace CRM
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** fabricate booking confirmations
- does **not** bypass Grand King approval
- does **not** implement Q7-05 or later

## Conflict discipline

Same `assignedWorker` cannot have overlapping scheduled intervals (hard fail). Cancelling a booking frees the slot and removes the worker from the conflict index. Same customer+slot is a soft warning.

## Booking Report

Each report includes: reportId, timestamp, businessProjectId, bookingId, customerReference, serviceSelected, scheduledDateTime, assignedWorker, bookingStatus, availabilityValidation, auditStatus, outstandingIssues, confidenceScore, metadataVersion, reportVersion, workerId, sourceOfferReportId, packageId, serviceArea, durationMinutes, reminderScheduled, recurringSeriesId, conflictCheckPassed, confirmationId, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, and `consumableByQ705: true`.

## Safety

Credentials are never exposed. Complete traceability and booking audit history are preserved. Sensitive values are masked in logs. Structural signals only.
