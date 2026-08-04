import React, { useState, useEffect } from "react";
import { Tag, Copy, Check, Percent, IndianRupee, Users, Shield } from "lucide-react";
import API_BASE_URL from "./config";

export default function Coupons({ onPageChange }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/coupons/active`);
        const data = await response.json();
        if (data.success) {
          setCoupons(data.data || []);
        }
      } catch (err) {
        console.error("Error fetching coupons:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [API_BASE_URL]);

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      alert(`Coupon code: ${code}`);
    }
  };

  const getDiscountLabel = (coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    }
    return `₹${coupon.discount_value} OFF`;
  };

  const getMinOrderLabel = (coupon) => {
    const min = Number(coupon.min_order_value || 0);
    return min > 0 ? `Min. order ₹${min}` : "No minimum order";
  };

  const getMaxDiscountLabel = (coupon) => {
    const max = Number(coupon.max_discount || 0);
    if (coupon.discount_type === "percentage" && max > 0) {
      return `Max discount ₹${max}`;
    }
    return null;
  };

  const getAudienceLabel = (coupon) => {
    if (!coupon.target_audience || coupon.target_audience === "all") return "All Users";
    if (coupon.target_audience === "new_users_only") return "New Users Only";
    if (coupon.target_audience === "specific_users") return "Selected Users";
    return coupon.target_audience;
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-widest mb-3">
            💰 Deals & Offers
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Available Coupons
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
            Copy a coupon code and apply it at checkout to save on your order.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700">
            <Tag className="mx-auto mb-4 text-gray-500" size={48} />
            <p className="text-gray-400 text-lg">No coupons available right now.</p>
            <button
              onClick={() => onPageChange("Products")}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold hover:from-orange-600 hover:to-amber-600 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon._id || coupon.id}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl hover:border-orange-500/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-wider">
                      <Percent size={14} />
                      {getDiscountLabel(coupon)}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      coupon.is_active !== false
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}>
                      {coupon.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="bg-gray-900/70 rounded-xl p-4 mb-4 border border-gray-700/60">
                    <p className="text-xs text-gray-400 mb-1">Coupon Code</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-2xl font-extrabold text-white tracking-widest">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(coupon.code)}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition border border-gray-600"
                        title="Copy code"
                      >
                        {copiedCode === coupon.code ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <IndianRupee size={16} className="text-gray-400" />
                      <span>{getMinOrderLabel(coupon)}</span>
                    </div>
                    {getMaxDiscountLabel(coupon) && (
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-gray-400" />
                        <span>{getMaxDiscountLabel(coupon)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span>{getAudienceLabel(coupon)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onPageChange("Cart")}
                    className="w-full mt-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:from-orange-600 hover:to-amber-600 transition shadow-md"
                  >
                    Use at Checkout
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
