export function Stub({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 text-stone-600 dark:text-stone-300">{desc}</p>
      <div className="mt-4 rounded-3xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500 dark:border-stone-700">
        Sẽ có ở Phase tiếp theo. Phase 0 chỉ dựng khung.
      </div>
    </div>
  );
}
