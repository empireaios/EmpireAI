import type { PillowConversationTurn } from '../cockpit/pillow/pillow-session-store';

type Turn = PillowConversationTurn;
const time = (turn: Turn) => Date.parse(turn.recordedAt);
const near = (a: Turn, b: Turn) => Number.isFinite(time(a)) && Number.isFinite(time(b)) && Math.abs(time(a) - time(b)) <= 5000;

/** Server evidence wins; unbound archives remain visible and are never promoted to evidence. */
export function reconcilePillowHistory(server: readonly Turn[], archive: readonly Turn[]): Turn[] {
  const ordered = (rows: readonly Turn[]) => [...rows].sort((a,b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id));
  const authoritative = ordered(server);
  const historical = ordered(archive);
  const suppressed = new Set<string>();
  const sameIdentity = (a: Turn, b: Turn) => a.role === b.role && Boolean(a.requestId) && a.requestId === b.requestId;
  for (const row of historical) if (authoritative.some(s => sameIdentity(s,row))) suppressed.add(row.id);

  // Legacy host UUID and transport pcr IDs differ. Join only a unique exact owner
  // turn in the same five-second admission window, then its adjacent answer.
  // Content alone never merges repeated messages or unrelated assistant answers.
  const answerAfter = (rows: Turn[], index: number) => rows[index + 1]?.role === 'pillow' ? rows[index + 1] : undefined;
  for (let i=0; i<historical.length; i++) {
    const owner = historical[i]!;
    if (owner.role !== 'grand-king') continue;
    const matches = authoritative.map((row,index)=>({row,index})).filter(({row})=>row.role === owner.role && row.content === owner.content && near(row,owner));
    if (matches.length !== 1) continue;
    const {row: verified,index} = matches[0]!;
    if (historical.filter(row=>row.role === owner.role && row.content === verified.content && near(row,verified)).length !== 1) continue;
    suppressed.add(owner.id);
    const savedAnswer = answerAfter(authoritative,index), cachedAnswer = answerAfter(historical,i);
    if (savedAnswer && cachedAnswer && near(savedAnswer,cachedAnswer) &&
      (!savedAnswer.requestId || !verified.requestId || savedAnswer.requestId === verified.requestId)) suppressed.add(cachedAnswer.id);
  }
  const output = [...authoritative];
  for (const row of historical) {
    if (suppressed.has(row.id) || output.some(other=>other.id === row.id || sameIdentity(other,row))) continue;
    output.push(row);
  }
  return ordered(output);
}
