import React, { useState, useEffect } from "react";
import { productsData } from "./productsData";
import { Heart } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

export default function Products({ onAddToCart, onPageChange }) {
  const [displayed, setDisplayed] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [products, setProducts] = useState(productsData); // Load static data immediately
  const [wishlist, setWishlist] = useState([]);
  const loading = false; // Static data loads instantly, no loading state needed

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, []);

  const fetchProducts = async () => {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setProducts(data.data);
      }
      // If API fails or returns empty, keep using static data
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error fetching products:", err);
      // Keep using static data from initial state
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
        setWishlist(wishlistIds);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  const handleToggleWishlist = async (product, e) => {
    e.stopPropagation();
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      alert("Please login to add items to wishlist");
      onPageChange("Login");
      return;
    }

    const isInWishlist = wishlist.includes(product._id);

    try {
      if (isInWishlist) {
        const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}/${product._id}`, {
          method: "DELETE",
        });
        const data = await response.json();
        if (data.success) {
          setWishlist(data.data || []);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/wishlist/${user.id}/${product._id}`, {
          method: "POST",
        });
        const data = await response.json();
        if (data.success) {
          const wishlistIds = (data.data || []).map(item => item._id);
          setWishlist(wishlistIds);
        }
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter(p => (p.category || "").toLowerCase().trim() === selectedCategory.toLowerCase().trim());

  const searchedProducts = searchQuery.trim() === ""
    ? filteredProducts
    : filteredProducts.filter((p) => {
        const lower = searchQuery.toLowerCase().trim();
        return (p.name || "").toLowerCase().includes(lower)
          || (p.description || "").toLowerCase().includes(lower)
          || (p.category || "").toLowerCase().includes(lower);
      });

  const sortedProducts = [...searchedProducts].sort((a, b) => {
    switch (sortOption) {
      case "priceLowHigh":
        return (a.price || 0) - (b.price || 0);
      case "priceHighLow":
        return (b.price || 0) - (a.price || 0);
      case "nameAZ":
        return (a.name || "").localeCompare(b.name || "");
      case "nameZA":
        return (b.name || "").localeCompare(a.name || "");
      default:
        return 0;
    }
  });

  // Dynamically generate categories from products
  const uniqueCategories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];

  const visibleProducts = sortedProducts.slice(0, displayed);
  const hasMore = displayed < sortedProducts.length;

  const loadMore = () => {
    setDisplayed((prev) => Math.min(prev + 4, filteredProducts.length));
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setDisplayed(12);
  };

  const handleAddToCart = (product) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to add items to cart");
      onPageChange("Login");
      return;
    }
    onAddToCart(product);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950">
      {/* Page Header */}
        <div className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 text-white py-12 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">All Products</h1>
           <p className="text-gray-200">Browse our complete collection of premium products</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full lg:w-1/2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayed(12);
              }}
              placeholder="Search products by name, category, or description"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div className="w-full lg:w-1/2 flex items-center justify-end gap-3">
            <label htmlFor="sort" className="sr-only">Sort products</label>
            <select
              id="sort"
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value);
                setDisplayed(12);
              }}
              className="w-full lg:w-72 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800"
            >
              <option value="featured">Featured</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
              <option value="nameAZ">Name: A–Z</option>
              <option value="nameZA">Name: Z–A</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {uniqueCategories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-6 py-2 rounded-full font-semibold transition ${selectedCategory === category
                  ? "bg-gray-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-400"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No products found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {visibleProducts.map((product) => (
                <div
                  key={product._id || product.id}
                  className="bg-white rounded-2xl shadow-md p-4 hover:shadow-xl transition transform hover:scale-105 cursor-pointer relative"
                >
                  <div
                    onClick={() => onPageChange("ProductDetails", product._id || product.id)}
                    className="relative overflow-hidden rounded-xl mb-4 cursor-pointer h-72 sm:h-80"
                  >
                    <img
                      src={resolveImageUrl(product.image_url || product.image || product.images?.[0])}
                      alt={product.name}
                      className="w-full h-full object-contain bg-slate-100 hover:scale-105 transition-transform duration-500"
                    />
                     <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      {product.category}
                    </div>
                    {/* Heart Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(product, e)}
                      className={`absolute top-2 left-2 p-2 rounded-full transition ${wishlist.includes(product._id)
                          ? "bg-gray-500 text-white"
                          : "bg-white/80 text-gray-600 hover:bg-white"
                        }`}
                    >
                      <Heart
                        size={18}
                        className={wishlist.includes(product._id) ? "fill-current" : ""}
                      />
                    </button>
                  </div>
                  <h2
                    onClick={() => onPageChange("ProductDetails", product._id || product.id)}
                     className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-gray-700 transition"
                  >
                    {product.name}
                  </h2>
                   <p className="text-2xl font-bold text-gray-800 mb-3">₹{product.price}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPageChange("ProductDetails", product._id || product.id)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-xl hover:shadow-lg transition font-semibold text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-gray-200 text-gray-800 py-2 rounded-xl hover:bg-gray-300 transition font-semibold text-sm"
                    >
                      Add Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  className="bg-gray-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-700 transition text-lg"
                >
                  Load More Products
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
