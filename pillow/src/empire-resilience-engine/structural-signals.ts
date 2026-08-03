export function sanitizeStructuralSignal(value: unknown) { return typeof value === "string" ? "[structural signal]" : value; }
