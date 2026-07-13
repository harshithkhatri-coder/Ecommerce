import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, ShoppingCart, CreditCard, Heart, X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import API_BASE_URL from "./config";
import { productsData } from "./productsData";
import { resolveImageUrl } from "./imageHelpers";

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

      try {
        const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}`);
        const data = await response.json();
        if (data.success) {
          const wishlistIds = data.data.map(item => item._id);
          setIsInWishlist(wishlistIds.includes(productId));
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

  const sizes = ["7", "8", "9", "10", "11", "12"];
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

    try {
      if (isInWishlist) {
        const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}/${productId}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          setIsInWishlist(false);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}/${productId}`, {
          method: "POST",
        });
        const data = await response.json();
        if (data.success) {
          setIsInWishlist(true);
        }
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

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (contactMessage) {
      alert('Message sent to seller!');
      setContactMessage('');
      setShowContactForm(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950 overflow-x-hidden">
      {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-4">
          <button
            onClick={() => onPageChange("Products")}
            className="flex items-center gap-2 hover:bg-white/20 px-3 py-2 rounded-lg transition"
          >
            <ArrowLeft size={24} />
            <span className="hidden sm:inline">Back to Products</span>
          </button>
          <h1 className="text-2xl font-bold flex-grow">{product.name}</h1>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Row 1: Image and Product Info side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 min-w-0">
          {/* Product Image Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 min-h-64 md:min-h-96 min-w-0 overflow-hidden">
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
                  <div className="relative h-64 md:h-96 flex items-center justify-center overflow-hidden rounded-lg">
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
                        className="max-w-full max-h-96 object-contain rounded-lg shadow-md hover:shadow-xl transition transform hover:scale-105"
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
          <div className="bg-white rounded-lg shadow-lg p-8 min-w-0 overflow-hidden">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
                <p className="text-gray-600 text-lg">{product.category}</p>
              </div>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < averageRating ? 'text-gray-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600">
                {reviewCount > 0
                  ? `(${reviewCount} customer review${reviewCount !== 1 ? 's' : ''})`
                  : 'No reviews yet'}
              </span>
            </div>

{/* Price */}
            <div className="border-t-2 border-b-2 border-gray-200 py-4 mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-2xl md:text-4xl font-bold text-gray-800">₹{product.price}</span>
                {product.original_price && product.original_price > product.price ? (
                  <span className="text-lg text-gray-500 line-through">₹{product.original_price}</span>
                ) : (
                  <span className="text-lg text-gray-500 line-through">₹{Math.round(product.price * 1.2)}</span>
                )}
                 {product.offer ? (
                   <span className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-semibold">
                     {product.offer}
                   </span>
                 ) : (
                   <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm font-semibold">
                     20% OFF
                   </span>
                 )}
              </div>
              <p className="text-gray-600 text-sm">Inclusive of all taxes</p>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Product Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description || `Premium quality ${product.name.toLowerCase()} designed for comfort and style. Made with high-grade materials, these products are perfect for everyday wear. Experience superior comfort and durability with our collection.`}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Size, Quantity, Actions - Full Width Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Size and Quantity */}
            <div>
              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-800 mb-3">Select Size (US)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-2 px-3 rounded-lg font-semibold transition border-2 ${selectedSize === size
                        ? "bg-gray-600 text-white border-gray-600"
                        : "bg-gray-100 text-gray-800 border-gray-300 hover:border-gray-500"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Quantity</label>
                <div className="flex items-center gap-4 bg-gray-100 w-fit rounded-lg p-2">
                  <button
                    onClick={decrementQuantity}
                    className="bg-white p-2 rounded hover:bg-gray-200 transition"
                  >
                    <Minus size={20} className="text-gray-800" />
                  </button>
                  <span className="text-2xl font-bold text-gray-800 min-w-12 text-center">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    className="bg-white p-2 rounded hover:bg-gray-200 transition"
                  >
                    <Plus size={20} className="text-gray-800" />
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
                  className="w-full bg-gray-700 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CreditCard size={24} />
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={24} />
                  Add to Cart
                </button>
              </div>

              {/* Info Badges */}
              
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={review.id || index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                       <span className="text-gray-600 font-bold">{review.user.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{review.user}</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xl ${i < review.rating ? 'text-gray-400' : 'text-gray-300'}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{review.comment}</p>
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
               <p className="text-white">No reviews yet.</p>
             )}
          </div>

          {/* Add Review Form */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={newReview.user}
                  onChange={(e) => setNewReview({ ...newReview, user: e.target.value })}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className={`text-2xl ${star <= newReview.rating ? 'text-gray-400' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 h-32 resize-none"
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Contact Seller */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Contact Seller</h3>
            {!showContactForm ? (
              <button
                onClick={() => setShowContactForm(true)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
              >
                Contact Seller
              </button>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Your Message</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 h-32 resize-none"
                    placeholder="Type your message to the seller..."
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="bg-gray-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition"
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
                className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1 text-left"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={resolveImageUrl(rp.image_url || rp.image || rp.images?.[0])}
                    alt={rp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    {rp.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{rp.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-gray-800">₹{rp.price}</p>
                    {rp.offer && (
                      <span className="bg-gray-600 text-white px-2 py-0.5 rounded text-xs font-semibold">
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
    </div>
    </div>

    {showCouponModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Apply Coupon</h3>
            <button onClick={() => setShowCouponModal(false)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 mb-2">Product: <strong>{product.name}</strong></p>
            <p className="text-gray-600 mb-2">Total: <strong>₹{product.price * quantity}</strong></p>
          </div>

          {appliedCoupon ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-green-700">{appliedCoupon.code}</p>
                  <p className="text-green-600 text-sm">Discount: -₹{appliedCoupon.discount_amount}</p>
                </div>
                <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {couponLocked && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
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

              {activeCoupons.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Coupons</h4>
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
                              ? "border-gray-800 bg-gray-50"
                              : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-sm">
                              {coupon.code}
                            </span>
                            <span className="text-xs font-semibold text-green-600">
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
                              <span className="text-green-600 font-medium">Eligible</span>
                            ) : (
                              <span className="text-red-500 font-medium">
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

          {couponError && <p className="text-red-500 text-xs mb-3">{couponError}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setShowCouponModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Skip
            </button>
            <button
              onClick={handleBuyNowWithCoupon}
              className="flex-1 bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
