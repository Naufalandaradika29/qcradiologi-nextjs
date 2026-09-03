export function Loading({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
        {label}
      </div>
    </div>
  );
}
