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
  return new RegExp(`^${subject} ${denial} ${action} ${boundedObject}$`).test(text);
}
