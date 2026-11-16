import { useId } from "react";

/** Logo Prépatempo : un « P » et l'arc d'un métronome (le rythme). */
export function BrandMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Prépatempo"
      className={`brand-mark shrink-0 ${className}`.trim()}
    >
      <defs>
        <linearGradient id={`bm-bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-pine))" />
          <stop offset="100%" stopColor="rgb(var(--color-ink))" />
        </linearGradient>
        <linearGradient id={`bm-accent-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-clay))" />
          <stop offset="100%" stopColor="rgb(var(--color-moss))" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill={`url(#bm-bg-${id})`} />
      <rect x="1.5" y="1.5" width="45" height="45" rx="13.5" fill="none" stroke="rgba(255,255,255,0.14)" />
      <path d="M13 35V13h9.5a7 7 0 0 1 0 14H13" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <g className="brand-mark__arc" style={{ transformOrigin: "35px 37px" }}>
        <path d="M35 37 38 15" stroke={`url(#bm-accent-${id})`} strokeWidth="3" strokeLinecap="round" />
        <circle cx="37.6" cy="18" r="3" fill="rgb(var(--color-clay))" />
      </g>
    </svg>
  );
}
