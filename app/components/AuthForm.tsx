"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction } from "@/app/lib/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-semibold py-2.5 px-4 rounded-xl
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150 text-sm shadow-md"
      style={{
        background: "var(--accent)",
        color: "var(--accent-on)",
        boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)",
      }}
    >
      {pending ? "Caricamento..." : label}
    </button>
  );
}

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginFormAction] = useActionState(loginAction, null);
  const [registerState, registerFormAction] = useActionState(registerAction, null);

  return (
    <div className="w-full max-w-sm">
      {/* Tab toggle */}
      <div
        className="flex mb-6 rounded-xl overflow-hidden border"
        style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)" }}
      >
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2.5 text-sm font-medium transition-all duration-200"
            style={mode === m
              ? { background: "var(--accent)", color: "var(--accent-on)" }
              : { background: "var(--bg-elevated)", color: "var(--fg-muted)" }
            }
          >
            {m === "login" ? "Accedi" : "Registrati"}
          </button>
        ))}
      </div>

      {/* Login form */}
      {mode === "login" && (
        <form action={loginFormAction} className="space-y-4 animate-fade-up">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-subtle)" }}
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 transition-colors"
              style={{
                background: "var(--bg-input)",
                borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                color: "var(--fg-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-subtle)" }}
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 transition-colors"
              style={{
                background: "var(--bg-input)",
                borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                color: "var(--fg-primary)",
              }}
            />
          </div>
          {loginState?.error && (
            <p
              className="text-xs px-3 py-2 rounded-xl border"
              style={{
                color: "#f87171",
                background: "color-mix(in srgb, #ef4444 8%, var(--bg-elevated))",
                borderColor: "color-mix(in srgb, #ef4444 30%, transparent)",
              }}
            >
              {loginState.error}
            </p>
          )}
          <SubmitButton label="Accedi" />
        </form>
      )}

      {/* Register form */}
      {mode === "register" && (
        <form action={registerFormAction} className="space-y-4 animate-fade-up">
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-subtle)" }}
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 transition-colors"
              style={{
                background: "var(--bg-input)",
                borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                color: "var(--fg-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--fg-subtle)" }}
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border rounded-xl px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 transition-colors"
              style={{
                background: "var(--bg-input)",
                borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                color: "var(--fg-primary)",
              }}
            />
          </div>
          {registerState?.error && (
            <p
              className="text-xs px-3 py-2 rounded-xl border"
              style={{
                color: "#f87171",
                background: "color-mix(in srgb, #ef4444 8%, var(--bg-elevated))",
                borderColor: "color-mix(in srgb, #ef4444 30%, transparent)",
              }}
            >
              {registerState.error}
            </p>
          )}
          <SubmitButton label="Registrati" />
        </form>
      )}
    </div>
  );
}
