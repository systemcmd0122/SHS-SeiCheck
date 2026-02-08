"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

// Global state for simplicity in this environment
let toastFn: (msg: Omit<ToastMessage, "id">) => void = () => {};

export const toast = (title: string, description?: string, type: ToastType = "info") => {
  toastFn({ title, description, type });
};

export const successToast = (title: string, description?: string) => toast(title, description, "success");
export const errorToast = (title: string, description?: string) => toast(title, description, "error");

export function Toaster() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addMessage = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [...prev, { ...msg, id }]);

    // Auto remove
    setTimeout(() => {
      removeMessage(id);
    }, 5000);
  }, [removeMessage]);

  useEffect(() => {
    toastFn = addMessage;
  }, [addMessage]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-[420px] pointer-events-none p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`pointer-events-auto flex items-start gap-4 p-5 rounded-[1.5rem] border shadow-premium animate-in slide-in-from-right-10 fade-in duration-300 transition-all backdrop-blur-xl ${
            msg.type === "success"
              ? "border-emerald-500/20 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-50"
              : msg.type === "error"
              ? "border-rose-500/20 bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-50"
              : msg.type === "warning"
              ? "border-amber-500/20 bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-50"
              : "border-primary/20 bg-background/95 dark:bg-card/90"
          }`}
        >
          <div className={`shrink-0 p-2 rounded-2xl ${
             msg.type === "success" ? "bg-emerald-500/10" :
             msg.type === "error" ? "bg-rose-500/10" :
             msg.type === "warning" ? "bg-amber-500/10" : "bg-primary/10"
          }`}>
            {msg.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            {msg.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            {msg.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            {msg.type === "info" && <Info className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-base font-black tracking-tight">{msg.title}</p>
            {msg.description && (
              <div className="mt-1.5 space-y-1">
                <p className="text-sm opacity-80 leading-relaxed">{msg.description}</p>
                {msg.type === "error" && (
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    ネットワークを確認して再度お試しください
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => removeMessage(msg.id)}
            className="shrink-0 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors active-scale"
          >
            <X className="w-4 h-4 opacity-40" />
          </button>
        </div>
      ))}
    </div>
  );
}
