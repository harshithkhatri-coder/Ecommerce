import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, ShoppingCart, CreditCard, Heart, X, ChevronLeft, ChevronRight, Play, Truck, CheckCircle } from "lucide-react";
import API_BASE_URL from "./config";
import { productsData } from "./productsData";
import { resolveImageUrl } from "./imageHelpers";
import { updatePageSEO, injectProductJsonLd } from "./seoHelpers";

export default function ProductDetails({ productId, onPageChange, onAddToCart, user }) {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("9");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [newReview, setNewReview] = useState({ user: '', rating: 5, comment: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [couponLocked, setCouponLocked] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState([]);

  // Interactive Zoom State
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Delivery & Pincode State
  const [pincode, setPincode] = useState("");
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [pincodeLocation, setPincodeLocation] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Recently Viewed
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const data = await response.json();
        if (response.ok && data.success) {
          setProduct(data.data);
        } else {
          // API returned no product, try static data fallback
          const staticProduct = productsData.find(
            p => (p._id === productId) || (p.id === productId) || (String(p.id) === String(productId))
          );
          if (staticProduct) {
            setProduct(staticProduct);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        // Try to find in static data on error
        const staticProduct = productsData.find(
          p => (p._id === productId) || (p.id === productId) || (String(p.id) === String(productId))
        );
        if (staticProduct) {
          setProduct(staticProduct);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
        const data = await response.json();
        if (data.success) {
          setReviews(data.data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    const fetchWishlist = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      const userId = user.id || user._id;
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/wishlist/${userId}`);
        const data = await response.json();
        if (data.success) {
          const wishlistIds = (data.data || []).map(item => String(item._id || item.id));
          setIsInWishlist(wishlistIds.includes(String(productId)));
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };

    if (productId) {
      fetchProduct();
      fetchReviews();
      fetchWishlist();
    }
  }, [productId]);

  // Track Recently Viewed & Inject SEO
  useEffect(() => {
    if (!product) return;
    try {
      updatePageSEO({
        title: product.name,
        description: product.description,
        image: resolveImageUrl(product.image_url)
      });
      injectProductJsonLd(product);

      const existing = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const filtered = existing.filter(p => (p._id || p.id) !== (product._id || product.id));
      const updated = [product, ...filtered].slice(0, 8);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      setRecentlyViewed(filtered.slice(0, 4));
    } catch (err) {
      console.error("Error setting recently viewed:", err);
    }
  }, [product]);

  const handleMouseMoveZoom = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
    setIsZooming(true);
  };

  const handleMouseLeaveZoom = () => {
    setIsZooming(false);
  };

  const getEstimatedDeliveryDate = () => {
    const target = new Date();
    target.setDate(target.getDate() + 4);
    return target.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const handleCheckPincode = async () => {
    if (pincode.length === 6) {
      setPincodeLoading(true);
      setPincodeChecked(false);
      setPincodeLocation("");
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();
        if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          const loc = po.District ? `${po.District}, ${po.State}` : `${po.Name}, ${po.State}`;
          setPincodeLocation(loc);
        }
      } catch (err) {
        console.error("Error fetching location for pincode:", err);
      } finally {
        setPincodeChecked(true);
        setPincodeLoading(false);
      }
    } else {
      alert("Please enter a valid 6-digit Pincode");
    }
  };

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;

    const fetchRelatedProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      if (isMounted && data.success && Array.isArray(data.data)) {
        const currentProduct = productsData.find(
          p => (p._id === productId) || (p.id === productId) || (String(p.id) === String(productId))
        );
        const currentCategory = currentProduct?.category || product?.category;
        const filtered = data.data
          .filter(p => p._id !== productId && p.category === currentCategory)
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

    fetchRelatedProducts();

    return () => {
      isMounted = false;
    };
  }, [productId, product?.category]);

  useEffect(() => {
    if (!showCouponModal) return;

    const fetchActiveCoupons = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/coupons/active`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const eligible = data.data.filter(coupon => {
            if (!coupon.applicable_product_id) return true;
            const applicableId = coupon.applicable_product_id._id || coupon.applicable_product_id;
            return String(applicableId) === String(productId);
          });
          setActiveCoupons(eligible);
        }
      } catch (err) {
        console.error("Error fetching active coupons:", err);
      }
    };

    fetchActiveCoupons();
  }, [showCouponModal, productId]);

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-gray-50 via-gray-100 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-400"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-full bg-gradient-to-b from-gray-50 via-gray-100 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h1>
          <button
            onClick={() => onPageChange("Products")}
             className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const NO_SIZE_CATEGORIES = ["watches", "watch", "accessories", "accessory", "wallets", "wallet", "perfumes", "perfume", "bags", "bag", "electronics"];
  const categoryLower = (product?.category || "").trim().toLowerCase();
  const isNoSizeCategory = NO_SIZE_CATEGORIES.some(cat => categoryLower.includes(cat));

  const cleanSizes = (rawSizes) => {
    if (!rawSizes) return [];
    let items = Array.isArray(rawSizes) ? rawSizes : [rawSizes];
    return items
      .flatMap(item => {
        if (typeof item === "string") {
          try {
            const parsed = JSON.parse(item);
            return Array.isArray(parsed) ? parsed : [item];
          } catch (e) {
            return item.split(",");
          }
        }
        return [item];
      })
      .map(s => String(s).replace(/[[\]"'\\]/g, "").trim())
      .filter(Boolean);
  };

  const rawProductSizes = cleanSizes(product?.sizes);
  const sizes = isNoSizeCategory ? [] : (rawProductSizes.length > 0 ? rawProductSizes : (categoryLower.includes("belt") ? ["32", "34", "36", "38", "40", "42"] : ["7", "8", "9", "10", "11", "12"]));
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? Math.round(reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount) : 0;
  // const totalPrice = product.price * quantity;
  const MAX_ITEMS = 5;

const handleAddToCart = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to add items to cart");
      onPageChange("Login");
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const currentTotalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (currentTotalItems + quantity > MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items total. Please reduce the quantity or checkout with fewer items.`);
      return;
    }

    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, { silent: true });
    }
    alert(`Added ${quantity} item(s) to cart!`);
  };

const handleBuyNowWithCoupon = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to place an order");
      onPageChange("Login");
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const currentTotalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (currentTotalItems + quantity > MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items total. Please reduce the quantity or checkout with fewer items.`);
      return;
    }

    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, { silent: true });
    }

    if (appliedCoupon) {
      localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
    }
    onPageChange("Cart");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const subtotal = product.price * quantity;
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal,
          cartItems: [{
            product_id: product._id || product.id,
            name: product.name,
            price: product.price,
            quantity
          }],
          userId: user?.id || user?._id
        })
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

  const handleBuyNow = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to place an order");
      onPageChange("Login");
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const currentTotalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (currentTotalItems + quantity > MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items total. Please reduce the quantity or checkout with fewer items.`);
      return;
    }

    setShowCouponModal(true);
  };

  const incrementQuantity = () => {
    if (quantity >= 5) {
      alert(`Maximum ${MAX_ITEMS} items allowed per order`);
      return;
    }
    setQuantity((prev) => prev + 1);
  };
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleToggleWishlist = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Please login to add items to wishlist");
      onPageChange("Login");
      return;
    }

    const userId = user.id || user._id;
    const pId = String(productId);
    const nextState = !isInWishlist;

    // Optimistic UI update
    setIsInWishlist(nextState);

    try {
      const method = isInWishlist ? "DELETE" : "POST";
      const response = await fetch(`${API_BASE_URL}/wishlist/${userId}/${pId}`, {
        method,
      });
      const data = await response.json();
      if (data.success) {
        const wishlistIds = (data.data || []).map(item => String(item._id || item.id));
        setIsInWishlist(wishlistIds.includes(pId));
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (newReview.user && newReview.comment) {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newReview),
        });
        const data = await response.json();
        if (data.success) {
          setReviews([...reviews, data.data]);
          setNewReview({ user: '', rating: 5, comment: '' });
          alert('Review submitted!');
        } else {
          alert('Error submitting review');
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review');
      }
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!currentUser) {
      alert("Please login to contact the seller");
      onPageChange("Login");
      return;
    }
    if (!contactMessage.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          product_id: product._id || product.id,
          product_name: product.name,
          user_name: currentUser.name || currentUser.email,
          user_email: currentUser.email,
          message: contactMessage.trim()
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Your message has been sent successfully to the seller!");
        setContactMessage("");
        setShowContactForm(false);
      } else {
        alert(data.message || "Failed to send message.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950 overflow-x-hidden">
      {/* Header */}
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white py-6 px-4 border-b border-gray-800 shadow-2xl sticky top-0 z-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 relative z-10">
          <button
            onClick={() => onPageChange("Products")}
            className="flex items-center gap-2 bg-gray-900/90 hover:bg-orange-500 hover:text-white border border-gray-700 px-4 py-2 rounded-xl transition text-gray-200 font-bold text-sm shadow-md active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span>Back to Products</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-widest">
              Product Details
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold animated-banner-title truncate max-w-md drop-shadow-md">{product.name}</h1>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Row 1: Image and Product Info side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 min-w-0">
          {/* Product Image Container */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-4 md:p-8 min-h-64 md:min-h-96 min-w-0 overflow-hidden">
            {(() => {
              const images = Array.isArray(product.images) ? product.images : (product.image_url || product.image ? [product.image_url || product.image] : []);
              const videos = Array.isArray(product.videos) ? product.videos : [];
              const productMedia = [...images, ...videos];
              const validMedia = productMedia.filter(Boolean);

              if (validMedia.length === 0) {
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="text-gray-400">No media available</div>
                  </div>
                );
              }

              const safeIndex = Math.min(activeImageIndex, validMedia.length - 1);
              const currentSrc = validMedia[safeIndex] || validMedia[0];
              const isVideo = typeof currentSrc === 'string' && (
                currentSrc.endsWith('.mp4') ||
                currentSrc.endsWith('.webm') ||
                currentSrc.endsWith('.mov') ||
                currentSrc.includes('video')
              );

              return (
                <div className="relative">
                  <div
                    onMouseMove={handleMouseMoveZoom}
                    onMouseLeave={handleMouseLeaveZoom}
                    className="relative h-64 md:h-96 flex items-center justify-center overflow-hidden rounded-lg cursor-zoom-in"
                  >
                    {isVideo ? (
                      <video
                        src={resolveImageUrl(currentSrc)}
                        controls
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-md"
                        onError={(e) => {
                          if (safeIndex > 0) {
                            setActiveImageIndex(0);
                          }
                        }}
                      />
                    ) : (
                      <img
                        src={resolveImageUrl(currentSrc)}
                        alt={product.name}
                        onError={(e) => {
                          if (safeIndex > 0) {
                            setActiveImageIndex(0);
                          }
                        }}
                        style={
                          isZooming
                            ? {
                                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                transform: "scale(2.2)",
                              }
                            : {}
                        }
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-md transition-transform duration-150 ease-out"
                      />
                    )}
                  </div>

                  {validMedia.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev === 0 ? validMedia.length - 1 : prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex((prev) => (prev === validMedia.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition"
                      >
                        <ChevronRight size={24} />
                      </button>

                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {validMedia.map((media, idx) => {
                          const isMediaVideo = typeof media === 'string' && (
                            media.endsWith('.mp4') ||
                            media.endsWith('.webm') ||
                            media.endsWith('.mov') ||
                            media.includes('video')
                          );
                          return (
                            <button
                              key={idx}
                              onClick={() => setActiveImageIndex(idx)}
                              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                                safeIndex === idx ? "border-gray-600" : "border-gray-200"
                              }`}
                            >
                              {isMediaVideo ? (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Play size={20} className="text-gray-600" />
                                </div>
                              ) : (
                                <img
                                  src={resolveImageUrl(media)}
                                  alt={`${product.name} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleToggleWishlist}
                    className={`absolute top-4 right-4 p-3 rounded-full transition z-10 ${isInWishlist
                      ? "bg-gray-500 text-white"
                      : "bg-white/80 text-gray-800 hover:bg-white"
                      }`}
                  >
                    <Heart size={24} fill={isInWishlist ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Product Details Container */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{product.name}</h1>
                <p className="text-gray-400 text-lg">{product.category}</p>
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < averageRating ? 'text-amber-400' : 'text-gray-600'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-400">
                {reviewCount > 0
                  ? `(${reviewCount} customer review${reviewCount !== 1 ? 's' : ''})`
                  : 'No reviews yet'}
              </span>
            </div>

            {/* Price */}
            <div className="border-t-2 border-b-2 border-gray-800 py-4 mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-2xl md:text-4xl font-bold text-white">₹{product.price}</span>
                {product.original_price && product.original_price > product.price ? (
                  <span className="text-lg text-gray-500 line-through">₹{product.original_price}</span>
                ) : (
                  <span className="text-lg text-gray-500 line-through">₹{Math.round(product.price * 1.2)}</span>
                )}
                 {product.offer ? (
                   <span className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-semibold">
                     {product.offer}
                   </span>
                 ) : (
                   <span className="bg-gray-800 text-orange-400 border border-orange-500/30 px-3 py-1 rounded text-sm font-semibold">
                     20% OFF
                   </span>
                 )}
              </div>
              <p className="text-gray-400 text-sm">Inclusive of all taxes</p>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Product Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {product.description || `Premium quality ${product.name.toLowerCase()} designed for comfort and style. Made with high-grade materials, these products are perfect for everyday wear. Experience superior comfort and durability with our collection.`}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Size, Quantity, Actions - Full Width Container */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Size and Quantity */}
            <div>
              {/* Size Selection */}
              <div className="mb-6">
                {sizes.length > 0 ? (
                  <>
                    <label className="block text-lg font-bold text-white mb-3">
                      Select Size {categoryLower.includes("belt") ? "(Waist Size in Inches)" : ""}
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 px-3 rounded-lg font-semibold transition border-2 ${selectedSize === size
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md"
                            : "bg-gray-800 text-gray-200 border-gray-700 hover:border-gray-500"
                            }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Size Option</label>
                    <p className="text-white text-sm font-semibold flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-400" /> Standard Size / No Size Selection Required
                    </p>
                  </div>
                )}
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-lg font-bold text-white mb-3">Quantity</label>
                <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 w-fit rounded-xl p-2">
                  <button
                    onClick={decrementQuantity}
                    className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition text-white"
                  >
                    <Minus size={20} className="text-white" />
                  </button>
                  <span className="text-2xl font-bold text-white min-w-12 text-center">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition text-white"
                  >
                    <Plus size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Action Buttons and Info Badges */}
            <div>
              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
                >
                  <CreditCard size={24} />
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gray-800 text-white py-4 rounded-xl font-bold text-lg border border-gray-700 hover:bg-gray-750 transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={24} />
                  Add to Cart
                </button>
              </div>

              {/* Info Badges & Delivery Estimate */}
              <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-4 space-y-3 mt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <Truck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Estimated Delivery: <span className="text-emerald-400 font-extrabold">{getEstimatedDeliveryDate()}</span>
                    </p>
                    <p className="text-xs text-gray-400">Free express delivery on orders above ₹999.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Pincode"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/\D/g, ''));
                      setPincodeChecked(false);
                      setPincodeLocation("");
                    }}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 text-white placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleCheckPincode}
                    disabled={pincodeLoading}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {pincodeLoading ? "Checking..." : "Check"}
                  </button>
                </div>
                {pincodeChecked && (
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle size={14} /> Serviceable Location! Express & COD Delivery available.
                    </p>
                    {pincodeLocation && (
                      <p className="text-xs text-gray-200 font-medium pl-5 flex items-center gap-1">
                        <span>📍</span> Delivery Location: <span className="text-emerald-300 font-bold">{pincodeLocation}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={review.id || index} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center">
                       <span className="text-orange-400 font-bold">{review.user.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{review.user}</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xl ${i < review.rating ? 'text-amber-400' : 'text-gray-600'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {review.images.map((img, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={resolveImageUrl(img)}
                          alt={`Review attachment ${imgIndex + 1}`}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
) : (
               <p className="text-gray-400">No reviews yet.</p>
             )}
          </div>

          {/* Add Review Form */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold text-white mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  value={newReview.user}
                  onChange={(e) => setNewReview({ ...newReview, user: e.target.value })}
                   className="w-full p-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`text-2xl ${star <= newReview.rating ? 'text-amber-400' : 'text-gray-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                   className="w-full p-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none"
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Contact Seller */}
          <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-2xl font-bold text-white mb-4">Contact Seller</h3>
            {!showContactForm ? (
              <button
                onClick={() => {
                  const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
                  if (!currentUser) {
                    alert("Please login to contact the seller");
                    onPageChange("Login");
                    return;
                  }
                  setShowContactForm(true);
                }}
                className="bg-gray-800 text-white border border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition"
              >
                Contact Seller
              </button>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const currentUser = user || JSON.parse(localStorage.getItem("user") || "null");
                if (!currentUser) {
                  alert("Please login to send a message to the seller");
                  onPageChange("Login");
                  return;
                }
                handleContactSubmit(e);
              }} className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-2">Your Message</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full p-3 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-32 resize-none"
                    placeholder="Type your message to the seller..."
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="bg-gray-800 text-white border border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-white mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <button
                key={rp._id || rp.id}
                type="button"
                onClick={() => onPageChange("ProductDetails", rp._id || rp.id)}
                className="group bg-gray-900 border border-gray-800 rounded-2xl shadow-lg overflow-hidden hover:border-gray-600 transition transform hover:-translate-y-1 text-left"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={resolveImageUrl(rp.image_url || rp.image || rp.images?.[0])}
                    alt={rp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    {rp.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">{rp.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-orange-400">₹{rp.price}</p>
                    {rp.offer && (
                      <span className="bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                        {rp.offer}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">Recently Viewed Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentlyViewed.map((item) => (
              <button
                key={item._id || item.id}
                type="button"
                onClick={() => onPageChange("ProductDetails", item._id || item.id)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-left hover:border-gray-600 transition group"
              >
                <div className="h-28 overflow-hidden rounded-lg mb-2">
                  <img
                    src={resolveImageUrl(item.image_url || item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                <p className="text-xs text-orange-400 font-bold">₹{item.price}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Add To Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 border-t border-gray-800 p-3 shadow-2xl backdrop-blur-lg flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400">Total Price</p>
          <p className="text-lg font-bold text-white">₹{product.price * quantity}</p>
        </div>
        <div className="flex gap-2 flex-1 max-w-xs">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-gradient-to-r from-gray-700 to-gray-800 text-white py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-1"
          >
            <ShoppingCart size={16} />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-1"
          >
            <CreditCard size={16} />
            <span>Buy</span>
          </button>
        </div>
      </div>

    {showCouponModal && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 border border-gray-800 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
            <h3 className="text-xl font-bold text-white">Apply Coupon</h3>
            <button onClick={() => setShowCouponModal(false)} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4 bg-gray-950 p-3 rounded-xl border border-gray-800">
            <p className="text-gray-300 mb-1 text-sm">Product: <strong className="text-white">{product.name}</strong></p>
            <p className="text-gray-300 text-sm">Total: <strong className="text-orange-400">₹{product.price * quantity}</strong></p>
          </div>

          {appliedCoupon ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-400">{appliedCoupon.code}</p>
                  <p className="text-emerald-300 text-sm">Discount: -₹{appliedCoupon.discount_amount}</p>
                </div>
                <button onClick={removeCoupon} className="text-red-400 hover:text-red-300 text-sm font-semibold">Remove</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {couponLocked && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-xl text-sm">
                  Your coupon access is locked. Please wait for admin permission to use coupons again.
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                  placeholder="Enter coupon code"
                  disabled={couponLocked}
                  className="flex-1 px-3 py-2 bg-gray-950 border border-gray-800 text-white placeholder-gray-500 rounded-xl text-sm focus:border-orange-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim() || couponLocked}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>

              {activeCoupons.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Available Coupons</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeCoupons.map((coupon) => {
                      const minOrder = coupon.min_order_value || 0;
                      const currentOrderTotal = product.price * quantity;
                      const isEligible = currentOrderTotal >= minOrder;

                      return (
                        <div
                          key={coupon._id || coupon.id}
                          onClick={() => {
                            if (!couponLocked) {
                              setCouponCode(coupon.code);
                              setCouponError("");
                            }
                          }}
                          className={`p-3 border rounded-xl text-left transition cursor-pointer flex flex-col justify-between ${
                            couponCode === coupon.code
                              ? "border-orange-500 bg-gray-800"
                              : "border-gray-800 bg-gray-950 hover:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-700 text-sm">
                              {coupon.code}
                            </span>
                            <span className="text-xs font-semibold text-emerald-400">
                              {coupon.discount_type === "percentage"
                                ? `${coupon.discount_value}% OFF`
                                : `₹${coupon.discount_value} OFF`}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-gray-400">
                              Min purchase: ₹{minOrder}
                            </span>
                            {isEligible ? (
                              <span className="text-emerald-400 font-medium">Eligible</span>
                            ) : (
                              <span className="text-red-400 font-medium">
                                Buy ₹{minOrder - currentOrderTotal} more to apply
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {couponError && <p className="text-red-400 text-xs mb-3">{couponError}</p>}

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowCouponModal(false)}
              className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-xl hover:bg-gray-800 transition font-semibold"
            >
              Skip
            </button>
            <button
              onClick={handleBuyNowWithCoupon}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
);
}
