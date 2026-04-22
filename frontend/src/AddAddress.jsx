import React, { useState } from "react";
import { MapPin, Building, Home, Phone, Globe } from "lucide-react";
import API_BASE_URL from "./config";

export default function AddAddress({ onPageChange, user }) {
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: user?.phone || ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage({ type: "error", text: "Please login first" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, ...formData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setMessage({ type: "success", text: "Address saved successfully!" });
        setTimeout(() => {
          onPageChange("Profile");
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save address" });
      }
    } catch (err) {
      console.error("Error saving address:", err);
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-gray-950 to-black py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Add Address</h2>
            <button
              onClick={() => onPageChange("Profile")}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {message.text && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
              message.type === "success" 
                ? "bg-green-900 border border-green-500 text-green-200"
                : "bg-red-900 border border-red-500 text-red-200"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                <MapPin size={16} className="inline mr-2" />
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House No, Street, Village/Area"
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">
                  <Building size={16} className="inline mr-2" />
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full px-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">
                  <Home size={16} className="inline mr-2" />
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="w-full px-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">
                  ZIP / PIN Code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="6-digit code"
                  className="w-full px-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-1">
                  <Globe size={16} className="inline mr-2" />
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:border-gray-400 transition"
                >
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-1">
                <Phone size={16} className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 XXXXXXXXXX"
                className="w-full px-4 py-2 border-2 border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Address"}
              </button>
              <button
                type="button"
                onClick={() => onPageChange("Profile")}
                className="px-6 py-3 border-2 border-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}