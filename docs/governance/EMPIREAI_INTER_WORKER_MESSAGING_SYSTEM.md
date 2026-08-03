# EmpireAI Inter-Worker Messaging System

PILLOW-IWM-001 / Q0-24 provides the Inter-Worker Messaging service.

The Inter-Worker Messaging service is the standardized communication layer used by every AI Worker inside the EmpireAI Workforce. Workers must never communicate through ad-hoc methods. Every communication must be structured, traceable, auditable, and context-aware. Pillow must be able to inspect every message exchanged throughout the organization.

The Inter-Worker Messaging service never performs worker tasks. It only transports executive communication.

> Note: Doctrine ID is **PILLOW-IWM-001**. There is one authoritative Inter-Worker Messaging service. All communication between AI Workers must pass through this service.

## Boundaries

The Inter-Worker Messaging service:

- **does** transport messages, preserve message history, route communications, track delivery, and maintain context
- does **not** execute worker logic
- does **not** modify worker decisions
- does **not** replace Workforce Orchestrator
- does **not** override Pillow
- does **not** override Grand King

## Message Record

Each record includes: Message ID, Timestamp, Sender Worker, Receiver Worker, Business ID, Mission ID, Conversation ID, Message Type, Priority, Message Summary, Payload Reference, Delivery Status, and Metadata version (`IWM-001-v1`).

## Message types

Default: task request, task response, information, review request, review response, approval request, approval response, escalation, broadcast, system notification.

Additional message types can be registered through configuration without redesigning the service.

## Delivery states

Default: queued, sent, delivered, read, acknowledged, failed, expired.

## Safety

Credentials and authentication tokens are never exposed. Messaging operations preserve auditability and traceability. Sensitive values are masked in logs. Message records never claim that the service executed worker logic, modified worker decisions, replaced Workforce Orchestrator, overrode Pillow, or overrode Grand King.
