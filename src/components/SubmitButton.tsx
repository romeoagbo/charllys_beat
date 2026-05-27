"use client";

import type { ComponentProps } from "react";
import { Spinner } from "@/components/Spinner";

type SubmitButtonProps = ComponentProps<"button"> & {
  loading?: boolean;
  loadingLabel?: string;
};

export function SubmitButton({
  loading = false,
  loadingLabel = "Chargement...",
  children,
  disabled,
  className = "",
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-gold py-3 font-semibold text-black transition-colors hover:bg-gold-light disabled:opacity-50 ${className}`}
      {...props}
    >
      {loading && <Spinner size="md" tone="dark" />}
      {loading ? loadingLabel : children}
    </button>
  );
}
