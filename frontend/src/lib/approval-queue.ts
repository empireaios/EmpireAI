import { asArray, asRecord, asString } from "@/lib/empire-data";

export interface ApprovalQueueItem {
  id: string;
  title: string;
  detail?: string;
  source: string;
  investigateTo: string;
}

export interface ApprovalQueueSources {
  executiveCouncil: Record<string, unknown> | null;
  success001: Record<string, unknown> | null;
  grandKingRevenuePipeline: Record<string, unknown> | null;
}

/** Shared approval queue builder (UX-014 · GC-02). */
export function buildApprovalQueue(
  sources: ApprovalQueueSources,
  investigatePaths: { debate: string; success001: string; command: string },
): ApprovalQueueItem[] {
  const queue: ApprovalQueueItem[] = [];

  for (const raw of asArray(sources.executiveCouncil?.recommendationsAwaitingKing)) {
    const rec = asRecord(raw);
    const id = `council-${asString(rec?.decisionId, asString(rec?.topic))}`;
    queue.push({
      id,
      title: asString(rec?.topic, "Council recommendation"),
      detail: asString(rec?.majorityRecommendation, asString(rec?.consensus, "Executive Council recommendation")),
      source: "council",
      investigateTo: investigatePaths.debate,
    });
  }

  for (const raw of asArray(sources.success001?.grandKingApprovalQueue)) {
    const item = asRecord(raw);
    const id = `s1-${asString(item?.id, asString(item?.title))}`;
    queue.push({
      id,
      title: asString(item?.title, "SUCCESS-001 decision"),
      detail: asString(item?.reason, asString(item?.evidence, "Awaiting Grand King approval")),
      source: "success001",
      investigateTo: investigatePaths.success001,
    });
  }

  const pipeline = asRecord(sources.grandKingRevenuePipeline?.currentRevenuePipeline);
  for (const raw of asArray(pipeline?.awaitingApproval)) {
    const item = asRecord(raw);
    const id = `gkr-${asString(item?.id, asString(item?.title, asString(item?.name)))}`;
    queue.push({
      id,
      title: asString(item?.title, asString(item?.name, "Revenue pipeline item")),
      detail: asString(item?.reason, asString(item?.summary, "Launch decision awaiting approval")),
      source: "pipeline",
      investigateTo: investigatePaths.command,
    });
  }

  return queue;
}
