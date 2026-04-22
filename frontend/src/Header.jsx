import React, { useState } from "react";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";

const ADMIN_LOGIN_EMAIL = "admin@veluxkicks.com";

function isAdminUser(user) {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  return user.role === "admin" || email === ADMIN_LOGIN_EMAIL;
}

export default function Header({ currentPage, onPageChange, cartCount, user, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const baseNavItems = ["Home", "Products", "About"];
  const navItems = isAdminUser(user) ? [...baseNavItems, "Admin"] : baseNavItems;

  return (
    <header className="bg-gray-950 text-white shadow-lg sticky top-0 z-50">
      <div className="px-4 md:px-6 py-3 flex justify-between items-center gap-4">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src={require('./images/Logo.jpg')}
              alt="VELUX KICKS Logo"
              className="w-10 h-10 rounded-full border-2 border-white object-cover"
            />
            <span className="text-lg font-bold hidden sm:inline">VELUX KICKS</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4">
            {navItems.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`font-semibold text-sm transition px-3 py-2 rounded ${
                  currentPage === page
                    ? "bg-white text-black"
                    : "text-white hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Side - Search, Cart and Profile */}
        <div className="flex items-center gap-2 md:gap-4">
            <button
            onClick={() => onPageChange("Search")}
            className="hidden sm:flex items-center gap-2 bg-gray-700 px-3 md:px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition font-semibold"
          >
            <Search size={20} />
            <span>Search</span>
          </button>
          <button
            onClick={() => onPageChange("Cart")}
            className="flex items-center gap-2 bg-gray-700 px-3 md:px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition font-semibold"
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline">{cartCount}</span>
            <span className="sm:hidden">{cartCount}</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => onPageChange("Profile")}
                className="flex items-center gap-2 text-white hover:text-gray-200 transition"
              >
                <User size={20} />
                <span className="hidden sm:inline font-semibold">{user.name}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onPageChange("Login")}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 rounded-lg hover:shadow-lg transition font-semibold"
            >
              <User size={20} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-700 transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800">
          <nav className="flex flex-col py-2">
            {navItems.map((page) => (
              <button
                key={page}
                onClick={() => {
                  onPageChange(page);
                  setMobileMenuOpen(false);
                }}
                className={`font-semibold text-sm transition px-4 py-3 text-left ${
                  currentPage === page
                    ? "bg-white text-black"
                    : "text-white hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}            <button
              onClick={() => {
                onPageChange("Search");
                setMobileMenuOpen(false);
              }}
              className="font-semibold text-sm transition px-4 py-3 text-left text-white hover:bg-gray-800 flex items-center gap-2"
            >
              <Search size={18} />
              Search
            </button>            {!user && (
              <button
                onClick={() => {
                  onPageChange("Login");
                  setMobileMenuOpen(false);
                }}
              className="font-semibold text-sm transition px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <User size={18} />
                Login
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
