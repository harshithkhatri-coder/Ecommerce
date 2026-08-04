import React, { useState, useEffect } from "react";
import Carousel from "./Carousel";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";
import AdBanner from "./AdBanner";

export default function Home({ cart, onAddToCart, onPageChange, user }) {
  const [highlightProducts, setHighlightProducts] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    // A hosted backend can take several seconds to wake up after inactivity.
    // Keep the request alive long enough to receive the real catalogue.
    const timeoutId = setTimeout(() => controller.abort("Products request timed out"), 20000);

    const fetchProducts = async () => {
      try {
        // The public catalogue must always come from the same database as Admin.
        // Do not fall back to the old static catalogue or a browser cache here.
        const response = await fetch(`${API_BASE_URL}/products/featured?limit=8`, {
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.success && Array.isArray(data.data)) {
            setHighlightProducts(data.data.filter(Boolean));
          }
        }
      } catch (err) {
        // Keep the list empty if the API cannot be reached. Showing static products
        // here would make the storefront disagree with the Admin product list.
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
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4 md:mb-6 text-center">
          Discover Our Signature Styles
        </h2>
        <p className="text-center text-gray-200 mb-10 max-w-2xl mx-auto font-medium">
          A quick peek at a few of our most loved designs. Explore the full
          collection in the products section.
        </p>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {highlightProducts.map((product, index) => (
            <button
              key={product._id || product.id}
              type="button"
              onClick={() => onPageChange("ProductDetails", product._id || product.id)}
              className="product-card fade-up group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="relative h-48 sm:h-56 md:h-64">
                <img
                  src={resolveImageUrl(product.image_url || product.image)}
                  alt={product.name}
                  loading={index < 2 ? "eager" : "lazy"}
                  fetchPriority={index < 2 ? "high" : "auto"}
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
