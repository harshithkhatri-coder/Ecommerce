import React, { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import API_BASE_URL from "./config";

export default function ResetPassword({ token, onPageChange }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const endpointCandidates = ["/auth/reset-password", "/auth/resetPassword"];
      let lastMessage = "Failed to reset password";

      for (const endpoint of endpointCandidates) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword })
        });

        let data = null;
        try {
          data = await response.json();
        } catch {
          data = { success: false, message: "Unexpected server response" };
        }

        if (response.ok && data.success) {
          alert("Password reset successful. Please login.");
          onPageChange("Login");
          return;
        }

        lastMessage = data.message || lastMessage;
        if (response.status === 404) continue;
        break;
      }

      alert(lastMessage);
    } catch (error) {
      alert("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Reset Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-gray-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition disabled:opacity-50"
            >
              {loading ? "Please wait..." : "Update Password"}
            </button>
          </form>

          <button
            onClick={() => onPageChange("Login")}
            className="w-full mt-4 border border-gray-600 text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
