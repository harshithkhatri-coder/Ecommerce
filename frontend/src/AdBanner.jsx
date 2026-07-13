import React, { useState, useEffect } from "react";
import { X, Tag, ExternalLink } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

const STORAGE_KEY = "velux_seen_ad_ids";
const ADS_CACHE_KEY = "velux_ads_cache";
const ADS_CACHE_TTL = 30 * 1000; // 30s

function getSeenAdIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markAdAsSeen(adId) {
  const seen = getSeenAdIds();
  if (!seen.includes(adId)) {
    seen.push(adId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    } catch {
      // ignore storage errors
    }
  }
}

export default function AdBanner({ user, onNavigate }) {
  const [ads, setAds] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAds = async () => {
      setLoading(true);
      try {
        // try cache first
        try {
          const raw = localStorage.getItem(ADS_CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.ts && Date.now() - parsed.ts < ADS_CACHE_TTL && Array.isArray(parsed.items)) {
              const seenIds = getSeenAdIds();
              const filtered = parsed.items.filter((ad) => !seenIds.includes(ad._id || ad.id));
              setAds(filtered);
              setLoading(false);
              return;
            }
          }
        } catch {}

        const response = await fetch(`${API_BASE_URL}/ads/active`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          try { localStorage.setItem(ADS_CACHE_KEY, JSON.stringify({ ts: Date.now(), items: data.data })); } catch {}
          const seenIds = getSeenAdIds();
          const filtered = data.data.filter((ad) => !seenIds.includes(ad._id || ad.id));
          setAds(filtered);
        }
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAds();
  }, []);

  const handleDismiss = (adId) => {
    markAdAsSeen(adId);
    setDismissedIds((prev) => [...prev, adId]);
  };

  const handleAction = (ad) => {
    if (ad.link_url) {
      if (ad.link_url.startsWith("http")) {
        window.open(ad.link_url, "_blank", "noopener,noreferrer");
      } else if (ad.link_url.startsWith("/") && onNavigate) {
        onNavigate(ad.link_url.replace(/^\//, ""));
      }
    }
    markAdAsSeen(ad._id || ad.id);
    setDismissedIds((prev) => [...prev, ad._id || ad.id]);
  };

  if (loading || ads.length === 0) return null;

  const visibleAds = ads.filter((ad) => !dismissedIds.includes(ad._id || ad.id));
  if (visibleAds.length === 0) return null;

  // Render differently based on display_type for better mobile UX
  const primary = visibleAds[0];
  if (primary.display_type === 'banner') {
    return (
      <div className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full overflow-hidden flex items-center gap-4 p-3">
          {primary.image_url && (
            <img src={resolveImageUrl(primary.image_url)} alt={primary.title} className="h-16 w-40 object-cover rounded" />
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">{primary.title}</h4>
              <button onClick={() => handleDismiss(primary._id || primary.id)} className="text-gray-500">Close</button>
            </div>
            <p className="text-sm text-gray-600">{primary.message}</p>
          </div>
          {primary.link_url && (
            <button onClick={() => handleAction(primary)} className="bg-gray-800 text-white px-3 py-2 rounded">{primary.button_text || 'Shop'}</button>
          )}
        </div>
      </div>
    );
  }

  if (primary.display_type === 'toast') {
    return (
      <div className="fixed bottom-6 right-4 z-50">
        <div className="bg-white rounded-xl shadow-lg p-4 max-w-xs w-full flex items-start gap-3">
          {primary.image_url && <img src={resolveImageUrl(primary.image_url)} alt={primary.title} className="h-12 w-12 object-cover rounded" />}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">{primary.title}</h4>
              <button onClick={() => handleDismiss(primary._id || primary.id)} className="text-gray-500">×</button>
            </div>
            <p className="text-sm text-gray-600">{primary.message}</p>
            {primary.link_url && <button onClick={() => handleAction(primary)} className="mt-2 text-xs text-gray-700">{primary.button_text || 'Open'}</button>}
          </div>
        </div>
      </div>
    );
  }

  // default: modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {visibleAds.map((ad, index) => (
          <div key={ad._id || ad.id || index} className="relative">
            {ad.image_url && (
              <div className="relative h-48 bg-gray-100">
                <img
                  src={resolveImageUrl(ad.image_url)}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="text-gray-600" size={20} />
                  <h3 className="text-xl font-bold text-gray-800">{ad.title}</h3>
                </div>
                <button
                  onClick={() => handleDismiss(ad._id || ad.id)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">{ad.message}</p>

              <div className="flex gap-3">
                {ad.link_url && (
                  <button
                    onClick={() => handleAction(ad)}
                    className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                  >
                    {ad.button_text || "Shop Now"}
                    <ExternalLink size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(ad._id || ad.id)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
