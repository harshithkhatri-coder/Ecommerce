import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Edit2, Save, X, Heart, ShoppingBag, LogOut } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

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
  });

  const [editData, setEditData] = useState(profileData);

  useEffect(() => {
    fetchUserData();
    fetchOrders();
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      onPageChange("Home");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/${user.id}`);
      const data = await response.json();
      if (data.success) {
        const userData = data.data;
        setProfileData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          zipCode: userData.zip_code || "",
          country: userData.country || "",
        });
        setEditData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          zipCode: userData.zip_code || "",
          country: userData.country || "",
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
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

  const getTrackingReference = (order) => {
    return order.tracking_number || order.order_id || "";
  };

  const openTrackingLink = (order) => {
    const reference = getTrackingReference(order);
    if (!reference) {
      alert("No tracking reference available for this order.");
      return;
    }

    const trackingUrl = `https://www.google.com/search?q=${encodeURIComponent(
      `track package ${reference}`
    )}`;
    window.open(trackingUrl, "_blank");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      <div className="min-h-full bg-gradient-to-b from-blue-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-teal-600 to-teal-500 text-white py-12 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-indigo-100">Manage your account and preferences</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
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
            <div className="bg-white rounded-lg shadow-lg p-8">
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-700 to-teal-500 rounded-full flex items-center justify-center text-white">
                    <User size={40} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">{profileData.name}</h2>
                    <p className="text-gray-600">{profileData.email}</p>
                  </div>
                </div>
                {!isEditing && !showWishlist && (
                  <button
                    onClick={handleEdit}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-3 rounded-lg hover:shadow-lg transition flex items-center gap-2"
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
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="text-teal-600" size={20} />
                        <div>
                          <p className="text-gray-600 text-sm">Email</p>
                          <p className="text-gray-800 font-semibold">{profileData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="text-teal-600" size={20} />
                        <div>
                          <p className="text-gray-600 text-sm">Phone</p>
                          <p className="text-gray-800 font-semibold">{profileData.phone || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Address</h3>
                    <div className="flex items-start gap-3">
                      <MapPin className="text-teal-600 mt-1" size={20} />
                      <div>
                        <p className="text-gray-600 text-sm">Delivery Address</p>
                        {profileData.address ? (
                          <>
                            <p className="text-gray-800 font-semibold">{profileData.address}</p>
                            <p className="text-gray-600 text-sm mt-1">
                              {profileData.city}, {profileData.state} {profileData.zipCode}, {profileData.country}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-800 font-semibold">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : showWishlist ? (
                /* Wishlist Section */
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Heart className="text-teal-600" size={24} />
                    My Wishlist ({wishlist.length} items)
                  </h3>
                  {wishlistLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-600"></div>
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-500">Your wishlist is empty</p>
                      <button
                        onClick={() => onPageChange("Products")}
                        className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
                      >
                        Discover Products
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlist.map((product) => (
                        <div key={product._id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-teal-300 transition">
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
                              <p className="text-xl font-bold text-teal-600 mt-2">₹{product.price}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromWishlist(product._id)}
                              className="text-gray-400 hover:text-red-500 transition h-fit"
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
                              className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 rounded-lg hover:shadow-lg transition text-sm font-semibold"
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
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email (cannot change)</label>
                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        disabled
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={editData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={editData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={editData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        name="state"
                        value={editData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={editData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
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
                <ShoppingBag className="text-teal-600" size={28} />
                Order History
              </h3>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-teal-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <button
                    onClick={() => onPageChange("Products")}
                    className="mt-4 bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
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
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
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
                        <p className="mt-2 text-sm text-red-600">Cancellation reason: {order.cancellation_reason}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3 items-center">
                        {order.status !== "Cancelled" && (
                          <button
                            onClick={() => openTrackingLink(order)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:shadow-lg transition"
                          >
                            Track Package
                          </button>
                        )}
                        <p className="text-sm text-gray-500">Reference: {getTrackingReference(order)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-100 to-teal-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="text-teal-600" size={24} />
                    <div>
                      <p className="text-gray-600 text-sm">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Heart className="text-teal-600" size={24} />
                    <div>
                      <p className="text-gray-600 text-sm">Wishlist Items</p>
                      <p className="text-2xl font-bold text-gray-800">{wishlist.length}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="text-green-600" size={24} />
                    <div>
                      <p className="text-gray-600 text-sm">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-800">
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
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
              <button
                onClick={() => {
                  setShowWishlist(true);
                  setIsEditing(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-semibold"
              >
                <Heart size={20} className="text-teal-600" />
                My Wishlist
              </button>
              <button
                onClick={() => onPageChange("Products")}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition text-gray-700 font-semibold"
              >
                <ShoppingBag size={20} className="text-teal-600" />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
