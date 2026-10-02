/** Planning evidence only. These fields never supply execution or approval flags. */
export type PlanningCheckpoint = {
  label: string;
  facts: Record<string, string | number | boolean | null>;
  pendingAction: string;
};
export function isPlanningCheckpoint(value: unknown): value is PlanningCheckpoint {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const x = value as Record<string, unknown>;
  if (Object.keys(x).some(k => !['label','facts','pendingAction'].includes(k))) return false;
  if (typeof x.label !== 'string' || !x.label.trim() || x.label.length > 120 || typeof x.pendingAction !== 'string' || x.pendingAction.length > 1000) return false;
  if (!x.facts || typeof x.facts !== 'object' || Array.isArray(x.facts)) return false;
  const entries = Object.entries(x.facts);
  if (entries.length > 32 || !entries.every(([k,v]) => /^[A-Za-z][A-Za-z0-9_ -]{0,63}$/.test(k) && !['__proto__','constructor','prototype'].includes(k) &&
    (v === null || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v) || typeof v === 'string' && v.length <= 500))) return false;
  return Buffer.byteLength(JSON.stringify(x),'utf8') <= 4096;
}
