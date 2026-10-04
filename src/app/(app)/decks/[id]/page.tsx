"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db/client";
import { createCard, newCardDefaults } from "@/lib/db/repositories";
import { cardSchema } from "@/lib/db/schemas";
import { CardForm, type CardFormValues } from "@/components/cards/CardForm";
import { ShareDeckButton } from "@/components/deck/ShareDeckButton";
import { CardList } from "@/components/cards/CardList";
import { BulkAdd } from "@/components/cards/BulkAdd";
import { ImportDialog } from "@/components/cards/ImportDialog";
import { useToasts } from "@/components/common/Toasts";
import { useDbMounted } from "@/stores/settings";
import type { Card, Cefr } from "@/types/entities";

function toCardInput(deckId: string, v: CardFormValues) {
  return {
    ...newCardDefaults(
      deckId,
      v.word.trim(),
      v.meaningVi.split(";").map((s) => s.trim()).filter(Boolean),
    ),
    pos: v.pos.split(",").map((s) => s.trim()).filter(Boolean),
    ipaUs: v.ipa || undefined,
    ipaUk: v.ipa || undefined,
    definitionEn: v.definitionEn || undefined,
    examples: v.exampleEn ? [{ en: v.exampleEn, vi: v.exampleVi || undefined }] : [],
    mnemonic: v.mnemonic || undefined,
    tags: v.tags.split(",").map((s) => s.trim()).filter(Boolean),
    cefr: (v.cefr || undefined) as Cefr | undefined,
  };
}

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mounted = useDbMounted();
  const push = useToasts((s) => s.push);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);

  const deck = useLiveQuery(async () => {
    if (!mounted) return null;
    return getDb().decks.get(id);
  }, [mounted, id]);

  async function onAdd(v: CardFormValues): Promise<void> {
    // Chống trùng trong cùng deck
    const db = getDb();
    const same = await db.cards.where("deckId").equals(id).toArray();
    if (same.some((c) => c.deletedAt == null && c.word.trim().toLowerCase() === v.word.trim().toLowerCase())) {
      push(`“${v.word.trim()}” đã có trong bộ này — vẫn lưu nếu bạn muốn thẻ khác nghĩa.`);
    }
    await createCard(db, toCardInput(id, v));
    setShowAdd(false);
    push(`Đã thêm “${v.word.trim()}”.`);
  }

  async function onSaveEdit(v: CardFormValues): Promise<void> {
    if (!editing) return;
    const db = getDb();
    const next = cardSchema.parse({
      ...editing,
      ...toCardInput(id, v),
      id: editing.id,
      createdAt: editing.createdAt,
      updatedAt: Date.now(),
    });
    await db.cards.put(next);
    setEditing(null);
    push("Đã lưu thẻ.");
  }

  if (!mounted) return <div aria-busy="true" className="h-24 animate-pulse rounded-3xl bg-stone-200" />;

  if (deck === null) {
    return (
      <div>
        <Link href="/decks" className="text-sm underline">← Về danh sách</Link>
        <p className="mt-4 font-bold">Không tìm thấy bộ thẻ (có thể đã xóa).</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/decks" className="text-sm underline">← Về danh sách</Link>
      <h1 className="mt-1 text-2xl font-extrabold">
        {deck?.emoji} {deck?.name}
      </h1>
      {deck?.description ? <p className="text-sm text-stone-500">{deck.description}</p> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => { setShowAdd((v) => !v); setEditing(null); }} className="flex min-h-[44px] items-center rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white">
          {showAdd ? "Đóng form" : "＋ Thêm thẻ"}
        </button>
        <Link href={`/add?deck=${id}`} className="flex min-h-[44px] items-center rounded-2xl border px-4 text-sm font-bold">
          Thêm nhanh →
        </Link>
        <ShareDeckButton deckId={id} />
      </div>

      {showAdd ? (
        <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <CardForm onSubmit={(v) => void onAdd(v)} submitLabel="Lưu thẻ" />
        </div>
      ) : null}

      {editing ? (
        <div className="mt-3 rounded-3xl bg-white p-4 shadow-soft dark:bg-stone-900">
          <h2 className="mb-2 font-bold">Sửa: {editing.word}</h2>
          <CardForm
            initial={{
              word: editing.word,
              meaningVi: editing.meaningVi.join("; "),
              pos: editing.pos.join(", "),
              ipa: editing.ipaUs ?? editing.ipaUk ?? "",
              definitionEn: editing.definitionEn ?? "",
              exampleEn: editing.examples[0]?.en ?? "",
              exampleVi: editing.examples[0]?.vi ?? "",
              mnemonic: editing.mnemonic ?? "",
              tags: editing.tags.join(", "),
              cefr: editing.cefr ?? "",
            }}
            onSubmit={(v) => void onSaveEdit(v)}
            submitLabel="Lưu"
          />
          <button type="button" onClick={() => setEditing(null)} className="mt-2 text-sm underline">Hủy</button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <BulkAdd deckId={id} onDone={() => undefined} />
        <ImportDialog deckId={id} onDone={() => undefined} />
      </div>

      <CardList deckId={id} onEdit={setEditing} />
    </div>
  );
}
