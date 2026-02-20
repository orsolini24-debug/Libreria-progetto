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
      className="w-full bg-amber-600 text-stone-950 font-semibold py-2.5 px-4 rounded-xl
        hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
      <div className="flex mb-6 border border-stone-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-amber-600 text-stone-950"
              : "bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700"
          }`}
        >
          Accedi
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-amber-600 text-stone-950"
              : "bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700"
          }`}
        >
          Registrati
        </button>
      </div>

      {/* Login form */}
      {mode === "login" && (
        <form action={loginFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-stone-700 bg-stone-800 text-stone-100 rounded-xl
                px-3 py-2.5 text-sm placeholder:text-stone-600
                focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-stone-700 bg-stone-800 text-stone-100 rounded-xl
                px-3 py-2.5 text-sm placeholder:text-stone-600
                focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-700"
            />
          </div>
          {loginState?.error && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-900/60 px-3 py-2 rounded-xl">
              {loginState.error}
            </p>
          )}
          <SubmitButton label="Accedi" />
        </form>
      )}

      {/* Register form */}
      {mode === "register" && (
        <form action={registerFormAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-stone-700 bg-stone-800 text-stone-100 rounded-xl
                px-3 py-2.5 text-sm placeholder:text-stone-600
                focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-stone-700 bg-stone-800 text-stone-100 rounded-xl
                px-3 py-2.5 text-sm placeholder:text-stone-600
                focus:outline-none focus:ring-2 focus:ring-amber-600/50 focus:border-amber-700"
            />
          </div>
          {registerState?.error && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-900/60 px-3 py-2 rounded-xl">
              {registerState.error}
            </p>
          )}
          <SubmitButton label="Registrati" />
        </form>
      )}
    </div>
  );
}
