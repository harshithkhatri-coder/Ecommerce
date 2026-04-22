import React, { useState } from 'react';

const TrackOrder = () => {
  const [trackingId, setTrackingId] = useState("");

  const openTrackingSearch = () => {
    if (!trackingId.trim()) {
      alert("Please enter your tracking number or order ID.");
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(`track package ${trackingId.trim()}`)}`;
    window.open(url, '_blank');
  };
  return (
    <div className="space-y-6 text-gray-700">
      <h2 className="text-2xl font-bold text-gray-900">Track Your Order</h2>
      <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
        <label htmlFor="tracking-id" className="block text-sm font-semibold text-gray-700 mb-2">
          Enter your Order ID or Tracking Number
        </label>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            id="tracking-id"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="VK-123456789 or order id"
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-gray-400 outline-none"
          />
          <button
            onClick={openTrackingSearch}
            className="rounded-2xl bg-gradient-to-r from-gray-700 to-gray-800 text-white px-5 py-3 font-semibold hover:shadow-lg transition"
          >
            Track Package
          </button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">How to Track Your Order</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Log in to your account on Velux Kicks</li>
          <li>Go to "My Orders" section in your profile</li>
          <li>Click on the order you want to track</li>
          <li>View the tracking number and click "Track Package"</li>
          <li>You will be redirected to the courier partner's tracking page</li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Statuses</h3>
        <div className="space-y-3 mt-2">
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-500 mr-3"></span>
            <div>
              <p className="font-medium">Order Placed</p>
              <p className="text-sm text-gray-500">Your order has been confirmed and is awaiting processing</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-400 mr-3"></span>
            <div>
              <p className="font-medium">Processing</p>
              <p className="text-sm text-gray-500">Your order is being prepared for shipment</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-500 mr-3"></span>
            <div>
              <p className="font-medium">Shipped</p>
              <p className="text-sm text-gray-500">Your package has been handed over to the courier</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-500 mr-3"></span>
            <div>
              <p className="font-medium">In Transit</p>
              <p className="text-sm text-gray-500">Your package is on its way to your location</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-500 mr-3"></span>
            <div>
              <p className="font-medium">Out for Delivery</p>
              <p className="text-sm text-gray-500">The package is with the delivery executive</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 rounded-full bg-gray-600 mr-3"></span>
            <div>
              <p className="font-medium">Delivered</p>
              <p className="text-sm text-gray-500">Your package has been delivered successfully</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Tracking Number Format</h3>
        <p>Your tracking number will be in one of these formats:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>VK-XXXXXXXXX (12 digits)</li>
          <li>DX-XXXXXXXXX (for Delhivery shipments)</li>
          <li>FD-XXXXXXXXX (for FedEx shipments)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Not Received Tracking Info?</h3>
        <p>If you haven't received your tracking information within 48 hours of placing your order, please:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Check your email spam/junk folder</li>
          <li>Log in to your account to check order status</li>
          <li>Contact our customer support team</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delayed Shipments</h3>
        <p>While we strive to deliver on time, occasional delays may occur due to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Weather conditions affecting transportation</li>
          <li>Local courier delays</li>
          <li>High order volumes during sales</li>
          <li>Customs clearance (for applicable orders)</li>
        </ul>
        <p className="mt-2">We recommend waiting 2-3 business days beyond the estimated delivery date before contacting support.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Lost or Damaged Packages</h3>
        <p>If your package is lost or arrives damaged:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Take photos of the damaged package immediately</li>
          <li>Contact us within 48 hours of delivery</li>
          <li>We will initiate an investigation with the courier</li>
          <li>Eligible for full refund or replacement</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Us</h3>
        <p>For tracking-related support:</p>
        <p className="mt-1">Email: support@veluxkicks.com</p>
        <p>Phone: +91 98765 43210</p>
        <p>WhatsApp: +91 98765 43210</p>
      </div>
    </div>
  );
};

export default TrackOrder;
