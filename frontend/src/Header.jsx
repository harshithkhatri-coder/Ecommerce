import React, { useState } from "react";
import { ShoppingCart, User, Search, Menu, X, Moon, Sun, Mic } from "lucide-react";

const ADMIN_LOGIN_EMAIL = "admin@veluxkicks.com";

function isAdminUser(user) {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  return user.role === "admin" || email === ADMIN_LOGIN_EMAIL;
}

export default function Header({ currentPage, onPageChange, cartCount, user, onLogout, theme, onToggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

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
          onPageChange("Search", transcript);
        }
      };
      recognition.start();
    } catch (err) {
      console.error("Voice search error:", err);
      setIsListening(false);
    }
  };

  const baseNavItems = ["Home", "Products", "About"];
  const navItems = isAdminUser(user) ? [...baseNavItems, "Admin"] : baseNavItems;

  const isNavActive = (page) => {
    if (page === "Products") {
      return currentPage === "Products" || currentPage === "ProductDetails";
    }
    return currentPage === page;
  };

  return (
    <header className="bg-gray-950/95 backdrop-blur-md text-white shadow-xl sticky top-0 z-50 border-b border-gray-800/70 transition-colors duration-300">
      <div className="px-4 md:px-6 py-3 flex justify-between items-center gap-4">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo */}
          <button
            type="button"
            onClick={() => onPageChange("Home")}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          >
            <img
              src={require('./images/Logo.jpg')}
              alt="VELUX KICKS Logo"
              className="w-10 h-10 rounded-full border-2 border-orange-500/80 object-cover group-hover:scale-105 group-hover:border-orange-400 transition-all duration-300 shadow-md shadow-orange-500/20"
            />
            <span className="text-lg font-extrabold tracking-wide hidden sm:inline text-white group-hover:text-orange-400 transition-all duration-300">
              VELUX KICKS
            </span>

          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-gray-900/80 p-1.5 rounded-2xl border border-gray-800/80">
            {navItems.map((page) => {
              const active = isNavActive(page);
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`font-semibold text-sm transition-all duration-300 px-4 py-2 rounded-xl flex items-center gap-2 relative ${
                    active
                      ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 scale-[1.02] font-bold"
                      : "text-gray-300 hover:text-white hover:bg-white/10 active:scale-95"
                  }`}
                >
                  <span>{page}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side - Search, Cart and Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="theme-toggle rounded-xl p-2.5 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            {theme === "dark" ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-indigo-300" />}
          </button>

          <button
            onClick={() => onPageChange("Search")}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm border ${
              currentPage === "Search"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20 scale-[1.02]"
                : "bg-gray-900/80 text-gray-200 border-gray-800 hover:bg-gray-800 hover:border-gray-700 hover:text-white active:scale-95"
            }`}
          >
            <Search size={18} />
            <span className="hidden xs:inline">Search</span>
          </button>

          <button
            type="button"
            onClick={handleVoiceSearch}
            title={isListening ? "Listening..." : "Search by voice"}
            className={`flex items-center justify-center gap-1 p-2 md:px-3 rounded-xl border transition-all duration-300 active:scale-95 cursor-pointer ${
              isListening
                ? "bg-red-600 text-white border-red-500 animate-pulse shadow-lg shadow-red-500/50"
                : "border-gray-800 bg-gray-900/80 text-gray-300 hover:text-orange-400 hover:border-orange-500/50 hover:bg-gray-800"
            }`}
          >
            <Mic size={18} className={isListening ? "animate-bounce text-white" : ""} />
            {isListening && <span className="text-xs font-extrabold hidden sm:inline">Listening...</span>}
          </button>

          <button
            onClick={() => onPageChange("Cart")}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl cursor-pointer transition-all duration-300 font-semibold text-sm border relative ${
              currentPage === "Cart"
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20 scale-[1.02]"
                : "bg-gray-900/80 text-gray-200 border-gray-800 hover:bg-gray-800 hover:border-gray-700 hover:text-white active:scale-95"
            }`}
          >
            <ShoppingCart size={18} />
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold ml-0.5 shadow-sm">
              {cartCount}
            </span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => onPageChange("Profile")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all duration-300 font-semibold text-sm border ${
                  currentPage === "Profile"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20 scale-[1.02]"
                    : "bg-gray-900/80 text-gray-200 border-gray-800 hover:bg-gray-800 hover:border-gray-700 hover:text-white active:scale-95"
                }`}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || "User"} className="w-5 h-5 rounded-full object-cover border border-orange-400" />
                ) : (
                  <User size={18} />
                )}
                <span className="hidden sm:inline">{user.name}</span>
              </button>

            </div>
          ) : (
            <button
              onClick={() => onPageChange("Login")}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm border ${
                currentPage === "Login"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/20 scale-[1.02]"
                  : "bg-gradient-to-r from-gray-800 to-gray-900 text-white border-gray-700 hover:from-gray-700 hover:to-gray-800 active:scale-95 shadow-md"
              }`}
            >
              <User size={18} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-200 hover:text-white hover:bg-gray-800 transition-all duration-200"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800/80 bg-gray-950/95 backdrop-blur-lg px-3 py-3 space-y-1.5 shadow-2xl">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((page) => {
              const active = isNavActive(page);
              return (
                <button
                  key={page}
                  onClick={() => {
                    onPageChange(page);
                    setMobileMenuOpen(false);
                  }}
                  className={`font-semibold text-sm transition-all duration-200 px-4 py-3 rounded-xl text-left flex items-center justify-between ${
                    active
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25"
                      : "text-gray-300 hover:bg-gray-900 hover:text-white"
                  }`}
                >
                  <span>{page}</span>
                  {active && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </button>
              );
            })}

            <button
              onClick={() => {
                onPageChange("Search");
                setMobileMenuOpen(false);
              }}
              className={`font-semibold text-sm transition-all duration-200 px-4 py-3 rounded-xl text-left flex items-center gap-2.5 ${
                currentPage === "Search"
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25"
                  : "text-gray-300 hover:bg-gray-900 hover:text-white"
              }`}
            >
              <Search size={18} />
              <span>Search</span>
            </button>

            {user ? (
              <div className="px-4 py-3 rounded-xl text-left flex items-center gap-2.5 text-gray-400">
                <User size={18} />
                <span>{user.name}</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  onPageChange("Login");
                  setMobileMenuOpen(false);
                }}
                className={`font-semibold text-sm transition-all duration-200 px-4 py-3 rounded-xl text-left flex items-center gap-2.5 ${
                  currentPage === "Login"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25"
                    : "text-gray-300 hover:bg-gray-900 hover:text-white"
                }`}
              >
                <User size={18} />
                <span>Login</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
