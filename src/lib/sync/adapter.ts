/** Interface SyncAdapter: tách backend để thay Supabase bằng backend khác sau này. */
export type SyncStatus = {
  state: "idle" | "syncing" | "error" | "off";
  lastSyncAt: number | null;
  lastError: string | null;
};

export type SyncResult = {
  pushed: number;
  pulled: number;
  at: number;
};

export interface SyncAdapter {
  readonly name: string;
  isConfigured(): boolean;
  getUserId(): Promise<string | null>;
  signInWithEmail(email: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  onAuthChange(cb: (userId: string | null) => void): () => void;
  /** Đẩy delta local → cloud, kéo cloud → local, merge last-write-wins. */
  syncNow(): Promise<SyncResult>;
}

/** Merge last-write-wins theo từng bản ghi (dùng updatedAt). Trả về bản thắng + phía cần cập nhật. */
export function mergeByUpdatedAt<T extends { id: string; updatedAt: number }>(
  local: T[],
  cloud: T[],
): { merged: T[]; toCloud: T[]; toLocal: T[] } {
  const lmap = new Map(local.map((r) => [r.id, r]));
  const cmap = new Map(cloud.map((r) => [r.id, r]));
  const ids = new Set([...lmap.keys(), ...cmap.keys()]);
  const merged: T[] = [];
  const toCloud: T[] = [];
  const toLocal: T[] = [];
  for (const id of ids) {
    const l = lmap.get(id);
    const c = cmap.get(id);
    if (l && !c) {
      merged.push(l);
      toCloud.push(l);
    } else if (!l && c) {
      merged.push(c);
      toLocal.push(c);
    } else if (l && c) {
      if (l.updatedAt >= c.updatedAt) {
        merged.push(l);
        if (l.updatedAt > c.updatedAt) toCloud.push(l);
      } else {
        merged.push(c);
        toLocal.push(c);
      }
    }
  }
  return { merged, toCloud, toLocal };
}
