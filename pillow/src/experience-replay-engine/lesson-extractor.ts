import { XPL_METADATA_VERSION } from "./paths.js";
import type {
  ExperienceRecord,
  ExperienceReplayEngineInput,
  HistoricalExecutionEvent,
  LearnedLesson,
  RepeatedMistake,
  ValidationStatus,
} from "./types.js";

export type LearningResult = {
  records: ExperienceRecord[];
  lessons: LearnedLesson[];
  repeatedMistakes: RepeatedMistake[];
  patterns: string[];
};

/** Analyses history, detects patterns/mistakes, and extracts reusable lessons. */
export class LessonExtractor {
  learn(
    input: ExperienceReplayEngineInput,
    history: HistoricalExecutionEvent[],
    mistakeRepeatThreshold: number,
    sourcesApplied: string[],
  ): LearningResult {
    const repeatedMistakes = this.detectRepeatedMistakes(history, mistakeRepeatThreshold);
    const patterns = this.identifyPatterns(history, repeatedMistakes);
    const lessons = this.extractLessons(history, repeatedMistakes, patterns);
    const records = history.map((event) =>
      this.buildRecord(input, event, history, lessons, repeatedMistakes, patterns, sourcesApplied, "passed"),
    );
    return { records, lessons, repeatedMistakes, patterns };
  }

  analyseSubset(
    input: ExperienceReplayEngineInput,
    history: HistoricalExecutionEvent[],
    allHistory: HistoricalExecutionEvent[],
    mistakeRepeatThreshold: number,
    sourcesApplied: string[],
    validationStatus: ValidationStatus,
  ): LearningResult {
    const repeatedMistakes = this.detectRepeatedMistakes(allHistory, mistakeRepeatThreshold);
    const patterns = this.identifyPatterns(history, repeatedMistakes);
    const lessons = this.extractLessons(history, repeatedMistakes, patterns);
    const records = history.map((event) =>
      this.buildRecord(
        input,
        event,
        allHistory,
        lessons,
        repeatedMistakes,
        patterns,
        sourcesApplied,
        validationStatus,
      ),
    );
    return { records, lessons, repeatedMistakes, patterns };
  }

  private detectRepeatedMistakes(
    history: HistoricalExecutionEvent[],
    threshold: number,
  ): RepeatedMistake[] {
    const counts = new Map<string, { count: number; missions: Set<string> }>();
    for (const event of history) {
      if (!["failure", "rejected", "corrected"].includes(String(event.outcome).toLowerCase())) continue;
      for (const factor of event.factors) {
        const key = factor.toLowerCase();
        const entry = counts.get(key) ?? { count: 0, missions: new Set<string>() };
        entry.count += 1;
        entry.missions.add(event.missionId);
        counts.set(key, entry);
      }
    }

    const mistakes: RepeatedMistake[] = [];
    let index = 0;
    for (const [pattern, entry] of counts.entries()) {
      if (entry.count < threshold) continue;
      index += 1;
      mistakes.push({
        mistakeId: `xpl-mst-${index}`,
        pattern,
        occurrences: entry.count,
        relatedMissionIds: [...entry.missions],
        severity: entry.count >= threshold + 2 ? "high" : entry.count >= threshold + 1 ? "medium" : "low",
      });
    }
    return mistakes.sort((a, b) => b.occurrences - a.occurrences);
  }

  private identifyPatterns(
    history: HistoricalExecutionEvent[],
    mistakes: RepeatedMistake[],
  ): string[] {
    const patterns = new Set<string>();
    const successes = history.filter((h) => String(h.outcome).toLowerCase() === "success");
    const failures = history.filter((h) =>
      ["failure", "rejected"].includes(String(h.outcome).toLowerCase()),
    );
    if (successes.length) patterns.add(`success_cluster:${successes.length}`);
    if (failures.length) patterns.add(`failure_cluster:${failures.length}`);
    if (history.some((h) => h.grandKingFeedback)) patterns.add("grand_king_feedback_present");
    for (const mistake of mistakes.slice(0, 5)) {
      patterns.add(`repeated_mistake:${mistake.pattern}`);
    }
    const factorFreq = new Map<string, number>();
    for (const event of history) {
      for (const factor of event.factors) {
        factorFreq.set(factor, (factorFreq.get(factor) ?? 0) + 1);
      }
    }
    for (const [factor, count] of factorFreq.entries()) {
      if (count >= 2) patterns.add(`recurring_factor:${factor}`);
    }
    return [...patterns];
  }

  private extractLessons(
    history: HistoricalExecutionEvent[],
    mistakes: RepeatedMistake[],
    patterns: string[],
  ): LearnedLesson[] {
    const lessons: LearnedLesson[] = [];
    let index = 0;

    for (const event of history.filter((h) => String(h.outcome).toLowerCase() === "success").slice(0, 3)) {
      index += 1;
      lessons.push({
        lessonId: `xpl-lsn-${index}`,
        statement: `Preserve success factors from ${event.missionId}: ${event.factors.slice(0, 3).join(", ")}`,
        category: "success",
        confidence: 80,
        relatedMissionIds: [event.missionId],
      });
    }

    for (const event of history.filter((h) => String(h.outcome).toLowerCase() === "failure").slice(0, 3)) {
      index += 1;
      lessons.push({
        lessonId: `xpl-lsn-${index}`,
        statement: `Avoid failure pattern from ${event.missionId}: ${event.factors.slice(0, 3).join(", ")}`,
        category: "failure",
        confidence: 85,
        relatedMissionIds: [event.missionId],
      });
    }

    for (const event of history.filter((h) => String(h.outcome).toLowerCase() === "rejected").slice(0, 3)) {
      index += 1;
      lessons.push({
        lessonId: `xpl-lsn-${index}`,
        statement: `Honour Grand King rejection guidance on ${event.missionId}: ${event.grandKingFeedback ?? event.summary}`,
        category: "rejection",
        confidence: 90,
        relatedMissionIds: [event.missionId],
      });
    }

    for (const event of history.filter((h) => h.grandKingFeedback?.trim()).slice(0, 3)) {
      if (String(event.outcome).toLowerCase() === "rejected") continue;
      index += 1;
      lessons.push({
        lessonId: `xpl-lsn-${index}`,
        statement: `Apply Grand King correction: ${event.grandKingFeedback}`,
        category: "correction",
        confidence: 88,
        relatedMissionIds: [event.missionId],
      });
    }

    for (const mistake of mistakes.slice(0, 3)) {
      index += 1;
      lessons.push({
        lessonId: `xpl-lsn-${index}`,
        statement: `Stop repeating mistake "${mistake.pattern}" seen ${mistake.occurrences} times across ${mistake.relatedMissionIds.join(", ")}`,
        category: "pattern",
        confidence: Math.min(95, 70 + mistake.occurrences * 5),
        relatedMissionIds: [...mistake.relatedMissionIds],
      });
    }

    if (lessons.length === 0 && patterns.length) {
      lessons.push({
        lessonId: "xpl-lsn-1",
        statement: `Monitor emerging patterns: ${patterns.slice(0, 3).join("; ")}`,
        category: "pattern",
        confidence: 60,
        relatedMissionIds: [...new Set(history.map((h) => h.missionId))],
      });
    }

    return lessons;
  }

  private buildRecord(
    input: ExperienceReplayEngineInput,
    event: HistoricalExecutionEvent,
    allHistory: HistoricalExecutionEvent[],
    lessons: LearnedLesson[],
    mistakes: RepeatedMistake[],
    patterns: string[],
    sourcesApplied: string[],
    validationStatus: ValidationStatus,
  ): ExperienceRecord {
    experienceSequence += 1;
    const relatedLessons = lessons
      .filter((l) => l.relatedMissionIds.includes(event.missionId) || l.category === "pattern")
      .map((l) => l.statement);
    const successFactors =
      String(event.outcome).toLowerCase() === "success"
        ? [...event.factors]
        : allHistory
            .filter((h) => String(h.outcome).toLowerCase() === "success")
            .flatMap((h) => h.factors)
            .filter((f, i, arr) => arr.indexOf(f) === i)
            .slice(0, 3);
    const failureFactors =
      ["failure", "rejected", "corrected"].includes(String(event.outcome).toLowerCase())
        ? [...event.factors]
        : mistakes.map((m) => m.pattern).slice(0, 3);

    const recommendedFutureBehaviour = this.recommendBehaviour(event, relatedLessons, mistakes);

    return {
      experienceId: `xpl-exp-${Date.now()}-${experienceSequence}`,
      timestamp: new Date().toISOString(),
      missionId: event.missionId,
      businessId: event.businessId,
      eventType: String(event.eventType),
      outcome: String(event.outcome),
      successFactors,
      failureFactors,
      lessonsLearned: relatedLessons.length
        ? relatedLessons.slice(0, 5)
        : [`Replay of ${event.missionId}: ${event.summary}`],
      recommendedFutureBehaviour,
      confidenceScore: this.confidenceFor(event, mistakes),
      supportingEvidence: [
        event.summary,
        ...(event.grandKingFeedback ? [`grand_king_feedback:${event.grandKingFeedback}`] : []),
        ...event.factors.map((f) => `factor:${f}`),
        ...(input.replayScope ? [`replay_scope:${input.replayScope}`] : []),
      ],
      metadataVersion: XPL_METADATA_VERSION,
      experienceTraceId: `xpl-trace-${Date.now()}-${experienceSequence}`,
      sourcesApplied: [...sourcesApplied],
      repeatedMistakes: mistakes
        .filter((m) => m.relatedMissionIds.includes(event.missionId) || event.factors.includes(m.pattern))
        .map((m) => ({ ...m, relatedMissionIds: [...m.relatedMissionIds] })),
      patternsIdentified: [...patterns],
      validationStatus,
      neverExecuteWork: true,
      neverReplaceExecutionMemory: true,
      neverReplaceDecisionEngine: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workExecuted: false,
      executionMemoryReplaced: false,
      decisionEngineReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveExperienceTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private recommendBehaviour(
    event: HistoricalExecutionEvent,
    lessons: string[],
    mistakes: RepeatedMistake[],
  ): string {
    if (String(event.outcome).toLowerCase() === "success") {
      return `Reuse validated success pattern from ${event.missionId}: ${event.factors.slice(0, 3).join(", ")}.`;
    }
    if (event.grandKingFeedback?.trim()) {
      return `Before next similar mission, apply Grand King feedback: ${event.grandKingFeedback}`;
    }
    if (mistakes.length) {
      return `Block recurrence of ${mistakes[0]!.pattern}; enforce lesson checks before execution planning.`;
    }
    if (lessons.length) return lessons[0]!;
    return `Capture additional evidence for ${event.missionId} before repeating similar executive actions.`;
  }

  private confidenceFor(event: HistoricalExecutionEvent, mistakes: RepeatedMistake[]): number {
    let score = 70;
    if (event.grandKingFeedback) score += 10;
    if (String(event.outcome).toLowerCase() === "success") score += 8;
    if (["failure", "rejected"].includes(String(event.outcome).toLowerCase())) score += 5;
    if (mistakes.some((m) => event.factors.includes(m.pattern))) score += 7;
    return Math.max(0, Math.min(100, score));
  }
}

let experienceSequence = 0;

export function resetExperienceSequenceForTesting() {
  experienceSequence = 0;
}
