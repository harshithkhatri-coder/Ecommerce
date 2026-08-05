import React, { useState, useEffect, useRef } from "react";
import { Trash2, ShoppingCart, ArrowLeft, Plus, Minus, Tag, Check, X } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

const DEFAULT_COUPONS = [
  {
    id: "c1",
    _id: "c1",
    code: "WELCOME10",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value: 0,
    max_discount: 0,
    is_active: true
  },
  {
    id: "c2",
    _id: "c2",
    code: "SAVE20",
    discount_type: "percentage",
    discount_value: 20,
    min_order_value: 500,
    max_discount: 200,
    is_active: true
  },
  {
    id: "c3",
    _id: "c3",
    code: "FLAT50",
    discount_type: "fixed",
    discount_value: 50,
    min_order_value: 300,
    max_discount: 0,
    is_active: true
  }
];

export default function Cart({ cart, setCart, onRemoveFromCart, onPageChange, user }) {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState(DEFAULT_COUPONS);

  // Address States
  const addressInputRef = useRef(null);
  const [selectedAddressType, setSelectedAddressType] = useState("profile");
  const [customAddress, setCustomAddress] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India"
  });
  const [addressError, setAddressError] = useState("");

  const MAX_ITEMS = 5;

  // Saved Profile Address
  const userAddress = user ?
    `${user.address || ''}, ${user.city || ''}, ${user.state || ''} ${user.zipCode || ''}, ${user.country || ''}`.replace(/^, |, $/g, '')
    : "";

  // Fetch Available Coupons on Load
  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch(`${API_BASE_URL}/coupons/active`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setActiveCoupons(data.data.filter(c => c.is_active !== false));
        }
      } catch {
        // Fallback to DEFAULT_COUPONS
      }
    }
    fetchCoupons();
  }, []);

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    const newQuantity = newCart[index].quantity + delta;

    if (newQuantity < 1) return;

    const currentTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (delta > 0 && currentTotal >= MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items. Please remove an item to add more.`);
      return;
    }

    newCart[index].quantity = newQuantity;
    setCart(newCart);
  };

  // Coupon Application Logic
  const applyCouponByObject = (couponObj) => {
    setCouponError("");
    const minOrder = Number(couponObj.min_order_value || 0);

    if (total < minOrder) {
      setCouponError(`Add ₹${minOrder - total} more to apply code "${couponObj.code}" (Min purchase ₹${minOrder})`);
      return;
    }

    let discount = 0;
    if (couponObj.discount_type === "percentage") {
      discount = Math.round((total * Number(couponObj.discount_value)) / 100);
      const maxDisc = Number(couponObj.max_discount || 0);
      if (maxDisc > 0 && discount > maxDisc) discount = maxDisc;
    } else {
      discount = Number(couponObj.discount_value || 0);
    }

    setAppliedCoupon({
      ...couponObj,
      discount_amount: discount
    });
    setCouponCode(couponObj.code);
    setCouponError("");
  };

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    const codeUpper = couponCode.trim().toUpperCase();

    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeUpper,
          subtotal: total,
          cartItems: cart,
          userId: user?.id || user?._id
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAppliedCoupon(data.data);
        setCouponCode(data.data.code);
        setCouponError("");
        setCouponLoading(false);
        return;
      } else if (data.message) {
        setCouponError(data.message);
        setCouponLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Backend validation fallback to local:", err);
    }

    const found = activeCoupons.find(c => c.code.toUpperCase() === codeUpper);
    if (!found) {
      setCouponError("Invalid coupon code. Please try a valid code.");
      setCouponLoading(false);
      return;
    }

    applyCouponByObject(found);
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Address Helper
  const getDeliveryAddress = () => {
    if (selectedAddressType === "profile" && userAddress.trim()) {
      return userAddress;
    }
    const { address, city, state, zipCode, country } = customAddress;
    if (!address.trim() || !city.trim() || !state.trim()) return "";
    return `${address.trim()}, ${city.trim()}, ${state.trim()} ${zipCode.trim()}, ${country.trim()}`.replace(/^, |, $/g, '');
  };

  // Pincode Lookup Helper
  const lookupPincode = async (pincode) => {
    if (!pincode || pincode.length !== 6) return null;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        return {
          city: po.District || po.Block || "",
          state: po.State || "",
          country: "India"
        };
      }
    } catch {
      return null;
    }
  };

  // Calculations
  const tax = Math.round(total * 0.18);
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const grandTotal = Math.max(0, total + tax - discountAmount);

  const handleCheckout = async () => {
    if (!user) {
      alert("Please login to place an order");
      onPageChange("Login");
      return;
    }

    const shippingAddress = getDeliveryAddress();
    if (!shippingAddress) {
      setAddressError("Please enter your complete house, street, city and state address.");
      if (addressInputRef.current) {
        addressInputRef.current.focus();
        addressInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    if (totalItems > MAX_ITEMS) {
      alert(`You can only purchase a maximum of ${MAX_ITEMS} items per order.`);
      return;
    }

    setLoading(true);
    try {
      const items = cart.map((item) => ({
        product_id: item._id || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url || item.image,
      }));

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id || user._id,
          items: items,
          total: grandTotal,
          address: shippingAddress,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          discount_amount: discountAmount
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOrderSuccess(true);
        alert(`Order placed successfully! Order ID: ${data.data._id || data.data.id}`);
        setTimeout(() => {
          setCart([]);
          onPageChange("Home");
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
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 py-12 px-4 shadow-xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Shopping Cart</h1>
            <p className="text-gray-400 text-sm">Review your selected items and apply coupons for best prices</p>
          </div>
          <button
            onClick={() => onPageChange("Products")}
            className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold transition"
          >
            <ArrowLeft size={16} /> Continue Shopping
          </button>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Item Limit Indicator */}
        <div className="mb-6 bg-gray-900/80 border border-gray-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <span className="text-sm font-semibold text-gray-300">
            Items in Cart: <strong className="text-orange-400 text-base">{totalItems}</strong> / {MAX_ITEMS} max
          </span>
          {totalItems >= MAX_ITEMS && (
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Maximum Limit Reached
            </span>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-2xl">
            <ShoppingCart size={64} className="mx-auto text-gray-600 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-white mb-2">Your Cart is Empty</h2>
            <p className="text-gray-400 mb-6 text-sm">Looks like you haven't added any products yet.</p>
            <button
              onClick={() => onPageChange("Products")}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:from-orange-600 hover:to-amber-600 transition"
            >
              Explore Sneakers & Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-900/90 border border-gray-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-800">
                {cart.map((item, index) => (
                  <div key={index} className="p-4 sm:p-6 hover:bg-gray-800/40 transition flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                    <img
                      src={resolveImageUrl(item.image_url || item.image)}
                      alt={item.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-gray-800"
                    />
                    <div className="flex-grow w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-white">{item.name}</h3>
                          <p className="text-xs font-medium text-gray-400 mb-1">{item.category}</p>
                        </div>
                        <p className="text-lg font-bold text-white">₹{item.price * item.quantity}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-xl">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="text-gray-400 hover:text-white transition"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-sm text-white w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="text-gray-400 hover:text-white transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveFromCart(index)}
                          className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl transition"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkout & Coupons Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl sticky top-20">
                <h3 className="text-xl font-bold text-white mb-4">Order Summary</h3>

                {/* Subtotal & Totals */}
                <div className="space-y-3 text-sm pb-4 border-b border-gray-800">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-white">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Tax (GST 18%)</span>
                    <span className="font-semibold text-white">₹{tax}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
                      <span className="font-semibold flex items-center gap-1.5 text-xs uppercase">
                        <Tag size={14} /> Coupon ({appliedCoupon.code})
                      </span>
                      <span className="font-bold">-₹{discountAmount}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="py-4 flex justify-between items-center border-b border-gray-800 mb-6">
                  <span className="text-base font-bold text-gray-300">Total Payable</span>
                  <span className="text-2xl font-black text-orange-400">₹{grandTotal}</span>
                </div>

                {/* COUPONS SECTION */}
                <div className="mb-6 bg-gray-950 border border-gray-800 p-4 rounded-xl">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag size={14} className="text-orange-400" /> Apply Coupon / Offer Code
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/40 p-3 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{appliedCoupon.code} Applied</p>
                        <p className="text-xs text-gray-400">You saved ₹{discountAmount} on this order!</p>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-red-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-orange-500 uppercase"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                        >
                          {couponLoading ? "..." : "Apply"}
                        </button>
                      </form>

                      {couponError && (
                        <p className="text-xs text-red-400 font-semibold mb-3 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          {couponError}
                        </p>
                      )}

                      {/* AVAILABLE COUPONS CARDS */}
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Coupons (Click to Apply):</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {activeCoupons.map((coupon) => {
                            const minOrder = Number(coupon.min_order_value || 0);
                            const isEligible = total >= minOrder;
                            const isSelected = couponCode.toUpperCase() === coupon.code.toUpperCase();

                            return (
                              <div
                                key={coupon.id || coupon._id}
                                onClick={() => applyCouponByObject(coupon)}
                                className={`p-3 border rounded-xl cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-500/10 text-white shadow-md"
                                    : "border-gray-800 bg-gray-900/60 hover:border-gray-700 text-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono font-bold text-xs bg-gray-800 px-2 py-0.5 rounded text-orange-400 border border-gray-700">
                                    {coupon.code}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-400">
                                    {coupon.discount_type === "percentage"
                                      ? `${coupon.discount_value}% OFF`
                                      : `₹${coupon.discount_value} OFF`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                                  <span>Min Order: ₹{minOrder}</span>
                                  {isEligible ? (
                                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                      <Check size={12} /> Eligible
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 font-semibold">
                                      Add ₹{minOrder - total} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* DELIVERY ADDRESS SECTION */}
                <div className="mb-6 bg-gray-950 border border-gray-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Delivery Address
                    </label>
                    <button
                      type="button"
                      onClick={() => onPageChange("Profile")}
                      className="text-[11px] text-orange-400 hover:underline font-semibold"
                    >
                      Manage Profile
                    </button>
                  </div>

                  {userAddress.trim() ? (
                    <label
                      onClick={() => setSelectedAddressType("profile")}
                      className={`block p-3 rounded-lg border cursor-pointer transition mb-2.5 ${
                        selectedAddressType === "profile"
                          ? "border-orange-500 bg-orange-500/10 text-white"
                          : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="addressType"
                          checked={selectedAddressType === "profile"}
                          onChange={() => setSelectedAddressType("profile")}
                          className="mt-0.5 text-orange-500 focus:ring-orange-500"
                        />
                        <div>
                          <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">Saved Profile Address</p>
                          <p className="text-xs font-semibold text-white leading-tight">{userAddress}</p>
                        </div>
                      </div>
                    </label>
                  ) : null}

                  <label
                    onClick={() => setSelectedAddressType("custom")}
                    className={`block p-3 rounded-lg border cursor-pointer transition ${
                      selectedAddressType === "custom" || !userAddress.trim()
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="addressType"
                        checked={selectedAddressType === "custom" || !userAddress.trim()}
                        onChange={() => setSelectedAddressType("custom")}
                        className="mt-0.5 text-orange-500 focus:ring-orange-500"
                      />
                      <div className="w-full">
                        <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                          {userAddress.trim() ? "Deliver to a Different Address" : "Enter Shipping Address"}
                        </p>

                        {(selectedAddressType === "custom" || !userAddress.trim()) && (
                          <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={addressInputRef}
                              type="text"
                              placeholder="House / Flat No., Street, Landmark"
                              value={customAddress.address}
                              onChange={(e) => { setCustomAddress({ ...customAddress, address: e.target.value }); setAddressError(""); }}
                              className="w-full p-2.5 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                              required
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="City"
                                value={customAddress.city}
                                onChange={(e) => { setCustomAddress({ ...customAddress, city: e.target.value }); setAddressError(""); }}
                                className="w-full p-2 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                              <input
                                type="text"
                                placeholder="State"
                                value={customAddress.state}
                                onChange={(e) => { setCustomAddress({ ...customAddress, state: e.target.value }); setAddressError(""); }}
                                className="w-full p-2 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="PIN Code (Auto-fills)"
                                value={customAddress.zipCode}
                                onChange={async (e) => {
                                  const val = e.target.value;
                                  setCustomAddress(prev => ({ ...prev, zipCode: val }));
                                  setAddressError("");
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
                                className="w-full p-2 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                              <input
                                type="text"
                                placeholder="Country"
                                value={customAddress.country}
                                onChange={(e) => { setCustomAddress({ ...customAddress, country: e.target.value }); setAddressError(""); }}
                                className="w-full p-2 bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-lg text-xs focus:ring-1 focus:ring-orange-500"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>

                  {addressError && (
                    <div className="mt-2.5 p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg">
                      {addressError}
                    </div>
                  )}
                </div>

                {/* CHECKOUT BUTTON */}
                {orderSuccess ? (
                  <div className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-center mb-3 text-sm">
                    ✓ Order Placed Successfully!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0}
                    className="w-full py-3.5 rounded-xl font-bold transition mb-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-lg active:scale-98 cursor-pointer disabled:opacity-50 text-sm tracking-wide uppercase"
                  >
                    {loading ? "Placing Order..." : "Proceed to Checkout"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
