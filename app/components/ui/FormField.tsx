"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className = "" }: FormFieldProps) {
  const labelStyle = { color: "var(--fg-subtle)" };
  
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <label className="text-[10px] font-semibold uppercase tracking-wider" style={labelStyle}>
        {label}
      </label>
      {children}
      {error && error.map((e, i) => (
        <span key={i} className="text-[10px] font-medium text-red-400 animate-fade-in">
          {e}
        </span>
      ))}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string[];
}

export function Input({ error, className = "", ...props }: InputProps) {
  const style = {
    background: "var(--bg-input)",
    color: "var(--fg-primary)",
    borderColor: error ? "rgb(248 113 113)" : "color-mix(in srgb, var(--accent) 18%, transparent)",
  };

  return (
    <input
      {...props}
      style={style}
      className={`w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all ${className}`}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string[];
}

export function Select({ error, className = "", children, ...props }: SelectProps) {
  const style = {
    background: "var(--bg-input)",
    color: "var(--fg-primary)",
    borderColor: error ? "rgb(248 113 113)" : "color-mix(in srgb, var(--accent) 18%, transparent)",
  };

  return (
    <select
      {...props}
      style={style}
      className={`w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none ${className}`}
    >
      {children}
    </select>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string[];
}

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  const style = {
    background: "var(--bg-input)",
    color: "var(--fg-primary)",
    borderColor: error ? "rgb(248 113 113)" : "color-mix(in srgb, var(--accent) 18%, transparent)",
  };

  return (
    <textarea
      {...props}
      style={style}
      className={`w-full rounded-xl px-4 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[80px] ${className}`}
    />
  );
}
