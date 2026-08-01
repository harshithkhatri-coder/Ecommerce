import React from "react";
import { Home, Package, Search, ShoppingCart, User } from "lucide-react";

export default function MobileBottomNav({ currentPage, onPageChange, cartCount }) {
  const isNavActive = (page) => {
    if (page === "Products") {
      return currentPage === "Products" || currentPage === "ProductDetails";
    }
    return currentPage === page;
  };

  const navItems = [
    { name: "Home", page: "Home", icon: Home },
    { name: "Products", page: "Products", icon: Package },
    { name: "Search", page: "Search", icon: Search },
    { name: "Cart", page: "Cart", icon: ShoppingCart, badge: cartCount },
    { name: "Profile", page: "Profile", icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-950/95 border-t border-gray-800 backdrop-blur-lg px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(item.page);

          return (
            <button
              key={item.name}
              onClick={() => onPageChange(item.page)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                active
                  ? "text-orange-500 scale-105 font-bold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="relative">
                <Icon size={20} className={active ? "text-orange-500 stroke-[2.5]" : "text-gray-400"} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{item.name}</span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-orange-500 mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
