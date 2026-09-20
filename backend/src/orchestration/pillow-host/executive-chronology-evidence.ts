/**
 * A chronology is supplied evidence, not a numbered instruction list or a
 * commerce objective. Keep fallback answers tied to its actual observations.
 */
const TEMPORAL_PREFIX = /^(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?\b|\d{4}[-/]\d{1,2}[-/]\d{1,2}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?|\d{1,2}\s+[A-Za-z]{3,9}\.?\s+\d{4}(?:\s+\d{1,2}:\d{2})?)/;
const CHRONOLOGY_REQUEST = /\b(?:timeline|chronolog\w*|sequence of events|event sequence|event log summary)\b/i;

/** Narrow comparison only: identical timestamp/observation description/unit,
 * different numeric measurement. Keep every other identifier (including sample)
 * intact; do not equate different sensors, samples, units or timestamps.
 */
function conflictingMeasurements(events: string[]): string[][] {
  const groups = new Map<string, Map<string, string>>();
  for (const event of events) {
    const stamp = TEMPORAL_PREFIX.exec(event)?.[0];
    if (!stamp) continue;
    const body = event.slice(stamp.length).trim();
    const measurements = [...body.matchAll(/(?<![\w.])(-?\d+(?:\.\d+)?)\s*(bar|psi|kpa|mpa|pa|°c|°f|celsius|fahrenheit|volts?|rpm|%)(?!\w)/gi)];
    // Multiple measurements need richer entity/attribute binding than this fallback.
    if (measurements.length !== 1) continue;
    const measurement = measurements[0]!;
    const context = `${body.slice(0, measurement.index)}<reading> ${measurement[2]}${body.slice(measurement.index! + measurement[0].length)}`.toLowerCase().replace(/\s+/g, " ");
    const key = `${stamp.toLowerCase()}|${context}`;
    const values = groups.get(key) ?? new Map<string, string>();
    values.set(String(Number(measurement[1])), event);
    groups.set(key, values);
  }
  return [...groups.values()].filter((values) => values.size > 1).map((values) => [...values.values()]);
}

export function synthesizeChronologyObligation(subject: string, supplied: string): string | null {
  if (!CHRONOLOGY_REQUEST.test(supplied)) return null;
  const events = supplied.split(/\n+/).map((line) => line.trim()).filter((line) => TEMPORAL_PREFIX.test(line));
  if (events.length < 2) return null;
  const heading = subject.trim();
  const conflicts = conflictingMeasurements(events);
  if (CHRONOLOGY_REQUEST.test(heading)) {
    return `Supplied timeline, in the order recorded (not independently verified):\n${events.map((event) => `- ${event}`).join("\n")}`;
  }
  if (/\b(?:causal|causality|causation|cause|causes|why it happened)\b/i.test(heading)) {
    const assertions = events.filter((event) => /\b(?:caused|triggered|because|resulted from|led to)\b/i.test(event));
    return [
      "Chronological order alone does not establish a causal chain. Earlier and later observations are not proof that one caused another.",
      assertions.length
        ? `The log explicitly states these causal assertions, which still require corroboration:\n${assertions.map((event) => `- ${event}`).join("\n")}`
        : "No explicit causal link appears in the timestamped observations; the mechanism remains unproven.",
    ].join("\n\n");
  }
  if (/\b(?:contradict\w*|conflict\w*|inconsisten\w*)\b/i.test(heading)) {
    if (conflicts.length) {
      return [
        "Conflicting reported measurements: entries with the same timestamp, observation description and unit contain different values:",
        ...conflicts.map((group) => group.map((event) => `- ${event}`).join("\n")),
        "These values cannot both describe the same measurement. The supplied record does not establish which is correct; reconcile the original sample and sensor records before selecting a value. This is a bounded numeric check, not an exhaustive contradiction audit.",
      ].join("\n\n");
    }
    return "Partial contradiction check: no conflicting numeric readings with an identical timestamp, observation description and unit were identified. Other contradictions remain unresolved; this bounded comparison cannot certify that the records are consistent. Different observations at different times may describe a change, not a contradiction.";
  }
  if (/\b(?:unknown|uncertain\w*|missing|gaps?)\b/i.test(heading)) {
    return "Unknowns include the accuracy and completeness of the timestamps, unrecorded intervening events, and the mechanism connecting observations. The supplied entries do not independently verify a root cause or prove that an apparent recovery persisted.";
  }
  if (/\b(?:conclusion|conclude|synthesis|supported finding)\b/i.test(heading)) {
    if (conflicts.length) {
      return `The supplied record contains conflicting numeric reports for the same timed observation: ${conflicts.map((group) => group.map((event) => `“${event}”`).join(" versus ")).join("; ")}. No single disputed reading or causal explanation is established. Resolve these discrepancies before relying on the sequence for a decision.`;
    }
    return `The supported conclusion is limited to what the supplied record reports: its first listed observation is “${events[0]}” and its last listed observation is “${events[events.length - 1]}”. This supports a reported sequence, not an independently verified causal explanation or a claim about current live operations.`;
  }
  if (/\b(?:verif\w*|next check|checks? next|check next|validation|follow-up)\b/i.test(heading)) {
    return "Next verification: obtain the original event logs and confirm timestamp alignment; compare telemetry for each transition; test any proposed causal mechanism against competing explanations; and confirm the later state with a fresh observation. Preserve discrepancies instead of treating a plausible sequence as proof.";
  }
  return null;
}
