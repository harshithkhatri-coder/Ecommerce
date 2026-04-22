import React from "react";
import { X } from "lucide-react";

export const termsContent = `
  <h3 class="text-xl font-bold mb-4">Terms & Conditions</h3>
  <p class="mb-4"><strong>1. Acceptance of Terms</strong></p>
  <p class="mb-4">By accessing and using Velux Kicks, you accept and agree to be bound by the terms and provisions of this agreement.</p>
  
  <p class="mb-4"><strong>2. Use of Service</strong></p>
  <p class="mb-4">You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.</p>
  
  <p class="mb-4"><strong>3. Product Information</strong></p>
  <p class="mb-4">We strive to provide accurate product information. However, we do not warrant that product descriptions or other content is accurate, complete, reliable, current, or error-free.</p>
  
  <p class="mb-4"><strong>4. Pricing</strong></p>
  <p class="mb-4">All prices are in Indian Rupees (INR) and are subject to change without notice. We reserve the right to modify prices at any time.</p>
  
  <p class="mb-4"><strong>5. Orders and Payment</strong></p>
  <p class="mb-4">We accept various payment methods. By placing an order, you represent that the products ordered will be used in a lawful manner.</p>
  
  <p class="mb-4"><strong>6. Shipping and Delivery</strong></p>
  <p class="mb-4">Delivery times may vary based on location. We are not responsible for delays caused by shipping carriers or force majeure events.</p>
  
  <p class="mb-4"><strong>7. Returns and Refunds</strong></p>
  <p class="mb-4">Products can be returned within 15 days of delivery in original condition. Refunds will be processed within 7-10 business days.</p>
  
  <p class="mb-4"><strong>8. Intellectual Property</strong></p>
  <p class="mb-4">All content on this website is the property of Velux Kicks and is protected by copyright laws.</p>
  
  <p class="mb-4"><strong>9. Limitation of Liability</strong></p>
  <p class="mb-4">Velux Kicks shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.</p>
  
  <p class="mb-4"><strong>10. Governing Law</strong></p>
  <p class="mb-4">These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Mumbai, Maharashtra.</p>
`;

export const privacyContent = `
  <h3 class="text-xl font-bold mb-4">Privacy Policy</h3>
  
  <p class="mb-4"><strong>1. Information We Collect</strong></p>
  <p class="mb-4">We collect information you provide directly to us, including name, email address, phone number, shipping address, and payment information.</p>
  
  <p class="mb-4"><strong>2. How We Use Your Information</strong></p>
  <p class="mb-4">We use your information to process orders, provide services, communicate with you, improve our website, and for marketing purposes.</p>
  
  <p class="mb-4"><strong>3. Information Sharing</strong></p>
  <p class="mb-4">We do not sell or rent your personal information to third parties. We may share your information with service providers who assist in our operations.</p>
  
  <p class="mb-4"><strong>4. Data Security</strong></p>
  <p class="mb-4">We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.</p>
  
  <p class="mb-4"><strong>5. Cookies and Tracking</strong></p>
  <p class="mb-4">We use cookies to enhance your experience. You can disable cookies in your browser settings, but some features may not function properly.</p>
  
  <p class="mb-4"><strong>6. Third-Party Links</strong></p>
  <p class="mb-4">Our website may contain links to third-party websites. We are not responsible for the privacy practices of these websites.</p>
  
  <p class="mb-4"><strong>7. Children's Privacy</strong></p>
  <p class="mb-4">Our website is not intended for children under 18. We do not knowingly collect personal information from children.</p>
  
  <p class="mb-4"><strong>8. Your Rights</strong></p>
  <p class="mb-4">You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>
  
  <p class="mb-4"><strong>9. Policy Updates</strong></p>
  <p class="mb-4">We may update this policy periodically. Continued use of our services constitutes acceptance of any changes.</p>
  
  <p class="mb-4"><strong>10. Contact Us</strong></p>
  <p class="mb-4">For questions about this privacy policy, contact us at veluxkicks11@gmail.com</p>
`;

export default function LegalModal({ type, onClose }) {
  const getContent = () => {
    switch (type) {
      case 'terms':
        return { content: termsContent, title: 'Terms & Conditions' };
      case 'privacy':
        return { content: privacyContent, title: 'Privacy Policy' };
      default:
        return { content: '', title: '' };
    }
  };

  const { content, title } = getContent();

  if (!content) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>
        <div 
          className="p-6 text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
