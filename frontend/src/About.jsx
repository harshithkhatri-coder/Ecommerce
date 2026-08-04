import React from "react";
import { Award, Target, Users, Zap, Mail, Phone, Instagram } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-full bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-black text-white py-16 px-6 border-b border-gray-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-block px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-extrabold uppercase tracking-widest mb-3">
            ✨ Premium Experience
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight animated-banner-title drop-shadow-lg text-white">
            About VELUX KICKS
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto font-medium leading-relaxed">
            Your trusted destination for premium footwear, unmatched quality, and exceptional service.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Who We Are */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Who We Are</h2>
            <p className="text-gray-200 leading-relaxed mb-4 text-base md:text-lg">
              We are a leading online retailer specializing in premium products and accessories.
              With over a decade of experience in the industry, we've served millions of satisfied customers worldwide.
            </p>
            <p className="text-gray-200 leading-relaxed text-base md:text-lg">
              Our commitment is to provide the best quality products at competitive prices with exceptional customer service.
            </p>
          </div>
          <div className="flex justify-center items-center">
            <img
              src="/images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg"
              alt="About Us"
              className="rounded-xl shadow-2xl hover:shadow-orange-500/10 transition transform hover:scale-105 object-cover w-full h-96 max-w-lg border border-gray-800"
            />
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-center">
          <div className="flex justify-center items-center">
            <img
              src="/images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg"
              alt="Mission"
              className="rounded-xl shadow-2xl hover:shadow-orange-500/10 transition transform hover:scale-105 object-cover w-full h-96 max-w-lg border border-gray-800"
            />
          </div>
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                  <Target size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white">Our Mission</h3>
              </div>
              <p className="text-gray-200 leading-relaxed text-base">
                To revolutionize online shopping by offering cutting-edge products with unparalleled customer support and competitive pricing.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white">Our Vision</h3>
              </div>
              <p className="text-gray-200 leading-relaxed text-base">
                To become the world's most customer-centric retailer where people can find and discover any product they want at the best prices.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Why Choose Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Quality Products</h3>
              <p className="text-gray-300">
                We carefully curate all products to ensure the highest quality standards.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Best Prices</h3>
              <p className="text-gray-300">
                Competitive pricing with frequent discounts and special offers.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Expert Support</h3>
              <p className="text-gray-300">
                Dedicated customer service team available 24/7 to assist you.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { label: "Happy Customers", value: "500+" },
            { label: "Years in Business", value: "2+" },
            { label: "Customer Satisfaction", value: "99%" },
          ].map((stat, index) => (
            <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-xl hover:border-orange-500/30 transition">
              <p className="text-4xl font-extrabold text-orange-400 mb-1">{stat.value}</p>
              <p className="text-gray-200 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-16 shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-white mb-8">Get In Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <a href="mailto:veluxkicks11@gmail.com" className="inline-block group">
                <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500 group-hover:text-white transition cursor-pointer">
                  <Mail size={24} />
                </div>
              </a>
              <p className="text-gray-300 mb-1 font-semibold">Email Us</p>
              <a href="mailto:veluxkicks11@gmail.com" className="text-orange-400 hover:underline transition text-sm font-bold">
                veluxkicks11@gmail.com
              </a>
            </div>
            <div className="text-center">
              <a href="tel:+917676526644" className="inline-block group">
                <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500 group-hover:text-white transition cursor-pointer">
                  <Phone size={24} />
                </div>
              </a>
              <p className="text-gray-300 mb-1 font-semibold">Call Us</p>
              <a href="tel:+917676526644" className="text-orange-400 hover:underline transition text-sm font-bold">
                +91 76765 26644
              </a>
            </div>
            <div className="text-center">
              <a href="https://www.instagram.com/veluxkicks/" target="_blank" rel="noopener noreferrer" className="inline-block group">
                <div className="bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500 group-hover:text-white transition cursor-pointer">
                  <Instagram size={24} />
                </div>
              </a>
              <p className="text-gray-300 mb-1 font-semibold">Instagram</p>
              <a href="https://www.instagram.com/veluxkicks/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline transition text-sm font-bold">
                @veluxkicks
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
