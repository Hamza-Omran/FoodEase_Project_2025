// src/pages/Profile.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Profile() {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Egypt",
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/customers/${user.id}/profile`);
      setCustomer(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get(`/customers/${user.id}/addresses`);
      setAddresses(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/${user.id}/addresses`, newAddress);
      fetchAddresses();
      setShowAddressForm(false);
      setNewAddress({
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        country: "Egypt",
        is_default: false,
      });
    } catch (err) {
      alert("Failed to add address");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (confirm("Delete this address?")) {
      try {
        await api.delete(`/customers/${user.id}/addresses/${addressId}`);
        fetchAddresses();
      } catch (err) {
        alert("Failed to delete address");
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Customer Stats */}
      {customer && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Account Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {customer.total_orders}
              </p>
              <p className="text-gray-600">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {parseFloat(customer.total_spent || 0).toFixed(2)} EGP
              </p>
              <p className="text-gray-600">Total Spent</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {customer.loyalty_points}
              </p>
              <p className="text-gray-600">Loyalty Points</p>
            </div>
          </div>
        </div>
      )}

      {/* Addresses */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">My Addresses</h2>
          <button
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            {showAddressForm ? "Cancel" : "Add Address"}
          </button>
        </div>

        {showAddressForm && (
          <form
            onSubmit={handleAddAddress}
            className="mb-6 p-4 border rounded"
          >
            <input
              type="text"
              placeholder="Street Address"
              value={newAddress.street_address}
              onChange={(e) =>
                setNewAddress({ ...newAddress, street_address: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                className="p-2 border rounded"
              />
            </div>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={newAddress.is_default}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, is_default: e.target.checked })
                }
                className="mr-2"
              />
              Set as default
            </label>
            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Address
            </button>
          </form>
        )}

        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.address_id}
              className="border rounded p-4 flex justify-between items-start"
            >
              <div>
                <p className="font-bold">{addr.street_address}</p>
                <p className="text-gray-600">
                  {addr.city}, {addr.state}
                </p>
                {addr.is_default && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded mt-1 inline-block">
                    Default
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDeleteAddress(addr.address_id)}
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
