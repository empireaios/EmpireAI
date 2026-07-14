# EmpireAI Multi-Proposal Generator System

**Mission ID:** T4-04  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-MPG-001

## Constitutional Purpose

Implement the Multi-Proposal Generator for Pillow. This mission consumes Screen Annotation from T4-03 and enables Pillow to generate multiple redesign options for EmpireAI UX collaboration.

## Scope (T4-04 Only)

Multiple redesign option generation · requirement interpretation · proposal strategy · category-specific generators · UX finding linkage · builder capability mapping.

**Out of scope:** Side-by-side comparison · explain decisions · approval workflow · preference learning · continuous collaboration · autonomous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Multi-Proposal Generator (T4-04 / PILLOW-MPG-001)            │
├─────────────────────────────────────────────────────────────┤
│  Multi-Proposal Generator Manager                           │
│  Proposal Requirement Interpreter                           │
│  Proposal Strategy Engine                                   │
│  Layout / Component / Navigation / Workflow / Theme         │
│  Accessibility / Consistency / Extended Generators          │
│  Proposal Evidence Linker · Builder Capability Mapper       │
│  Proposal Metadata Generator · Proposal Validator             │
│  Health Monitor · Recovery Manager                          │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T4-01 Natural UX Conversation · T4-02 Voice UX Commands
         │ T4-03 Screen Annotation · T2 UX Intelligence · T3 Builder Certification
```

## Safety

- Preserves Grand King control.
- Generates options only — does **not** apply or approve changes.
- Does **not** modify files directly.
- Keeps proposal generation separate from implementation execution.
- Preserves traceability between intent, annotation, and proposal.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MULTI_PROPOSAL_GENERATOR_ENABLED` | `true` | Enable/disable generator |
| `MULTI_PROPOSAL_GENERATOR_MIN_COUNT` | `3` | Minimum proposals per run |
| `MULTI_PROPOSAL_GENERATOR_MAX_COUNT` | `8` | Maximum proposals per run |
| `MULTI_PROPOSAL_GENERATOR_CONFIDENCE_THRESHOLD` | `0.5` | Minimum confidence |
| `MULTI_PROPOSAL_GENERATOR_MAX_RETRIES` | `3` | Recovery attempts |
| `MULTI_PROPOSAL_GENERATOR_TIMEOUT_MS` | `120000` | Generation timeout |
| `MULTI_PROPOSAL_GENERATOR_LOG_LEVEL` | `info` | Logging level |
| `MULTI_PROPOSAL_GENERATOR_AUTO_RECOVER` | `true` | Automatic recovery |

External file: `config/multi-proposal-generator.config.json`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/multi-proposal-generator` | Engine state + latest report |
| POST | `/api/pillow/multi-proposal-generator/generate` | Generate multiple redesign proposals |

## Completion Outcome

Multiple redesign options — better decision making. The Grand King can review diverse UX redesign options before any action is taken.
