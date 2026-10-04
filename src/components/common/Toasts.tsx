"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { Undo2, X } from "lucide-react";

type Toast = {
  id: number;
  message: string;
  onUndo?: () => void;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, onUndo?: () => void) => void;
  dismiss: (id: number) => void;
};

let seq = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (message, onUndo) => {
    const id = seq++;
    set((s) => ({ toasts: [...s.toasts, { id, message, onUndo }] }));
    window.setTimeout(() => {
      useToasts.getState().dismiss(id);
    }, 6000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function Toasts() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape" && toasts.length > 0) {
        const last = toasts[toasts.length - 1];
        if (last) dismiss(last.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toasts, dismiss]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4 md:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-stone-900 p-3 text-sm font-medium text-white shadow-card dark:bg-white dark:text-stone-900"
        >
          <span className="flex-1">{t.message}</span>
          {t.onUndo ? (
            <button
              type="button"
              onClick={() => {
                t.onUndo?.();
                dismiss(t.id);
              }}
              className="flex min-h-[36px] items-center gap-1 rounded-xl bg-white/20 px-3 font-bold dark:bg-stone-900/10"
            >
              <Undo2 size={14} aria-hidden /> Hoàn tác
            </button>
          ) : null}
          <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(t.id)} className="p-1">
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
