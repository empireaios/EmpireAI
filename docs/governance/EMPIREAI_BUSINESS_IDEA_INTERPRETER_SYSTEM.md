# EmpireAI Business Idea Interpreter

PILLOW-BII-001 / Q2-02 provides the Business Idea Interpreter.

The Business Idea Interpreter takes a simple Grand King business command and converts it into structured business intent for later Q2 missions.

> Note: Doctrine ID is **PILLOW-BII-001**. There is one authoritative Business Idea Interpreter. It prepares structured intent without implementing Q2-03 or later.

## Workflow

1. Accept a plain-language business command.
2. Identify the intended business type.
3. Extract the core business idea.
4. Extract optional fields when stated: target customer, product/service category, channel/platform, constraints, success objective.
5. Compute a confidence score and list missing information.
6. Produce a machine-readable Structured Business Intent record (`BII-001-v1`).

## Boundaries

The Business Idea Interpreter:

- **does** interpret business commands, structure business intent, identify missing information, and prepare output for later Q2 missions
- does **not** generate business models
- does **not** research markets
- does **not** build businesses
- does **not** assign workers
- does **not** execute anything
- does **not** implement Q2-03 or later

## Structured Business Intent

Each record includes: Intent ID, Timestamp, Original Command, Business Type, Business Idea, Target Customer, Product / Service Category, Channel / Platform, Constraints, Success Objective, Confidence Score, Missing Information, and Metadata version (`BII-001-v1`).

## Example commands

- Build a media business.
- Build a commerce business for local retailers via Shopify to achieve first 100 orders.
- Build a local cleaning business.
- Build an affiliate business.
- Build a digital product business.

## Safety

Credentials and authentication tokens are never exposed. Original commands are preserved for traceability. Sensitive values are masked in logs.
