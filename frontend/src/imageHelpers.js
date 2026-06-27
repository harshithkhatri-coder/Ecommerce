export function resolveImageUrl(src) {
  if (!src) return "";
  if (typeof src !== "string") return src?.default || "";

  const trimmed = src.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  return trimmed;
}
