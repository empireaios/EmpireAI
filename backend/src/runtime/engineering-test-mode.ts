/** Deployment/recovery testing is not authority to run commerce or paid AI. */
export function isEngineeringTestMode(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.EMPIRE_ENGINEERING_TEST_MODE?.trim().toLowerCase();
  if (value == null || value === "" || value === "false" || value === "0") return false;
  if (value === "true" || value === "1") return true;
  throw new Error("EMPIRE_ENGINEERING_TEST_MODE must be true/false or 1/0");
}

export function assertCommerceAutomationAllowed(): void {
  if (isEngineeringTestMode()) {
    throw new Error("Commerce automation is disabled during engineering deployment/recovery testing");
  }
}

export function backgroundExecutionPolicy(options: {
  startWorkers?: boolean;
  startScheduler?: boolean;
} = {}): { startWorkers: boolean; startScheduler: boolean; commerceAutomation: boolean } {
  const engineering = isEngineeringTestMode();
  return {
    startWorkers: !engineering && Boolean(options.startWorkers),
    startScheduler: !engineering && Boolean(options.startScheduler),
    commerceAutomation: !engineering,
  };
}
