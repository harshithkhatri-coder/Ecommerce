import React from "react";
import { Award, Target, Users, Zap, Mail, Phone, Instagram } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-full bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900 text-gray-200">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-teal-500 text-white py-16 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About VELUX KICKS</h1>
          <p className="text-xl text-blue-100">
            Your trusted destination for premium products and exceptional service
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Who We Are */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-blue-400 mb-4">Who We Are</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We are a leading online retailer specializing in premium products and accessories.
              With over a decade of experience in the industry, we've served millions of satisfied customers worldwide.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Our commitment is to provide the best quality products at competitive prices with exceptional customer service.
            </p>
          </div>
          <div>
            <img
              src={require('./images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg')}
              alt="About Us"
              className="rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 object-cover w-full h-96"
            />
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div>
            <img
              src={require('./images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg')}
              alt="Mission"
              className="rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-105 object-cover w-full h-96"
            />
          </div>
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Target size={28} className="text-blue-400" />
                <h3 className="text-2xl font-bold text-blue-400">Our Mission</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                To revolutionize online shopping by offering cutting-edge products with unparalleled customer support and competitive pricing.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Zap size={28} className="text-purple-400" />
                <h3 className="text-2xl font-bold text-purple-400">Our Vision</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                To become the world's most customer-centric retailer where people can find and discover any product they want at the best prices.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-blue-400 mb-8">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Quality Products</h3>
              <p className="text-gray-400">
                We carefully curate all products to ensure the highest quality standards.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Best Prices</h3>
              <p className="text-gray-400">
                Competitive pricing with frequent discounts and special offers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Expert Support</h3>
              <p className="text-gray-400">
                Dedicated customer service team available 24/7 to assist you.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "Happy Customers", value: "500K+" },
            { label: "Products Sold", value: "2M+" },
            { label: "Years in Business", value: "10+" },
            { label: "Customer Satisfaction", value: "98%" },
          ].map((stat, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-blue-100">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-blue-400 mb-8">Get In Touch</h2>
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Mail size={24} />
              </div>
              <p className="text-gray-400 mb-2">Email Us</p>
              <a href="mailto: veluxkicks11@gmail.com" className="text-blue-400 hover:text-blue-300 transition font-semibold">
                veluxkicks11@gmail.com
              </a>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Phone size={24} />
              </div>
              <p className="text-gray-400 mb-2">Call Us</p>
              <a href="tel:+91-7676526644" className="text-blue-400 hover:text-blue-300 transition font-semibold">
                +91 7676526644
              </a>
            </div>
            <div className="text-center">
              <a href="https://www.instagram.com/veluxkicks/" target="_blank" rel="noopener noreferrer" className="inline-block">
                <div className="bg-pink-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 hover:bg-pink-700 transition cursor-pointer">
                  <Instagram size={24} />
                </div>
              </a>
              <p className="text-gray-400 mb-2">Instagram</p>
              <a href="https://www.instagram.com/veluxkicks/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition font-semibold">
                veluxkicks
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
