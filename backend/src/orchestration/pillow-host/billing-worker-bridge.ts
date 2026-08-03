/** Safe offline snapshot; live billing operations remain in the Pillow worker. */
export function collectBillingWorkerSnapshot() {
  return {
    computedAt: new Date().toISOString(), missionId: "Q6-09", live: false,
    engine: { engineVersion: "PILLOW-BLW-001", missionId: "Q6-09", status: "idle", initializedAt: null, latestReport: null },
    cockpit: { missionId: "Q6-09", status: "idle", workerId: "wkr-billing-01", billingAccounts: 0, invoices: 0, transactions: 0, neverFabricateSuccessfulPaymentResults: true, neverReplacePaymentGatewayIntegrations: true, neverImplementQ610OrLater: true },
  };
}
