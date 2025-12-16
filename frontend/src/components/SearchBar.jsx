import { useState, useEffect } from 'react';
import { searchAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    cuisine_type: '',
    min_rating: ''
  });
  const [filterOptions, setFilterOptions] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await searchAPI.filters();
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filters.city) params.append('city', filters.city);
    if (filters.cuisine_type) params.append('cuisine_type', filters.cuisine_type);
    if (filters.min_rating) params.append('min_rating', filters.min_rating);

    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search restaurants or dishes..."
          className="flex-1 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white bg-gray-800 placeholder-gray-400"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
        >
          Filters
        </button>
        <button
          onClick={handleSearch}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
        >
          Search
        </button>
      </div>

      {showFilters && filterOptions && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="border border-gray-600 rounded-lg px-4 py-2 text-white bg-gray-800"
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={filters.cuisine_type}
            onChange={(e) => setFilters({ ...filters, cuisine_type: e.target.value })}
            className="border border-gray-600 rounded-lg px-4 py-2 text-white bg-gray-800"
          >
            <option value="">All Cuisines</option>
            {filterOptions.cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>

          <select
            value={filters.min_rating}
            onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}
            className="border border-gray-600 rounded-lg px-4 py-2 text-white bg-gray-800"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>
      )}
    </div>
  );
}
