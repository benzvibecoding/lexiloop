"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/client";
import { createCard, newCardDefaults } from "@/lib/db/repositories";
import { CardForm, type CardFormValues } from "@/components/cards/CardForm";
import { useToasts } from "@/components/common/Toasts";
import { useDbMounted } from "@/stores/settings";
import type { Cefr } from "@/types/entities";

function AddInner() {
  const mounted = useDbMounted();
  const push = useToasts((s) => s.push);
  const sp = useSearchParams();
  const presetDeck = sp.get("deck") ?? "";
  const [deckId, setDeckId] = useState(presetDeck);
  const [key, setKey] = useState(0);

  const decks = useLiveQuery(async () => {
    if (!mounted) return [];
    const all = await getDb().decks.toArray();
    return all.filter((d) => d.deletedAt == null && !d.archived);
  }, [mounted]);

  async function onAdd(v: CardFormValues): Promise<void> {
    const target = deckId || decks?.[0]?.id;
    if (!target) {
      push("Tạo một bộ thẻ trước đã.");
      return;
    }
    await createCard(
      getDb(),
      {
        ...newCardDefaults(target, v.word.trim(), v.meaningVi.split(";").map((s) => s.trim()).filter(Boolean)),
        pos: v.pos.split(",").map((s) => s.trim()).filter(Boolean),
        ipaUs: v.ipa || undefined,
        ipaUk: v.ipa || undefined,
        definitionEn: v.definitionEn || undefined,
        examples: v.exampleEn ? [{ en: v.exampleEn, vi: v.exampleVi || undefined }] : [],
        mnemonic: v.mnemonic || undefined,
        tags: v.tags.split(",").map((s) => s.trim()).filter(Boolean),
        cefr: (v.cefr || undefined) as Cefr | undefined,
      },
    );
    push(`Đã thêm “${v.word.trim()}”. Tiếp tục từ tiếp theo!`);
    setKey((k) => k + 1);
  }

  if (!mounted) return <div aria-busy="true" className="h-24 animate-pulse rounded-3xl bg-stone-200" />;

  if ((decks ?? []).length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold">Thêm thẻ</h1>
        <p className="mt-2">Bạn chưa có bộ thẻ nào. <Link href="/decks" className="underline">Tạo bộ thẻ trước →</Link></p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-extrabold">Thêm thẻ mới</h1>
      <label className="mt-3 block text-sm font-medium">
        Lưu vào bộ
        <select
          value={deckId || decks?.[0]?.id}
          onChange={(e) => setDeckId(e.target.value)}
          className="mt-1 block min-h-[44px] w-full rounded-xl border border-stone-300 px-3 dark:border-stone-700 dark:bg-stone-950"
        >
          {(decks ?? []).map((d) => (
            <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
          ))}
        </select>
      </label>
      <div key={key} className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
        <CardForm onSubmit={(v) => void onAdd(v)} submitLabel="Lưu & thêm tiếp" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <AddInner />
    </Suspense>
  );
}
