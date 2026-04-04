import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Minus, ShoppingCart, CreditCard, Heart } from "lucide-react";
import API_BASE_URL from "./config";
import { productsData } from "./productsData";
import { resolveImageUrl } from "./imageHelpers";

export default function ProductDetails({ productId, onPageChange, onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("9");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [newReview, setNewReview] = useState({ user: '', rating: 5, comment: '' });
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const data = await response.json();
        if (data.success) {
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

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-full bg-gradient-to-b from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h1>
          <button
            onClick={() => onPageChange("Products")}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
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
    // Check if adding these items would exceed the limit
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const currentTotalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (currentTotalItems + quantity > MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items total. Please reduce the quantity or checkout with fewer items.`);
      return;
    }

    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    alert(`Added ${quantity} item(s) to cart!`);
  };

  const handleBuyNow = () => {
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const currentTotalItems = currentCart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    if (currentTotalItems + quantity > MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items total. Please reduce the quantity or checkout with fewer items.`);
      return;
    }

    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
    onPageChange("Cart");
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
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-teal-600 to-teal-500 text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Image Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 flex items-center justify-center min-h-64 md:min-h-96">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={resolveImageUrl(product.image_url || product.image)}
                alt={product.name}
                onError={(e) => {
                  if (product.image && e.currentTarget.src !== product.image) {
                    e.currentTarget.src = product.image;
                  }
                }}
                className="max-w-full max-h-96 object-contain rounded-lg shadow-md hover:shadow-xl transition transform hover:scale-105"
              />
              <button
                onClick={handleToggleWishlist}
                className={`absolute top-4 right-4 p-3 rounded-full transition ${isInWishlist
                  ? "bg-teal-500 text-white"
                  : "bg-white/80 text-gray-800 hover:bg-white"
                  }`}
              >
                <Heart size={24} fill={isInWishlist ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Product Details Container */}
          <div className="bg-white rounded-lg shadow-lg p-8">
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
                  <span key={i} className={`text-xl ${i < averageRating ? 'text-yellow-400' : 'text-gray-300'}`}>
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
                <span className="text-2xl md:text-4xl font-bold text-teal-600">₹{product.price}</span>
                <span className="text-lg text-gray-500 line-through">₹{Math.round(product.price * 1.2)}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-semibold">
                  20% OFF
                </span>
              </div>
              <p className="text-gray-600 text-sm">Inclusive of all taxes</p>
            </div>

            {/* Product Description */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Product Description</h3>
              <p className="text-gray-700 leading-relaxed">
                Premium quality {product.name.toLowerCase()} designed for comfort and style. Made with high-grade materials,
                these products are perfect for everyday wear. Experience superior comfort and durability with our collection.
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
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-gray-100 text-gray-800 border-gray-300 hover:border-teal-600"
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
                  className="w-full bg-black from-green-500 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CreditCard size={24} />
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-black from-blue-500 to-teal-600 text-white py-4 rounded-lg font-bold text-lg hover:shadow-lg transition flex items-center justify-center gap-2"
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
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={review.id || index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-600 font-bold">{review.user.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{review.user}</h4>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
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
              <p className="text-gray-600">No reviews yet.</p>
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                      className={`text-2xl ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none"
                  placeholder="Share your thoughts about this product..."
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition"
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
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-32 resize-none"
                    placeholder="Type your message to the seller..."
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
