/** Text is inert. Only a complete top-level object enters the closed tool protocol. */
const ACTION_FIELDS = new Set(['readOnlyCalls','tool_calls','toolCalls','actions','function_call','action']);
export function parseResponseEnvelope(text: string): Record<string, unknown> | null {
  let value: unknown;
  try { value = JSON.parse(text); } catch { return null; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  const actionShape = (value: unknown): boolean => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const item=value as Record<string, unknown>;
    return typeof item.name === 'string' || (item.function !== null && typeof item.function === 'object');
  };
  const hasEnvelope = Object.keys(object).some(key => {
    if (!ACTION_FIELDS.has(key)) return false;
    const value=object[key];
    // Field names in ordinary structured data are not action requests either.
    if (key === 'readOnlyCalls' && Array.isArray(value)) return true;
    return Array.isArray(value) ? value.length > 0 && value.every(actionShape) : actionShape(value);
  });
  return hasEnvelope ? object : null;
}

/** No fallback synthesis: extract only an explicit provider-authored answer. */
export function preserveEnvelopeReasoning(envelope: Record<string, unknown>): string {
  const answers = ['answer','content','message'].filter(k => typeof envelope[k] === 'string' && (envelope[k] as string).trim());
  if (answers.length !== 1) throw Error('Read-only tool proposal refused; no unambiguous reasoning answer remains');
  return '[Server normalization: structured action requests were denied and omitted. The provider-authored reasoning below is unchanged; no execution or authority change occurred.]\n\n' + envelope[answers[0]!] as string;
}
