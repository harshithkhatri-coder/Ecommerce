import React, { useState, useEffect } from "react";
import Carousel from "./Carousel";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";
import AdBanner from "./AdBanner";
import { productsData } from "./productsData";

export default function Home({ cart, onAddToCart, onPageChange, user }) {
  const [highlightProducts, setHighlightProducts] = useState(() => productsData.slice(0, 3));

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Products request timed out"), 4000);

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products/featured`, {
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.success && Array.isArray(data.data) && data.data.length > 0) {
            setHighlightProducts(data.data.filter(Boolean).slice(0, 3));
            clearTimeout(timeoutId);
            return;
          }
        }
      } catch (err) {
        // Silent fallback in background
      }

      try {
        const fallbackResponse = await fetch(`${API_BASE_URL}/products`, {
          signal: controller.signal
        });
        if (isMounted && fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && Array.isArray(fallbackData.data) && fallbackData.data.length > 0) {
            setHighlightProducts(fallbackData.data.filter(Boolean).slice(0, 3));
          }
        }
      } catch (err) {
        // Silent fallback in background
      } finally {
        clearTimeout(timeoutId);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
      <AdBanner user={user} onNavigate={onPageChange} />

      {/* Hero Carousel */}
      <Carousel />

      {/* Highlight Strip - just a few beautiful product images */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 via-gray-600 to-gray-500 bg-clip-text text-transparent mb-4 md:mb-6 text-center">
          Discover Our Signature Styles
        </h2>
        <p className="text-center text-gray-300 mb-10 max-w-2xl mx-auto">
          A quick peek at a few of our most loved designs. Explore the full
          collection in the products section.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlightProducts.map((product) => (
            <button
              key={product._id || product.id}
              type="button"
              onClick={() => onPageChange("ProductDetails", product._id || product.id)}
              className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="relative h-64">
                <img
                  src={resolveImageUrl(product.image_url || product.image)}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs uppercase tracking-wide text-gray-300 mb-1">
                    {product.category}
                  </p>
                  <h3 className="text-white text-lg font-semibold">
                    {product.name}
                  </h3>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CTA to go to full products list */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => onPageChange("Products")}
            className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-10 py-3 rounded-xl font-semibold hover:shadow-lg transition text-lg"
          >
            Browse All Products
          </button>
        </div>
      </div>
    </div>
  );
}
