# EmpireAI WhatsApp Worker

PILLOW-WAW-001 / Q7-06 provides the WhatsApp Worker inside the Local Business Factory.

The WhatsApp Worker consumes Q7-05 CRM Reports and earlier factory worker outputs to manage structural WhatsApp conversations, inbound/outbound messages, templates, automation workflows, reminders, escalations, and CRM/booking trigger handoffs. It produces machine-readable WhatsApp Reports consumable by Q7-07. The WhatsApp Worker never replaces CRM, booking, or operations workers, and never fabricates message delivery results.

The WhatsApp Worker reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It links conversations to Local Business Factory Core projects via `businessProjectId` and triggers CRM/booking via injected dependency method calls — it does not reimplement CRM or booking.

## Workflow

1. Receive inbound enquiries and open conversations with status taxonomy.
2. Send outbound messages only through modular transport providers (fixture / sandbox / live stub); delivery results come solely from observed transport outcomes.
3. Apply message templates and run automation workflows (`enquiry_received`, `auto_reply`, `template_send`, `quotation`, `booking_trigger`, `crm_trigger`, `reminder`, `follow_up`, `status_update`, `escalate_human`, `unknown`).
4. Trigger CRM workflows via injected `crmWorker.captureLead` / `recordContact` / `scheduleFollowUp` — consume Q7-05 via `getQ706ConsumableContract`, `CrmReport`, or `fixtureCrm`.
5. Trigger booking workflows via injected `bookingWorker.createBooking` / `generateConfirmation`.
6. Schedule reminders and follow-up messages; escalate conversations to human agents; assign and label conversations.
7. Preserve complete conversation history and audit history.
8. Produce a machine-readable WhatsApp Report (`WAW-RPT-v1` / `WAW-001-v1`) with `consumableByQ707: true` and `evidenceMode`.
9. Submit findings through the Executive Reporting Runtime.

## Taxonomies

Extensible via config:

- **Conversation statuses:** `open`, `awaiting_customer`, `awaiting_agent`, `automated`, `escalated`, `resolved`, `closed`, `failed`, `unknown`
- **Message directions:** `inbound`, `outbound`
- **Automation step types:** `enquiry_received`, `auto_reply`, `template_send`, `quotation`, `booking_trigger`, `crm_trigger`, `reminder`, `follow_up`, `status_update`, `escalate_human`, `unknown`
- **Evidence modes:** `fixture`, `sandbox`, `cached`, `live`

## Integrations

The worker integrates with:

- Local Business Factory Core
- Booking Worker
- CRM Worker
- Notification Worker
- API Integration Worker
- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Boundaries

The WhatsApp Worker:

- **does** manage conversations/messages/templates/workflows, trigger CRM/booking via injected deps, produce WhatsApp reports consumable by Q7-07
- does **not** replace CRM
- does **not** replace booking worker
- does **not** replace operations worker
- does **not** modify unrelated platform components
- does **not** fabricate message delivery results
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q7-07 or later
- does **not** expose credentials or prohibited personal data

## WhatsApp Report

Each report includes: reportId, timestamp, businessProjectId, conversationId, customerReference, messageDirection, conversationStatus, templatesUsed, automationSteps, crmIntegrationStatus, bookingIntegrationStatus, auditStatus, outstandingIssues, confidenceScore, metadataVersion, reportVersion, workerId, messages, labels, assignedAgent, mediaAttachments, reminderSchedule, boundary locks, submittedToExecutiveReporting, executiveReportId, evidenceMode, traceabilityRefs, and `consumableByQ707: true`.

## Safety

Credentials and prohibited personal data are never exposed. Complete conversation history, complete traceability, and audit history are preserved. Sensitive values are masked in logs. Structural signals only. Transport success is never hard-coded — only observed fixture/sandbox/live outcomes count.
