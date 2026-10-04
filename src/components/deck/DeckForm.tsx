"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DECK_COLORS, DECK_EMOJIS } from "@/lib/deck/actions";

const formSchema = z.object({
  name: z.string().min(1, "Nhập tên bộ thẻ").max(120),
  description: z.string().max(1000).optional(),
  emoji: z.string().min(1).max(16),
  color: z.string().min(1).max(32),
  tags: z.string().max(500),
});

export type DeckFormValues = z.infer<typeof formSchema>;

export function DeckForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<DeckFormValues>;
  onSubmit: (v: DeckFormValues) => void;
  submitLabel: string;
}) {
  const form = useForm<DeckFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      emoji: initial?.emoji ?? "📚",
      color: initial?.color ?? "coral",
      tags: initial?.tags ?? "",
    },
  });

  return (
    <form
      onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
      className="grid gap-3"
      aria-label="Form bộ thẻ"
    >
      <label className="text-sm font-medium">
        Tên bộ thẻ
        <input
          {...form.register("name")}
          className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
          placeholder="VD: IELTS Environment"
        />
        {form.formState.errors.name ? (
          <span className="text-xs text-red-600">{form.formState.errors.name.message}</span>
        ) : null}
      </label>
      <label className="text-sm font-medium">
        Mô tả
        <input
          {...form.register("description")}
          className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
          placeholder="Học từ vựng môi trường B1–B2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Emoji
          <select
            {...form.register("emoji")}
            className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
          >
            {DECK_EMOJIS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Màu
          <select
            {...form.register("color")}
            className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
          >
            {DECK_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="text-sm font-medium">
        Tags (cách nhau bằng dấu phẩy)
        <input
          {...form.register("tags")}
          className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
          placeholder="ielts, environment"
        />
      </label>
      <button
        type="submit"
        className="min-h-[48px] rounded-2xl bg-orange-500 px-6 font-bold text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}
