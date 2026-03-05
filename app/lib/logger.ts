/**
 * #128, #110: Logger centralizzato per uniformare i log e proteggere dati sensibili.
 */

type LogLevel = "info" | "warn" | "error" | "critical";

function log(level: LogLevel, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    // #110: Mai loggare l'intero oggetto errore se contiene dettagli DB (es. Prisma error)
    data: data instanceof Error ? { name: data.name, message: data.message } : data,
  };

  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(entry));
  } else {
    const color = level === "error" || level === "critical" ? "\x1b[31m" : level === "warn" ? "\x1b[33m" : "\x1b[32m";
    console.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, data ?? "");
  }
}

export const logger = {
  info: (msg: string, data?: unknown) => log("info", msg, data),
  warn: (msg: string, data?: unknown) => log("warn", msg, data),
  error: (msg: string, err?: unknown) => log("error", msg, err),
  critical: (msg: string, err?: unknown) => log("critical", msg, err),
};
