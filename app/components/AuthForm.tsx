"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, registerAction } from "@/app/lib/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Caricamento..." : label}
    </button>
  );
}

export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginFormAction] = useFormState(loginAction, null);
  const [registerState, registerFormAction] = useFormState(registerAction, null);

  return (
    <div className="w-full max-w-sm">
      {/* Tab toggle */}
      <div className="flex mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setMode("login")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "login"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Accedi
        </button>
        <button
          onClick={() => setMode("register")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "register"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Registrati
        </button>
      </div>

      {/* Login form */}
      {mode === "login" && (
        <form action={loginFormAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {loginState?.error && (
            <p className="text-red-600 text-sm">{loginState.error}</p>
          )}
          <SubmitButton label="Accedi" />
        </form>
      )}

      {/* Register form */}
      {mode === "register" && (
        <form action={registerFormAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {registerState?.error && (
            <p className="text-red-600 text-sm">{registerState.error}</p>
          )}
          <SubmitButton label="Registrati" />
        </form>
      )}
    </div>
  );
}
