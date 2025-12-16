import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function AdminDriversPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        vehicle_type: 'bike',
        vehicle_model: '',
        license_plate: '',
        license_number: ''
    });

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchDrivers();
    }, [user]);

    const fetchDrivers = async () => {
        try {
            const response = await api.get('/admin/drivers');
            setDrivers(response.data);
            setLoading(false);
        } catch (err) {

            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingDriver) {
                await api.put(`/admin/drivers/${editingDriver.driver_id}`, formData);
                alert('Driver updated successfully!');
            } else {
                await api.post('/admin/drivers', formData);
                alert('Driver created successfully!');
            }
            setShowModal(false);
            setEditingDriver(null);
            resetForm();
            fetchDrivers();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save driver');
        }
    };

    const handleEdit = (driver) => {
        setEditingDriver(driver);
        setFormData({
            vehicle_type: driver.vehicle_type,
            vehicle_model: driver.vehicle_model,
            license_plate: driver.license_plate,
            license_number: driver.license_number
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will delete the driver and their user account.')) return;
        try {
            await api.delete(`/admin/drivers/${id}`);
            alert('Driver deleted successfully!');
            fetchDrivers();
        } catch (err) {
            alert('Failed to delete driver');
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            full_name: '',
            phone: '',
            vehicle_type: 'bike',
            vehicle_model: '',
            license_plate: '',
            license_number: ''
        });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Manage Drivers</h1>
                    <button
                        onClick={() => {
                            setEditingDriver(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="bg-orange-600 text-black px-6 py-3 rounded-lg hover:bg-orange-700 font-bold"
                    >
                        + Add Driver
                    </button>
                </div>


                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Name</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Email</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Phone</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Vehicle</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Status</th>
                                <th className="px-6 py-3 text-left text-gray-900 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {drivers.map((driver) => (
                                <tr key={driver.driver_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-gray-900">{driver.full_name}</td>
                                    <td className="px-6 py-4 text-gray-900">{driver.email}</td>
                                    <td className="px-6 py-4 text-gray-900">{driver.phone}</td>
                                    <td className="px-6 py-4 text-gray-900">
                                        {driver.vehicle_type} - {driver.vehicle_model}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-sm ${driver.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {driver.is_available ? 'Available' : 'Busy'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(driver)}
                                                className="bg-orange-600 text-black px-3 py-1 rounded hover:bg-orange-700 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(driver.driver_id)}
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
                        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                {!editingDriver && (
                                    <div className="border-b pb-4 mb-4">
                                        <h3 className="font-bold text-gray-900 mb-3">User Information</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                className="p-3 border rounded text-white bg-gray-800"
                                                required
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="p-3 border rounded text-white bg-gray-800"
                                                required
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="p-3 border rounded text-white bg-gray-800"
                                                required
                                            />
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="p-3 border rounded text-white bg-gray-800"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}


                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={formData.vehicle_type}
                                        onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                        className="p-3 border rounded text-white bg-gray-800"
                                        required
                                    >
                                        <option value="bike">Bike</option>
                                        <option value="scooter">Scooter</option>
                                        <option value="car">Car</option>
                                        <option value="van">Van</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Vehicle Model"
                                        value={formData.vehicle_model}
                                        onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                        className="p-3 border rounded text-white bg-gray-800"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="License Plate"
                                        value={formData.license_plate}
                                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                        className="p-3 border rounded text-white bg-gray-800"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="License Number"
                                        value={formData.license_number}
                                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                        className="p-3 border rounded text-white bg-gray-800"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-orange-600 text-black px-6 py-3 rounded-lg hover:bg-orange-700 font-bold"
                                    >
                                        {editingDriver ? 'Update Driver' : 'Create Driver'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingDriver(null);
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
