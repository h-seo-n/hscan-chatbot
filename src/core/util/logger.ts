import type { Logger } from "./types/generalTypes";
import * as Sentry from "@sentry/browser";

export interface LogEntry {
  level: "debug" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

// Console Logger
function createConsoleLogger(context: Record<string, unknown> = {}): Logger {
  const format = (msg: string) => {
    const scopeStr = context.scope ? `[${context.scope}] ` : "";
    return `${scopeStr}${msg}`;
  };
  
  return {
    debug: (msg, extra) => console.debug(format(msg), { ...context, ...extra }),
    warn: (msg, extra) => console.warn(format(msg), { ...context, ...extra }),
    error: (msg, extra) => console.error(format(msg), { ...context, ...extra }),

    child: (newContext) => createConsoleLogger({ ...context, ...newContext }),
  };
};
export const consoleLogger = createConsoleLogger();

// Sentry Logger
function createSentryLogger(context: Record<string, unknown> = {}): Logger {
  return {
    debug: (msg, ctx) => {
      if (import.meta.env.DEV) {
        console.debug(msg, { ...context, ...ctx });
      }
    },
    warn: (msg, ctx) => {
      Sentry.addBreadcrumb({
        level: "warning",
        message: msg,
        data: { ...context, ...ctx },
      });
    },
    error: (msg, ctx) => {
      Sentry.captureMessage(msg, {
        level: "error",
        extra: { ...context, ...ctx },
        tags: extractTags(context), 
      });
    },
    child: (newContext) =>
      createSentryLogger({ ...context, ...newContext }),
  };
}
function extractTags(context: Record<string, unknown>): Record<string, string> {
  const tags: Record<string, string> = {};
  if (typeof context.scope === "string") tags.scope = context.scope;
  return tags;
}

export const sentryLogger = createSentryLogger();


// Memory logger (on unit tests)
export class MemoryLogger implements Logger {
  public entries: LogEntry[];
  private context: Record<string, unknown>;

  constructor(
    context: Record<string, unknown> = {},
    sharedEntries?: LogEntry[],   // 부모와 entries 공유
  ) {
    this.context = context;
    this.entries = sharedEntries ?? [];
  }

  private log(level: LogEntry["level"], message: string, ctx?: Record<string, unknown>) {
    this.entries.push({
      level,
      message,
      context: { ...this.context, ...ctx },
      timestamp: Date.now(),
    });
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }
  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }
  error(message: string, context?: Record<string, unknown>) {
    this.log("error", message, context);
  }

  child(newContext: Record<string, unknown>): MemoryLogger {
    // entries 배열 공유 / context만 누적된 새 인스턴스 반환
    return new MemoryLogger(
      { ...this.context, ...newContext },
      this.entries,
    );
  }

  clear() {
    this.entries.length = 0;
  }
  warnings() {
    return this.entries.filter(e => e.level === "warn");
  }
  errors() {
    return this.entries.filter(e => e.level === "error");
  }

  // scope로 필터링하는 헬퍼
  byScope(scope: string) {
    return this.entries.filter(e => e.context?.scope === scope);
  }
}