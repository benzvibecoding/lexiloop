"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { fetchFreeDict, suggestMeaningVi } from "@/lib/dictionary/freeDict";
import { suggestWithGemini, suggestWithOpenAI } from "@/lib/ai/assist";
import { useAiPrefs } from "@/stores/ai";

const formSchema = z.object({
  word: z.string().min(1, "Nhập từ").max(200),
  meaningVi: z.string().min(1, "Nhập nghĩa tiếng Việt").max(1000),
  pos: z.string().max(120),
  ipa: z.string().max(120),
  definitionEn: z.string().max(2000),
  exampleEn: z.string().max(1000),
  exampleVi: z.string().max(1000),
  mnemonic: z.string().max(2000),
  tags: z.string().max(500),
  cefr: z.string().max(4),
});

export type CardFormValues = z.infer<typeof formSchema>;

export function emptyCardForm(word = ""): CardFormValues {
  return { word, meaningVi: "", pos: "", ipa: "", definitionEn: "", exampleEn: "", exampleVi: "", mnemonic: "", tags: "", cefr: "" };
}

export function CardForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<CardFormValues>;
  onSubmit: (v: CardFormValues) => void;
  submitLabel: string;
}) {
  const [filling, setFilling] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [fillMsg, setFillMsg] = useState("");
  const ai = useAiPrefs();
  const aiReady = ai.enabled && ai.apiKey.length > 0;
  const form = useForm<CardFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...emptyCardForm(), ...initial },
  });
  const word = form.watch("word");

  async function onAiSuggest(): Promise<void> {
    const w = word.trim();
    if (!w) {
      setFillMsg("Nhập từ trước đã.");
      return;
    }
    setAiBusy(true);
    setFillMsg("");
    try {
      const s =
        ai.provider === "gemini"
          ? await suggestWithGemini(ai.apiKey, w)
          : await suggestWithOpenAI(ai.baseUrl, ai.apiKey, ai.model, w);
      if (!form.getValues("meaningVi")) form.setValue("meaningVi", s.meaningVi.join("; "));
      if (!form.getValues("exampleEn") && s.exampleEn) form.setValue("exampleEn", s.exampleEn);
      if (!form.getValues("exampleVi") && s.exampleVi) form.setValue("exampleVi", s.exampleVi);
      if (!form.getValues("mnemonic") && s.mnemonic) form.setValue("mnemonic", s.mnemonic);
      setFillMsg("AI đã gợi ý — kiểm tra lại rồi hãy lưu nhé.");
    } catch (e) {
      setFillMsg(e instanceof Error ? e.message : "AI lỗi.");
    } finally {
      setAiBusy(false);
    }
  }
  async function onAutofill(): Promise<void> {
    const w = word.trim();
    if (!w) {
      setFillMsg("Nhập từ trước đã.");
      return;
    }
    setFilling(true);
    setFillMsg("");
    try {
      const [entry, vi] = await Promise.all([
        fetchFreeDict(w),
        suggestMeaningVi(w).catch(() => [] as string[]),
      ]);
      if (!entry) {
        setFillMsg("Không tìm thấy trong từ điển — nhập tay giúp mình.");
        return;
      }
      if (!form.getValues("pos")) form.setValue("pos", entry.pos.join(", "));
      if (!form.getValues("ipa")) form.setValue("ipa", entry.ipaUs);
      if (!form.getValues("definitionEn")) form.setValue("definitionEn", entry.definitionEn);
      if (!form.getValues("exampleEn") && entry.examples[0]) form.setValue("exampleEn", entry.examples[0].en);
      if (!form.getValues("meaningVi") && vi[0]) form.setValue("meaningVi", vi[0]);
      setFillMsg(
        entry.definitionEn
          ? "Đã điền IPA, loại từ, định nghĩa. Nghĩa Việt chỉ là gợi ý máy dịch — sửa lại giúp mình."
          : "Từ điển thiếu định nghĩa — nhập tay giúp mình.",
      );
    } catch {
      setFillMsg("Mất mạng hoặc hết quota — nhập tay vẫn lưu được.");
    } finally {
      setFilling(false);
    }
  }

  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="grid gap-3" aria-label="Form thẻ">
      <div className="flex gap-2">
        <label className="flex-1 text-sm font-medium">
          Từ / cụm từ
          <input
            {...form.register("word")}
            placeholder="resilient"
            className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
          />
        </label>
        <button
          type="button"
          onClick={() => void onAutofill()}
          disabled={filling}
          className="mt-6 flex min-h-[44px] items-center gap-1 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {filling ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
          Tự điền
        </button>
        {aiReady ? (
          <button
            type="button"
            onClick={() => void onAiSuggest()}
            disabled={aiBusy}
            title="Gợi ý bằng AI (key của bạn)"
            className="mt-6 flex min-h-[44px] items-center gap-1 rounded-xl bg-violet-600 px-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {aiBusy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Bot size={16} aria-hidden />}
            AI
          </button>
        ) : null}
      </div>
      {fillMsg ? (
        <p role="status" className="text-xs text-stone-500">
          {fillMsg}
        </p>
      ) : null}
      <label className="text-sm font-medium">
        Nghĩa tiếng Việt (nhiều nghĩa cách nhau bằng ;)
        <input
          {...form.register("meaningVi")}
          placeholder="kiên cường; có khả năng phục hồi"
          className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
        />
        {form.formState.errors.meaningVi ? (
          <span className="text-xs text-red-600">{form.formState.errors.meaningVi.message}</span>
        ) : null}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Loại từ (adjective, verb…)
          <input {...form.register("pos")} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        </label>
        <label className="text-sm font-medium">
          IPA
          <input {...form.register("ipa")} placeholder="/rɪˈzɪl.jənt/" className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 font-ipa dark:border-stone-700 dark:bg-stone-950" />
        </label>
      </div>
      <label className="text-sm font-medium">
        Định nghĩa English
        <input {...form.register("definitionEn")} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Ví dụ EN
          <input {...form.register("exampleEn")} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        </label>
        <label className="text-sm font-medium">
          Ví dụ VI
          <input {...form.register("exampleVi")} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        </label>
      </div>
      <label className="text-sm font-medium">
        Mẹo nhớ (mnemonic)
        <input {...form.register("mnemonic")} placeholder="VD: gắn với một hình ảnh vui" className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Tags
          <input {...form.register("tags")} placeholder="ielts, b1" className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950" />
        </label>
        <label className="text-sm font-medium">
          CEFR
          <select {...form.register("cefr")} className="mt-1 block min-h-[44px] w-full rounded-xl border px-3 dark:border-stone-700 dark:bg-stone-950">
            <option value="">—</option>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="min-h-[48px] rounded-2xl bg-orange-500 px-6 font-bold text-white">
        {submitLabel}
      </button>
    </form>
  );
}
