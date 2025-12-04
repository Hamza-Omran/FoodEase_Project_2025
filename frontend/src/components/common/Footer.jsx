export default function Footer() {
  return (
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
              <a href="#" className="hover:text-orange-500">
                About Foodie
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500">
                Join as a Restaurant
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-orange-500">
                Terms and Conditions
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Contact Us</h4>
          <p className="text-gray-400">support@foodie.eg</p>
          <p className="text-gray-400">010-2222-8888</p>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8 text-gray-500 text-sm">
        © 2025 Foodie. All rights reserved
      </div>
    </footer>
  );
}
