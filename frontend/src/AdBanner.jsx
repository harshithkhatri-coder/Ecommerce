import React, { useState, useEffect } from "react";
import { X, Tag, ExternalLink } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

const STORAGE_KEY = "velux_seen_ad_ids";

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
        const response = await fetch(`${API_BASE_URL}/ads/active`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
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

  if (loading || ads.length === 0) {
    return null;
  }

  const visibleAds = ads.filter((ad) => !dismissedIds.includes(ad._id || ad.id));
  if (visibleAds.length === 0) {
    return null;
  }

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
