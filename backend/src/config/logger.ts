import pino from "pino";
import { env } from "./env.js";

export const logger = pino({ level: env.LOG_LEVEL });

export type Logger = typeof logger;
