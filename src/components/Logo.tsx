import Image from "next/image";
import Link from "next/link";

const sizes = {
  sm: { width: 96, height: 96, className: "h-9 w-auto" },
  md: { width: 112, height: 112, className: "h-11 w-auto" },
  lg: { width: 160, height: 160, className: "h-20 w-auto" },
} as const;

type LogoProps = {
  size?: keyof typeof sizes;
  linked?: boolean;
  className?: string;
};

export function Logo({ size = "md", linked = true, className = "" }: LogoProps) {
  const { width, height, className: sizeClass } = sizes[size];

  const image = (
    <Image
      src="/logo.jpeg"
      alt="LBP Records — Production musicale"
      width={width}
      height={height}
      className={`object-contain ${sizeClass} ${className}`}
      priority={size === "md"}
    />
  );

  if (linked) {
    return (
      <Link href="/" className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    );
  }

  return image;
}
