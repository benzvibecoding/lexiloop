"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md p-10 text-center">
      <h1 className="text-2xl font-extrabold">Có lỗi xảy ra</h1>
      <p className="mt-2 text-sm text-stone-500">{error.message}</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 min-h-[44px] rounded-2xl bg-orange-500 px-6 font-bold text-white"
      >
        Thử lại
      </button>
    </main>
  );
}
