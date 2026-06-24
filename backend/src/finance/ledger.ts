import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import type {
  FinancialReport,
  LedgerBalanceSummary,
  LedgerDirection,
  LedgerEvent,
  LedgerEventType,
} from "./types.js";

const ALL_EVENT_TYPES: LedgerEventType[] = [
  "sale",
  "refund",
  "chargeback",
  "supplier_cost",
  "shipping",
  "advertising",
  "subscription",
  "royalty",
  "reserved_cash",
  "withdrawable_cash",
  "manual_adjustment",
  "tax",
  "payout",
];

/** Append-only financial ledger — balances are never overwritten. */
export class FinancialLedger {
  append(input: {
    workspaceId: string;
    companyId?: string;
    eventType: LedgerEventType;
    amountCents: number;
    currency?: string;
    direction: LedgerDirection;
    correlationId: string;
    source: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): LedgerEvent {
    if (input.amountCents < 0) {
      throw new Error("Ledger amount must be non-negative; use direction for sign semantics");
    }

    const db = getDatabase();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO financial_ledger_events
        (id, workspace_id, company_id, event_type, amount_cents, currency, direction,
         correlation_id, source, description, metadata, created_at)
       VALUES (@id, @workspaceId, @companyId, @eventType, @amountCents, @currency, @direction,
         @correlationId, @source, @description, @metadata, @createdAt)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      companyId: input.companyId ?? null,
      eventType: input.eventType,
      amountCents: input.amountCents,
      currency: input.currency ?? "USD",
      direction: input.direction,
      correlationId: input.correlationId,
      source: input.source,
      description: input.description,
      metadata: JSON.stringify(input.metadata ?? {}),
      createdAt,
    });

    return {
      id,
      workspaceId: input.workspaceId,
      companyId: input.companyId ?? null,
      eventType: input.eventType,
      amountCents: input.amountCents,
      currency: input.currency ?? "USD",
      direction: input.direction,
      correlationId: input.correlationId,
      source: input.source,
      description: input.description,
      metadata: input.metadata ?? {},
      createdAt,
    };
  }

  list(workspaceId: string, limit = 500): LedgerEvent[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM financial_ledger_events WHERE workspace_id = @workspaceId
         ORDER BY created_at ASC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Array<Record<string, unknown>>;

    return rows.map(mapRow);
  }

  summarize(workspaceId: string): LedgerBalanceSummary {
    const events = this.list(workspaceId, 10_000);
    const byType = Object.fromEntries(
      ALL_EVENT_TYPES.map((type) => [type, { credits: 0, debits: 0, net: 0 }]),
    ) as LedgerBalanceSummary["byType"];

    let totalCreditsCents = 0;
    let totalDebitsCents = 0;

    for (const event of events) {
      const bucket = byType[event.eventType];
      if (event.direction === "credit") {
        totalCreditsCents += event.amountCents;
        bucket.credits += event.amountCents;
      } else {
        totalDebitsCents += event.amountCents;
        bucket.debits += event.amountCents;
      }
      bucket.net = bucket.credits - bucket.debits;
    }

    return {
      workspaceId,
      currency: "USD",
      totalCreditsCents,
      totalDebitsCents,
      netCents: totalCreditsCents - totalDebitsCents,
      eventCount: events.length,
      byType,
      computedAt: new Date().toISOString(),
    };
  }

  generateReport(workspaceId: string, period = "mtd"): FinancialReport {
    const summary = this.summarize(workspaceId);
    const revenueCents = summary.byType.sale.net;
    const expensesCents =
      summary.byType.supplier_cost.debits +
      summary.byType.shipping.debits +
      summary.byType.advertising.debits +
      summary.byType.subscription.debits +
      summary.byType.tax.debits;
    const netProfitCents = revenueCents - expensesCents - summary.byType.refund.debits;
    const empireaiRoyaltyCents = Math.max(0, Math.round(netProfitCents * 0.1));
    const pendingRefundsCents = summary.byType.refund.debits;
    const pendingLiabilitiesCents =
      summary.byType.supplier_cost.debits + summary.byType.advertising.debits;
    const cashAvailableCents = summary.netCents;
    const safetyReserveCents = Math.round(cashAvailableCents * 0.15);
    const cashSafeToWithdrawCents = Math.max(
      0,
      cashAvailableCents - pendingRefundsCents - pendingLiabilitiesCents - safetyReserveCents,
    );

    return {
      workspaceId,
      period,
      revenueCents,
      expensesCents,
      netProfitCents,
      empireaiRoyaltyCents,
      founderReceivableCents: Math.max(0, netProfitCents - empireaiRoyaltyCents),
      pendingRefundsCents,
      pendingLiabilitiesCents,
      cashAvailableCents,
      cashSafeToWithdrawCents,
      forecastNote: "Forecast framework prepared — requires historical ledger depth and connector actuals.",
      generatedAt: new Date().toISOString(),
    };
  }
}

function mapRow(row: Record<string, unknown>): LedgerEvent {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    companyId: row.company_id ? String(row.company_id) : null,
    eventType: row.event_type as LedgerEventType,
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    direction: row.direction as LedgerDirection,
    correlationId: String(row.correlation_id),
    source: String(row.source),
    description: String(row.description),
    metadata: JSON.parse(String(row.metadata)) as Record<string, unknown>,
    createdAt: String(row.created_at),
  };
}

export const financialLedger = new FinancialLedger();
