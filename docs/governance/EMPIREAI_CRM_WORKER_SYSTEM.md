# EmpireAI CRM Worker

PILLOW-CRMW-001 / Q7-05 provides the CRM Worker inside the Local Business Factory.

The CRM Worker consumes Q7-04 Booking Reports and earlier factory worker outputs to maintain structural customer profiles, leads, contact history, booking-history links, follow-ups, opportunities, and CRM analytics. It produces machine-readable CRM Reports consumable by Q7-06. The CRM Worker never executes marketing campaigns, delivers customer jobs, or replaces booking functionality.

The CRM Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links CRM records to Local Business Factory Core projects via `businessProjectId` and to bookings via booking history links — it does not reimplement booking create/cancel.

## Workflow

1. Create and update customer profiles with lifecycle stage, tags, segments, and referral source.
2. Capture leads and update lead status (`new`, `contacted`, `qualified`, `proposal`, `won`, `lost`, `nurture`, `unknown`).
3. Record contact history and notes from explicit input only — never fabricate customer interactions.
4. Link booking history from `bookingReport`, `bookingId` + Booking Worker, or `fixtureBooking` (deterministic tests).
5. Schedule and complete follow-ups; track opportunities.
6. Update CRM lifecycle stages (`lead`, `prospect`, `active_customer`, `repeat_customer`, `inactive`, `churned`, `unknown`).
7. Generate CRM analytics from recorded data only.
8. Produce a machine-readable CRM Report (`CRMW-RPT-v1` / `CRMW-001-v1`) with `consumableByQ706: true`.
9. Submit findings through the Executive Reporting Runtime and preserve complete customer history and CRM audit history.

## Taxonomies

Extensible via config:

- **Lead statuses:** `new`, `contacted`, `qualified`, `proposal`, `won`, `lost`, `nurture`, `unknown`
- **Lifecycle stages:** `lead`, `prospect`, `active_customer`, `repeat_customer`, `inactive`, `churned`, `unknown`
- **Customer statuses:** `active`, `inactive`, `blocked`, `archived`, `unknown`

## Integrations

The worker integrates with:

- Local Business Factory Core
- Local Market Research Worker
- Service Offer Worker
- Booking Worker
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The CRM Worker:

- **does** maintain customer/lead/contact/follow-up records, link booking history, produce CRM analytics and reports consumable by Q7-06
- does **not** execute marketing campaigns
- does **not** deliver customer jobs
- does **not** replace booking functionality
- does **not** fabricate customer interactions
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q7-06 or later
- does **not** expose credentials or prohibited personal data

## CRM Report

Each report includes: reportId, timestamp, businessProjectId, customerId, leadStatus, contactHistory, bookingHistory, followUpSchedule, customerLifecycleStage, outstandingTasks, auditStatus, confidenceScore, metadataVersion, reportVersion, workerId, tags, segments, referralSource, repeatCustomer, opportunities, communicationHistory, boundary locks, submittedToExecutiveReporting, executiveReportId, traceabilityRefs, and `consumableByQ706: true`.

## Safety

Credentials and prohibited personal data are never exposed. Complete customer history, complete traceability, and CRM audit history are preserved. Sensitive values are masked in logs. Structural signals only.
