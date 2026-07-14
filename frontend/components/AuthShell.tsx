export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute inset-y-0 -right-6 hidden w-6 border-r-2 border-dashed border-amber-400/60 sm:block" />
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-extrabold text-emerald-700">
            ثانوية أسيستنت
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink/60">{subtitle}</p>
        </div>
        <div className="rounded-card border border-line bg-white p-6 shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
