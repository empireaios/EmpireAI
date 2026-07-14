/** T4-09 — Tracks active UX design discussions. */

import type { ActiveDiscussionTopic, ContinuousCollaborationEngineBundle } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import { CollaborationMetadataGenerator } from "./collaboration-metadata-generator.js";
import { appendCollaborationLog } from "./collaboration-logging.js";

export class ActiveDiscussionTracker {
  private readonly metadata = new CollaborationMetadataGenerator();

  track(input: {
    engines: ContinuousCollaborationEngineBundle;
    config: ContinuousCollaborationConfiguration;
    existing: ActiveDiscussionTopic[];
  }): ActiveDiscussionTopic[] {
    const topics: ActiveDiscussionTopic[] = [...input.existing];
    const now = new Date().toISOString();

    try {
      const conversation = input.engines.naturalUxConversation?.getLatestReport?.() ?? null;
      const turn = conversation?.latestTurn ?? null;
      if (turn) {
        topics.push({
          topicId: this.metadata.buildTopicId(),
          topic: turn.recognizedIntent,
          sourceType: "conversation",
          sourceId: turn.conversationId,
          status: turn.clarificationStatus === "pending" ? "active" : "resolved",
          lastUpdatedAt: now,
        });
        for (const ctx of turn.conversationContext.activeTopics) {
          topics.push({
            topicId: this.metadata.buildTopicId(),
            topic: ctx,
            sourceType: "conversation",
            sourceId: turn.conversationId,
            status: "active",
            lastUpdatedAt: now,
          });
        }
      }
    } catch {
      /* partial input */
    }

    try {
      const annotation = input.engines.screenAnnotation?.getLatestReport?.() ?? null;
      const latest = annotation?.latestAnnotation ?? null;
      if (latest) {
        topics.push({
          topicId: this.metadata.buildTopicId(),
          topic: latest.userInstructionSummary,
          sourceType: "annotation",
          sourceId: latest.annotationId,
          status: "active",
          lastUpdatedAt: now,
        });
      }
    } catch {
      /* partial input */
    }

    try {
      const voice = input.engines.voiceUxCommands?.getLatestReport?.() ?? null;
      const command = voice?.latestCommand ?? null;
      if (command) {
        topics.push({
          topicId: this.metadata.buildTopicId(),
          topic: `Voice: ${command.voiceCommandType}`,
          sourceType: "voice",
          sourceId: command.voiceCommandId,
          status: "active",
          lastUpdatedAt: now,
        });
      }
    } catch {
      /* partial input */
    }

    const deduped = this.deduplicate(topics).slice(0, input.config.maxActiveDiscussions);
    if (deduped.length > 0) {
      appendCollaborationLog({
        event: "discussion_updates",
        level: "info",
        details: `Tracking ${deduped.length} active discussion topic(s)`,
      });
    }
    return deduped;
  }

  private deduplicate(topics: ActiveDiscussionTopic[]): ActiveDiscussionTopic[] {
    const seen = new Set<string>();
    return topics.filter((t) => {
      const key = `${t.sourceType}:${t.topic}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
