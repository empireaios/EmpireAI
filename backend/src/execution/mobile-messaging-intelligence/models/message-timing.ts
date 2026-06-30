import { z } from "zod";

export const MESSAGE_CHANNELS = ["SMS", "PUSH", "BOTH"] as const;

export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

/** Timing rule for when messages may be sent. */
export type MessageTiming = {
  timingId: string;
  channel: MessageChannel;
  label: string;
  sendWindowLocal: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezonePolicy: string;
  optimalDays: string[];
  score: number;
};

export const messageTimingSchema = z.object({
  timingId: z.string().min(1),
  channel: z.enum(MESSAGE_CHANNELS),
  label: z.string().min(1),
  sendWindowLocal: z.string().min(1),
  quietHoursStart: z.string().min(1),
  quietHoursEnd: z.string().min(1),
  timezonePolicy: z.string().min(1),
  optimalDays: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates a MessageTiming record shape. */
export function validateMessageTiming(value: unknown): MessageTiming {
  return messageTimingSchema.parse(value);
}
