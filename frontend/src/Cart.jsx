import React, { useState, useEffect } from "react";
import { Trash2, ShoppingCart, ArrowLeft, Plus, Minus, Tag } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

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

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const tax = Math.round((total - discountAmount) * 0.18);
  const grandTotal = total - discountAmount + tax;

  // Maximum allowed items per user
  const MAX_ITEMS = 5;

  // Get user's saved address from signup
  const userAddress = user ?
    `${user.address || ''}, ${user.city || ''}, ${user.state || ''} ${user.zipCode || ''}, ${user.country || ''}`.replace(/^, |, $/g, '')
    : "";

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

    if (!userAddress.trim()) {
      alert("Please complete your address in your profile before ordering");
      onPageChange("Profile");
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
          address: userAddress,
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
      {/* Page Header */}
        <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 text-white py-12 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
           <p className="text-gray-200">Review and manage your items</p>
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

                {/* Saved Delivery Address */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Delivery Address (from your profile)
                  </label>
                  <div className="w-full p-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700 h-24">
                    {userAddress ? (
                      <p className="text-sm">{userAddress}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No address found. Please add your address in your profile.</p>
                    )}
                  </div>
                  <button
                    onClick={() => onPageChange("Profile")}
                     className="text-sm text-gray-600 hover:text-gray-800 mt-1 underline"
                  >
                    Edit address in profile
                  </button>
                </div>

                {orderSuccess ? (
                  <div className="w-full bg-gray-500 text-white py-3 rounded-lg font-bold text-center mb-3">
                    ✓ Order Placed Successfully!
                  </div>
                ) : (
                  <button
                    onClick={handleCheckout}
                    disabled={loading || cart.length === 0 || !userAddress.trim()}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-bold hover:shadow-lg transition mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Placing Order..." : "Proceed to Checkout"}
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
