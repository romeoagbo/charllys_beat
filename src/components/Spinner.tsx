type SpinnerProps = {
  size?: "sm" | "md";
  tone?: "dark" | "light";
  className?: string;
};

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

const tones = {
  dark: "border-black/20 border-t-black",
  light: "border-current/20 border-t-current",
};

export function Spinner({
  size = "sm",
  tone = "light",
  className = "",
}: SpinnerProps) {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 ${sizes[size]} ${tones[tone]} ${className}`}
      aria-hidden="true"
    />
  );
}
