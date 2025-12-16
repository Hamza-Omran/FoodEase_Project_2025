import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

export default function Footer() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  const AboutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">About Foodie</h2>
          <button
            onClick={() => setShowAboutModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="p-6 text-gray-700">
          <p className="mb-4">
            <strong className="text-orange-600">Foodie</strong> is Egypt's premier food delivery platform, connecting food lovers with their favorite restaurants and cuisines.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Our Mission</h3>
          <p className="mb-4">
            We're committed to bringing delicious meals from the best restaurants directly to your doorstep, making quality food accessible to everyone across Egypt.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">What We Offer</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>Wide selection of restaurants and cuisines</li>
            <li>Fast and reliable delivery service</li>
            <li>Easy-to-use platform for ordering</li>
            <li>Secure payment options</li>
            <li>Real-time order tracking</li>
            <li>24/7 customer support</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">Why Choose Foodie?</h3>
          <p className="mb-4">
            With thousands of satisfied customers and hundreds of partner restaurants, Foodie has become the trusted choice for food delivery in Egypt. Our commitment to quality, speed, and customer satisfaction sets us apart.
          </p>

          <div className="bg-orange-50 p-4 rounded-lg mt-6">
            <p className="text-orange-800 font-semibold">
              Join thousands of happy customers and enjoy the best food delivery experience in Egypt!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const PartnershipModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Partner with Foodie</h2>
          <button
            onClick={() => setShowPartnerModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="p-6 text-gray-700">
          <div className="bg-orange-50 p-4 rounded-lg mb-6">
            <h3 className="text-xl font-bold text-orange-800 mb-2">Grow Your Restaurant Business with Foodie!</h3>
            <p className="text-orange-700">Join Egypt's leading food delivery platform and reach thousands of hungry customers.</p>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Why Partner with Us?</h3>
          <ul className="list-disc list-inside space-y-2 mb-6">
            <li><strong>Increased Visibility:</strong> Reach a wider audience across Egypt</li>
            <li><strong>Easy Integration:</strong> Simple setup and management tools</li>
            <li><strong>Marketing Support:</strong> Featured promotions and campaigns</li>
            <li><strong>Real-time Orders:</strong> Instant notifications and order management</li>
            <li><strong>Flexible Commission:</strong> Competitive rates tailored to your needs</li>
            <li><strong>Dedicated Support:</strong> 24/7 partner assistance</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Partnership Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Boost Sales</h4>
              <p className="text-sm">Increase your revenue with our large customer base</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Easy Management</h4>
              <p className="text-sm">User-friendly dashboard for orders and menu</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Fast Delivery</h4>
              <p className="text-sm">Reliable delivery network across Egypt</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-gray-900 mb-2">Transparent Pricing</h4>
              <p className="text-sm">No hidden fees, clear commission structure</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">Get Started Today</h3>
          <p className="mb-4">
            Ready to join Foodie and grow your restaurant business? Contact our partnership team and we'll guide you through a simple onboarding process.
          </p>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg text-center">
            <h4 className="text-xl font-bold mb-3">Contact Our Partnership Team</h4>
            <p className="mb-4">Email us to start your journey with Foodie</p>
            <a
              href="mailto:partner@foodie.eg?subject=Restaurant Partnership Inquiry&body=Hello Foodie Team,%0D%0A%0D%0AI am interested in partnering my restaurant with Foodie.%0D%0A%0D%0ARestaurant Name: %0D%0ALocation: %0D%0APhone: %0D%0A%0D%0APlease contact me to discuss the partnership.%0D%0A%0D%0AThank you!"
              className="inline-block bg-white text-orange-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Send Partnership Email
            </a>
            <p className="text-sm mt-3 opacity-90">or call us at: 010-2222-8888</p>
          </div>
        </div>
      </div>
    </div>
  );

  const TermsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
          <button
            onClick={() => setShowTermsModal(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="p-6 text-gray-700">
          <p className="text-sm text-gray-500 mb-6">Last Updated: January 2025</p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h3>
          <p className="mb-4">
            By accessing and using Foodie's services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">2. Service Description</h3>
          <p className="mb-4">
            Foodie provides an online platform connecting customers with restaurants for food ordering and delivery services. We act as an intermediary between customers and restaurants.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">3. User Responsibilities</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>Provide accurate delivery information</li>
            <li>Make payment for orders placed</li>
            <li>Be available to receive deliveries</li>
            <li>Treat delivery personnel with respect</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-3">4. Orders and Payments</h3>
          <p className="mb-4">
            All orders are subject to availability and confirmation. Prices are subject to change without notice. Payment must be made at the time of ordering or upon delivery, depending on the payment method selected.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">5. Delivery</h3>
          <p className="mb-4">
            Delivery times are estimates and may vary. Foodie is not responsible for delays caused by factors beyond our control. A delivery fee may apply based on distance and restaurant policies.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">6. Cancellations and Refunds</h3>
          <p className="mb-4">
            Orders may be cancelled before restaurant confirmation. Refunds are processed according to our refund policy. Food quality issues should be reported within 24 hours.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">7. Privacy</h3>
          <p className="mb-4">
            We respect your privacy and protect your personal information. Please refer to our Privacy Policy for details on how we collect and use your data.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h3>
          <p className="mb-4">
            For questions about these terms, please contact us at support@foodie.eg or call 010-2222-8888.
          </p>

          <div className="bg-gray-100 p-4 rounded-lg mt-6">
            <p className="text-sm text-gray-700">
              These terms are subject to change. Continued use of our services constitutes acceptance of any modifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-orange-500 mb-4">Foodie</h3>
            <p className="text-gray-400">
              the best food delivery service in Egypt, bringing your favorite meals right to your doorstep.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="hover:text-orange-500 transition-colors"
                >
                  About Foodie
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowPartnerModal(true)}
                  className="hover:text-orange-500 transition-colors"
                >
                  Join as a Restaurant
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-orange-500 transition-colors"
                >
                  Terms and Conditions
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <a
              href="mailto:support@foodie.eg"
              className="text-gray-400 hover:text-orange-500 transition-colors block mb-2"
            >
              support@foodie.eg
            </a>
            <a
              href="tel:+20102228888"
              className="text-gray-400 hover:text-orange-500 transition-colors block"
            >
              010-2222-8888
            </a>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
                title="Facebook"
              >
                f
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-700 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors text-sm font-bold"
                title="Twitter"
              >
                𝕏
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-gray-500 text-sm">
          © 2025 Foodie. All rights reserved
        </div>
      </footer>

      {showAboutModal && <AboutModal />}
      {showPartnerModal && <PartnershipModal />}
      {showTermsModal && <TermsModal />}
    </>
  );
}
