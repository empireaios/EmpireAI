import { treasuryEngine } from "./treasury-engine.js";
import { financialLedger } from "../finance/ledger.js";
import type { TreasurySnapshot } from "./types.js";

export type WithdrawalRuleViolation = {
  ruleId: string;
  message: string;
  severity: "block" | "warn";
};

export type WithdrawalValidation = {
  allowed: boolean;
  requestedCents: number;
  withdrawableCents: number;
  violations: WithdrawalRuleViolation[];
  treasury: TreasurySnapshot;
  validatedAt: string;
};

export type WithdrawalRule = {
  id: string;
  description: string;
  evaluate: (ctx: {
    workspaceId: string;
    requestedCents: number;
    treasury: TreasurySnapshot;
  }) => WithdrawalRuleViolation | null;
};

const WITHDRAWAL_RULES: WithdrawalRule[] = [
  {
    id: "max-withdrawable",
    description: "Withdrawal cannot exceed withdrawable cash bucket",
    evaluate: ({ requestedCents, treasury }) =>
      requestedCents > treasury.buckets.withdrawable_cash
        ? {
            ruleId: "max-withdrawable",
            message: `Requested ${requestedCents} exceeds withdrawable ${treasury.buckets.withdrawable_cash}`,
            severity: "block",
          }
        : null,
  },
  {
    id: "positive-amount",
    description: "Withdrawal amount must be positive",
    evaluate: ({ requestedCents }) =>
      requestedCents <= 0
        ? { ruleId: "positive-amount", message: "Amount must be greater than zero", severity: "block" }
        : null,
  },
  {
    id: "safety-reserve-intact",
    description: "Safety reserve must remain intact after withdrawal",
    evaluate: ({ requestedCents, treasury }) => {
      const remaining = treasury.buckets.available_cash - requestedCents;
      const minReserve = treasury.buckets.safety_reserve;
      return remaining < minReserve
        ? {
            ruleId: "safety-reserve-intact",
            message: "Withdrawal would breach safety reserve",
            severity: "block",
          }
        : null;
    },
  },
  {
    id: "royalty-reserved",
    description: "EmpireAI royalty must remain reserved",
    evaluate: ({ treasury }) =>
      treasury.buckets.reserved_cash < treasury.empireaiRoyaltyCents
        ? {
            ruleId: "royalty-reserved",
            message: "Royalty reserve not fully allocated",
            severity: "warn",
          }
        : null,
  },
];

/** Treasury / Withdrawal Framework — validates withdrawals against cash bucket rules. */
export class WithdrawalRulesFramework {
  listRules(): WithdrawalRule[] {
    return [...WITHDRAWAL_RULES];
  }

  validate(workspaceId: string, requestedCents: number): WithdrawalValidation {
    const treasury = treasuryEngine.compute(workspaceId);
    const violations: WithdrawalRuleViolation[] = [];

    for (const rule of WITHDRAWAL_RULES) {
      const violation = rule.evaluate({ workspaceId, requestedCents, treasury });
      if (violation) violations.push(violation);
    }

    const blocked = violations.some((v) => v.severity === "block");

    return {
      allowed: !blocked,
      requestedCents,
      withdrawableCents: treasury.buckets.withdrawable_cash,
      violations,
      treasury,
      validatedAt: new Date().toISOString(),
    };
  }

  /** Record approved withdrawal as append-only payout ledger event. */
  executeWithdrawal(
    workspaceId: string,
    requestedCents: number,
    source = "treasury-withdrawal",
  ): { validation: WithdrawalValidation; eventId?: string } {
    const validation = this.validate(workspaceId, requestedCents);
    if (!validation.allowed) {
      return { validation };
    }

    const event = financialLedger.append({
      workspaceId,
      eventType: "payout",
      amountCents: requestedCents,
      direction: "debit",
      correlationId: `withdrawal:${workspaceId}:${Date.now()}`,
      source,
      description: "Founder withdrawal (validated)",
      metadata: { withdrawableBefore: validation.withdrawableCents },
    });

    return { validation, eventId: event.id };
  }
}

export const withdrawalRulesFramework = new WithdrawalRulesFramework();
