"use client";

import { useState, useEffect } from "react";
import { Bell, BellDot, X, Check } from "lucide-react";
import { getNotifications, markAsRead } from "@/app/lib/notification-actions";
import { Notification } from "@/app/generated/prisma/client";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getNotifications();
      setNotifications(data);
      setHasUnread(data.some(n => !n.isRead));
    }
    load();
    // In un sistema reale useremmo WebSockets o Polling, qui facciamo un fetch iniziale
  }, [isOpen]);

  async function handleRead(id: string) {
    await markAsRead(id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setHasUnread(notifications.some(n => n.id !== id && !n.isRead));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-white/5 transition-all relative"
        style={{ color: "var(--fg-muted)" }}
      >
        {hasUnread ? <BellDot className="w-5 h-5 text-amber-500" /> : <Bell className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 max-h-96 rounded-2xl border shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in"
          style={{ background: "var(--bg-elevated)", borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)" }}
        >
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 10%, transparent)" }}>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-50">Notifiche</h3>
            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 opacity-40" /></button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="p-10 text-center text-[10px] uppercase font-bold opacity-20">Nessuna notifica</div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b last:border-0 transition-colors flex gap-3
                    ${!n.isRead ? 'bg-white/5' : 'opacity-50'}`}
                  style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 5%, transparent)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold leading-tight" style={{ color: "var(--fg-primary)" }}>{n.title}</p>
                    <p className="text-[10px] mt-1 opacity-60 leading-relaxed">{n.message}</p>
                    <p className="text-[8px] mt-2 opacity-30 font-bold uppercase">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!n.isRead && (
                    <button 
                      onClick={() => handleRead(n.id)}
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:opacity-80"
                      style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
