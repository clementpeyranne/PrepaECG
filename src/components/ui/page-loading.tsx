export function PageLoading() {
  return (
    <div className="animate-pulse" aria-label="Chargement de la page" role="status">
      <div className="h-4 w-28 rounded-full bg-pine/10" />
      <div className="mt-4 h-10 w-64 max-w-[75%] rounded-2xl bg-pine/12" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="h-52 rounded-[28px] bg-white/60" />
        <div className="h-52 rounded-[28px] bg-white/60" />
      </div>
      <div className="mt-5 h-72 rounded-[28px] bg-white/60" />
      <span className="sr-only">Chargement...</span>
    </div>
  );
}
