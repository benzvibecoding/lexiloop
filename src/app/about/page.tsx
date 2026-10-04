import type { Metadata } from "next";

export const metadata: Metadata = { title: "Giới thiệu" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-extrabold">LexiLoop là gì?</h1>
      <p className="mt-4">
        LexiLoop là web app học từ vựng tiếng Anh cho người Việt. Bạn tạo bộ thẻ, học bằng flashcard
        và app tự nhắc ôn lại đúng lúc để nhớ lâu.
      </p>
      <p className="mt-2">
        Dữ liệu lưu trên máy bạn (IndexedDB), không cần tài khoản, dùng được khi mất mạng.
      </p>
    </main>
  );
}
