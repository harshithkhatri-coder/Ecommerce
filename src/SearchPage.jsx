import React, { useState } from "react";
import { Search as SearchIcon, ArrowLeft, X } from "lucide-react";
import { productsData } from "./productsData";

export default function Search({ searchQuery, onPageChange, onAddToCart }) {
  const [query, setQuery] = useState(searchQuery || "");
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim() === "") {
      setResults([]);
      return;
    }

    const filtered = productsData.filter(
      (product) =>
        product.name.toLowerCase().includes(value.toLowerCase()) ||
        product.category.toLowerCase().includes(value.toLowerCase())
    );
    setResults(filtered);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-teal-600 to-teal-500 text-white py-6 px-4 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => onPageChange("Home")}
              className="flex items-center gap-2 hover:bg-white/20 px-3 py-2 rounded-lg transition"
            >
              <ArrowLeft size={24} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-2xl font-bold flex-grow">Search Products</h1>
          </div>

          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search by product name or category..."
              className="w-full pl-12 pr-12 py-3 text-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-white/50"
              autoFocus
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {query.trim() === "" ? (
          <div className="text-center py-16">
            <SearchIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-3xl font-bold text-gray-700 mb-2">Search Products</h2>
            <p className="text-gray-600">Enter a product name or category to begin searching</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-3xl font-bold text-gray-700 mb-2">No Results Found</h2>
            <p className="text-gray-600">
              We couldn't find any products matching "<strong>{query}</strong>"
            </p>
            <button
              onClick={clearSearch}
              className="mt-6 bg-gradient-to-r from-blue-700 to-teal-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
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
                  key={product.id}
                  className="bg-white rounded-2xl shadow-md p-4 hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
                >
                  <div
                    onClick={() => onPageChange("ProductDetails", product.id)}
                    className="relative overflow-hidden rounded-xl mb-4 cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover hover:scale-110 transition"
                    />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                      {product.category}
                    </div>
                  </div>

                  <h2
                    onClick={() => onPageChange("ProductDetails", product.id)}
                    className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition line-clamp-2"
                  >
                    {product.name}
                  </h2>

                  <p className="text-2xl font-bold text-blue-600 mb-3">₹{product.price}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onPageChange("ProductDetails", product.id)}
                      className="bg-gradient-to-r from-blue-700 to-teal-600 text-white py-2 rounded-xl hover:shadow-lg transition font-semibold text-sm"
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
