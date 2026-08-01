import React, { useState, useEffect, useCallback } from "react";
import {
  Package, ShoppingCart, Users, DollarSign, Plus, Edit2, Trash2,
  Eye, X, Home, BarChart3, TrendingUp, Lock, Mail, LogOut, Upload,
  Bell, Tag, MessageSquare
} from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

const DEFAULT_CAROUSEL_IMAGES = [
  { id: 1, url: "/images/SHOE1.jpg", title: "BRANDED SHOES" },
  { id: 2, url: "/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg", title: "Premium Collection" },
  { id: 3, url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg", title: "New Arrivals" },
  { id: 4, url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg", title: "Premium Sneakers" },
  { id: 5, url: "/images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg", title: "Latest Trends" }
];
const DEFAULT_PRODUCT_CATEGORIES = [
  "Running Sneakers",
  "Casual Sneakers",
  "High Top Sneakers",
  "Watches",
  "Belts",
  "Accessories",
  "Wallets",
  "Perfumes",
  "Bags",
  "Electronics"
];
const ADMIN_LOGIN_EMAIL = "admin@veluxkicks.com";
const PRODUCT_IMAGE_LIMIT = 10;
const PRODUCT_VIDEO_LIMIT = 2;
const PRODUCT_MEDIA_FILE_SIZE_LIMIT = 8 * 1024 * 1024;

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

function isAdminUser(user) {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  return user.role === "admin" || email === ADMIN_LOGIN_EMAIL;
}

export default function Admin({ onPageChange, onLogout }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [customerMessages, setCustomerMessages] = useState([]);
  const [carouselItems, setCarouselItems] = useState(loadCarouselImages());
  const [editingCarousel, setEditingCarousel] = useState(false);
  const [carouselForm, setCarouselForm] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "0",
    max_discount: "0",
    applicable_product_id: "",
    is_active: true,
    target_audience: "all",
    allowed_user_ids: "",
    usage_limit: "0",
    usage_limit_per_user: "1"
  });
  const [ads, setAds] = useState([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [adForm, setAdForm] = useState({
    title: "",
    message: "",
    image_url: "",
    link_url: "",
    button_text: "Shop Now",
    display_type: "banner",
    is_active: true,
    priority: "0",
    start_date: "",
    end_date: "",
    target_audience: "all"
  });

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
    original_price: "",
    category: "",
    stock: "",
    description: "",
    image_url: "",
    offer: "",
    is_featured: false,
    sizes: "7, 8, 9, 10, 11, 12",
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [productVideos, setProductVideos] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const getEntityId = (entity) => entity?.id || entity?._id || "";
  const productCategories = [...new Set([
    ...DEFAULT_PRODUCT_CATEGORIES,
    ...products.map((product) => (product.category || "").trim()).filter(Boolean)
  ])].sort((a, b) => a.localeCompare(b));

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setSelectedImages([]);
    setImagePreviews([]);
    setProductVideos([]);
    setVideoPreviews([]);
  };

  const openCarouselEditor = () => {
    setCarouselForm(carouselItems.length ? carouselItems : DEFAULT_CAROUSEL_IMAGES);
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

  const saveCarouselChanges = async () => {
    const token = localStorage.getItem("adminToken");
    const normalized = carouselForm.map((slide, index) => {
      return {
        id: slide.id || index + 1,
        title: (slide.title || `Slide ${index + 1}`).trim(),
        url: (slide.url || "").trim()
      };
    });

    const hasEmptyImage = normalized.some((slide) => !slide.url);
    if (hasEmptyImage) {
      alert("Please provide an image URL or upload a file for all slides.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/carousel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ slides: normalized })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save carousel");
      }

      setCarouselItems(data.data || normalized);
      localStorage.setItem("carouselImages", JSON.stringify(data.data || normalized));
      setEditingCarousel(false);
      alert("Carousel updated successfully!");
    } catch (error) {
      console.error("Error saving carousel:", error);
      alert(error.message || "Failed to save carousel");
    }
  };

  const resetCarouselToDefault = async () => {
    const token = localStorage.getItem("adminToken");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/carousel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ slides: DEFAULT_CAROUSEL_IMAGES })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reset carousel");
      }
      setCarouselItems(data.data || DEFAULT_CAROUSEL_IMAGES);
      setCarouselForm(data.data || DEFAULT_CAROUSEL_IMAGES);
      localStorage.setItem("carouselImages", JSON.stringify(data.data || DEFAULT_CAROUSEL_IMAGES));
      setEditingCarousel(false);
    } catch (error) {
      console.error("Error resetting carousel:", error);
      alert(error.message || "Failed to reset carousel");
    }
  };

  const formatDateForInput = (dateVal) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const openCouponEditor = (coupon = null) => {
    try {
      console.log('openCouponEditor', !!coupon, coupon && (coupon._id || coupon.id));
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon?.code || "",
        discount_type: coupon?.discount_type || "percentage",
        discount_value: coupon?.discount_value !== undefined && coupon?.discount_value !== null ? coupon.discount_value.toString() : "",
        min_order_value: coupon?.min_order_value !== undefined && coupon?.min_order_value !== null ? coupon.min_order_value.toString() : "0",
        max_discount: coupon?.max_discount !== undefined && coupon?.max_discount !== null ? coupon.max_discount.toString() : "0",
        applicable_product_id: coupon?.applicable_product_id?._id || coupon?.applicable_product_id || "",
        is_active: coupon?.is_active !== false,
        target_audience: coupon?.target_audience || "all",
        allowed_user_ids: Array.isArray(coupon?.allowed_user_ids) ? coupon.allowed_user_ids.join(", ") : "",
        usage_limit: coupon?.usage_limit !== undefined && coupon?.usage_limit !== null ? coupon.usage_limit.toString() : "0",
        usage_limit_per_user: coupon?.usage_limit_per_user !== undefined && coupon?.usage_limit_per_user !== null ? coupon.usage_limit_per_user.toString() : "1"
      });
      setShowCouponModal(true);
    } catch (err) {
      console.error("Error opening coupon editor:", err);
      alert("Failed to open coupon editor: " + err.message);
    }
  };

  const closeCouponModal = () => {
    setShowCouponModal(false);
    setEditingCoupon(null);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const url = editingCoupon
      ? `${API_BASE_URL}/admin/coupons/${editingCoupon._id || editingCoupon.id}`
      : `${API_BASE_URL}/admin/coupons`;
    const method = editingCoupon ? "PUT" : "POST";

    const allowedUserIdsArray = couponForm.target_audience === "specific_users"
      ? couponForm.allowed_user_ids.split(",").map(id => id.trim()).filter(Boolean)
      : [];

    const body = {
      code: couponForm.code.trim(),
      discount_type: couponForm.discount_type,
      discount_value: Number(couponForm.discount_value),
      min_order_value: Number(couponForm.min_order_value) || 0,
      max_discount: Number(couponForm.max_discount) || 0,
      is_active: couponForm.is_active,
      target_audience: couponForm.target_audience,
      allowed_user_ids: allowedUserIdsArray,
      usage_limit: Number(couponForm.usage_limit) || 0,
      usage_limit_per_user: Number(couponForm.usage_limit_per_user) || 1,
      applicable_product_id: couponForm.applicable_product_id || null
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

    const data = await response.json();
      if (data.success) {
        // Close the modal first so the UI responds instantly
        closeCouponModal();

        // Update state locally without requiring a full reload of all 8 admin endpoints
        if (editingCoupon) {
          setCoupons(prev => {
            const updated = prev.map(c =>
              (c._id || c.id) === (editingCoupon._id || editingCoupon.id)
                ? { ...c, ...data.data } : c
            );
            setStats(s => ({
              ...s,
              totalCoupons: updated.filter(coupon => coupon.is_active).length
            }));
            return updated;
          });
        } else {
          setCoupons(prev => {
            const updated = [data.data, ...prev];
            setStats(s => ({
              ...s,
              totalCoupons: updated.filter(coupon => coupon.is_active).length
            }));
            return updated;
          });
        }

        alert(editingCoupon ? "Coupon updated!" : "Coupon created!");
      } else {
        alert(data.message || "Error saving coupon");
      }
    } catch (err) {
      alert("Error saving coupon");
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCoupons(prev => {
          const updated = prev.filter(c => (c._id || c.id) !== couponId);
          setStats(s => ({
            ...s,
            totalCoupons: updated.filter(coupon => coupon.is_active).length
          }));
          return updated;
        });
        alert("Coupon deleted!");
      } else {
        alert(data.message || "Error deleting coupon");
      }
    } catch (err) {
      alert("Error deleting coupon");
    }
  };

  const handleCouponAccessChange = async (userId, shouldLock) => {
    const token = localStorage.getItem("adminToken");
    const action = shouldLock ? "lock" : "unlock";

    try {
      const response = await fetch(`${API_BASE_URL}/admin/coupon-locks/${userId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers((prev) => prev.map((user) =>
          (user.id || user._id) === userId ? { ...user, coupon_locked: shouldLock } : user
        ));
      } else {
        alert(data.message || "Failed to update coupon access");
      }
    } catch (err) {
      alert("Failed to update coupon access");
    }
  };

  const openAdEditor = (ad = null) => {
    try {
      console.log('openAdEditor', !!ad, ad && (ad._id || ad.id));
      setEditingAd(ad);
      setAdForm({
        title: ad?.title || "",
        message: ad?.message || "",
        image_url: ad?.image_url || "",
        link_url: ad?.link_url || "",
        button_text: ad?.button_text || "Shop Now",
        display_type: ad?.display_type || "banner",
        is_active: ad?.is_active !== false,
        priority: ad?.priority?.toString() || "0",
        start_date: formatDateForInput(ad?.start_date),
        end_date: formatDateForInput(ad?.end_date),
        target_audience: ad?.target_audience || "all"
      });
      setShowAdModal(true);
    } catch (err) {
      console.error("Error opening ad editor:", err);
      alert("Failed to open ad editor: " + err.message);
    }
  };

  const closeAdModal = () => {
    setShowAdModal(false);
    setEditingAd(null);
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    const url = editingAd
      ? `${API_BASE_URL}/admin/ads/${editingAd._id || editingAd.id}`
      : `${API_BASE_URL}/admin/ads`;
    const method = editingAd ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(adForm)
      });

      const data = await response.json();
      if (data.success) {
        closeAdModal();
        if (editingAd) {
          setAds(prev => prev.map(a =>
            (a._id || a.id) === (editingAd._id || editingAd.id)
              ? { ...a, ...data.data } : a
          ));
        } else {
          setAds(prev => [data.data, ...prev]);
        }
        alert(editingAd ? "Ad updated!" : "Ad created!");
      } else {
        alert(data.message || "Error saving ad");
      }
    } catch (err) {
      alert("Error saving ad");
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;
    const token = localStorage.getItem("adminToken");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/ads/${adId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAds(prev => prev.filter(a => (a._id || a.id) !== adId));
        alert("Ad deleted!");
      } else {
        alert(data.message || "Error deleting ad");
      }
    } catch (err) {
      alert("Error deleting ad");
    }
  };

  const fetchData = useCallback(async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [
        productsRes,
        carouselRes,
        ordersRes,
        notificationsRes,
        unreadRes,
        usersRes,
        couponsRes,
        adsRes,
        messagesRes
      ] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/admin/products`, { headers }),
        fetch(`${API_BASE_URL}/admin/carousel`, { headers }),
        fetch(`${API_BASE_URL}/admin/orders`, { headers }),
        fetch(`${API_BASE_URL}/admin/notifications`, { headers }),
        fetch(`${API_BASE_URL}/admin/notifications/unread-count`, { headers }),
        fetch(`${API_BASE_URL}/admin/users`, { headers }),
        fetch(`${API_BASE_URL}/admin/coupons`, { headers }),
        fetch(`${API_BASE_URL}/admin/ads`, { headers }),
        fetch(`${API_BASE_URL}/admin/messages`, { headers })
      ]);

      const allResponses = [productsRes, carouselRes, ordersRes, notificationsRes, unreadRes, usersRes, couponsRes, adsRes, messagesRes];

      if (allResponses.some(r => r.status === "fulfilled" && r.value.status === 401)) {
        clearAuth();
        return;
      }

      // Products
      if (productsRes.status === "fulfilled" && productsRes.value.ok) {
        const d = await productsRes.value.json();
        if (d.success) {
          setProducts(d.data || []);
          setStats(prev => ({ ...prev, totalProducts: (d.data || []).length }));
        }
      }

      // Carousel
      if (carouselRes.status === "fulfilled" && carouselRes.value.ok) {
        const d = await carouselRes.value.json();
        if (d.success && Array.isArray(d.data)) {
          setCarouselItems(d.data);
          localStorage.setItem("carouselImages", JSON.stringify(d.data));
        }
      }

      // Orders
      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const d = await ordersRes.value.json();
        if (d.success) {
          const ordersArr = d.data || [];
          setOrders(ordersArr);
          const totalRevenue = ordersArr
            .filter(o => o.status !== "Cancelled")
            .reduce((sum, o) => sum + (o.total || 0), 0);
          setStats(prev => ({ ...prev, totalOrders: ordersArr.length, totalRevenue }));
        } else {
          setOrders([]);
        }
      }

      // Notifications
      if (notificationsRes.status === "fulfilled" && notificationsRes.value.ok) {
        const d = await notificationsRes.value.json();
        if (d.success) setNotifications(d.data || []);
      }

      // Unread count
      if (unreadRes.status === "fulfilled" && unreadRes.value.ok) {
        const d = await unreadRes.value.json();
        if (d.success) setUnreadCount(d.count || 0);
      }

      // Users
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const d = await usersRes.value.json();
        if (d.success) {
          const nonAdminUsers = (d.data || []).filter(u => u.role !== "admin");
          setUsers(nonAdminUsers);
          setStats(prev => ({ ...prev, totalUsers: nonAdminUsers.length }));
        } else {
          setUsers([]);
          setStats(prev => ({ ...prev, totalUsers: 0 }));
        }
      }

      // Coupons
      if (couponsRes.status === "fulfilled" && couponsRes.value.ok) {
        const d = await couponsRes.value.json();
        if (d.success) {
          setCoupons(d.data || []);
          setStats(prev => ({ ...prev, totalCoupons: (d.data || []).filter(c => c.is_active).length }));
        }
      }

      // Ads
      if (adsRes.status === "fulfilled" && adsRes.value.ok) {
        const d = await adsRes.value.json();
        if (d.success) setAds(d.data || []);
      }

      // Messages
      if (messagesRes.status === "fulfilled" && messagesRes.value.ok) {
        const d = await messagesRes.value.json();
        if (d.success && Array.isArray(d.data)) {
          setCustomerMessages(d.data);
        }
      }

    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  }, []);

  const clearAuth = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setAdminUser(null);
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
          if (isAdminUser(user)) {
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
          if (isAdminUser(user)) {
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
  }, [fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const loginEndpoints = ["/auth/admin-login", "/auth/login"];
      let lastErrorMessage = "Invalid credentials";

      for (const endpoint of loginEndpoints) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginForm),
        });

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = { success: false, message: "Invalid server response" };
        }

        if (data?.success && data?.data) {
          if (!isAdminUser(data.data)) {
            setLoginError("Access denied. Admin only.");
            setLoginLoading(false);
            return;
          }

          const normalizedAdminUser = {
            ...data.data,
            role: "admin",
            email: (data.data.email || "").trim().toLowerCase(),
          };

          localStorage.setItem("adminToken", normalizedAdminUser.token);
          localStorage.setItem("adminUser", JSON.stringify(normalizedAdminUser));
          localStorage.setItem("token", normalizedAdminUser.token);
          localStorage.setItem("user", JSON.stringify(normalizedAdminUser));
          window.dispatchEvent(new Event("adminLoggedIn"));
          setAdminUser(normalizedAdminUser);
          setIsAuthenticated(true);
          fetchData(normalizedAdminUser.token);
          setLoginLoading(false);
          return;
        }

        if (data?.message) {
          lastErrorMessage = data.message;
        }

        // Try fallback endpoint if not found on this API.
        if (response.status === 404) {
          continue;
        }
      }

      setLoginError(lastErrorMessage);
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

const handleAddProduct = () => {
    setActiveTab("products");
    setEditingProduct(null);
    setProductForm({
      name: "",
      price: "",
      original_price: "",
      category: "",
      stock: "",
      description: "",
      image_url: "",
      offer: "",
      is_featured: false,
      sizes: "7, 8, 9, 10, 11, 12",
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setProductVideos([]);
    setVideoPreviews([]);
    setShowProductModal(true);
  };

const handleEditProduct = (product) => {
    setActiveTab("products");
    setEditingProduct(product);
    const rawSizes = product.sizes;
    let cleanedSizes = [];
    if (Array.isArray(rawSizes)) {
      cleanedSizes = rawSizes.map(s => String(s).replace(/[[\]"'\\]/g, "").trim()).filter(Boolean);
    } else if (typeof rawSizes === "string") {
      cleanedSizes = rawSizes.replace(/[[\]"'\\]/g, "").split(",").map(s => s.trim()).filter(Boolean);
    }
    setProductForm({
      name: product.name || "",
      price: product.price?.toString() || "",
      original_price: product.original_price?.toString() || "",
      category: product.category || "",
      stock: product.stock?.toString() || "",
      description: product.description || "",
      image_url: product.image_url || product.image || "",
      offer: product.offer || "",
      is_featured: product.is_featured === true,
      sizes: cleanedSizes.length > 0 ? cleanedSizes.join(", ") : "7, 8, 9, 10, 11, 12",
    });
    const images = product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image_url || product.image ? [product.image_url || product.image] : []);
    const videos = product.videos && Array.isArray(product.videos) && product.videos.length > 0
      ? product.videos
      : [];
    setSelectedImages([]);
    setImagePreviews(images);
    setProductVideos([]);
    setVideoPreviews(videos);
    setShowProductModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const availableSlots = PRODUCT_IMAGE_LIMIT - selectedImages.length;
    const validFiles = files.filter((file) => file.size <= PRODUCT_MEDIA_FILE_SIZE_LIMIT).slice(0, Math.max(availableSlots, 0));

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }

    if (validFiles.length !== files.length) {
      alert(`You can upload up to ${PRODUCT_IMAGE_LIMIT} images, with each file no larger than 8 MB.`);
    }
    e.target.value = "";
  };

  const handleImageUrlChange = (value) => {
    setProductForm((prev) => ({ ...prev, image_url: value }));
  };

  const handleRemoveImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files || []);
    const availableSlots = PRODUCT_VIDEO_LIMIT - productVideos.length;
    const validFiles = files.filter((file) => file.size <= PRODUCT_MEDIA_FILE_SIZE_LIMIT).slice(0, Math.max(availableSlots, 0));

    if (validFiles.length > 0) {
      setProductVideos((prev) => [...prev, ...validFiles]);
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setVideoPreviews((prev) => [...prev, ...newPreviews]);
    }

    if (validFiles.length !== files.length) {
      alert(`You can upload up to ${PRODUCT_VIDEO_LIMIT} videos, with each file no larger than 8 MB.`);
    }
    e.target.value = "";
  };

  const handleRemoveVideo = (index) => {
    setProductVideos((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    const editingProductId = getEntityId(editingProduct);

    if (editingProduct && !editingProductId) {
      alert("Cannot edit this product because its ID is missing.");
      return;
    }

    const url = editingProduct
      ? `${API_BASE_URL}/admin/products/${editingProductId}`
      : `${API_BASE_URL}/admin/products`;

    const method = editingProduct ? "PUT" : "POST";

    const existingImages = imagePreviews.filter(src => typeof src === 'string' && !src.startsWith('blob:'));
    const existingVideos = videoPreviews.filter(src => typeof src === 'string' && !src.startsWith('blob:'));

    const formData = new FormData();
    formData.append("name", productForm.name.trim());
    formData.append("price", productForm.price);
    formData.append("original_price", productForm.original_price || productForm.price);
    formData.append("category", productForm.category.trim());
    formData.append("stock", productForm.stock);
    formData.append("description", productForm.description.trim());
    formData.append("offer", productForm.offer || "");
    formData.append("is_featured", productForm.is_featured ? "true" : "false");
    formData.append("image_url", productForm.image_url.trim() || existingImages[0] || "");
    formData.append("existing_images", JSON.stringify(existingImages));
    formData.append("existing_videos", JSON.stringify(existingVideos));
    const cleanedSizes = (productForm.sizes || "")
      .replace(/[[\]"'\\]/g, "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    formData.append("sizes", JSON.stringify(cleanedSizes));

    if (selectedImages.length > 0) {
      selectedImages.forEach((img) => {
        formData.append("images", img);
      });
    }

    if (productVideos.length > 0) {
      productVideos.forEach((video) => {
        formData.append("videos", video);
      });
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : null;

      if (response.status === 401) {
        clearAuth();
        return;
      }

      if (response.ok && data?.success) {
        alert(editingProduct ? "Product updated!" : "Product added!");
        closeProductModal();
        fetchData(token);
      } else {
        alert(data?.message || `Unable to save product (server returned ${response.status}).`);
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Unable to save product. Check your connection and try again.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId) {
      alert("Cannot delete this product because its ID is missing.");
      return;
    }
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

  const handleTogglePaymentStatus = async (orderId, targetStatus) => {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

    // Optimistic UI update
    setOrders(prev => prev.map(o => ((o._id || o.id) === orderId ? { ...o, payment_status: targetStatus } : o)));
    if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
      setSelectedOrder(prev => ({ ...prev, payment_status: targetStatus }));
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/payment-status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: targetStatus })
      });
      const data = await response.json();
      if (data.success && data.data) {
        setOrders(prev => prev.map(o => ((o._id || o.id) === orderId ? { ...o, ...data.data } : o)));
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
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
      case "Pending": return "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold";
      case "Processing": return "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold";
      case "Shipped": return "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold";
      case "Delivered": return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold";
      case "Cancelled": return "bg-red-500/20 text-red-400 border border-red-500/40 font-bold";
      default: return "bg-gray-800 text-gray-200 font-bold";
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
      {/* Animated Header */}
      <div className="animated-products-banner text-white py-5 px-4 md:px-6 shadow-2xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-2xl font-extrabold animated-banner-title">Admin Panel</h1>
            <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider w-fit backdrop-blur-sm">
              Welcome, {adminUser?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onPageChange("Home")}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition text-sm font-semibold border border-gray-700 shadow-md cursor-pointer"
            >
              <Home size={18} />
              <span>View Site</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition text-sm font-semibold border border-red-500/50 shadow-md cursor-pointer"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Users className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <Tag className="text-gray-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalCoupons || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "dashboard" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <BarChart3 className="inline mr-2" size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "products" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Package className="inline mr-2" size={20} />
              Products
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "orders" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <ShoppingCart className="inline mr-2" size={20} />
              Orders
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 sm:px-6 py-4 font-semibold transition relative shrink-0 ${activeTab === "notifications" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
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
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "users" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Users className="inline mr-2" size={20} />
              Users
            </button>
            <button
              onClick={() => setActiveTab("carousel")}
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "carousel" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <TrendingUp className="inline mr-2" size={20} />
              Carousel
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "coupons" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <Tag className="inline mr-2" size={20} />
              Coupons
            </button>
            <button
              onClick={() => setActiveTab("ads")}
              className={`px-4 sm:px-6 py-4 font-semibold transition shrink-0 ${activeTab === "ads" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <TrendingUp className="inline mr-2" size={20} />
              Ads
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-4 sm:px-6 py-4 font-semibold transition relative shrink-0 flex items-center gap-2 ${activeTab === "messages" ? "border-b-2 border-gray-600 text-gray-600" : "text-gray-600 hover:text-gray-800"}`}
            >
              <MessageSquare className="inline" size={20} />
              Messages
              {customerMessages.filter(m => m.status === "Unread").length > 0 && (
                <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                  {customerMessages.filter(m => m.status === "Unread").length}
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
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${product.stock === 0 ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"}`}>
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

            <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Tag className="text-gray-600" size={24} />
                  Quick Coupon Manager
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    openCouponEditor();
                  }}
                  className="w-full sm:w-auto justify-center bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 transition font-semibold"
                >
                  <Plus size={20} />
                  Create Coupon
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Code</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Value</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Audience</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Usage</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coupons.slice(0, 5).map((coupon) => (
                      <tr key={coupon._id || coupon.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold">{coupon.code}</td>
                        <td className="px-6 py-4 text-gray-600 capitalize">{coupon.discount_type}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                        </td>
                        <td className="px-6 py-4 text-gray-600 capitalize">{coupon.target_audience?.replace("_", " ") || "All"}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {coupon.usage_limit > 0 ? `${coupon.total_used || 0}/${coupon.usage_limit}` : "Unlimited"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${coupon.is_active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"}`}>
                            {coupon.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                openCouponEditor(coupon);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteCoupon(coupon._id || coupon.id);
                              }}
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
                {coupons.length === 0 && (
                  <div className="p-8 text-center text-gray-600">
                    No coupons found. Click "Create Coupon" to add your first one!
                  </div>
                )}
                {coupons.length > 5 && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => setActiveTab("coupons")}
                      className="text-gray-600 hover:text-gray-800 font-semibold text-sm"
                    >
                      View All Coupons →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-xl font-bold text-gray-800">Products ({products.length})</h3>
              <button
                onClick={handleAddProduct}
                className="w-full sm:w-auto justify-center bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 transition font-semibold"
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
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${product.stock === 0 ? "bg-red-500/20 text-red-400 border border-red-500/40" : product.stock < 10 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"}`}>
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
                            onClick={() => handleDeleteProduct(getEntityId(product))}
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
                      <td className="px-6 py-4">
                        <select
                          value={order.payment_status || "Paid"}
                          onChange={(e) => handleTogglePaymentStatus(order._id || order.id, e.target.value)}
                          title="Select Payment Status (Admin Only)"
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border shadow-sm cursor-pointer outline-none transition ${
                            (order.payment_status || "Paid") === "Paid"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-500/60 focus:ring-2 focus:ring-emerald-500"
                              : "bg-red-950 text-red-300 border-red-500/60 focus:ring-2 focus:ring-red-500"
                          }`}
                        >
                          <option value="Paid" className="bg-gray-900 text-emerald-400 font-bold">✓ Paid</option>
                          <option value="Unpaid" className="bg-gray-900 text-red-400 font-bold">✕ Unpaid</option>
                        </select>
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
                            {order.status !== "Cancelled" && (
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
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteOrder(order.id || order._id)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                            title="Delete Order"
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
        {/* Coupons Tab */}
        {activeTab === "coupons" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-xl font-bold text-gray-800">Coupons ({coupons.length})</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openCouponEditor();
                }}
                className="w-full sm:w-auto justify-center bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 transition font-semibold"
              >
                <Plus size={20} />
                Create Coupon
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Value</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Audience</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Usage</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id || coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{coupon.code}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{coupon.discount_type}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{coupon.target_audience?.replace("_", " ") || "All"}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {coupon.usage_limit > 0 ? `${coupon.total_used || 0}/${coupon.usage_limit}` : "Unlimited"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${coupon.is_active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"}`}>
                          {coupon.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openCouponEditor(coupon);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteCoupon(coupon._id || coupon.id);
                            }}
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
              {coupons.length === 0 && (
                <div className="p-8 text-center text-gray-600">
                  No coupons found. Create your first coupon!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === "ads" && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6 border-b flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <h3 className="text-xl font-bold text-gray-800">Ads / Offers ({ads.length})</h3>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openAdEditor();
                }}
                className="w-full sm:w-auto justify-center bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg flex items-center gap-2 transition font-semibold"
              >
                <Plus size={20} />
                Create Ad
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Audience</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Priority</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ads.map((ad) => (
                    <tr key={ad._id || ad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold">{ad.title}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{ad.display_type}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{ad.target_audience?.replace("_", " ") || "All"}</td>
                      <td className="px-6 py-4 text-gray-600">{ad.priority || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${ad.is_active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-red-500/20 text-red-400 border border-red-500/40"}`}>
                          {ad.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              openAdEditor(ad);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-lg transition"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteAd(ad._id || ad.id);
                            }}
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
              {ads.length === 0 && (
                <div className="p-8 text-center text-gray-600">
                  No ads found. Create your first ad!
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Coupon Access</th>
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
                      <td className="px-6 py-4 text-gray-600">{user.zipCode || user.zip_code || "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{user.country || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${user.role === "admin" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${user.coupon_locked ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"}`}>
                            {user.coupon_locked ? "Blocked" : "Allowed"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCouponAccessChange(user.id || user._id, !user.coupon_locked)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${user.coupon_locked ? "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40" : "bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/40"}`}
                          >
                            {user.coupon_locked ? "Allow" : "Block"}
                          </button>
                        </div>
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

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Enquiries & Messages</h2>
                <p className="text-gray-400 text-sm">Messages sent by customers via "Contact Seller"</p>
              </div>
              <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-full font-bold border border-gray-700">
                Total Messages: {customerMessages.length}
              </span>
            </div>

            {customerMessages.length === 0 ? (
              <div className="text-center py-12 bg-gray-950/60 rounded-xl border border-gray-800">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium">No customer messages received yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="p-4">Customer</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Message</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-sm">
                    {customerMessages.map((msg) => (
                      <tr key={msg._id || msg.id} className="hover:bg-gray-800/50 transition">
                        <td className="p-4">
                          <p className="font-bold text-white">{msg.user_name || "Customer"}</p>
                          <p className="text-xs text-gray-400">{msg.user_email}</p>
                        </td>
                        <td className="p-4">
                          <span className="bg-gray-800 text-orange-400 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-700">
                            {msg.product_name || "General"}
                          </span>
                        </td>
                        <td className="p-4 max-w-md">
                          <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                            msg.status === "Unread"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : msg.status === "Replied"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}>
                            {msg.status || "Unread"}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-400">
                          {msg.created_at ? new Date(msg.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`mailto:${msg.user_email}?subject=Re: Inquiry for ${msg.product_name}`}
                              onClick={async () => {
                                const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
                                await fetch(`${API_BASE_URL}/admin/messages/${msg._id}/status`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ status: "Replied" })
                                });
                                setCustomerMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: "Replied" } : m));
                              }}
                              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            >
                              <Mail size={14} /> Reply
                            </a>
                            {msg.status === "Unread" && (
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
                                  await fetch(`${API_BASE_URL}/admin/messages/${msg._id}/status`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ status: "Read" })
                                  });
                                  setCustomerMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: "Read" } : m));
                                }}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-gray-700"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (!window.confirm("Are you sure you want to delete this message?")) return;
                                const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
                                await fetch(`${API_BASE_URL}/admin/messages/${msg._id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                setCustomerMessages(prev => prev.filter(m => m._id !== msg._id));
                              }}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 p-1.5 rounded-xl transition"
                              title="Delete Message"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                  {carouselForm.map((slide, i) => (
                    <div key={i} className="border rounded-lg p-4 relative">
                      <button 
                        onClick={() => setCarouselForm(carouselForm.filter((_, index) => index !== i))}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                        title="Remove Slide"
                      >
                        <X size={20} />
                      </button>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Slide {i + 1}</label>
                      {slide.url && (
                        <img 
                          src={slide.url} 
                          alt={`Slide ${i+1}`}
                          className="w-full h-24 object-cover rounded mb-2"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <input
                        type="text"
                        value={slide.title || ""}
                        onChange={(e) => handleCarouselFieldChange(i, "title", e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 mb-2"
                        placeholder="Enter title"
                      />
                      <input
                        type="text"
                        value={slide.url || ""}
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
                  
                  <div className="border rounded-lg p-4 flex items-center justify-center border-dashed bg-gray-50 hover:bg-gray-100 transition cursor-pointer" onClick={() => setCarouselForm([...carouselForm, { id: Date.now(), title: "", url: "" }])}>
                     <div className="text-center text-gray-500">
                        <Plus size={32} className="mx-auto mb-2" />
                        <span className="font-semibold">Add New Slide</span>
                     </div>
                  </div>
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

      {showCouponModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg w-full max-w-[min(96vw,72rem)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingCoupon ? "Edit Coupon" : "Create Coupon"}</h2>
              <button onClick={closeCouponModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder={couponForm.discount_type === "percentage" ? "e.g., 20" : "e.g., 50"}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={couponForm.min_order_value}
                    onChange={(e) => setCouponForm({ ...couponForm, min_order_value: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={couponForm.max_discount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="0 = no limit"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Product</label>
                <select
                  value={couponForm.applicable_product_id}
                  onChange={(e) => setCouponForm({ ...couponForm, applicable_product_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">All Products</option>
                  {products.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={couponForm.target_audience}
                  onChange={(e) => setCouponForm({ ...couponForm, target_audience: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  <option value="all">All Customers</option>
                  <option value="new_users_only">New Users Only (First Order)</option>
                  <option value="specific_users">Specific Users Only</option>
                </select>
              </div>

              {couponForm.target_audience === "specific_users" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowed User IDs (comma separated)</label>
                  <input
                    type="text"
                    value={couponForm.allowed_user_ids}
                    onChange={(e) => setCouponForm({ ...couponForm, allowed_user_ids: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="user_id_1, user_id_2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter MongoDB User IDs separated by commas</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm({ ...couponForm, usage_limit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="0 = unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
                  <input
                    type="number"
                    value={couponForm.usage_limit_per_user}
                    onChange={(e) => setCouponForm({ ...couponForm, usage_limit_per_user: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={couponForm.is_active}
                  onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <label htmlFor="coupon_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeCouponModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700"
                >
                  {editingCoupon ? "Update" : "Create"} Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg w-full max-w-[min(96vw,72rem)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingAd ? "Edit Ad" : "Create Ad"}</h2>
              <button onClick={closeAdModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={adForm.title}
                  onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={adForm.message}
                  onChange={(e) => setAdForm({ ...adForm, message: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Type</label>
                <select
                  value={adForm.display_type}
                  onChange={(e) => setAdForm({ ...adForm, display_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                >
                  <option value="banner">Banner</option>
                  <option value="modal">Modal Popup</option>
                  <option value="toast">Toast Notification</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                  <input
                    type="text"
                    value={adForm.image_url}
                    onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="/images/ad.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
                  <input
                    type="text"
                    value={adForm.link_url}
                    onChange={(e) => setAdForm({ ...adForm, link_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    placeholder="/products"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input
                  type="text"
                  value={adForm.button_text}
                  onChange={(e) => setAdForm({ ...adForm, button_text: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={adForm.start_date}
                    onChange={(e) => setAdForm({ ...adForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={adForm.end_date}
                    onChange={(e) => setAdForm({ ...adForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={adForm.priority}
                    onChange={(e) => setAdForm({ ...adForm, priority: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={adForm.target_audience}
                    onChange={(e) => setAdForm({ ...adForm, target_audience: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  >
                    <option value="all">All</option>
                    <option value="new_users">New Users</option>
                    <option value="returning">Returning</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ad_active"
                  checked={adForm.is_active}
                  onChange={(e) => setAdForm({ ...adForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                />
                <label htmlFor="ad_active" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeAdModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700"
                >
                  {editingAd ? "Update" : "Create"} Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-[min(96vw,72rem)] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={closeProductModal} className="text-gray-500 hover:text-gray-700">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
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
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                    required
                  />
                </div>
                <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Category</label>
                <select
                  value={productCategories.includes(productForm.category) ? productForm.category : (productForm.category ? "Custom" : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Custom") {
                      setProductForm((prev) => ({ ...prev, category: "" }));
                    } else {
                      const isNoSize = ["watches", "watch", "belts", "belt", "accessories", "accessory", "wallets", "wallet", "perfumes", "perfume", "bags", "bag", "electronics"].some(cat => val.toLowerCase().includes(cat));
                      setProductForm((prev) => ({
                        ...prev,
                        category: val,
                        sizes: isNoSize ? "" : (prev.sizes || "7, 8, 9, 10, 11, 12")
                      }));
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 bg-white font-medium text-gray-800 text-sm"
                  required
                >
                  <option value="" disabled>Select a Category...</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="Custom">+ Add New Custom Category...</option>
                </select>

                {(!productCategories.includes(productForm.category) || productForm.category === "") && (
                  <input
                    type="text"
                    value={productForm.category || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isNoSize = ["watches", "watch", "belts", "belt", "accessories", "accessory", "wallets", "wallet", "perfumes", "perfume", "bags", "bag", "electronics"].some(cat => val.toLowerCase().includes(cat));
                      setProductForm((prev) => ({
                        ...prev,
                        category: val,
                        sizes: isNoSize ? "" : (prev.sizes || "7, 8, 9, 10, 11, 12")
                      }));
                    }}
                    className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="Enter custom category name"
                    required
                  />
                )}
              </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  rows="3"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer (e.g., "20% OFF", "Buy 2 Get 1 Free")</label>
                <input
                  type="text"
                  value={productForm.offer || ""}
                  onChange={(e) => setProductForm({ ...productForm, offer: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter offer text or leave empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹) - leave empty to auto-calculate from offer</label>
                <input
                  type="number"
                  value={productForm.original_price || ""}
                  onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                  placeholder="Enter original/MRP price (optional)"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <input
                    type="checkbox"
                    checked={productForm.is_featured || false}
                    onChange={(e) => setProductForm((prev) => ({ ...prev, is_featured: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  Featured on Home Page
                </label>
                <p className="text-xs text-gray-500">Enable to show this product in the featured/highlight section on the home page.</p>
              </div>

              {/* Size Field: Only show if category requires sizes (e.g. Sneakers) */}
              {!["watches", "watch", "belts", "belt", "accessories", "accessory", "wallets", "wallet", "perfumes", "perfume", "bags", "bag", "electronics"].some(cat => (productForm.category || "").toLowerCase().includes(cat)) ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Available Sizes (US)</label>
                  <input
                    type="text"
                    value={productForm.sizes || ""}
                    onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 text-sm"
                    placeholder="e.g., 7, 8, 9, 10, 11, 12"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["6", "7", "8", "9", "10", "11", "12"].map((size) => {
                      const currentSizes = (productForm.sizes || "").replace(/[[\]"'\\]/g, "").split(",").map(s => s.trim()).filter(Boolean);
                      const isSelected = currentSizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            const newSizes = isSelected
                              ? currentSizes.filter(s => s !== size)
                              : [...currentSizes, size];
                            setProductForm({ ...productForm, sizes: newSizes.join(", ") });
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                            isSelected
                              ? "bg-gray-800 text-white border-gray-700 shadow-sm"
                              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Toggle buttons above or type custom comma-separated sizes.</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-0.5">Size Option</span>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    Sizes not applicable for "{productForm.category}" category.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-4">
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <span className="text-sm text-gray-600">Click to upload images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 mb-3"
                    placeholder="Paste image URL (e.g., /images/SHOE1.jpg)"
                  />

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 overflow-hidden">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative border rounded-lg overflow-hidden bg-gray-50">
                          <img src={resolveImageUrl(src)} alt={`Preview ${idx + 1}`} className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                          {idx === 0 && <span className="absolute bottom-1 left-1 bg-gray-700 text-white text-xs px-2 py-0.5 rounded">Main</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">First image is the main product image. Up to 10 images, 8 MB each.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Videos (optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-4">
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={32} />
                      <span className="text-sm text-gray-600">Click to upload videos</span>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {videoPreviews.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 overflow-hidden">
                      {videoPreviews.map((src, idx) => (
                        <div key={idx} className="relative border rounded-lg overflow-hidden bg-black">
                          <video src={src} controls className="w-full h-32 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveVideo(idx)}
                            className="absolute top-1 right-1 bg-gray-800 text-white rounded-full p-1 z-10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Videos appear alongside images. Up to 2 videos, 8 MB each.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeProductModal}
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

      {/* Notifications Tab removed temporarily while fixing JSX parsing error */}

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

              {selectedOrder.cancellation_reason ? (
                <div className="bg-gray-100 border-l-4 border-gray-500 p-4 rounded">
                  <p className="text-sm text-gray-600 font-semibold">Cancellation Reason</p>
                  <p className="text-gray-800">{selectedOrder.cancellation_reason}</p>
                </div>
              ) : null}

              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">{selectedOrder.user_name || "Customer"}</p>
                <p className="text-gray-600">{selectedOrder.user_email || ""}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Items</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {(selectedOrder.items || []).map((item, index) => (
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
    </div>
  );
}
