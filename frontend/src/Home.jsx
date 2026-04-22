import React, { useState, useEffect } from "react";
import Carousel from "./Carousel";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

// Sample products to show when API is unavailable
const SAMPLE_PRODUCTS = [
  {
    _id: "sample1",
    name: "Premium Running Shoes",
    category: "Footwear",
    image_url: "/images/SHOE1.jpg"
  },
  {
    _id: "sample2",
    name: "Classic Leather Sneakers",
    category: "Footwear",
    image_url: "/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg"
  },
  {
    _id: "sample3",
    name: "Urban Style Collection",
    category: "Fashion",
    image_url: "/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg"
  }
];

export default function Home({ cart, onAddToCart, onPageChange }) {
  const [highlightProducts, setHighlightProducts] = useState(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setHighlightProducts(data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-gray-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlightProducts.map((product) => (
              <button
                key={product._id}
                type="button"
                onClick={() => onPageChange("ProductDetails", product._id)}
                className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className="relative h-64">
                  <img
                    src={resolveImageUrl(product.image_url || product.image)}
                    alt={product.name}
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
        )}

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
