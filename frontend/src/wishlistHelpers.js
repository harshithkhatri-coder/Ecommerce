export const getWishlistUserId = (userObj) => {
  if (!userObj) {
    try {
      const uStr = localStorage.getItem("user");
      if (uStr) userObj = JSON.parse(uStr);
    } catch (e) {}
  }
  if (!userObj) return "";
  return (userObj.email || userObj.id || userObj._id || "").toLowerCase().trim();
};

export const getLocalWishlist = (userIdOrObj) => {
  let keyId = typeof userIdOrObj === "object" ? getWishlistUserId(userIdOrObj) : String(userIdOrObj || "").toLowerCase().trim();
  if (!keyId) {
    keyId = getWishlistUserId();
  }
  if (!keyId) return [];

  try {
    const data = localStorage.getItem(`wishlist_${keyId}`);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    // Secondary key check (e.g. check email if keyId was ID or vice versa)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      const candidates = [
        u.email ? u.email.toLowerCase().trim() : null,
        u.id ? String(u.id).toLowerCase().trim() : null,
        u._id ? String(u._id).toLowerCase().trim() : null
      ].filter(Boolean);

      for (const cand of candidates) {
        if (cand !== keyId) {
          const altData = localStorage.getItem(`wishlist_${cand}`);
          if (altData) {
            const parsedAlt = JSON.parse(altData);
            if (Array.isArray(parsedAlt) && parsedAlt.length > 0) return parsedAlt;
          }
        }
      }
    }
  } catch (e) {}
  return [];
};

export const setLocalWishlist = (userIdOrObj, items) => {
  let keyId = typeof userIdOrObj === "object" ? getWishlistUserId(userIdOrObj) : String(userIdOrObj || "").toLowerCase().trim();
  if (!keyId) keyId = getWishlistUserId();
  if (!keyId) return;

  try {
    localStorage.setItem(`wishlist_${keyId}`, JSON.stringify(items));

    // Save to all equivalent candidate keys so any fetch finds it
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const u = JSON.parse(userStr);
      if (u.email) localStorage.setItem(`wishlist_${u.email.toLowerCase().trim()}`, JSON.stringify(items));
      if (u.id) localStorage.setItem(`wishlist_${String(u.id).toLowerCase().trim()}`, JSON.stringify(items));
      if (u._id) localStorage.setItem(`wishlist_${String(u._id).toLowerCase().trim()}`, JSON.stringify(items));
    }
  } catch (e) {}
};
