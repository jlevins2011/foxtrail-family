type PipMarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function PipMark({
  size = 40,
  className,
  title = "Pip the lantern fox",
}: PipMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <circle cx="32" cy="32" r="30" fill="var(--pine)" />
      <path
        d="M18 28c0-10 6-16 14-16s14 6 14 16c0 11-6 20-14 20S18 39 18 28Z"
        fill="var(--fox)"
      />
      <path d="M20 20 14 10l12 6" fill="var(--fox)" />
      <path d="M44 20 50 10 38 16" fill="var(--fox)" />
      <circle cx="26" cy="28" r="2.2" fill="var(--bark)" />
      <circle cx="38" cy="28" r="2.2" fill="var(--bark)" />
      <path
        d="M32 31c2 2 4 3 6 2"
        fill="none"
        stroke="var(--bark)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M28 38h8l-4 5z" fill="var(--ember)" />
      <g transform="translate(40 34)">
        <rect x="0" y="6" width="10" height="12" rx="2" fill="var(--lantern)" />
        <path d="M2 6h6l-1-4h-4z" fill="var(--ember)" />
        <circle cx="5" cy="12" r="2.4" fill="var(--snow)" />
      </g>
    </svg>
  );
}
