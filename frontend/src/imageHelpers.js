import API_BASE_URL from "./config";

const getApiOrigin = () => {
  if (!API_BASE_URL) return "";
  const trimmed = API_BASE_URL.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/api\/?$/i, "");
  }

  if (trimmed.startsWith("/api")) {
    if (typeof window !== "undefined" && window.location) {
      return window.location.origin;
    }
    return "";
  }

  return trimmed;
};

const encodePath = (url) => {
  try {
    return encodeURI(url);
  } catch (err) {
    return url;
  }
};

export function resolveImageUrl(src) {
  if (!src) return "";
  if (typeof src !== "string") return src?.default || "";

  const trimmed = src.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return encodePath(trimmed);
  }

  if (trimmed.startsWith("/images/")) {
    const origin = getApiOrigin();
    const finalUrl = origin ? `${origin}${trimmed}` : trimmed;
    return encodePath(finalUrl);
  }

  if (trimmed.startsWith("images/")) {
    const origin = getApiOrigin();
    const finalUrl = origin ? `${origin}/${trimmed}` : `/${trimmed}`;
    return encodePath(finalUrl);
  }

  return encodePath(trimmed);
}
