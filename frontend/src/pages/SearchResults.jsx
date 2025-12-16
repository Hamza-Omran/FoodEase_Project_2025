import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    performSearch();
  }, [searchParams]);

  const performSearch = async () => {
    try {
      const params = Object.fromEntries(searchParams);
      const response = await searchAPI.restaurants(params);
      setResults(response.data.restaurants || []);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    return `${baseUrl}/${cleanPath}`;
  };

  if (loading) return <div className="text-center py-12">Searching...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-900 mb-8">Found {results.length} restaurants</p>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-900">No restaurants found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((restaurant) => (
            <div
              key={restaurant.restaurant_id}
              onClick={() => navigate(`/restaurant/${restaurant.restaurant_id}`)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition"
            >
              <img
                src={getImageUrl(restaurant.image_url)}
                alt={restaurant.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                <p className="text-gray-900 text-sm mb-2 line-clamp-2">{restaurant.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faClock} className="text-gray-400 mr-1" />{restaurant.estimated_delivery_time} min</span>
                </div>
                {restaurant.cuisine_type && (
                  <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded">
                    {restaurant.cuisine_type}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
