export default function AppLoading() {
  return (
    <div aria-busy="true" className="grid gap-3">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-stone-200 dark:bg-stone-800" />
      <div className="h-40 animate-pulse rounded-3xl bg-stone-200 dark:bg-stone-800" />
    </div>
  );
}
