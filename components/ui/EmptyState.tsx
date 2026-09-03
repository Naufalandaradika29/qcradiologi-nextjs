export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="mb-3 text-lg font-semibold text-slate-700">{title}</div>
      {description ? <p className="max-w-md text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
