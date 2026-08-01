import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { productsData } from "./productsData";
import { Heart } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";

export default function Products({ onAddToCart, onPageChange }) {
  // choose initial displayed count based on screen width for better UX on mobile
  const getInitialDisplayed = () => {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w < 640) return 8; // mobile
      if (w < 1024) return 12; // tablet
      return 24; // desktop
    }
    return 12;
  };
  const [displayed, setDisplayed] = useState(getInitialDisplayed);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("featured");
  const [products, setProducts] = useState(productsData); // Fallback data
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    try {
      if (products.length === 0) {
        setLoading(true);
      }
      const response = await fetch(`${API_BASE_URL}/products`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Products request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Use API data only if it is not empty to ensure products are shown.
        setProducts(data.data.filter(Boolean));
        try {
          localStorage.setItem('velux_products_cache', JSON.stringify({ ts: Date.now(), items: data.data }));
        } catch {}
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("Error fetching products, using local fallback:", err);
    } finally {
      setLoading(false);
    }
  };
  // hydrate from cache if available and fresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem('velux_products_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.ts && Date.now() - parsed.ts < 30 * 1000 && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setProducts(parsed.items.filter(Boolean));
          return;
        }
      }
    } catch {}
    // otherwise fetch
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

    const userId = user.id || user._id;
    const pId = String(product._id || product.id);
    const isInWishlist = wishlist.includes(pId);

    // Optimistic UI update
    const updatedWishlist = isInWishlist
      ? wishlist.filter(id => id !== pId)
      : [...wishlist, pId];
    setWishlist(updatedWishlist);

    try {
      const method = isInWishlist ? "DELETE" : "POST";
      const response = await fetch(`${API_BASE_URL}/wishlist/${userId}/${pId}`, {
        method,
      });
      const data = await response.json();
      if (data.success) {
        const wishlistIds = (data.data || []).map(item => String(item._id || item.id));
        setWishlist(wishlistIds);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  // Debounce search input
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setDisplayed(12);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(val), 250);
  }, []);

  // Memoized filtered/sorted products — only recalculate when inputs change
  const filteredProducts = useMemo(() =>
    selectedCategory === "All"
      ? products.filter(Boolean)
      : products.filter(Boolean).filter(p => (p.category || "").toLowerCase().trim() === selectedCategory.toLowerCase().trim()),
    [products, selectedCategory]
  );

  const searchedProducts = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return filteredProducts;
    return filteredProducts.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  }, [filteredProducts, debouncedSearch]);

  const sortedProducts = useMemo(() => {
    const arr = [...searchedProducts];
    switch (sortOption) {
      case "priceLowHigh": return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "priceHighLow": return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "nameAZ":       return arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "nameZA":       return arr.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      default:             return arr;
    }
  }, [searchedProducts, sortOption]);

  // Unique categories — memoized
  const uniqueCategories = useMemo(
    () => ["All", ...new Set(products.filter(Boolean).map(p => p.category).filter(Boolean))],
    [products]
  );

  const visibleProducts = sortedProducts.slice(0, displayed);
  const hasMore = displayed < sortedProducts.length;

  const loadMore = useCallback(() => {
    setDisplayed(prev => Math.min(prev + 8, sortedProducts.length));
  }, [sortedProducts.length]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
    setDisplayed(12);
  }, []);

  const handleAddToCart = useCallback((product) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login to add items to cart");
      onPageChange("Login");
      return;
    }
    onAddToCart(product);
  }, [onAddToCart, onPageChange]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-950">
      {/* Animated Page Header Banner */}
      <div className="animated-products-banner py-14 px-4 border-b border-gray-800 shadow-2xl relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10 space-y-2">
          <span className="inline-block px-3.5 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-sm animate-bounce">
            Premium Footwear Collection
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight animated-banner-title drop-shadow-md">
            All Products
          </h1>
          <p className="text-gray-300 max-w-xl mx-auto text-sm md:text-base font-medium">
            Browse our complete collection of premium products
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full lg:w-1/2">
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
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
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover bg-slate-100 hover:scale-105 transition-transform duration-500"
                    />
                     <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      {product.category}
                    </div>
                    {/* Heart Button */}
                    <button
                      onClick={(e) => handleToggleWishlist(product, e)}
                      className={`absolute top-2 left-2 p-2 rounded-full transition ${wishlist.includes(String(product._id || product.id))
                          ? "bg-red-500 text-white shadow-md scale-105"
                          : "bg-white/80 text-gray-600 hover:bg-white"
                        }`}
                    >
                      <Heart
                        size={18}
                        className={wishlist.includes(String(product._id || product.id)) ? "fill-current text-white" : ""}
                      />
                    </button>
                  </div>
<h2
                    onClick={() => onPageChange("ProductDetails", product._id || product.id)}
                     className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-gray-700 transition"
                  >
                    {product.name}
                  </h2>
                   <div className="flex items-baseline gap-2 mb-3">
                     <p className="text-2xl font-bold text-gray-800">₹{product.price}</p>
                     {product.offer && (
                       <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold">
                         {product.offer}
                       </span>
                     )}
                   </div>
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
