// src/pages/admin/RestaurantManagement.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function RestaurantManagement() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image: null
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role === "restaurant_owner") {
      fetchRestaurantData();
    }
  }, [user]);

  const fetchRestaurantData = async () => {
    try {
      console.log('Fetching my restaurants...');
      setLoading(true);
      const restRes = await api.get("/restaurants/my");
      console.log('My restaurants:', restRes.data);

      if (restRes.data.length === 0) {
        console.warn('No restaurants for this owner');
        setError("You don't have any restaurants yet.");
        setLoading(false);
        return;
      }

      const myRest = restRes.data[0];
      setRestaurant(myRest);

      const [menuRes, catRes] = await Promise.all([
        api.get(`/restaurants/${myRest.restaurant_id}/menu`),
        api.get(`/restaurants/${myRest.restaurant_id}/categories`),
      ]);

      setMenuItems(menuRes.data);
      setCategories(catRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching restaurant data:', err);
      setError(err.response?.data?.message || 'Failed to load restaurant data');
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setNewItem({ ...newItem, image: file });
    
    // Show preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('description', newItem.description);
      formData.append('price', newItem.price);
      formData.append('category_id', newItem.category_id);
      if (newItem.image) {
        formData.append('image', newItem.image);
      }

      if (editingItem) {
        await api.put(`/menu-items/${editingItem.menu_item_id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/restaurants/${restaurant.restaurant_id}/menu`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowItemForm(false);
      setEditingItem(null);
      setNewItem({ name: "", description: "", price: "", category_id: "", image: null });
      setImagePreview(null);
      fetchRestaurantData();
    } catch (err) {
      console.error('Failed to save item:', err);
      alert('Failed to save item');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category_id: item.category_id,
      image: null
    });
    setImagePreview(item.image_url && item.image_url.startsWith('/uploads') ? `http://localhost:3000${item.image_url}` : null);
    setShowItemForm(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu-items/${itemId}`);
      fetchRestaurantData();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/restaurants/${restaurant.restaurant_id}/categories`, newCategory);
      setShowCategoryForm(false);
      setNewCategory({ name: "", description: "" });
      fetchRestaurantData();
    } catch (err) {
      alert('Failed to add category');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">No Restaurant Found</h2>
        <p className="text-gray-600">You don't have a restaurant registered yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Categories</h2>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {showCategoryForm ? "Cancel" : "Add Category"}
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={handleAddCategory} className="mb-4 p-4 border rounded">
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <textarea
              placeholder="Description"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Save Category
            </button>
          </form>
        )}

        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <span key={cat.category_id} className="px-3 py-1 bg-gray-200 text-gray-900 rounded">
              {cat.name}
            </span>
          ))}
        </div>
      </div>

      {/* Menu Items Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Menu Items</h2>
          <button
            onClick={() => {
              setShowItemForm(!showItemForm);
              setEditingItem(null);
              setNewItem({ name: "", description: "", price: "", category_id: "", image: null });
              setImagePreview(null);
            }}
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
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <textarea
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            />
            <select
              value={newItem.category_id}
              onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
              className="w-full p-2 border rounded mb-2"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Image Upload */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border rounded"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />
              )}
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {editingItem ? "Update Item" : "Save Item"}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {menuItems.map((item) => (
            <div key={item.menu_item_id} className="border rounded p-4 flex justify-between items-center">
              <div className="flex gap-4 items-center">
                {item.image_url && item.image_url.startsWith('/uploads') && (
                  <img
                    src={`http://localhost:3000${item.image_url}`}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.category_name}</p>
                  <p className="text-orange-600 font-semibold">{parseFloat(item.price).toFixed(2)} EGP</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditItem(item)}
                  className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.menu_item_id)}
                  className="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
