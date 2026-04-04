import React, { useState, useEffect } from "react";
import {
  Package, ShoppingCart, Users, DollarSign, Plus, Edit2, Trash2,
  Eye, X, Home, BarChart3, TrendingUp, Lock, Mail, LogOut, Upload,
  Bell, CheckCircle
} from "lucide-react";
import API_BASE_URL from "./config";

export default function Admin({ onPageChange, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
        setProducts(productsData.data);
      }

      const ordersRes = await fetch(`${API_BASE_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.data);
      }

      // Fetch notifications
      const notificationsRes = await fetch(`${API_BASE_URL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const notificationsData = await notificationsRes.json();
      if (notificationsData.success) {
        setNotifications(notificationsData.data);
      }

      // Fetch unread count
      const unreadRes = await fetch(`${API_BASE_URL}/admin/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unreadData = await unreadRes.json();
      if (unreadData.success) {
        setUnreadCount(unreadData.count);
      }

      const totalRevenue = ordersData.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      setStats({
        totalProducts: productsData.data?.length || 0,
        totalOrders: ordersData.data?.length || 0,
        totalRevenue,
        totalUsers: 1
      });
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

      if (data.success && data.data.role === "admin") {
        localStorage.setItem("adminToken", data.data.token);
        localStorage.setItem("adminUser", JSON.stringify(data.data));
        setAdminUser(data.data);
        setIsAuthenticated(true);
        fetchData(data.data.token);
      } else {
        setLoginError(data.message || "Invalid credentials or not an admin");
      }
    } catch (err) {
      setLoginError("Network error. Please try again.");
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
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Processing": return "bg-blue-100 text-blue-800";
      case "Shipped": return "bg-purple-100 text-purple-800";
      case "Delivered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-800 via-blue-900 to-teal-800 flex items-center justify-center py-12 px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-teal-600" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-gray-600 mt-2">Sign in to access the admin panel</p>
          </div>

          {loginError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-blue-700 to-teal-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <button
            onClick={() => onPageChange("Home")}
            className="w-full mt-4 border-2 border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 via-teal-700 to-teal-600 text-white py-4 px-6 shadow-lg">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Package className="text-teal-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-lg">
                <Users className="text-teal-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "dashboard" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <BarChart3 className="inline mr-2" size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "products" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Package className="inline mr-2" size={20} />
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-4 font-semibold transition ${activeTab === "orders" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <ShoppingCart className="inline mr-2" size={20} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-6 py-4 font-semibold transition relative ${activeTab === "notifications" ? "border-b-2 border-teal-600 text-teal-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Bell className="inline mr-2" size={20} />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="text-teal-600" size={24} />
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
                <Package className="text-red-600" size={24} />
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
                      <span className={`px-3 py-1 rounded-full text-sm ${product.stock === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
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
                className="bg-gradient-to-r from-blue-700 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
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
                        <span className={`px-2 py-1 rounded-full text-sm ${product.stock === 0 ? "bg-red-100 text-red-800" : product.stock < 10 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition"
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
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
                        <p className="text-gray-600 text-sm">{order.user_email || ""}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{order.items?.length || 0} items</td>
                      <td className="px-6 py-4 font-semibold">₹{order.total?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
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
                            className="bg-teal-100 hover:bg-teal-200 text-teal-600 p-2 rounded-lg transition"
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
                                className="bg-teal-100 hover:bg-teal-200 text-teal-600 p-2 rounded-lg transition"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteOrder(order.id || order._id)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition"
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
      </div>

      {/* Product Modal */}
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                          setProductForm({ ...productForm, image_url: "" });
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                  
                  {/* OR separator */}
                  {!imagePreview && (
                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="text-sm text-gray-500">OR</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                  )}
                  
                  {/* URL Input as alternative */}
                  {!imagePreview && (
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={(e) => {
                        setProductForm({ ...productForm, image_url: e.target.value });
                        setSelectedImage(null);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-700 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700"
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
              <Bell className="text-teal-600" size={28} />
              Notifications
            </h2>
            <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
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
                  className={`border rounded-lg p-4 ${!notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        {!notification.is_read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
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
                        className="ml-4 bg-teal-100 hover:bg-teal-200 text-teal-600 p-2 rounded-lg transition"
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
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
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
