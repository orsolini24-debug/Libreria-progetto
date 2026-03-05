"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Libreria" },
    { href: "/citazioni", label: "Citazioni" },
    { href: "/suggestions", label: "Idee" },
  ];

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 font-medium
              ${active ? "bg-white/5 shadow-sm" : "opacity-60 hover:opacity-100"}`}
            style={{ 
              color: active ? "var(--accent)" : "var(--fg-muted)",
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
