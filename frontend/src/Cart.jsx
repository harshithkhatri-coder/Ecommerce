import React, { useState, useEffect } from "react";
import { Trash2, ShoppingCart, ArrowLeft, Plus, Minus, Tag } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";
import { lookupPincode } from "./pincodeHelper";

export default function Cart({ cart, setCart, onRemoveFromCart, onPageChange, user }) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponLocked, setCouponLocked] = useState(false);
  const [checkingLock, setCheckingLock] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [selectedAddressType, setSelectedAddressType] = useState("profile");
  const [customAddress, setCustomAddress] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India"
  });

  useEffect(() => {
    const storedCoupon = localStorage.getItem('appliedCoupon');
    if (storedCoupon) {
      try {
        setAppliedCoupon(JSON.parse(storedCoupon));
        setCouponCode(JSON.parse(storedCoupon).code);
        localStorage.removeItem('appliedCoupon');
      } catch (e) {
        localStorage.removeItem('appliedCoupon');
      }
    }
  }, []);

  useEffect(() => {
    const checkCouponLock = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      setCheckingLock(true);
      try {
        const res = await fetch(`${API_BASE_URL}/coupon-locks/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data?.locked) {
          setCouponLocked(true);
        }
      } catch (err) {
        console.error("Error checking coupon lock:", err);
      } finally {
        setCheckingLock(false);
      }
    };

    checkCouponLock();
  }, []);

  useEffect(() => {
    const fetchActiveCoupons = async () => {
      setCouponsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/coupons/active`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setActiveCoupons(data.data);
        }
      } catch (err) {
        console.error("Error fetching active coupons:", err);
      } finally {
        setCouponsLoading(false);
      }
    };

    fetchActiveCoupons();
  }, []);

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const tax = Math.round((total - discountAmount) * 0.18);
  const grandTotal = total - discountAmount + tax;

  // Maximum allowed items per user
  const MAX_ITEMS = 5;

  // Get user's saved address from signup/profile
  const userAddress = user ?
    `${user.address || ''}, ${user.city || ''}, ${user.state || ''} ${user.zipCode || ''}, ${user.country || ''}`.replace(/^, |, $/g, '').replace(/^,\s*|,\s*$/g, '')
    : "";

  const getEffectiveShippingAddress = () => {
    if (selectedAddressType === "profile" && userAddress.trim()) {
      return userAddress.trim();
    }
    const parts = [
      customAddress.address,
      customAddress.city,
      customAddress.state,
      customAddress.zipCode,
      customAddress.country
    ].map(p => (p || "").trim()).filter(Boolean);
    return parts.join(", ");
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    const newQuantity = newCart[index].quantity + delta;

    // Don't allow quantity less than 1
    if (newQuantity < 1) return;

    // Don't allow quantity increase if it would exceed limit
    const currentTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (delta > 0 && currentTotal >= MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items. Please remove an item to add more.`);
      return;
    }

    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");

    if (couponLocked) {
      setCouponError("Your coupon access is locked. Please wait for admin permission to use coupons.");
      setCouponLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal: total,
          cartItems: cart.map((item) => ({
            product_id: item._id || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          userId: user?.id || user?._id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        setCouponError("");
      } else {
        setCouponError(data.message || "Invalid coupon");
        setAppliedCoupon(null);
        if (data.coupon_locked) {
          setCouponLocked(true);
        }
      }
    } catch {
      setCouponError("Failed to validate coupon");
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("Please login to place an order");
      onPageChange("Login");
      return;
    }

    const shippingAddress = getEffectiveShippingAddress();
    if (!shippingAddress || shippingAddress.length < 5) {
      alert("Please select your saved address or enter a delivery address before proceeding to checkout.");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Check if total items exceed limit
    if (totalItems > MAX_ITEMS) {
      alert(`You can only purchase a maximum of ${MAX_ITEMS} items per order. Please reduce items in your cart.`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const items = cart.map((item) => ({
        product_id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url || item.image,
      }));



      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: user.id || user._id,
          items: items,
          subtotal: total,
          total: grandTotal,
          address: shippingAddress,
          coupon_code: appliedCoupon?.code || "",
          discount: discountAmount
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOrderSuccess(true);
        alert(`Order placed successfully! Order ID: ${data.data._id}`);
        // Clear cart after successful order
        setTimeout(() => {
          setCart([]);
          window.location.reload();
        }, 2000);
      } else {
        alert(data.message || "Failed to place order");
      }
    } catch (err) {
      console.error("Error placing order:", err);
      alert("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
      {/* Animated Page Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white py-12 px-6 border-b border-gray-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 space-y-1">
          <span className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-2">
            🛒 Your Cart Items
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight animated-banner-title drop-shadow-md">
            Shopping Cart
          </h1>
          <p className="text-gray-300 text-sm md:text-base font-medium">
            Review and manage your selected items before proceeding to checkout.
          </p>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Item Count Indicator */}
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-gray-700 font-semibold">
            Items in Cart: <span className="text-gray-900">{totalItems}</span> / {MAX_ITEMS}
          </p>
          {totalItems >= MAX_ITEMS && (
            <p className="text-gray-400 text-sm mt-1">You have reached the maximum limit of {MAX_ITEMS} items</p>
          )}
        </div>
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h2>
            <p className="text-gray-300 mb-8">Add some products to get started!</p>
            <button
              onClick={() => onPageChange("Products")}
               className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {cart.map((item, index) => (
                  <div key={index} className="border-b last:border-b-0 p-4 md:p-6 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                      <img
                        src={resolveImageUrl(item.image_url || item.image)}
                        alt={item.name}
                        className="w-full sm:w-24 h-32 sm:h-24 object-cover rounded-lg"
                      />
                      <div className="flex-grow w-full">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{item.name}</h3>
                        <p className="text-gray-600 mb-2">{item.category}</p>
                         <p className="text-xl sm:text-2xl font-bold text-gray-800">₹{item.price}</p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between w-full gap-3 mt-3 sm:mt-0">
                        <p className="text-lg sm:text-xl font-bold text-gray-800">₹{item.price * item.quantity}</p>
                        <button
                          onClick={() => onRemoveFromCart(index)}
                          className="bg-gray-600 text-white p-2 sm:p-3 rounded-lg hover:bg-gray-700 transition w-full sm:w-auto"
                        >
                          <Trash2 size={18} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-8 sticky top-20">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="font-semibold text-gray-600">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span className="font-semibold">₹{tax}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <span className="font-semibold">-₹{discountAmount}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code Input */}
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Tag size={14} className="inline mr-1" />
                    Coupon Code
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <span className="font-bold text-green-700">{appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm ml-2">-₹{appliedCoupon.discount_amount}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {couponLocked && !checkingLock && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
                          Your coupon access is locked. You need admin permission to use coupons again.
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          placeholder="Enter code"
                          disabled={couponLocked}
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-gray-400 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim() || couponLocked}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </div>
                    </div>
                  )}
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}

                  {!appliedCoupon && activeCoupons.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Coupons</h4>
                      {couponsLoading ? (
                        <p className="text-xs text-gray-400">Loading coupons...</p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {activeCoupons.map((coupon) => {
                            const minOrder = Number(coupon.min_order_value || 0);
                            const isEligible = total >= minOrder;
                            const isSelected = couponCode === coupon.code;

                            return (
                              <div
                                key={coupon._id || coupon.id}
                                onClick={() => {
                                  if (!couponLocked) {
                                    setCouponCode(coupon.code);
                                    setCouponError("");
                                  }
                                }}
                                className={`p-3 border rounded-lg text-left transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-50 shadow-md scale-[1.02]"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 animate-pulse">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-sm">
                                    {coupon.code}
                                  </span>
                                  <span className="text-xs font-semibold text-emerald-600">
                                    {coupon.discount_type === "percentage"
                                      ? `${coupon.discount_value}% OFF`
                                      : `₹${coupon.discount_value} OFF`}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs">
                                  <span className="text-gray-500">
                                    Min purchase: ₹{minOrder}
                                  </span>
                                  {isEligible ? (
                                    <span className="text-emerald-600 font-medium">Eligible</span>
                                  ) : (
                                    <span className="text-red-500 font-medium">
                                      Buy ₹{minOrder - total} more
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <div className="mt-2 pt-2 border-t border-orange-200 flex items-center gap-1 text-orange-700 text-xs font-semibold animate-fadeIn">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Selected
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between text-2xl font-bold text-gray-800">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">
                      ₹{grandTotal}
                    </span>
                  </div>
                </div>

                <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
                  Payment method: <strong>Prepaid only</strong>. Cash on delivery is not available.
                </div>

                {/* Delivery Address Selection */}
                <div className="mb-6 bg-gray-900 border border-gray-800 p-5 rounded-2xl text-white shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-white uppercase tracking-wider">
                      Delivery Address
                    </label>
                    <button
                      type="button"
                      onClick={() => onPageChange("Profile")}
                      className="text-xs text-orange-400 hover:underline font-semibold"
                    >
                      Manage Addresses
                    </button>
                  </div>

                  {/* Option 1: Saved Profile Address */}
                  {userAddress.trim() ? (
                    <label
                      onClick={() => setSelectedAddressType("profile")}
                      className={`block p-3.5 rounded-xl border-2 cursor-pointer transition mb-3 ${
                        selectedAddressType === "profile"
                          ? "border-orange-500 bg-orange-500/10 text-white shadow-md"
                          : "border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="addressType"
                          checked={selectedAddressType === "profile"}
                          onChange={() => setSelectedAddressType("profile")}
                          className="mt-1 text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-0.5">Use Saved Profile Address</p>
                          <p className="text-sm font-semibold text-white">{userAddress}</p>
                        </div>
                      </div>
                    </label>
                  ) : null}

                  {/* Option 2: Enter Custom Shipping Address */}
                  <label
                    onClick={() => setSelectedAddressType("custom")}
                    className={`block p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      selectedAddressType === "custom" || !userAddress.trim()
                        ? "border-orange-500 bg-orange-500/10 text-white shadow-md"
                        : "border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="addressType"
                        checked={selectedAddressType === "custom" || !userAddress.trim()}
                        onChange={() => setSelectedAddressType("custom")}
                        className="mt-1 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="w-full">
                        <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                          {userAddress.trim() ? "Deliver to a Different Address" : "Enter Delivery Address"}
                        </p>

                        {(selectedAddressType === "custom" || !userAddress.trim()) && (
                          <div className="space-y-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              placeholder="House / Flat No., Street, Landmark"
                              value={customAddress.address}
                              onChange={(e) => setCustomAddress({ ...customAddress, address: e.target.value })}
                              className="w-full p-2.5 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                              required
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="City"
                                value={customAddress.city}
                                onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                                className="w-full p-2.5 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                              <input
                                type="text"
                                placeholder="State"
                                value={customAddress.state}
                                onChange={(e) => setCustomAddress({ ...customAddress, state: e.target.value })}
                                className="w-full p-2.5 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="ZIP / Pincode (Auto-fills City/State)"
                                value={customAddress.zipCode}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  setCustomAddress(prev => ({ ...prev, zipCode: val }));
                                  const cleanPin = val.replace(/\D/g, "");
                                  if (cleanPin.length === 6) {
                                    const info = await lookupPincode(cleanPin);
                                    if (info) {
                                      setCustomAddress(prev => ({
                                        ...prev,
                                        city: info.city || prev.city,
                                        state: info.state || prev.state,
                                        country: info.country || prev.country
                                      }));
                                    }
                                  }
                                }}
                                className="w-full p-2.5 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Country"
                                value={customAddress.country}
                                onChange={(e) => setCustomAddress({ ...customAddress, country: e.target.value })}
                                className="w-full p-2.5 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {orderSuccess ? (
                  <div className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-center mb-3">
                    ✓ Order Placed Successfully!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0 || !getEffectiveShippingAddress().trim()}
                    className={`w-full py-3.5 rounded-xl font-bold transition mb-3 ${
                      getEffectiveShippingAddress().trim()
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg active:scale-98 cursor-pointer"
                        : "bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {loading
                      ? "Placing Order..."
                      : getEffectiveShippingAddress().trim()
                      ? "Proceed to Checkout"
                      : "⚠️ Add or Select Delivery Address to Proceed"}
                  </button>
                )}

                <button
                  onClick={() => onPageChange("Products")}
                  className="w-full border-2 border-gray-600 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
