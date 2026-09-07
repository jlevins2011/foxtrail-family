export function ForestBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(232,162,58,0.18),_transparent_42%),linear-gradient(180deg,_var(--cream),_#efe4cc_48%,_var(--cream))]" />
      <svg
        className="absolute bottom-0 left-1/2 h-[220px] w-[1400px] -translate-x-1/2 text-pine/20"
        viewBox="0 0 1400 220"
        fill="none"
      >
        <path d="M0 220 80 140 140 220Z" fill="currentColor" />
        <path d="M110 220 200 90 280 220Z" fill="currentColor" />
        <path d="M250 220 340 120 410 220Z" fill="currentColor" />
        <path d="M520 220 630 70 740 220Z" fill="currentColor" />
        <path d="M700 220 790 110 870 220Z" fill="currentColor" />
        <path d="M980 220 1080 80 1180 220Z" fill="currentColor" />
        <path d="M1140 220 1240 130 1320 220Z" fill="currentColor" />
        <ellipse
          cx="700"
          cy="210"
          rx="700"
          ry="28"
          fill="var(--moss)"
          opacity="0.18"
        />
      </svg>
    </div>
  );
}
