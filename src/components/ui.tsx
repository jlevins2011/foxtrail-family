import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "lantern";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-pine text-snow shadow-sm hover:bg-moss",
  secondary:
    "border border-pine/20 bg-snow/80 text-pine hover:border-pine/40 hover:bg-snow",
  ghost: "text-pine hover:bg-parchment/70",
  lantern: "bg-lantern text-bark shadow-sm hover:bg-ember hover:text-snow",
};

const baseClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lantern disabled:opacity-60";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  external?: boolean;
  className?: string;
}) {
  const classes = `${baseClass} ${variantClass[variant]} ${className}`;
  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`${baseClass} ${variantClass[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 ${className}`}
    >
      {children}
    </section>
  );
}
