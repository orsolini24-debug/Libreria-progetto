import { ZodError } from "zod";

export type ActionErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL";

export type ActionResponse<T = unknown> =
  | { ok: true; data?: T }
  | {
      ok: false;
      error: {
        code: ActionErrorCode;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };

export function mapZodError(error: ZodError): ActionResponse {
  const fieldErrors: Record<string, string[]> = {};

  for (const err of error.issues) {
    const path = err.path.join(".") || "_";
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(err.message);
  }

  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Dati inseriti non validi.",
      fieldErrors,
    },
  };
}
