import React, { useState, useEffect } from "react";
import Header from "./Header";
import Home from "./Home";
import About from "./About";
import Products from "./Products";
import ProductDetails from "./ProductDetails";
import Cart from "./Cart";
import Login from "./Login";
import Profile from "./Profile";
import Admin from "./Admin";
import Footer from "./Footer";
import SearchPage from "./SearchPage";
import AddAddress from "./AddAddress";
import ResetPassword from "./ResetPassword";
import './App.css';

function loadStoredUser() {
  const savedUser = localStorage.getItem("user");
  const savedAdminUser = localStorage.getItem("adminUser");

  try {
    if (savedAdminUser) {
      const parsedAdmin = JSON.parse(savedAdminUser);
      if (parsedAdmin?.role === "admin") return parsedAdmin;
    }
  } catch (error) {
    localStorage.removeItem("adminUser");
  }

  try {
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    localStorage.removeItem("user");
    return null;
  }
}

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const resetTokenFromUrl = query.get("token") || "";
  const initialPageFromUrl = query.get("page") === "reset-password" ? "ResetPassword" : "Home";
  const [currentPage, setCurrentPage] = useState("Home");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(() => loadStoredUser());
  const [resetToken, setResetToken] = useState(resetTokenFromUrl);

  useEffect(() => {
    if (initialPageFromUrl === "ResetPassword" && resetTokenFromUrl) {
      setCurrentPage("ResetPassword");
      setResetToken(resetTokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for localStorage changes (login/logout from other tabs or Login component)
  useEffect(() => {
    const handleUserChange = () => {
      setUser(loadStoredUser());
    };
    
    // Listen for storage events from other tabs
    window.addEventListener("storage", handleUserChange);
    
    // Listen for custom event from same-tab login
    window.addEventListener("userLoggedIn", handleUserChange);
    window.addEventListener("adminLoggedIn", handleUserChange);
    
    return () => {
      window.removeEventListener("storage", handleUserChange);
      window.removeEventListener("userLoggedIn", handleUserChange);
      window.removeEventListener("adminLoggedIn", handleUserChange);
    };
  }, []);

  // Check if user is admin (derived from user state)
  const isAdmin = user?.role === "admin";

  const addToCart = (product, options = {}) => {
    // Calculate current total items in cart
    const currentTotalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const MAX_ITEMS = 5;

    // Check if adding one more item would exceed the limit
    if (currentTotalItems >= MAX_ITEMS) {
      alert(`You can only add up to ${MAX_ITEMS} items to your cart. Please checkout or remove items to add more.`);
      return;
    }

    // Check if product already exists in cart
    const existingIndex = cart.findIndex(
      (item) => (item._id || item.id) === (product._id || product.id)
    );

    let updatedCart = [...cart];
    if (existingIndex >= 0) {
      const currentQty = updatedCart[existingIndex].quantity || 1;

      // Check if we can add more of this item
      if (currentTotalItems + 1 > MAX_ITEMS) {
        alert(`You can only add up to ${MAX_ITEMS} items total. You've reached the limit.`);
        return;
      }

      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: currentQty + 1
      };
    } else {
      // Product doesn't exist, add with quantity 1
      updatedCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(updatedCart);
    if (!options.silent) {
      alert("Product added to cart");
    }
  };

  const handlePageChange = (page, productId = null) => {
    setCurrentPage(page);
    setSelectedProductId(productId);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  // Unified logout function - clears all auth
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    setUser(null);
    handlePageChange("Home");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "Home":
        return <Home cart={cart} onAddToCart={addToCart} onPageChange={handlePageChange} />;
      case "About":
        return <About />;
      case "Products":
        return <Products onAddToCart={addToCart} onPageChange={handlePageChange} />;
      case "ProductDetails":
        return <ProductDetails productId={selectedProductId} onPageChange={handlePageChange} onAddToCart={addToCart} />;
      case "Cart":
        return <Cart cart={cart} setCart={setCart} onRemoveFromCart={removeFromCart} onPageChange={handlePageChange} user={user} />;
      case "Login":
        return <Login onPageChange={handlePageChange} />;
      case "Profile":
        return <Profile onPageChange={handlePageChange} />;
      case "AddAddress":
        return <AddAddress onPageChange={handlePageChange} user={user} />;
      case "ResetPassword":
        return <ResetPassword token={resetToken} onPageChange={handlePageChange} />;
      case "Search":
        return <SearchPage searchQuery="" onPageChange={handlePageChange} onAddToCart={addToCart} />;
      case "Admin":
        return <Admin onPageChange={handlePageChange} onLogout={handleLogout} />;
      case "Contact":
        return (
          <div className="min-h-full bg-gradient-to-b from-gray-50 via-gray-100 to-white flex items-center justify-center py-12">
            <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-md w-full">
              <h2 className="text-3xl font-bold text-white mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For any inquiries or support, please reach out to us:
              </p>
               <div className="space-y-3 text-white">
                <p><strong>Email:</strong> support@veluxkicks.com</p>
                <p><strong>Phone:</strong> +1 (800) 123-4567</p>
                <p><strong>Address:</strong> 123 Commerce Street, Business City, BC 12345</p>
              </div>
            </div>
          </div>
        );
      default:
        return <Home cart={cart} onAddToCart={addToCart} onPageChange={handlePageChange} />;
    }
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black flex flex-col">
      {/* Header with Navigation */}
      <Header 
        currentPage={currentPage} 
        onPageChange={handlePageChange}
        cartCount={cart.length}
        user={user}
        onLogout={handleLogout}
      />

      {/* Page Content - grows to fill available space */}
      <div className="flex-grow">
        {renderPage()}
      </div>

      {/* Footer */}
      <Footer onPageChange={handlePageChange} />
    </div>
  );
}
