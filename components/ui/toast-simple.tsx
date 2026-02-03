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

  const addMessage = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setMessages((prev) => [...prev, { ...msg, id }]);

    // Auto remove
    setTimeout(() => {
      removeMessage(id);
    }, 5000);
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => {
    toastFn = addMessage;
  }, [addMessage]);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-[400px] pointer-events-none p-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right-full transition-all bg-background ${
            msg.type === "success"
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-900"
              : msg.type === "error"
              ? "border-rose-200 bg-rose-50 dark:bg-rose-950/50 dark:border-rose-900"
              : msg.type === "warning"
              ? "border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-900"
              : "border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-900"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {msg.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            {msg.type === "error" && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
            {msg.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
            {msg.type === "info" && <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{msg.title}</p>
            {msg.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{msg.description}</p>}
          </div>
          <button
            onClick={() => removeMessage(msg.id)}
            className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}
