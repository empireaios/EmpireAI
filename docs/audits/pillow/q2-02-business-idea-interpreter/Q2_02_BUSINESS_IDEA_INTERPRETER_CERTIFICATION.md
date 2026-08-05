# Q2-02 Business Idea Interpreter

**Status:** FINAL PASS  
**Doctrine:** PILLOW-BII-001  
**Programme:** Q2 — Empire Builder Factory  
**Mission:** Q2-02 Business Idea Interpreter  
**Primary Deliverable:** Understand simple business commands and convert them into structured business intent.

> Doctrine ID uses **PILLOW-BII-001**. Business Idea Interpreter structures intent only; it never generates models, researches markets, builds businesses, assigns workers, executes anything, or implements Q2-03+.

## How Q2-02 works

1. A plain-language Grand King command is accepted.
2. Business type and core idea are identified.
3. Optional fields are extracted when stated.
4. Missing information and confidence score are computed.
5. A machine-readable Structured Business Intent (`BII-INT-v1` / `BII-001-v1`) is produced for later Q2 missions.

## Prerequisites

- Q2-01 Empire Builder Factory Core (`PILLOW-EBF-001`)

## Verification

`npx --yes tsx --test "src/validation/tests/business-idea-interpreter.test.ts"` — 10 passing, 0 failing.
