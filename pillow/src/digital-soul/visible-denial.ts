/** Recognize complete, unconditional denials in visible prose only.
 * Never apply this transformation to an owner request or an executable action.
 * Unknown grammar stays in the constitutional review input.
 */
export function isExplicitVisibleDenial(clause: string): boolean {
  const text = clause.toLowerCase().replace(/[’‘]/g, "'")
    .replace(/[*#]/g, "").trim().replace(/[.!?;:]+$/, "").trim();
  if (/\b(?:if|unless|until|except|provided|otherwise|instead|while|although|when|because|also|anyway)\b/.test(text)) return false;
  // Dismissal must name third-party instructions, never governance itself.
  if (/^(?:reject|ignore|disregard) (?:the |these |those )?(?:untrusted|external|third-party|supplier|vendor) (?:instructions|requests|claims|directions)$/.test(text)) return true;
  const action = "(?:bypass|override|ignore|waive|suspend|change|grant|disable)";
  const object = "(?:the|any|existing|required|mandatory|owner|grand|king|constitutional|constitution|governance|approval|authority|authorization|authorisation|process|gate|workflow|control|controls|check|checks|safeguards|review|rules|locks|lock|state|birth|commerce)";
  const boundedObject = `${object}(?: ${object}){0,11}`;
  const rejection = new RegExp(`^(?:reject|refuse) (?:the |this |that )?(?:request|instruction|attempt) to ${action} ${boundedObject}$`);
  if (rejection.test(text)) return true;
  const subject = "(?:the|this|that|an?|any) (?:(?:unsigned|untrusted|external|third-party|supplier|vendor) )?(?:document|attachment|message|note|email|claim|request|instruction|source|footer)";
  const denial = "(?:cannot|can't|does not|doesn't|has no authority to|does not grant authority to)";
  if (new RegExp(`^${subject} ${denial} ${action} ${boundedObject}$`).test(text)) return true;
  // Grammar, not a catalogue of document names: a short noun subject may
  // unconditionally deny authority. Keep nested actions and ambiguous tails.
  const negative = /^(.*?)\b(?:cannot|can't|will not|won't|must not|does not|doesn't|is not authori[sz]ed to|has no authority to)\s+(bypass|override|ignore|waive|circumvent|suspend|disable|grant|confer|suppress|delete|erase|hide)\s+(.+)$/.exec(text);
  if (!negative) return false;
  const [, nounSubject, , nounObject] = negative;
  const nounPhrase = (value: string) => /^[a-z][a-z' -]{0,160}$/.test(value.trim()) &&
    value.trim().split(/\s+/).length <= 16 &&
    !/\b(?:bypass|override|ignore|waive|circumvent|suspend|disable|grant|confer|suppress|delete|erase|hide|execute|publish|pay|send|transfer|run|proceed|follow|obey|do|not|and|or|but|then|to|because)\b/.test(value);
  return nounPhrase(nounSubject!) && nounPhrase(nounObject!);
}
