import { Link } from "react-router-dom";
import { Clock, Star, Phone } from "lucide-react";

export default function RestaurantCard({ restaurant }) {
  return (
    <Link to={`/restaurant/${restaurant.id}`} className="block">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-2">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-800">{restaurant.name}</h3>
          <p className="text-gray-600 text-sm mt-1">{restaurant.address}</p>
          <p className="text-gray-700 text-sm mt-2 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {restaurant.phone}
          </p>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {restaurant.opening_hours}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  restaurant.status === "open"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {restaurant.status === "open" ? "Open" : "Closed"}
              </span>
            </div>
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="mr-1 font-semibold">4.6</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
