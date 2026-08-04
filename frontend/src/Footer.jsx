import React, { useState } from "react";
import { Mail, Phone, Instagram, X } from "lucide-react";
import Logo from "./images/Logo.jpg";
import LegalModal from "./LegalPages";
import ShippingInfo from "./ShippingInfo";

export default function Footer({ onPageChange }) {
  const currentYear = new Date().getFullYear();
  const [showModal, setShowModal] = useState(null);

  const openModal = (type) => {
    setShowModal(type);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <>
      <footer className="bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-200 pt-8 md:pt-12 pb-6 mt-8 md:mt-12 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            {/* About Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <img
                  src={Logo}
                  alt="VELUX KICKS Logo"
                  className="w-12 h-12 rounded-full border-2 border-gray-400 object-cover"
                />
                <h3 className="text-white text-lg font-bold">VELUX KICKS</h3>
              </div>
               <p className="text-white text-sm leading-relaxed mb-4">
                Your trusted destination for premium products and exceptional customer service.
              </p>
              <div className="flex gap-3">
                <a href="https://www.instagram.com/veluxkicks/" target="_blank" rel="noopener noreferrer" className="inline-block">
                   <div className="bg-gray-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 hover:bg-gray-700 transition cursor-pointer">
                    <Instagram size={24} />
                  </div>
                </a>
                 <a href="https://www.instagram.com/veluxkicks/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition font-semibold">
                  veluxkicks
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                   <button
                     type="button"
                     onClick={() => onPageChange && onPageChange("Home")}
                     className="text-gray-300 hover:text-white transition"
                   >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onPageChange && onPageChange("About")}
                    className="text-gray-300 hover:text-white transition"
                  >
                    About Us
                  </button>
                </li>
                <li>
                   <button
                     type="button"
                     onClick={() => onPageChange && onPageChange("Products")}
                     className="text-gray-300 hover:text-white transition"
                   >
                     Products
                   </button>
                 </li>
                 <li>
                   <button
                     type="button"
                     onClick={() => onPageChange && onPageChange("Coupons")}
                     className="text-gray-300 hover:text-white transition"
                   >
                     Coupons
                   </button>
                 </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => openModal('shipping')}
                    className="text-gray-300 hover:text-white transition"
                  >
                    Shipping Info
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openModal('privacy')}
                    className="text-gray-300 hover:text-white transition"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openModal('terms')}
                    className="text-gray-300 hover:text-white transition"
                  >
                    Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
              <div className="space-y-3 text-sm">
                <a
                  href="mailto:veluxkicks11@gmail.com"
                  className="flex items-start gap-3 text-white hover:text-gray-300 transition group"
                >
                  <Mail size={18} className="text-gray-400 group-hover:text-white mt-1 flex-shrink-0 transition" />
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <span className="font-medium underline underline-offset-2">veluxkicks11@gmail.com</span>
                  </div>
                </a>
                <a
                  href="tel:+917676526644"
                  className="flex items-start gap-3 text-white hover:text-gray-300 transition group"
                >
                  <Phone size={18} className="text-gray-400 group-hover:text-white mt-1 flex-shrink-0 transition" />
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <span className="font-medium underline underline-offset-2">+91 76765 26644</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 py-6"></div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-center text-sm text-gray-400">
            <p className="text-center">&copy; {currentYear} Velux Kicks. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Legal Modal Popup */}
      {showModal === 'shipping' && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Shipping Information</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <ShippingInfo />
            </div>
          </div>
        </div>
      )}
      {(showModal === 'privacy' || showModal === 'terms') && (
        <LegalModal type={showModal} onClose={closeModal} />
      )}
    </>
  );
}
