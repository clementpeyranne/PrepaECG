export function PageLoading() {
  return (
    <div aria-label="Chargement de la page" role="status">
      <div className="shimmer h-36 rounded-[28px] bg-pine/10 lg:h-44" />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="shimmer h-52 rounded-[28px] bg-white/60" />
        <div className="shimmer h-52 rounded-[28px] bg-white/60" />
      </div>
      <div className="shimmer mt-5 h-72 rounded-[28px] bg-white/60" />
      <span className="sr-only">Chargement...</span>
    </div>
  );
}
