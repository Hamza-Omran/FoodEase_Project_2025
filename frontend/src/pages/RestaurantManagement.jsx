// src/pages/admin/RestaurantManagement.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { restaurantAPI, menuAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RestaurantManagement() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (user && user.role === "restaurant_owner") {
      fetchRestaurantData();
    }
  }, [user]);


  useEffect(() => {
    if (restaurant) {
      fetchMenuItems();
      fetchCategories();
    }
  }, [restaurant]);

  const fetchRestaurantData = async () => {
    try {
      const myRestaurantsRes = await restaurantAPI.getMy();

      if (!myRestaurantsRes.data || myRestaurantsRes.data.length === 0) {
        setLoading(false);
        return;
      }

      const myRestaurant = myRestaurantsRes.data[0];
      setRestaurant(myRestaurant);

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      if (!restaurant) {
        return;
      }

      const response = await menuAPI.getMenuItems(restaurant.restaurant_id);
      setMenuItems(response.data || []);
    } catch (err) {
    }
  };

  const fetchCategories = async () => {
    try {
      if (!restaurant) {
        return;
      }

      const response = await menuAPI.getCategories(restaurant.restaurant_id);
      setCategories(response.data || []);
    } catch (err) {
    }
  };


  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    return `${baseUrl}/${cleanPath}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem({ ...newItem, image: file });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {

      if (!newItem.name || !newItem.price) {
        alert('Name and price are required');
        return;
      }


      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('description', newItem.description || '');
      formData.append('price', parseFloat(newItem.price));

      if (newItem.category_id) {
        formData.append('category_id', parseInt(newItem.category_id));
      }


      if (newItem.image) {
        formData.append('image', newItem.image);
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const response = await axios.post(
        `${API_URL}/restaurants/${restaurant.restaurant_id}/menu`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );


      alert('Menu item added successfully!');
      setShowItemForm(false);
      setNewItem({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image: null
      });
      setImagePreview(null);
      fetchMenuItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category_id: item.category_id || "",
      image: null
    });
    setImagePreview(getImageUrl(item.image_url));
    setShowItemForm(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {


      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('description', newItem.description || '');
      formData.append('price', parseFloat(newItem.price));

      if (newItem.category_id) {
        formData.append('category_id', parseInt(newItem.category_id));
      }


      if (newItem.image) {
        formData.append('image', newItem.image);
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const response = await axios.put(
        `${API_URL}/restaurants/${restaurant.restaurant_id}/menu/${editingItem.menu_item_id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );


      alert('Menu item updated!');
      setShowItemForm(false);
      setEditingItem(null);
      setNewItem({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image: null
      });
      setImagePreview(null);
      fetchMenuItems();
    } catch (err) {
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Delete this item?')) return;
    try {
      await menuAPI.deleteItem(restaurant.restaurant_id, itemId);
      alert('Item deleted!');
      fetchMenuItems();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await menuAPI.createCategory(restaurant.restaurant_id, newCategory);
      alert('Category added!');
      setShowCategoryForm(false);
      setNewCategory({ name: "", description: "" });
      fetchCategories();
    } catch (err) {
      alert('Failed to add category');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">No Restaurant Found</h2>
        <p className="text-gray-900 mb-6">Create your restaurant to start managing menu items.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Categories Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Categories</h3>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
            >
              {showCategoryForm ? "Cancel" : "Add Category"}
            </button>
          </div>

          {showCategoryForm && (
            <form onSubmit={handleAddCategory} className="mb-6 p-4 border rounded-lg bg-gray-50">
              <input
                type="text"
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3 text-black placeholder-gray-500"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3 text-black placeholder-gray-500"
                rows="2"
              />
              <button
                type="submit"
                className="bg-orange-600 text-black px-6 py-2 rounded-lg hover:bg-orange-700"
              >
                Save Category
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.category_id} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold text-lg text-black">{cat.name}</h4>
                <p className="text-sm text-gray-900">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-orange-600">Menu Items</h3>
            <button
              onClick={() => {
                setEditingItem(null);
                setNewItem({
                  name: "",
                  description: "",
                  price: "",
                  category_id: "",
                  image: null
                });
                setImagePreview(null);
                setShowItemForm(true);
              }}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700"
            >
              Add Menu Item
            </button>
          </div>

          {showItemForm && (
            <form
              onSubmit={editingItem ? handleUpdateItem : handleAddItem}
              className="mb-8 p-6 border rounded-lg bg-gray-50"
            >
              <h4 className="text-xl font-bold mb-4 text-black">
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </h4>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  Item Image
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full p-2 border rounded-lg text-black"
                    />
                    <p className="text-xs text-gray-900 mt-1">
                      Upload an image (PNG, JPG, JPEG - max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3 text-black placeholder-gray-500"
                required
              />

              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3 text-black placeholder-gray-500"
                rows="3"
              />

              <input
                type="number"
                step="0.01"
                placeholder="Price (EGP)"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3 text-black placeholder-gray-500"
                required
              />

              <select
                value={newItem.category_id}
                onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                className="w-full p-3 border rounded-lg mb-3 text-black"
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-orange-600 text-black px-6 py-2 rounded-lg hover:bg-orange-700"
                >
                  {editingItem ? "Update Item" : "Add Item"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowItemForm(false);
                    setEditingItem(null);
                    setImagePreview(null);
                  }}
                  className="bg-gray-900 text-orange-500 px-6 py-2 rounded-lg hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <div key={item.menu_item_id} className="border rounded-lg p-4 hover:shadow-lg transition bg-white">
                {item.image_url ? (
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"

                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
                <h4 className="font-bold text-lg mb-2 text-black">{item.name}</h4>
                <p className="text-gray-900 text-sm mb-2">{item.category_name}</p>
                <p className="text-orange-600 font-bold text-xl mb-4">
                  {parseFloat(item.price).toFixed(2)} EGP
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditItem(item)}
                    className="flex-1 bg-orange-600 text-black px-4 py-2 rounded hover:bg-orange-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.menu_item_id)}
                    className="flex-1 bg-gray-900 text-orange-500 px-4 py-2 rounded hover:bg-gray-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
