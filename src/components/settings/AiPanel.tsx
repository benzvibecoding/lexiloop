"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import { useAiPrefs } from "@/stores/ai";

/** Tắt mặc định. Key lưu trên máy bạn; gọi trực tiếp từ trình duyệt tới provider. */
export function AiPanel() {
  const prefs = useAiPrefs();
  const [showKey, setShowKey] = useState(false);

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900" aria-label="Trợ lý AI (BYOK)">
      <h2 className="flex items-center gap-2 font-bold">
        <Bot size={18} aria-hidden /> Trợ lý AI — tự nhập key (tắt mặc định)
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        Key lưu trên máy bạn, app gọi thẳng từ trình duyệt tới Google/OpenAI. Câu trả lời có thể sai — luôn kiểm tra lại trước khi học.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={prefs.enabled} onChange={(e) => prefs.set({ enabled: e.target.checked })} className="size-5" />
        Bật gợi ý AI trong form thêm thẻ
      </label>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <label className="text-sm">Nhà cung cấp
          <select value={prefs.provider} onChange={(e) => prefs.set({ provider: e.target.value as "gemini" | "openai" })} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950">
            <option value="gemini">Gemini (có gói miễn phí)</option>
            <option value="openai">OpenAI / tương thích</option>
          </select>
        </label>
        {prefs.provider === "openai" ? (
          <label className="text-sm">Endpoint + model
            <span className="mt-1 flex gap-1">
              <input value={prefs.baseUrl} onChange={(e) => prefs.set({ baseUrl: e.target.value })} aria-label="Endpoint" className="min-h-[44px] w-full rounded-xl border px-2 text-xs dark:border-stone-700 dark:bg-stone-950" />
              <input value={prefs.model} onChange={(e) => prefs.set({ model: e.target.value })} aria-label="Model" className="min-h-[44px] w-32 rounded-xl border px-2 text-xs dark:border-stone-700 dark:bg-stone-950" />
            </span>
          </label>
        ) : null}
      </div>
      <label className="mt-2 block text-sm">API key
        <span className="mt-1 flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={prefs.apiKey}
            onChange={(e) => prefs.set({ apiKey: e.target.value.trim() })}
            placeholder="Dán key của bạn"
            autoComplete="off"
            className="min-h-[44px] flex-1 rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950"
          />
          <button type="button" onClick={() => setShowKey((v) => !v)} className="min-h-[44px] rounded-xl border px-3 text-xs font-bold">
            {showKey ? "Ẩn" : "Hiện"}
          </button>
        </span>
      </label>
    </section>
  );
}
