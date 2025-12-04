// src/pages/admin/RestaurantManagement.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function RestaurantManagement() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchRestaurantData();
    }
  }, [user]);

  const fetchRestaurantData = async () => {
    try {
      const restaurantsRes = await api.get("/restaurants");
      const myRestaurant = restaurantsRes.data.find(
        (r) => r.owner_id === user.id
      );

      if (myRestaurant) {
        setRestaurant(myRestaurant);

        const menuRes = await api.get(
          `/restaurants/${myRestaurant.restaurant_id}/menu`
        );
        setMenuItems(menuRes.data);

        const catRes = await api.get(
          `/restaurants/${myRestaurant.restaurant_id}/categories`
        );
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(
        `/restaurants/${restaurant.restaurant_id}/menu`,
        newItem
      );
      fetchRestaurantData();
      setShowItemForm(false);
      setNewItem({
        name: "",
        description: "",
        price: "",
        category_id: "",
      });
    } catch (err) {
      alert("Failed to add menu item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (confirm("Delete this item?")) {
      try {
        await api.delete(
          `/restaurants/${restaurant.restaurant_id}/menu/${itemId}`
        );
        fetchRestaurantData();
      } catch (err) {
        alert("Failed to delete item");
      }
    }
  };

  if (!user || user.role !== "admin" || !restaurant) {
    navigate("/login");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">
        Manage {restaurant.name}
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Restaurant Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Rating</p>
            <p className="font-bold">
              {parseFloat(restaurant.rating).toFixed(1)} ⭐
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Reviews</p>
            <p className="font-bold">{restaurant.total_reviews}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Menu Items</h2>
          <button
            onClick={() => setShowItemForm(!showItemForm)}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            {showItemForm ? "Cancel" : "Add Item"}
          </button>
        </div>

        {showItemForm && (
          <form onSubmit={handleAddItem} className="mb-6 p-4 border rounded">
            <input
              type="text"
              placeholder="Item Name"
              value={newItem.name}
              onChange={(e) =>
                setNewItem({ ...newItem, name: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
              required
            />
            <textarea
              placeholder="Description"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) =>
                  setNewItem({ ...newItem, price: e.target.value })
                }
                className="p-2 border rounded"
                required
              />
              <select
                value={newItem.category_id}
                onChange={(e) =>
                  setNewItem({ ...newItem, category_id: e.target.value })
                }
                className="p-2 border rounded"
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Item
            </button>
          </form>
        )}

        <div className="space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.menu_item_id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-gray-600 text-sm">{item.description}</p>
                <p className="text-orange-600 font-bold">
                  {parseFloat(item.price).toFixed(2)} EGP
                </p>
              </div>
              <button
                onClick={() => handleDeleteItem(item.menu_item_id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
