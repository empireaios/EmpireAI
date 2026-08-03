# EmpireAI Billing Worker System

The Billing Worker implements Q6-09 under doctrine `PILLOW-BLW-001`. It owns billing account, subscription, invoice, transaction-record, refund, credit-note, and audit-history orchestration.

It does not replace `pillow/src/payment-gateway-integration/`, authenticate users, manage authorization, override Pillow, Grand King, or approved architecture, implement Q6-10 or later, or fabricate a successful provider result. A payment becomes successful only through an explicit `recordPaymentProviderResult` event.
