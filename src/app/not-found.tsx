import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md p-10 text-center">
      <p className="text-6xl" aria-hidden>🧭</p>
      <h1 className="mt-4 text-2xl font-extrabold">Không tìm thấy trang</h1>
      <p className="mt-2 text-stone-500">Trang này không tồn tại hoặc đã bị chuyển đi.</p>
      <Link href="/" className="mt-6 inline-block min-h-[44px] rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white">
        Về trang chủ
      </Link>
    </main>
  );
}
