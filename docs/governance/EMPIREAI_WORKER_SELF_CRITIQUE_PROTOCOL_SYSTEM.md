# EmpireAI Worker Self-Critique Protocol System

PILLOW-WSCP-001 / Q0-28 provides the Worker Self-Critique Protocol.

The Worker Self-Critique Protocol ensures every AI Worker performs an independent quality review of its own completed work before submitting it to another worker or to Pillow. A worker must not simply complete work — it must first challenge its own work.

This protocol reduces errors before Peer Review and before Executive Review.

The Worker Self-Critique Protocol NEVER performs the worker's task. It evaluates the completed result.

> Note: Doctrine ID is **PILLOW-WSCP-001**. There is one authoritative Worker Self-Critique Protocol. Every AI Worker must complete this protocol before submitting work for Peer Review or Executive Review.

## Boundaries

The Worker Self-Critique Protocol:

- **does** evaluate completed work, detect weaknesses, recommend revisions, and produce self-critique records
- does **not** replace Peer Review Runtime
- does **not** replace Worker Quality Standard
- does **not** execute worker tasks
- does **not** override Pillow
- does **not** override Grand King

## Self-Critique Record

Each record includes: Self Critique ID, Timestamp, Worker ID, Mission ID, Output Reviewed, Completeness Score, Logical Consistency, Evidence Review, Weaknesses Found, Suggested Improvements, Revised Confidence Score, Submission Decision, and Metadata version (`WSCP-001-v1`).

## Self-critique checklist

Default checks: completeness, correctness, evidence, internal consistency, assumptions, risks, missing information, quality, executive readiness.

Additional quality checks can be registered through configuration without redesigning the protocol.

## Submission decisions

Minimum decisions: submit, revise before submit, escalate, reject output.

## Safety

Credentials and authentication tokens are never exposed. Critique operations preserve auditability and traceability. Sensitive values are masked in logs. Self-critique records never claim that the protocol replaced Peer Review Runtime, replaced Worker Quality Standard, executed worker tasks, overrode Pillow, or overrode Grand King.
