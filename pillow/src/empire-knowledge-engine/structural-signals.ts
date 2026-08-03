/** Bounds confidence values and guarantees that raw knowledge payloads are not retained. */
export function boundedStructuralScore(value: number | undefined, fallback: number): number { return Math.max(0, Math.min(100, value ?? fallback)); }
export function structuralSignal<T extends Record<string, unknown>>(value: T) { return { ...value, structuralSignalOnly: true as const }; }
