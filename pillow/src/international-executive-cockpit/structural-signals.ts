export const asStructuralSignal = <T>(value: T) => ({ value, structuralSignalOnly: true as const, unvalidatedClaim: "none" as const });
