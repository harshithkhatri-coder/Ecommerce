import React, { useState, useEffect } from "react";
import Carousel from "./Carousel";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";
import { productsData } from "./productsData";
import AdBanner from "./AdBanner";
import { ShoppingCart, Eye } from "lucide-react";

export default function Home({ cart, onAddToCart, onPageChange, user }) {
  const [highlightProducts, setHighlightProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products/featured?limit=8`);

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setHighlightProducts(data.data.filter(Boolean));
            setLoading(false);
            return;
          }
        }

        // Fallback to all products endpoint if featured returns empty
        const fallbackRes = await fetch(`${API_BASE_URL}/products`);
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setHighlightProducts(data.data.slice(0, 8).filter(Boolean));
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Error fetching featured products, using fallback data:", err);
      }

      if (isMounted) {
        setHighlightProducts(productsData.slice(0, 8));
        setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    if (!user) {
      alert("Please login to add items to cart");
      onPageChange("Login");
      return;
    }
    onAddToCart(product);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
      <AdBanner user={user} onNavigate={onPageChange} />

      {/* Hero Carousel */}
      <Carousel />

      {/* Highlight Strip - Signature Styles */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-widest mb-3">
            ⭐ Featured Collection
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Discover Our Signature Styles
          </h2>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
            A quick peek at a few of our most loved designs. Explore the full collection in the products section.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {highlightProducts.map((product, index) => (
              <div
                key={product._id || product.id}
                onClick={() => onPageChange("ProductDetails", product._id || product.id)}
                className="group bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl hover:border-orange-500/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-60 sm:h-64 rounded-xl overflow-hidden mb-4 bg-gray-950">
                    <img
                      src={resolveImageUrl(product.image_url || product.image || product.images?.[0])}
                      alt={product.name}
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-gray-950/80 backdrop-blur-md text-orange-400 border border-gray-800 px-2.5 py-1 rounded-full text-xs font-extrabold uppercase">
                      {product.category || "Sneakers"}
                    </div>
                  </div>

                  <h3 className="text-white text-lg font-bold truncate mb-1 group-hover:text-orange-400 transition">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-black text-white">₹{product.price}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs text-gray-500 line-through">₹{product.original_price}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageChange("ProductDetails", product._id || product.id);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 transition text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Eye size={14} /> Details
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(product, e)}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <ShoppingCart size={14} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA to go to full products list */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => onPageChange("Products")}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-10 py-3.5 rounded-xl font-bold hover:shadow-lg transition text-base tracking-wide uppercase shadow-lg shadow-orange-500/20"
          >
            Browse All Products
          </button>
        </div>
      </div>
    </div>
  );
}
