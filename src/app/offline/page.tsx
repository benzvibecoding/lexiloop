import Link from "next/link";

export const metadata = { title: "Mất mạng" };

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-md p-10 text-center">
      <p className="text-6xl" aria-hidden>📴</p>
      <h1 className="mt-4 text-2xl font-extrabold">Bạn đang offline</h1>
      <p className="mt-2 text-stone-500">
        Các trang đã mở trước đây vẫn dùng được. Phần học và thẻ của bạn nằm trên máy nên không mất đâu.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/dashboard" className="flex min-h-[44px] items-center rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white">
          Về Tổng quan
        </Link>
        <Link href="/review" className="flex min-h-[44px] items-center rounded-2xl border px-5 text-sm font-bold">
          Ôn tập
        </Link>
      </div>
    </main>
  );
}
