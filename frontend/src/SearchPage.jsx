import React, { useState, useEffect } from "react";
import { Search as SearchIcon, ArrowLeft, X, Mic } from "lucide-react";
import API_BASE_URL from "./config";
import { resolveImageUrl } from "./imageHelpers";
import { productsData as fallbackProducts } from "./productsData";

export default function Search({ searchQuery, onPageChange, onAddToCart }) {
  const [query, setQuery] = useState(searchQuery || "");
  const [allProducts, setAllProducts] = useState(fallbackProducts);
  const [results, setResults] = useState([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setAllProducts(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const performFilter = (text, list = allProducts) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }
    const filtered = list.filter(
      (product) =>
        (product.name || "").toLowerCase().includes(text.toLowerCase()) ||
        (product.category || "").toLowerCase().includes(text.toLowerCase())
    );
    setResults(filtered);
  };

  useEffect(() => {
    if (query) {
      performFilter(query, allProducts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProducts]);


  const handleSearch = (e) => {
    performFilter(e.target.value);
  };

  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please type your search query.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      setIsListening(true);
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          performFilter(transcript);
        }
      };
      recognition.start();
    } catch (err) {
      console.error("Voice search error:", err);
      setIsListening(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-black to-gray-950">
      {/* Animated Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white py-6 px-4 border-b border-gray-800 shadow-2xl sticky top-0 z-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => onPageChange("Home")}
              className="flex items-center gap-2 bg-gray-900/80 hover:bg-orange-500 hover:text-white border border-gray-700 px-3 py-1.5 rounded-xl transition text-gray-200 font-bold text-sm shadow-md active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
                🔍 Search Catalogue
              </span>
            </div>
          </div>

          {/* Search Input with Mic */}
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={isListening ? "Listening... Speak now..." : "Search by product name or category..."}
              className={`w-full pl-12 pr-24 py-3 text-gray-200 bg-gray-800 rounded-xl outline-none focus:ring-2 placeholder-gray-400 transition ${
                isListening ? "ring-2 ring-red-500 bg-red-950/20" : "focus:ring-orange-500"
              }`}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-gray-400 hover:text-white transition"
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title={isListening ? "Listening..." : "Search by voice"}
                className={`p-1.5 rounded-lg transition active:scale-95 cursor-pointer ${
                  isListening
                    ? "bg-red-600 text-white animate-pulse"
                    : "text-gray-400 hover:text-orange-400 hover:bg-gray-700"
                }`}
              >
                <Mic size={20} className={isListening ? "animate-bounce" : ""} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {query.trim() === "" ? (
          <div className="text-center py-16">
            <SearchIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Search Products</h2>
            <p className="text-gray-300">Enter a product name or category to begin searching</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">No Results Found</h2>
            <p className="text-gray-300">
              We couldn't find any products matching "<strong>{query}</strong>"
            </p>
            <button
              onClick={clearSearch}
              className="mt-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Found {results.length} result{results.length !== 1 ? "s" : ""} for "<strong>{query}</strong>"
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {results.map((product) => (
                <div
                  key={product.id || product._id}
                  className="bg-white rounded-2xl shadow-md p-4 hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
                >
                  <div
                    onClick={() => onPageChange("ProductDetails", product.id || product._id)}
                    className="relative overflow-hidden rounded-xl mb-4 cursor-pointer"
                  >
                    <img
                      src={resolveImageUrl(product.image || product.image_url)}
                      alt={product.name}
                      className="w-full h-48 object-cover hover:scale-110 transition"
                    />
                    <div className="absolute top-2 right-2 bg-gray-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      {product.category}
                    </div>
                  </div>

                  <h2
                    onClick={() => onPageChange("ProductDetails", product.id || product._id)}
                    className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-gray-700 transition line-clamp-2"
                  >
                    {product.name}
                  </h2>

                  <p className="text-2xl font-bold text-gray-800 mb-3">₹{product.price}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPageChange("ProductDetails", product.id || product._id)}
                      className="bg-gradient-to-r from-gray-700 to-gray-800 text-white py-2 rounded-xl hover:shadow-lg transition font-semibold text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      className="bg-gray-200 text-gray-800 py-2 rounded-xl hover:bg-gray-300 transition font-semibold text-sm"
                    >
                      Add Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
