export function maskPersonName(name: string, options?: { keepFirst?: number; keepLast?: number }) {
  const keepFirst = options?.keepFirst ?? 2;
  const keepLast = options?.keepLast ?? 0;

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const maskWord = (word: string) => {
    const raw = word.trim();
    if (raw.length <= keepFirst + keepLast) return raw;
    const start = raw.slice(0, keepFirst);
    const end = keepLast > 0 ? raw.slice(-keepLast) : "";
    const stars = "•".repeat(Math.max(3, raw.length - keepFirst - keepLast));
    return `${start}${stars}${end}`;
  };

  return parts.map(maskWord).join(" ");
}
