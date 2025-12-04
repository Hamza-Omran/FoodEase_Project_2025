import MenuItem from "./Menuitem";
import dummyData from "../../services/data";
import { useParams } from "react-router-dom";

export default function MenuList() {
  const { id } = useParams();
  const restaurantId = parseInt(id);

  const restaurant = dummyData.restaurants.find((r) => r.id === restaurantId);
  const menuItems = dummyData.menu_food.filter(
    (item) => item.restaurant_id === restaurantId
  );

  if (!restaurant)
    return <div className="text-center py-20 text-2xl">Restaurant not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          {restaurant.name}
        </h1>
        <p className="text-xl text-gray-600">
          {restaurant.address} • {restaurant.opening_hours}
        </p>
        <span
          className={`inline-block mt-4 px-6 py-2 rounded-full text-lg font-medium ${
            restaurant.status === "open"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {restaurant.status === "open" ? "Open Now" : "Closed"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {menuItems.map((item) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
