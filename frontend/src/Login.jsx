import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import API_BASE_URL from "./config";

export default function Login({ onPageChange }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async () => {
    const emailToReset = (forgotEmail || formData.email || "").trim();
    if (!emailToReset) {
      alert("Please enter your email.");
      return;
    }

    const endpointCandidates = ["/auth/forgot-password", "/auth/forgotPassword"];
    let lastMessage = "Failed to request password reset";

    for (const endpoint of endpointCandidates) {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToReset })
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = { success: false, message: "Unexpected server response" };
      }

      if (res.ok && data.success) {
        if (data.resetLink) {
          alert("Reset link generated. Opening it now.");
          window.open(data.resetLink, "_blank");
        } else {
          alert("Password reset link has been sent to your email.");
        }
        setIsForgotPassword(false);
        return;
      }

      lastMessage = data.message || lastMessage;
      if (res.status === 404) continue;
      break;
    }

    alert(lastMessage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        await handleForgotPassword();
        setLoading(false);
        return;
      }

      if (isLogin) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });
        const data = await res.json();

        if (data.success) {
          localStorage.setItem("user", JSON.stringify(data.data));
          localStorage.setItem("token", data.data.token);
          window.dispatchEvent(new Event("userLoggedIn"));
          onPageChange("Home");
        } else {
          alert(data.message || "Login failed");
          if (data.message === "User not found") {
            setIsLogin(false);
          }
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match!");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        });
        const data = await res.json();

        if (data.success) {
          alert("Account created! Logging in...");
          const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, password: formData.password })
          });
          const loginData = await loginRes.json();
          if (loginData.success) {
            localStorage.setItem("user", JSON.stringify(loginData.data));
            localStorage.setItem("token", loginData.data.token);
            window.dispatchEvent(new Event("userLoggedIn"));
            onPageChange("AddAddress");
          }
        } else {
          alert(data.message || "Registration failed");
        }
      }
    } catch (err) {
      alert("Cannot connect to server. Make sure backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            {isForgotPassword ? "Forgot Password" : isLogin ? "Login" : "Sign Up"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isForgotPassword && !isLogin && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-gray-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={isForgotPassword ? forgotEmail : formData.email}
                  onChange={isForgotPassword ? (e) => setForgotEmail(e.target.value) : handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-gray-400"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-gray-400"
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
            )}

            {!isForgotPassword && !isLogin && (
              <div>
                <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-gray-400"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-500 transition disabled:opacity-50"
            >
              {loading ? "Please wait..." : isForgotPassword ? "Send Reset Link" : isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            {!isForgotPassword ? (
              <>
                {isLogin && (
                  <button
                    onClick={() => setIsForgotPassword(true)}
                    className="text-gray-300 text-sm underline mb-3"
                  >
                    Forgot Password?
                  </button>
                )}
                <p className="text-gray-400 text-sm">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-white ml-1 underline"
                  >
                    {isLogin ? "Sign Up" : "Login"}
                  </button>
                </p>
              </>
            ) : (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-gray-300 text-sm underline"
              >
                Back to Login
              </button>
            )}
          </div>

          <button
            onClick={() => onPageChange("Home")}
            className="w-full mt-4 border border-gray-600 text-gray-300 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
