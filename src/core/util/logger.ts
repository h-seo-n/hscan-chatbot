import type { Logger } from "./types/generalTypes";
import * as Sentry from "@sentry/browser";

export interface LogEntry {
  level: "debug" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

// Console Logger
export const consoleLogger: Logger = {
  debug: (msg, ctx) => console.debug(`[DEBUG] ${msg}`, ctx ?? ""),
  warn: (msg, ctx) => console.warn(`[WARN] ${msg}`, ctx ?? ""),
  error: (msg, ctx) => console.error(`[ERROR] ${msg}`, ctx ?? ""),
};

// Sentry Logger
export const sentryLogger: Logger = {
  debug: (msg, ctx) => {
    if (import.meta.env.DEV) console.debug(msg, ctx);
  },
  warn: (msg, ctx) => {
    Sentry.addBreadcrumb({ level: "warning", message: msg, data: ctx });
  },
  error: (msg, ctx) => {
    Sentry.captureMessage(msg, { level: "error", extra: ctx });
  },
};

// Memory logger (on unit tests)
export class MemoryLogger implements Logger {
  public entries: LogEntry[] = [];

  debug(message: string, context?: Record<string, unknown>) {
    this.entries.push({ level: "debug", message, context, timestamp: Date.now() });
  }
  warn(message: string, context?: Record<string, unknown>) {
    this.entries.push({ level: "warn", message, context, timestamp: Date.now() });
  }
  error(message: string, context?: Record<string, unknown>) {
    this.entries.push({ level: "error", message, context, timestamp: Date.now() });
  }

  clear() { this.entries = []; }
  warnings() { return this.entries.filter(e => e.level === "warn"); }
}
