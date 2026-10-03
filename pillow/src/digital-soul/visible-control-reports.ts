/** Prose-only scope: a reported risk and a denied contrast are not actions.
 * Keep the positive clause for review; never apply this to executable requests.
 */
export function scopeVisibleControlReports(unit: string): string {
  let text = unit.replace(/[*#]/g, '').trim();
  if (/^(?:I|we|Pillow) (?:cannot|will not|would not|must not) (?:proceed|scale|pay|spend|execute) while (?:the )?(?:mandatory|Assurance) (?:finding|block|hold) remains (?:open|unresolved|in force)[.!?]*$/i.test(text))
    return 'Maintain the mandatory restriction pending independent clearance.';
  const noun = '[a-z -]{1,100}';
  const coordinatedDenial = new RegExp(`^(?:I|we|Pillow) (?:would|will|must) not (?:mark|declare|classify) (${noun}) as (?:passed|approved|cleared) or (?:bypass|override|ignore) (${noun})[.!?]*$`, 'i').exec(text);
  const actionOrException = /\b(?:if|unless|until|except|provided|otherwise|when|then|but|and|or|to|not|will|would|must|can|could|should|bypass|override|ignore|waive|execute|pay|spend|publish|proceed|follow|obey|do|clear|disable|remove)\b/i;
  if (coordinatedDenial && !actionOrException.test(coordinatedDenial[1]!) && !actionOrException.test(coordinatedDenial[2]!))
    return 'Maintain existing evidence and authority restrictions.';
  // A terminal negative contrast cannot contain an exception or another action.
  // The preceding condition applies to the retained positive review/escalation.
  text = text.replace(/(?:[—–]|,?\s+but)\s*not\s+(?:silently\s+)?(?:bypass|override|ignore|waive|circumvent|suspend)\s+(?:it|them|(?:the|its|their) (?:mandatory |existing )?(?:block|controls?|checks?|review|governance|approval)|Assurance)[.!?;]*$/i,
    '. Maintain the existing restriction.');
  // A bounded nominal warning reports an unsafe interpretation. Exclude finite
  // commitments, imperatives, quotations and conditional/exception tails.
  const risk = /^(?:the\s+)?(?:(?:main|primary|key|material)\s+)?risk\s+is\s+(?:treating|mistaking)\s+([a-z -]{1,160})\s+(?:as|for)\s+(?:permission|authority)\s+to\s+(?:bypass|override|ignore|waive|circumvent)\s+(?:the\s+)?(?:(?:mandatory|existing|constitutional)\s+)?(?:governance|approval|review|controls?|checks?|Assurance)[.!?]*$/i.exec(text);
  if (risk && !/\b(?:i|we|you|pillow|will|would|shall|should|must|can|could|do|follow|obey|proceed|execute|pay|spend|bypass|override|ignore|waive|if|unless|except|then|but|not|to)\b/i.test(risk[1]!))
    return 'Reported risk of an invalid permission inference; no authority granted.';
  return text;
}
