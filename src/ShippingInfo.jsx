import React from 'react';

const ShippingInfo = () => {
  return (
    <div className="space-y-6 text-gray-700">
      <h2 className="text-2xl font-bold text-gray-900">Shipping Information</h2>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping Rates</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Standard Shipping: ₹99 (Free for orders above ₹500)</li>
          <li>Express Shipping: ₹199 (Delivered in 2-3 business days)</li>
          <li>Free Shipping on all orders above ₹500</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivery Timeframe</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Standard Shipping: 5-7 business days</li>
          <li>Express Shipping: 2-3 business days</li>
          <li>Metro cities may receive deliveries faster</li>
          <li>Rural and remote areas may take additional 2-3 days</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Processing</h3>
        <p>Orders are typically processed within 24 hours of placement. You will receive a confirmation email with your order details and tracking information once your order is shipped.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping Partners</h3>
        <p>We partner with reliable courier services including FedEx, DHL, Blue Dart, and Delhivery to ensure safe and timely delivery of your orders.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Tracking Your Order</h3>
        <p>Once your order is shipped, you will receive a tracking number via email and SMS. You can track your order using:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>The tracking link in your shipping confirmation email</li>
          <li>Entering your tracking number on our website's Track Order page</li>
          <li>Downloading our mobile app for real-time updates</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivery Attempts</h3>
        <p>Our courier partners will make up to 2 delivery attempts. If delivery is unsuccessful, you will receive a notification. Please contact us within 48 hours to reschedule delivery or arrange for pickup from the local courier hub.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Shipping Restrictions</h3>
        <p>We currently ship to all locations within India. International shipping is not available at this time. Some remote areas may have delivery limitations.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Incorrect Address</h3>
        <p>Please ensure your shipping address is accurate and complete. If an order is returned due to an incorrect address, we will contact you to verify the correct address. Additional shipping charges may apply for reshipment.</p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Us</h3>
        <p>For any shipping-related queries, please contact us at:</p>
        <p className="mt-1">Email: support@veluxkicks.com</p>
        <p>Phone: +91 98765 43210</p>
      </div>
    </div>
  );
};

export default ShippingInfo;
