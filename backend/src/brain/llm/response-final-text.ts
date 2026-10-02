/** Responses phase separates interim commentary from releasable final output. */
export function finalResponseText(output: unknown): string {
  if (!Array.isArray(output)) throw Error('Inference output invalid');
  const messages = output.filter(item => item?.type === 'message');
  if (messages.some(item => (item.role && item.role !== 'assistant') || (item.status && item.status !== 'completed') || (item.phase != null && !['commentary','final_answer'].includes(item.phase)))) throw Error('Inference message invalid');
  const phased = messages.some(item => item.phase != null);
  const finals = phased ? messages.filter(item => item.phase === 'final_answer') : messages;
  if (finals.length !== 1) throw Error('Inference final message ambiguous or absent');
  const parts = finals[0].content;
  if (!Array.isArray(parts) || parts.some(item => item?.type !== 'output_text' || typeof item.text !== 'string')) throw Error('Inference final content invalid');
  const content = parts.map(item => item.text).join('\n');
  if (!content.trim()) throw Error('Inference answer absent');
  return content;
}
