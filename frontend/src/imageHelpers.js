export function resolveImageUrl(src) {
  if (!src) return "/images/SHOE1.jpg";

  if (Array.isArray(src)) {
    return resolveImageUrl(src[0]);
  }

  if (typeof src !== "string") {
    return src?.default || src?.url || "/images/SHOE1.jpg";
  }

  let trimmed = src.trim();
  if (!trimmed) return "/images/SHOE1.jpg";

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return resolveImageUrl(parsed[0]);
      }
    } catch (e) {}
  }

  trimmed = trimmed.replace(/^["']|["']$/g, '');

  if (!trimmed) return "/images/SHOE1.jpg";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (!trimmed.startsWith("/")) {
    trimmed = "/" + trimmed;
  }

  return trimmed;
}
