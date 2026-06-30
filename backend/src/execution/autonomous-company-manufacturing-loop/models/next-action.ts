import { z } from "zod";

export const NEXT_ACTION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type NextActionPriority = (typeof NEXT_ACTION_PRIORITIES)[number];

/** Recommended next action after a manufacturing run. */
export type NextAction = {
  actionId: string;
  title: string;
  description: string;
  priority: NextActionPriority;
  stage: string;
};

export const nextActionSchema = z.object({
  actionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(NEXT_ACTION_PRIORITIES),
  stage: z.string().min(1),
});

/** Validates a NextAction record shape. */
export function validateNextAction(value: unknown): NextAction {
  return nextActionSchema.parse(value);
}
