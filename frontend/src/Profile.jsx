import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Edit2, Save, X, Heart, ShoppingBag, LogOut, Plus, Camera } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";
import { lookupPincode } from "./pincodeHelper";

export default function Profile({ onPageChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [showWishlist, setShowWishlist] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    avatar: "",
  });

  const [editData, setEditData] = useState(profileData);

  useEffect(() => {
    fetchUserData();
    fetchOrders();
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || (!user.id && !user._id)) {
      setLoading(false);
      onPageChange("Login");
      return;
    }

    const userId = user.id || user._id;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
      const data = await response.json();
      const resolvedEmail = data?.data?.email || user.email || "";
      if (data.success && data.data) {
        const userData = data.data;
        setProfileData({
          name: userData.name || user.name || "",
          email: resolvedEmail,
          phone: userData.phone || "",
          address: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          zipCode: userData.zip_code || "",
          country: userData.country || "",
          avatar: userData.avatar || user.avatar || "",
        });
        setEditData({
          name: userData.name || user.name || "",
          email: resolvedEmail,
          phone: userData.phone || "",
          address: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          zipCode: userData.zip_code || "",
          country: userData.country || "",
          avatar: userData.avatar || user.avatar || "",
        });
      } else {
        setProfileData(prev => ({ ...prev, email: resolvedEmail }));
        setEditData(prev => ({ ...prev, email: resolvedEmail }));
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      const fallbackEmail = user.email || "";
      setProfileData(prev => ({ ...prev, email: fallbackEmail }));
      setEditData(prev => ({ ...prev, email: fallbackEmail }));
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchWishlist = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setWishlist(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}/${productId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setWishlist(data.data || []);
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
    setShowWishlist(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      const data = await response.json();
      if (data.success) {
        const updatedUser = {
          ...user,
          name: editData.name,
          phone: editData.phone,
          address: editData.address,
          city: editData.city,
          state: editData.state,
          zipCode: editData.zipCode,
          country: editData.country,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileData(editData);
        setIsEditing(false);
        window.dispatchEvent(new Event("userLoggedIn"));
        alert("Profile updated successfully!");
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData);
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "zipCode") {
      const cleanPin = value.replace(/\D/g, "");
      if (cleanPin.length === 6) {
        const info = await lookupPincode(cleanPin);
        if (info) {
          setEditData((prev) => ({
            ...prev,
            city: info.city || prev.city,
            state: info.state || prev.state,
            country: info.country || prev.country
          }));
        }
      }
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Profile picture must be under 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setProfileData(prev => ({ ...prev, avatar: base64 }));
        setEditData(prev => ({ ...prev, avatar: base64 }));
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...user, avatar: base64 };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        window.dispatchEvent(new Event("userLoggedIn"));

        const token = localStorage.getItem("token");
        if (token) {
          try {
            await fetch(`${API_BASE_URL}/users/profile`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ avatar: base64 })
            });
          } catch (err) {
            console.error("Error saving avatar to server:", err);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const calculateProfileCompletion = (data) => {
    let score = 0;
    if (data.name?.trim()) score += 15;
    if (data.email?.trim()) score += 15;
    if (data.phone?.trim()) score += 10;
    if (data.address?.trim()) score += 15;
    if (data.city?.trim()) score += 15;
    if (data.state?.trim()) score += 10;
    if (data.zipCode?.trim()) score += 10;
    if (data.avatar?.trim()) score += 10;
    return Math.min(score, 100);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-600 mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
      {/* Animated Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white py-12 px-6 border-b border-gray-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto flex justify-between items-center relative z-10">
          <div>
            <span className="inline-block px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm mb-2">
              👤 User Dashboard
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight animated-banner-title drop-shadow-md">
              My Profile
            </h1>
            <p className="text-gray-300 text-sm md:text-base font-medium mt-1">Manage your account details, addresses, and wishlist</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-800 border border-gray-700 hover:bg-red-600/20 hover:border-red-500 text-red-400 px-4 py-2.5 rounded-xl flex items-center gap-2 transition font-semibold"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8 text-white">
              {/* Profile Completion Progress Bar */}
              <div className="mb-8 bg-gray-950 p-5 rounded-2xl border border-gray-800 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Profile Setup Progress
                  </span>
                  <span className="text-sm font-extrabold text-orange-400">
                    {calculateProfileCompletion(profileData)}% Complete
                  </span>
                </div>
                <div className="w-full h-3.5 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-700 shadow-lg shadow-orange-500/20"
                    style={{ width: `${calculateProfileCompletion(profileData)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2.5">
                  {calculateProfileCompletion(profileData) === 100
                    ? "🎉 Excellent! Your profile is 100% complete."
                    : "Complete your phone, address, and profile photo to reach 100% completion."}
                </p>
              </div>

              {/* Profile Header */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="relative group w-20 h-20 shrink-0">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt={profileData.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center text-white shadow-lg">
                        <User size={40} />
                      </div>
                    )}
                    <label
                      title="Upload Profile Picture"
                      className="absolute bottom-0 right-0 bg-gray-800 hover:bg-orange-500 text-white p-1.5 rounded-full cursor-pointer shadow-md transition border border-gray-700"
                    >
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{profileData.name || "User"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={15} className="text-orange-400" />
                      <span className="text-gray-300 font-semibold text-sm">{profileData.email || editData.email || JSON.parse(localStorage.getItem("user") || "{}")?.email || "No email"}</span>
                      <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-gray-700">Login Email</span>
                    </div>
                  </div>
                </div>
                {!isEditing && !showWishlist && (
                  <button
                    onClick={handleEdit}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3 rounded-lg hover:shadow-lg transition flex items-center gap-2"
                  >
                    <Edit2 size={20} />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </button>
                )}
                {showWishlist && (
                  <button
                    onClick={() => setShowWishlist(false)}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-3 rounded-lg hover:shadow-lg transition flex items-center gap-2"
                  >
                    <X size={20} />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                )}
              </div>

              {/* Profile Information */}
              {!isEditing && !showWishlist ? (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-gray-950/80 p-3 rounded-xl border border-gray-800">
                        <Mail className="text-orange-400" size={20} />
                        <div>
                          <p className="text-gray-400 text-xs">Email</p>
                          <p className="text-white font-semibold">{profileData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-950/80 p-3 rounded-xl border border-gray-800">
                        <Phone className="text-orange-400" size={20} />
                        <div>
                          <p className="text-gray-400 text-xs">Phone</p>
                          <p className="text-white font-semibold">{profileData.phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">Address</h3>
                      <button
                        onClick={() => onPageChange("AddAddress")}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition flex items-center gap-2 text-sm font-semibold"
                      >
                        <Plus size={16} />
                        {profileData.address ? "Edit Address" : "Add Address"}
                      </button>
                    </div>
                    <div className="flex items-start gap-3 bg-gray-950/80 p-4 rounded-xl border border-gray-800">
                      <MapPin className="text-orange-400 mt-1" size={20} />
                      <div>
                        <p className="text-gray-400 text-xs">Delivery Address</p>
                        {profileData.address ? (
                          <>
                            <p className="text-white font-semibold">{profileData.address}</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {profileData.city}, {profileData.state} {profileData.zipCode}, {profileData.country}
                            </p>
                          </>
                        ) : (
                          <p className="text-white font-semibold">No address added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : showWishlist && !isEditing ? (
                /* Wishlist Section */
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="text-gray-600" size={24} />
                    My Wishlist ({wishlist.length} items)
                  </h3>
                  {wishlistLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-600"></div>
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-500">Your wishlist is empty</p>
                      <button
                        onClick={() => onPageChange("Products")}
                        className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                      >
                        Discover Products
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlist.map((product) => (
                        <div key={product._id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                          <div className="flex gap-4">
                            {(product.image_url || product.image) && (
                              <img
                                src={resolveImageUrl(product.image_url || product.image)}
                                alt={product.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800">{product.name}</h4>
                              <p className="text-sm text-gray-500">{product.category}</p>
                              <p className="text-xl font-bold text-gray-700 mt-2">₹{product.price}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromWishlist(product._id)}
                              className="text-gray-400 hover:text-gray-500 transition h-fit"
                              title="Remove from wishlist"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => {
                                localStorage.setItem('selectedProduct', JSON.stringify(product));
                                onPageChange("ProductDetails");
                              }}
                              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                const productWithId = { ...product, id: product._id };
                                localStorage.setItem('selectedProduct', JSON.stringify(productWithId));
                                onPageChange("ProductDetails");
                              }}
                               className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg hover:shadow-lg transition text-sm font-semibold"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Form */
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center justify-between">
                        <span>Email Address</span>
                        <span className="text-orange-400 font-semibold text-xs flex items-center gap-1">🔒 Login email (Cannot be changed)</span>
                      </label>
                      <div className="flex items-center gap-2 bg-gray-950 px-4 py-2.5 rounded-lg border border-gray-800 text-gray-400 cursor-not-allowed">
                        <Mail size={18} className="text-orange-400 shrink-0" />
                        <input
                          type="email"
                          name="email"
                          value={editData.email || profileData.email || JSON.parse(localStorage.getItem("user") || "{}")?.email || ""}
                          disabled
                          className="bg-transparent w-full text-sm font-bold text-gray-300 outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={editData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={editData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={editData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={editData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={editData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 rounded-lg font-bold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save size={20} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <X size={20} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order History */}
            <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingBag className="text-gray-600" size={28} />
                Order History
              </h3>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <button
                    onClick={() => onPageChange("Products")}
                        className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition">
                      <div className="flex flex-wrap justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-gray-800">{order.order_id}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${order.status === 'Delivered' ? 'bg-gray-300 text-gray-800' :
                            order.status === 'Shipped' ? 'bg-gray-200 text-gray-700' :
                              order.status === 'Processing' ? 'bg-gray-200 text-gray-700' :
                                'bg-gray-100 text-gray-600'
                          }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            {item.image_url && (
                              <img
                                src={resolveImageUrl(item.image_url || item.image)}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                            </div>
                            <p className="font-semibold text-gray-800">₹{item.quantity * item.price}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                        <p className="text-sm text-gray-500">{order.items.length} item(s)</p>
                        <p className="text-xl font-bold text-gray-800">Total: ₹{order.total}</p>
                      </div>
                      {order.payment_method && (
                        <p className="mt-2 text-sm text-gray-600">Payment method: {order.payment_method}</p>
                      )}
                      {order.tracking_location && (
                        <p className="mt-2 text-sm text-gray-600">Last known location: {order.tracking_location}</p>
                      )}
                      {order.cancellation_reason && (
                        <p className="mt-2 text-sm text-gray-600">Cancellation reason: {order.cancellation_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold text-white mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="text-orange-400" size={24} />
                    <div>
                      <p className="text-gray-400 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-white">{orders.length}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Heart className="text-orange-400" size={24} />
                    <div>
                      <p className="text-gray-400 text-sm">Wishlist Items</p>
                      <p className="text-2xl font-bold text-white">{wishlist.length}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="text-orange-400" size={24} />
                    <div>
                      <p className="text-gray-400 text-sm">Total Spent</p>
                      <p className="text-2xl font-bold text-white">
                        ₹{orders
                          .filter((order) => order.status !== "Cancelled")
                          .reduce((sum, order) => sum + (order.total || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings & Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-6 space-y-3 text-white">
              <button
                onClick={() => {
                  setShowWishlist(true);
                  setIsEditing(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl transition text-gray-200 font-semibold"
              >
                <Heart size={20} className="text-orange-400" />
                My Wishlist
              </button>
              <button
                onClick={() => onPageChange("Products")}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl transition text-gray-200 font-semibold"
              >
                <ShoppingBag size={20} className="text-orange-400" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
