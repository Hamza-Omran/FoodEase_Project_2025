import RestaurantCard from "./RestaurantCard";
import dummyData from "../../services/data";

export default function RestaurantList() {
  const restaurants = dummyData.restaurants;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} restaurant={restaurant} />
      ))}
    </div>
  );
}
