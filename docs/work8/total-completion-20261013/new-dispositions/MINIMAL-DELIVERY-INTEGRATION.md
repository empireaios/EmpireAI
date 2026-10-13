# O30 remaining integration — design only

Published source `9080fece4da947f1bf1f2e91568e33e94b287686` has an injectable notification transport and a durable attempt ledger. Its default adapter explicitly fails because no transport is configured. It does not contain the independent operational delivery path required for full O30. This is a software, configuration and examination dependency, not only a credential dependency.

The shortest legitimate completion keeps accepted detection, incident classification, F27/F29 and restart protection intact:

1. Bind an existing independently hosted controller to the retained incident identity and original fault deadlines. Its delivery path and retained incident/attempt data must remain available while the tested primary is unavailable. An adapter that only runs inside the failed primary cannot satisfy this assertion.
2. Select one existing authorised provider and an explicitly confirmed owner destination. Implement only that provider's adapter behind the existing transport interface, with bounded timeout and response validation. Credentials must remain in the existing secure provider configuration; no credential search or plaintext artifacts.
3. Before sending, persist a unique notification identity containing incident ID, scenario/run ID, escalation type and stable destination binding. Reuse durable UNKNOWN-before-dispatch semantics. Provider acceptance must not be described as delivery without the provider's corresponding delivery evidence or an independently attributable owner receipt.
4. Retain provider message ID and independently acquired delivery/failed/unknown status alongside incident and attempt identity. An unknown outcome stays unresolved; no blind resend or automatic claim of recovery. If provider status lookup is available, reconciliation must validate the same message and recipient binding. A provider without usable delivery evidence needs an explicit independent owner receipt rather than an invented success.
5. Execute one isolated, expressly authorised examination using the original scenario/deadline. Establish the primary unavailable state; independently detect/escalate and deliver a clearly labelled owner alert. Record actual timestamps, primary/process identity, controller separation, durable incident and provider/owner receipt. Verify independent recovery correlation and no authority restoration. Send a recovery notice only if original escalation criteria require it and the message is authorised.
6. Independent review reconciles the complete original O30 boundary and accepted prior evidence. No production deployment or physical host destruction is needed for an isolated examination. Full autonomous operational readiness cannot be claimed from a manually sent Gmail message.

## Available connector options and limits

Gmail sending tools are exposed. They may supply a bounded authorised examination channel, but are not a deployed autonomous transport adapter or monitor. Railway webhook tools are exposed, but no existing configured receiver has been established; creating/testing an endpoint would transmit data and must not be done without applicable authority. No new provider, subscription, infrastructure or monitor is assumed.

## Consolidated decision only if needed

Confirm the existing owner notification provider/channel, owner destination and already authorised independent execution location. Authorise the exact labelled fault alert and, if required, its recovery notice. Access should be provided through normal secure configuration/connector approval. If no existing location/provider is available, the controller must present a concrete bounded setup proposal and cost before activation. Do not request credentials in chat.

No new complete acceptance, live delivery, paid activity or source modification is represented by this design.
