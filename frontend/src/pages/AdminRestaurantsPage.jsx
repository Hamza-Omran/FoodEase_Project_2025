import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminRestaurantsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [formData, setFormData] = useState({
        owner_email: '',
        owner_password: '',
        owner_name: '',
        owner_phone: '',
        name: '',
        description: '',
        phone: '',
        email: '',
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        opening_time: '10:00',
        closing_time: '23:00',
        delivery_fee: '20',
        minimum_order: '50',
        cuisine_type: ''
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchRestaurants();
    }, [user]);

    const fetchRestaurants = async () => {
        try {
            const response = await api.get('/admin/restaurants');
            setRestaurants(response.data);
            setLoading(false);
        } catch (err) {

            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingRestaurant) {
                await api.put(`/admin/restaurants/${editingRestaurant.restaurant_id}`, formData);
                alert('Restaurant updated successfully!');
            } else {
                await api.post('/admin/restaurants', formData);
                alert('Restaurant created successfully!');
            }
            setShowModal(false);
            setEditingRestaurant(null);
            resetForm();
            fetchRestaurants();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save restaurant');
        }
    };

    const handleEdit = (restaurant) => {
        setEditingRestaurant(restaurant);
        setFormData({
            name: restaurant.name,
            description: restaurant.description || '',
            phone: restaurant.phone,
            email: restaurant.email,
            street_address: restaurant.street_address,
            city: restaurant.city,
            state: restaurant.state || '',
            postal_code: restaurant.postal_code || '',
            opening_time: restaurant.opening_time,
            closing_time: restaurant.closing_time,
            delivery_fee: restaurant.delivery_fee,
            minimum_order: restaurant.minimum_order,
            cuisine_type: restaurant.cuisine_type || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will delete the restaurant and its owner account.')) return;
        try {
            await api.delete(`/admin/restaurants/${id}`);
            alert('Restaurant deleted successfully!');
            fetchRestaurants();
        } catch (err) {
            alert('Failed to delete restaurant');
        }
    };

    const resetForm = () => {
        setFormData({
            owner_email: '',
            owner_password: '',
            owner_name: '',
            owner_phone: '',
            name: '',
            description: '',
            phone: '',
            email: '',
            street_address: '',
            city: '',
            state: '',
            postal_code: '',
            opening_time: '10:00',
            closing_time: '23:00',
            delivery_fee: '20',
            minimum_order: '50',
            cuisine_type: ''
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Manage Restaurants</h1>
                    <button
                        onClick={() => {
                            setEditingRestaurant(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-orange-600 text-black px-6 py-3 rounded-lg hover:bg-orange-700 font-bold"
                    >
                        + Add Restaurant
                    </button>
                </div>


                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Name</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Owner</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">City</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Cuisine</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Status</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {restaurants.map((restaurant) => (
                                <tr key={restaurant.restaurant_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-900">{restaurant.name}</td>
                                    <td className="px-6 py-4 text-gray-900">{restaurant.owner_name}</td>
                                    <td className="px-6 py-4 text-gray-900">{restaurant.city}</td>
                                    <td className="px-6 py-4 text-gray-900">{restaurant.cuisine_type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm ${restaurant.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {restaurant.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(restaurant)}
                                                className="bg-orange-600 text-black px-3 py-1 rounded hover:bg-orange-700 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(restaurant.restaurant_id)}
                                                className="bg-gray-900 text-orange-500 px-3 py-1 rounded hover:bg-gray-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>


                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {editingRestaurant ? 'Edit Restaurant' : 'Add New Restaurant'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                {!editingRestaurant && (
                                    <div className="border-b pb-4 mb-4">
                                        <h3 className="font-bold text-gray-900 mb-3">Owner Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="email"
                                                placeholder="Owner Email"
                                                value={formData.owner_email}
                                                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                                                className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                                required
                                            />
                                            <input
                                                type="password"
                                                placeholder="Owner Password"
                                                value={formData.owner_password}
                                                onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                                                className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Owner Name"
                                                value={formData.owner_name}
                                                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                                                className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                                required
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Owner Phone"
                                                value={formData.owner_phone}
                                                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                                                className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}


                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Restaurant Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Cuisine Type"
                                        value={formData.cuisine_type}
                                        onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Street Address"
                                        value={formData.street_address}
                                        onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300 col-span-2"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="City"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="State"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                    />
                                    <input
                                        type="time"
                                        placeholder="Opening Time"
                                        value={formData.opening_time}
                                        onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="time"
                                        placeholder="Closing Time"
                                        value={formData.closing_time}
                                        onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Delivery Fee (EGP)"
                                        value={formData.delivery_fee}
                                        onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Minimum Order (EGP)"
                                        value={formData.minimum_order}
                                        onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                                        className="p-3 border rounded text-gray-900 bg-white border-gray-300"
                                        required
                                    />
                                </div>

                                <textarea
                                    placeholder="Description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 border rounded text-gray-900 bg-white border-gray-300"
                                    rows="3"
                                />

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-orange-600 text-black px-6 py-3 rounded-lg hover:bg-orange-700 font-bold"
                                    >
                                        {editingRestaurant ? 'Update Restaurant' : 'Create Restaurant'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingRestaurant(null);
                                            resetForm();
                                        }}
                                        className="flex-1 bg-gray-900 text-orange-500 px-6 py-3 rounded-lg hover:bg-gray-800 font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
