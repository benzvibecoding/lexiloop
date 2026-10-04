"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { encodeShare } from "@/lib/share/share";
import { useToasts } from "@/components/common/Toasts";

/** Tạo link chia sẻ nén (deck nhỏ). Sao chép vào clipboard. */
export function ShareDeckButton({ deckId }: { deckId: string }) {
  const push = useToasts((s) => s.push);
  const [busy, setBusy] = useState(false);

  async function share(): Promise<void> {
    setBusy(true);
    try {
      const db = getDb();
      const deck = await db.decks.get(deckId);
      if (!deck) throw new Error("Không tìm thấy bộ thẻ.");
      const cards = await db.cards.where("deckId").equals(deckId).toArray();
      const alive = cards.filter((c) => c.deletedAt == null);
      if (alive.length === 0) throw new Error("Bộ này chưa có thẻ nào.");
      if (alive.length > 500) throw new Error("Deck quá lớn để chia sẻ link (tối đa 500 thẻ). Hãy xuất file JSON trong Cài đặt.");
      const code = encodeShare({
        v: 1,
        name: deck.name,
        description: deck.description,
        emoji: deck.emoji,
        cards: alive.map((c) => ({
          word: c.word,
          meaningVi: c.meaningVi,
          pos: c.pos,
          exampleEn: c.examples[0]?.en,
          exampleVi: c.examples[0]?.vi,
        })),
      });
      const url = `${window.location.origin}/share?d=${code}`;
      await navigator.clipboard.writeText(url);
      push(`Đã sao chép link chia sẻ (${alive.length} thẻ). Ai mở link là thêm được.`);
    } catch (e) {
      push(e instanceof Error ? e.message : "Chia sẻ thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      disabled={busy}
      className="flex min-h-[44px] items-center gap-1 rounded-2xl border px-4 text-sm font-bold disabled:opacity-50"
    >
      <Share2 size={16} aria-hidden /> {busy ? "Đang tạo…" : "Chia sẻ"}
    </button>
  );
}
