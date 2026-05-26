import Link from "next/link";

type ButtonProps = {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  primary:
    "bg-gold text-black hover:bg-gold-light gold-glow font-semibold",
  secondary:
    "border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold",
  ghost: "text-muted hover:text-foreground",
};

export function Button({
  href,
  variant = "primary",
  children,
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm transition-all duration-200 ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
