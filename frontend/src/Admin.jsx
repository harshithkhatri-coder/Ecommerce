import React, { useState, useEffect } from "react";
import {
  Package, ShoppingCart, Users, DollarSign, Plus, Edit2, Trash2,
  Eye, X, Home, BarChart3, TrendingUp, Lock, Mail, LogOut, Upload,
  Bell, CheckCircle
} from "lucide-react";
import API_BASE_URL from "./config";

const DEFAULT_CAROUSEL_IMAGES = [
  { id: 1, url: "/images/SHOE1.jpg", title: "BRANDED SHOES" },
  { id: 2, url: "/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg", title: "Premium Collection" },
  { id: 3, url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg", title: "New Arrivals" },
  { id: 4, url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg", title: "Premium Sneakers" },
  { id: 5, url: "/images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg", title: "Latest Trends" }
];

function loadCarouselImages() {
  try {
    const saved = localStorage.getItem("carouselImages");
    if (!saved) return DEFAULT_CAROUSEL_IMAGES;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CAROUSEL_IMAGES;

    return parsed.map((item, index) => ({
      id: item?.id || index + 1,
      title: item?.title || `Slide ${index + 1}`,
      url: item?.url || ""
    }));
  } catch (error) {
    return DEFAULT_CAROUSEL_IMAGES;
  }
}

export default function Admin({ onPageChange, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [carouselItems, setCarouselItems] = useState(loadCarouselImages());
  const [editingCarousel, setEditingCarousel] = useState(false);
  const [carouselForm, setCarouselForm] = useState([]);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInputs, setTrackingInputs] = useState({});

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    description: "",
    image_url: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const openCarouselEditor = () => {
    setCarouselForm(loadCarouselImages());
    setEditingCarousel(true);
  };

  const handleCarouselFieldChange = (index, field, value) => {
    const next = [...carouselForm];
    if (!next[index]) next[index] = { id: index + 1, url: "", title: "" };
    next[index][field] = value;
    setCarouselForm(next);
  };

  const handleCarouselImageFileChange = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleCarouselFieldChange(index, "url", reader.result);
    };
    reader.readAsDataURL(file);
  };

  const saveCarouselChanges = () => {
    const normalized = [...Array(5)].map((_, index) => {
      const slide = carouselForm[index] || {};
      return {
        id: index + 1,
        title: (slide.title || `Slide ${index + 1}`).trim(),
        url: (slide.url || "").trim()
      };
    });

    const hasEmptyImage = normalized.some((slide) => !slide.url);
    if (hasEmptyImage) {
      alert("Please provide an image URL or upload a file for all slides.");
      return;
    }

    localStorage.setItem("carouselImages", JSON.stringify(normalized));
    setCarouselItems(normalized);
    setEditingCarousel(false);
  };

  const resetCarouselToDefault = () => {
    localStorage.removeItem("carouselImages");
    setCarouselItems(DEFAULT_CAROUSEL_IMAGES);
    setCarouselForm(DEFAULT_CAROUSEL_IMAGES);
    setEditingCarousel(false);
  };

  useEffect(() => {
    setCheckingAuth(true);

    const checkAuth = () => {
      const adminToken = localStorage.getItem("adminToken");
      const adminUserData = localStorage.getItem("adminUser");
      const userToken = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (adminToken && adminUserData) {
        try {
          const user = JSON.parse(adminUserData);
          if (user.role === "admin") {
            setAdminUser(user);
            setIsAuthenticated(true);
            setCheckingAuth(false);
            fetchData(adminToken);
            return true;
          }
        } catch (e) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminUser");
        }
      } else if (userToken && userData) {
        try {
          const user = JSON.parse(userData);
          if (user.role === "admin") {
            localStorage.setItem("adminToken", userToken);
            localStorage.setItem("adminUser", userData);
            setAdminUser(user);
            setIsAuthenticated(true);
            setCheckingAuth(false);
            fetchData(userToken);
            return true;
          }
        } catch (e) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      return false;
    };

    if (!checkAuth()) {
      const timeout = setTimeout(() => {
        checkAuth();
        setCheckingAuth(false);
      }, 100);

      window.addEventListener("storage", (e) => {
        if (e.key === "adminToken" || e.key === "adminUser" || e.key === "user") {
          checkAuth();
        }
      });

      return () => clearTimeout(timeout);
    }
  }, []);

  const fetchData = async (token) => {
    try {
      const productsRes = await fetch(`${API_BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data || []);
      } else {
        setProducts([]);
      }

      try {
        const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.data || []);
        } else {
          setOrders([]);
        }

        const totalRevenue = (ordersData.data || []).reduce((sum, order) => sum + (order.total || 0), 0);
        setStats(prev => ({
          ...prev,
          totalOrders: (ordersData.data || []).length,
          totalRevenue,
        }));
      } catch (e) {
        console.error("Error fetching orders:", e);
        setOrders([]);
      }

      try {
        const notificationsRes = await fetch(`${API_BASE_URL}/admin/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const notificationsData = await notificationsRes.json();
        if (notificationsData.success) {
          setNotifications(notificationsData.data || []);
        }

        const unreadRes = await fetch(`${API_BASE_URL}/admin/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadData = await unreadRes.json();
        if (unreadData.success) {
          setUnreadCount(unreadData.count || 0);
        }
      } catch (e) {
        console.error("Error fetching notifications:", e);
      }

      setStats(prev => ({
        ...prev,
        totalProducts: productsData.data?.length || 0
      }));

      try {
        console.log("Fetching users with token:", token ? "yes" : "no");
        const usersRes = await fetch(`${API_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const usersData = await usersRes.json();
        console.log("Users response status:", usersRes.status);
        console.log("Users data:", JSON.stringify(usersData));
        if (usersData.success) {
          const nonAdminUsers = (usersData.data || []).filter((user) => user.role !== "admin");
          setUsers(nonAdminUsers);
        } else {
          console.log("Users fetch failed:", usersData.message);
          setUsers([]);
        }
      } catch (e) {
        console.error("Error fetching users:", e.message);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.role === "admin") {
          localStorage.setItem("adminToken", data.data.token);
          localStorage.setItem("adminUser", JSON.stringify(data.data));
          setAdminUser(data.data);
          setIsAuthenticated(true);
          fetchData(data.data.token);
        } else {
          setLoginError("Access denied. Admin only.");
        }
      } else {
        setLoginError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Cannot connect to server. Is backend running?");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setIsAuthenticated(false);
    setAdminUser(null);
    if (onLogout) onLogout();
  };

  const markNotificationAsRead = async (notificationId) => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(notifications.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: "",
      category: "",
      stock: "",
      description: "",
      image_url: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || "",
      price: product.price?.toString() || "",
      category: product.category || "",
      stock: product.stock?.toString() || "",
      description: product.description || "",
      image_url: product.image_url || product.image || "",
    });
    setSelectedImage(null);
    setImagePreview(product.image_url || product.image || null);
    setShowProductModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");

    try {
      const url = editingProduct
        ? `${API_BASE_URL}/admin/products/${editingProduct._id}`
        : `${API_BASE_URL}/admin/products`;

      const method = editingProduct ? "PUT" : "POST";

      let response;
      
      // If there's a selected image file, use FormData
      if (selectedImage) {
        const formData = new FormData();
        formData.append("name", productForm.name);
        formData.append("price", productForm.price);
        formData.append("category", productForm.category);
        formData.append("stock", productForm.stock);
        formData.append("description", productForm.description);
        formData.append("image", selectedImage);

        response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
        });
      } else {
        // Use JSON for URL-based images
        response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productForm),
        });
      }

      const data = await response.json();

      if (data.success) {
        alert(editingProduct ? "Product updated!" : "Product added!");
        setShowProductModal(false);
        fetchData(token);
      } else {
        alert(data.message || "Error saving product");
      }
    } catch (err) {
      alert("Error saving product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert("Product deleted!");
        fetchData(token);
      } else {
        alert(data.message || "Error deleting product");
      }
    } catch (err) {
      alert("Error deleting product");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status, trackingLocation = "") => {
    const token = localStorage.getItem("adminToken");

    try {
      const body = { tracking_location: trackingLocation };
      if (status) body.status = status;

      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        fetchData(token);
      } else {
        alert(data.message || "Error updating order");
      }
    } catch (err) {
      alert("Error updating order");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        alert("Order deleted!");
        fetchData(token);
      } else {
        alert(data.message || "Error deleting order");
      }
    } catch (err) {
      alert("Error deleting order");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-gray-800 text-gray-200";
      case "Processing": return "bg-gray-700 text-gray-200";
      case "Shipped": return "bg-gray-600 text-gray-200";
      case "Delivered": return "bg-gray-500 text-white";
      case "Cancelled": return "bg-gray-900 text-gray-400";
      default: return "bg-gray-800 text-gray-200";
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-400"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-full bg-gray-900 flex items-center justify-center py-12 px-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-8">
             <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-gray-300" size={32} />
             </div>
             <h2 className="text-3xl font-bold text-white">Admin Login</h2>
             <p className="text-gray-400 mt-2">Sign in to access the admin panel</p>
          </div>

          {loginError && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                 <input
                   type="email"
                   value={loginForm.email}
                   onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                   className="w-full pl-10 pr-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:border-gray-400 transition"
                   required
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                 <input
                   type="password"
                   value={loginForm.password}
                   onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                   className="w-full pl-10 pr-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:border-gray-400 transition"
                   required
                 />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gray-700 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

<button
            onClick={() => onPageChange("Home")}
            className="w-full mt-4 border-2 border-gray-600 text-gray-300 font-semibold py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-900">
      {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Welcome, {adminUser?.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onPageChange("Home")}
              className="flex items-center gap-2 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <Home size={20} />
              <span>View Site</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
               <div className="bg-gray-100 p-3 rounded-lg">
                 <Package className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
               <div className="bg-gray-100 p-3 rounded-lg">
                 <ShoppingCart className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <DollarSign className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "dashboard" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <BarChart3 className="inline mr-2" size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "products" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Package className="inline mr-2" size={20} />
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "orders" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <ShoppingCart className="inline mr-2" size={20} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-6 py-4 font-semibold transition relative ${activeTab === "notifications" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Bell className="inline mr-2" size={20} />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "users" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Users className="inline mr-2" size={20} />
              Users
            </button>
            <button
              onClick={() => setActiveTab("carousel")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "carousel" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <TrendingUp className="inline mr-2" size={20} />
              Carousel
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-gray-600" size={24} />
                Recent Orders
              </h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id || order._id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">Order #{order.id || order._id?.slice(-6)}</p>
                        <p className="text-gray-600 text-sm">{order.user_name || "Customer"}</p>
                        <p className="text-gray-600 text-sm">{order.items?.length || 0} items - ₹{order.total?.toLocaleString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <p className="text-gray-600 text-center py-4">No orders yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="text-gray-600" size={24} />
                Low Stock Products
              </h3>
              <div className="space-y-4">
                {products.filter(p => p.stock < 10).slice(0, 5).map((product) => (
                  <div key={product.id || product._id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-gray-600 text-sm">{product.category}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${product.stock === 0 ? "bg-gray-100 text-gray-800" : "bg-gray-200 text-gray-800"}`}>
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                ))}
                {products.filter(p => p.stock < 10).length === 0 && (
                  <p className="text-gray-600 text-center py-4">All products are well stocked</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Products ({products.length})</h3>
              <button
                onClick={handleAddProduct}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id || product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">#{product.id || product._id?.slice(-6)}</td>
                      <td className="px-6 py-4 font-semibold">{product.name}</td>
                      <td className="px-6 py-4 text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-gray-600">₹{product.price?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${product.stock === 0 ? "bg-gray-100 text-gray-800" : product.stock < 10 ? "bg-gray-200 text-gray-800" : "bg-gray-300 text-gray-800"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="p-8 text-center text-gray-600">
                  No products found. Add your first product!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Orders ({orders.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id || order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-600">#{order.id || order._id?.slice(-6)}</td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{order.user_name || "Customer"}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{order.user_email || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{order.items?.length || 0} items</td>
                      <td className="px-6 py-4 font-semibold">₹{order.total?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{order.payment_method || "Prepaid"}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {order.tracking_location || "Not set"}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                            >
                            <Eye size={18} />
                          </button>
                          <div className="flex flex-col gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id || order._id, e.target.value, trackingInputs[order.id || order._id] ?? order.tracking_location ?? "")}
                              className="border rounded-lg px-2 py-1 text-sm"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={trackingInputs[order.id || order._id] ?? order.tracking_location ?? ""}
                                onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id || order._id]: e.target.value }))}
                                placeholder="Tracking location"
                                className="w-full border rounded-lg px-2 py-1 text-sm"
                              />
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id || order._id, order.status, trackingInputs[order.id || order._id] ?? order.tracking_location ?? "")}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteOrder(order.id || order._id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="p-8 text-center text-gray-600">
                  No orders found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">All Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">City</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">State</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ZIP</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Country</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Orders</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id || user._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{user.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-gray-600">{user.phone || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{user.city || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{user.state || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{user.zipCode || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{user.country || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${user.role === "admin" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.orderCount || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-gray-600">
                  No users found.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "carousel" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Manage Carousel</h3>
              <button
                onClick={openCarouselEditor}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Edit Carousel
              </button>
            </div>
            
            {editingCarousel ? (
              <div className="space-y-4">
                <p className="text-gray-600">Edit slide titles, paste image URLs, or upload image files for each slide.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Slide {i + 1}</label>
                      {carouselForm[i]?.url && (
                        <img 
                          src={carouselForm[i].url} 
                          alt={`Slide ${i+1}`}
                          className="w-full h-24 object-cover rounded mb-2"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <input
                        type="text"
                        value={carouselForm[i]?.title || ""}
                        onChange={(e) => handleCarouselFieldChange(i, "title", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 mb-2"
                        placeholder="Enter title"
                      />
                      <input
                        type="text"
                        value={carouselForm[i]?.url || ""}
                        onChange={(e) => handleCarouselFieldChange(i, "url", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 mb-2"
                        placeholder="Paste image URL or /images/file.jpg"
                      />
                      <label className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer transition">
                        <Upload size={16} />
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleCarouselImageFileChange(i, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={saveCarouselChanges}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={resetCarouselToDefault}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
                  >
                    Reset to Default
                  </button>
                  <button
                    onClick={() => setEditingCarousel(false)}
                    className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">Current carousel slides (shown on home page):</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {carouselItems.map((item, i) => (
                 <div key={i} className="border rounded-lg p-4 bg-gray-50">
                   <img src={item.url} alt={item.title} className="w-full h-24 object-cover rounded mb-2" />
                   <p className="font-semibold">{i + 1}. {item.title}</p>
                 </div>
                  ))}
                </div>
                <button
                  onClick={openCarouselEditor}
                  className="mt-6 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Edit Carousel
                </button>
              </div>
            )}
          </div>
        )}
</div>

      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Running Sneakers">Running Sneakers</option>
                  <option value="Casual Sneakers">Casual Sneakers</option>
                  <option value="Watches">Watches</option>
                  <option value="Belts">Belts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-4">
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <span className="text-sm text-gray-600">Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {imagePreview && (
                    <div className="mt-4">
                      <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                        className="mt-2 text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {!imagePreview && (
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={(e) => {
                        setProductForm({ ...productForm, image_url: e.target.value });
                        setSelectedImage(null);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                      placeholder="Enter image URL (e.g., /images/SHOE1.jpg)"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload a file or enter a URL</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700"
                >
                  {editingProduct ? "Update" : "Add"} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="text-gray-600" size={28} />
              Notifications
            </h2>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
              {unreadCount} unread
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id || notification._id}
                  className={`border rounded-lg p-4 ${!notification.is_read ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        {!notification.is_read && (
                          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">New</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{notification.user_name && `Customer: ${notification.user_name}`}</span>
                        <span>{new Date(notification.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markNotificationAsRead(notification.id || notification._id)}
                        className="ml-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                        title="Mark as read"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-semibold">#{selectedOrder.id || selectedOrder._id?.slice(-6)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {selectedOrder.cancellation_reason && (
                <div className="bg-gray-100 border-l-4 border-gray-500 p-4 rounded">
                  <p className="text-sm text-gray-600 font-semibold">Cancellation Reason</p>
                  <p className="text-gray-800">{selectedOrder.cancellation_reason}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">{selectedOrder.user_name || "Customer"}</p>
                <p className="text-gray-600">{selectedOrder.user_email || ""}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Items</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{selectedOrder.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
