"use client";

import { useEffect, useState } from "react";
import { Download, Upload, Trash2, HardDrive } from "lucide-react";
import { getDb } from "@/lib/db/client";
import { exportBackup, importBackup, getStorageUsage, ensurePersist } from "@/lib/backup/backup";
import { wipeAll } from "@/lib/db/repositories";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function DataPanel() {
  const [info, setInfo] = useState<string>("");
  const [usage, setUsage] = useState<{ usedBytes: number; quotaBytes: number; persisted: boolean } | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    void getStorageUsage().then(setUsage);
  }, []);

  async function onExport(): Promise<void> {
    try {
      const doc = await exportBackup(getDb());
      const blob = new Blob([JSON.stringify(doc)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lexiloop-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setInfo("Đã xuất backup. Giữ file này cẩn thận.");
    } catch (e) {
      setInfo(e instanceof Error ? e.message : "Xuất backup thất bại.");
    }
  }

  async function onImport(file: File): Promise<void> {
    try {
      const text = await file.text();
      const json: unknown = JSON.parse(text);
      const r = await importBackup(getDb(), json, "replace");
      setInfo(`Đã khôi phục: ${r.decks} bộ thẻ, ${r.cards} thẻ.`);
    } catch (e) {
      setInfo(e instanceof Error ? `File không hợp lệ: ${e.message}` : "File không hợp lệ.");
    }
  }

  async function onWipe(): Promise<void> {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    await wipeAll(getDb());
    setConfirmWipe(false);
    setInfo("Đã xóa toàn bộ dữ liệu trên máy này.");
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-5 shadow-soft dark:bg-stone-900" aria-label="Dữ liệu">
      <h2 className="flex items-center gap-2 font-bold">
        <HardDrive size={18} aria-hidden /> Dữ liệu trên máy
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        {usage
          ? `Đã dùng ${formatBytes(usage.usedBytes)} / ${formatBytes(usage.quotaBytes)} · Chống mất khi dọn rác: ${usage.persisted ? "bật" : "tắt"}`
          : "Đang đọc dung lượng…"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onExport()}
          className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-stone-900 px-4 text-sm font-bold text-white dark:bg-white dark:text-stone-900"
        >
          <Download size={16} aria-hidden /> Xuất backup
        </button>
        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl border border-stone-300 px-4 text-sm font-bold">
          <Upload size={16} aria-hidden /> Nhập backup
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => void ensurePersist().then((ok) => setInfo(ok ? "Đã bật chống mất dữ liệu." : "Trình duyệt từ chối."))}
          className="flex min-h-[44px] items-center rounded-2xl border border-stone-300 px-4 text-sm font-bold"
        >
          Giữ dữ liệu lâu dài
        </button>
        <button
          type="button"
          onClick={() => void onWipe()}
          className="flex min-h-[44px] items-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white"
        >
          <Trash2 size={16} aria-hidden /> {confirmWipe ? "Bấm lần nữa để xác nhận xóa" : "Xóa toàn bộ"}
        </button>
      </div>
      {info ? (
        <p role="status" className="mt-3 text-sm font-medium">
          {info}
        </p>
      ) : null}
    </section>
  );
}
