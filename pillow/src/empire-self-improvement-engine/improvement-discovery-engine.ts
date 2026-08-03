/** Categorises structural failure signals; never performs remediation. */
export class FailureDetectionEngine { readonly structuralSignalsOnly = true as const; }
