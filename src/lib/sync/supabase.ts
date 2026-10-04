"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getDb } from "@/lib/db/client";
import { loadSettings } from "@/lib/db/repositories";
import { mergeByUpdatedAt, type SyncAdapter, type SyncResult } from "@/lib/sync/adapter";
import type { AppSettings, Card, Deck } from "@/types/entities";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSyncConfigured(): boolean {
  return URL.length > 0 && ANON.length > 0;
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSyncConfigured()) return null;
  if (!client) client = createClient(URL, ANON);
  return client;
}

type DeckRow = { id: string; user_id: string; data: Deck; updated_at: number; deleted_at: number | null };
type CardRow = { id: string; user_id: string; deck_id: string; data: Card; updated_at: number; deleted_at: number | null };
type SettingsRow = { user_id: string; data: AppSettings; updated_at: number };

class SupabaseSync implements SyncAdapter {
  readonly name = "supabase";

  isConfigured(): boolean {
    return isSyncConfigured();
  }

  async getUserId(): Promise<string | null> {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getUser();
    return data.user?.id ?? null;
  }

  async signInWithEmail(email: string): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error("Chưa cấu hình Supabase.");
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined },
    });
    if (error) throw new Error(error.message);
  }

  async signInWithGoogle(): Promise<void> {
    const sb = getSupabase();
    if (!sb) throw new Error("Chưa cấu hình Supabase.");
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined },
    });
    if (error) throw new Error(error.message);
  }

  async signOut(): Promise<void> {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
  }

  onAuthChange(cb: (userId: string | null) => void): () => void {
    const sb = getSupabase();
    if (!sb) return () => undefined;
    const { data } = sb.auth.onAuthStateChange((_ev, session) => cb(session?.user?.id ?? null));
    return () => data.subscription.unsubscribe();
  }

  async syncNow(): Promise<SyncResult> {
    const sb = getSupabase();
    if (!sb) throw new Error("Chưa cấu hình Supabase.");
    const { data } = await sb.auth.getUser();
    const uid = data.user?.id;
    if (!uid) throw new Error("Bạn chưa đăng nhập.");
    const db = getDb();
    const at = Date.now();
    let pushed = 0;
    let pulled = 0;

    // --- Decks ---
    const [localDecks, cloudDecks] = await Promise.all([
      db.decks.toArray(),
      sb.from("decks").select("*").then((r) => {
        if (r.error) throw new Error(r.error.message);
        return (r.data ?? []) as DeckRow[];
      }),
    ]);
    const dm = mergeByUpdatedAt(
      localDecks,
      cloudDecks.map((r) => ({ ...r.data, updatedAt: r.updated_at, deletedAt: r.deleted_at })),
    );
    if (dm.toCloud.length > 0) {
      const { error } = await sb.from("decks").upsert(
        dm.toCloud.map((d) => ({ id: d.id, user_id: uid, data: d, updated_at: d.updatedAt, deleted_at: d.deletedAt ?? null })),
      );
      if (error) throw new Error(error.message);
      pushed += dm.toCloud.length;
    }
    if (dm.toLocal.length > 0) {
      await db.decks.bulkPut(dm.toLocal);
      pulled += dm.toLocal.length;
    }

    // --- Cards ---
    const [localCards, cloudCards] = await Promise.all([
      db.cards.toArray(),
      sb.from("cards").select("*").then((r) => {
        if (r.error) throw new Error(r.error.message);
        return (r.data ?? []) as CardRow[];
      }),
    ]);
    const cm = mergeByUpdatedAt(
      localCards,
      cloudCards.map((r) => ({ ...r.data, updatedAt: r.updated_at, deletedAt: r.deleted_at })),
    );
    if (cm.toCloud.length > 0) {
      // Chia nhỏ để tránh payload quá lớn
      for (let i = 0; i < cm.toCloud.length; i += 200) {
        const chunk = cm.toCloud.slice(i, i + 200);
        const { error } = await sb.from("cards").upsert(
          chunk.map((c) => ({ id: c.id, user_id: uid, deck_id: c.deckId, data: c, updated_at: c.updatedAt, deleted_at: c.deletedAt ?? null })),
        );
        if (error) throw new Error(error.message);
      }
      pushed += cm.toCloud.length;
    }
    if (cm.toLocal.length > 0) {
      await db.cards.bulkPut(cm.toLocal);
      pulled += cm.toLocal.length;
    }

    // --- Review logs: chỉ append (upsert theo id, không xóa) ---
    const [localLogs, cloudLogs] = await Promise.all([
      db.reviewLogs.toArray(),
      sb.from("review_logs").select("id").then((r) => {
        if (r.error) throw new Error(r.error.message);
        return ((r.data ?? []) as Array<{ id: string }>).map((x) => x.id);
      }),
    ]);
    const known = new Set(cloudLogs);
    const fresh = localLogs.filter((l) => !known.has(l.id));
    if (fresh.length > 0) {
      for (let i = 0; i < fresh.length; i += 200) {
        const chunk = fresh.slice(i, i + 200);
        const { error } = await sb.from("review_logs").upsert(
          chunk.map((l) => ({ id: l.id, user_id: uid, card_id: l.cardId, deck_id: l.deckId, data: l, updated_at: l.reviewedAt })),
        );
        if (error) throw new Error(error.message);
      }
      pushed += fresh.length;
    }

    // --- Settings ---
    const localSettings = await loadSettings(db);
    const { data: cloudSettings, error: sErr } = await sb.from("settings").select("*").eq("user_id", uid).maybeSingle();
    if (sErr) throw new Error(sErr.message);
    const cRow = (cloudSettings ?? null) as SettingsRow | null;
    if (!cRow || localSettings.updatedAt >= cRow.updated_at) {
      if (!cRow || localSettings.updatedAt > cRow.updated_at) {
        const { error } = await sb.from("settings").upsert({ user_id: uid, data: localSettings, updated_at: localSettings.updatedAt });
        if (error) throw new Error(error.message);
        pushed += 1;
      }
    } else {
      await db.settings.put({ ...cRow.data, updatedAt: cRow.updated_at });
      pulled += 1;
    }

    try {
      localStorage.setItem("lexiloop-last-sync", String(at));
    } catch {
      // bỏ qua
    }
    return { pushed, pulled, at };
  }
}

export const syncAdapter: SyncAdapter = new SupabaseSync();
