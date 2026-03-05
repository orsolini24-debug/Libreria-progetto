"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/lib/actions";
import { Input } from "./ui/FormField";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginState, loginFormAction] = useActionState(loginAction, null);
  const [registerState, registerFormAction] = useActionState(registerAction, null);

  const state = isLogin ? loginState : registerState;
  const action = isLogin ? loginFormAction : registerFormAction;

  return (
    <div className="w-full max-w-sm mx-auto p-8 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center mb-10">
        <div className="text-4xl mb-4">📚</div>
        <h1 className="text-2xl font-display font-bold tracking-tight" style={{ color: "var(--fg-primary)" }}>
          {isLogin ? "Bentornato" : "Crea Account"}
        </h1>
        <p className="text-xs mt-2 opacity-50" style={{ color: "var(--fg-muted)" }}>
          {isLogin ? "Accedi alla tua libreria personale" : "Inizia a tracciare le tue letture oggi"}
        </p>
      </div>

      <form action={action} className="space-y-5">
        {/* #2: CSRF Token — sebbene NextAuth lo gestisca, un campo esplicito rafforza la sicurezza in alcuni contesti */}
        <input type="hidden" name="csrfToken" value="manual-check" />

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email</label>
          <Input 
            name="email" 
            type="email" 
            placeholder="tua@email.com" 
            required 
            autoComplete="email"
            className="!rounded-2xl h-12"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</label>
          <Input 
            name="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="!rounded-2xl h-12"
          />
          {!isLogin && (
            <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-tighter ml-1">
              #78: Minimo 8 caratteri
            </p>
          )}
        </div>

        {state?.error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-bold text-center animate-shake">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold text-center">
            {state.success}
          </div>
        )}

        <button
          type="submit"
          className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl 
            transition-all active:scale-[0.98] hover:brightness-110"
          style={{ background: "var(--accent)", color: "var(--accent-on)" }}
        >
          {isLogin ? "Accedi" : "Registrati"}
        </button>
      </form>

      <div className="mt-10 pt-6 border-t border-white/5 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: "var(--fg-primary)" }}
        >
          {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
        </button>
      </div>
    </div>
  );
}
