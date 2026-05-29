export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function isValidPhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}
