import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChefHat, Save, CheckCircle } from 'lucide-react';
import Layout from '../Components/Layout';
import { AddressSearch } from '../Components/GoogleMapComponents';
import { INDIAN_STATES } from '../utils/states';
import toast from 'react-hot-toast';

const CUISINE_TYPES = [
  'North Indian',
  'South Indian',
  'Biryani',
  'Mughlai',
  'Punjabi',
  'Gujarati',
  'Rajasthani',
  'Maharashtrian',
  'Goan',
  'Bengali',
  'Hyderabadi',
  'Kerala',
  'Chettinad',
  'Andhra',
  'Chinese',
  'Italian',
  'Continental',
  'Mexican',
  'Thai',
  'Japanese',
  'Korean',
  'Lebanese',
  'Mediterranean',
  'American',
  'Turkish',
  'Vegetarian',
  'Vegan',
  'Jain Food',
  'Healthy Food',
  'Seafood',
  'Grill & BBQ',
  'Tandoor',
  'Cafe',
  'Bakery',
  'Desserts',
  'Beverages',
  'Mithai'
];

const AddEatery = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cuisine: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: ''
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');

  const fetchCurrentUser = async () => {
    try {
      setCheckingUser(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (response.ok && data.admin) {
        setCurrentUser(data.admin);
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceSelect = (placeData) => {
    if (placeData) {
      setSelectedLocation(placeData);
      setFormData(prev => ({
        ...prev,
        address: placeData.address || prev.address
      }));
      setIsManualEntry(false);
      toast.success('Location selected from Google Maps');
    }
  };

  const handleManualEntryToggle = (checked) => {
    setIsManualEntry(checked);
    if (checked) {
      setSelectedLocation(null);
      setManualLatitude('');
      setManualLongitude('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!isManualEntry && !selectedLocation) {
      toast.error('Please select the location on map or enable manual entry');
      return;
    }

    if (isManualEntry && (!manualLatitude || !manualLongitude)) {
      toast.error('Please provide both latitude and longitude for manual entry');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        displayName: formData.name,
        email: formData.email,
        mobile: formData.phone,
        operationalInfo: {
          cuisineType: formData.cuisine || 'Various',
          deliveryTime: '30-45 mins',
          storeAddress: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: 'India',
            coordinates: {
              latitude: isManualEntry ? manualLatitude : (selectedLocation ? selectedLocation.lat : ''),
              longitude: isManualEntry ? manualLongitude : (selectedLocation ? selectedLocation.lng : '')
            }
          }
        },
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: 'India'
        },
        description: formData.description,
        storeType: 'Restaurant'
      };

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/eateries`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Eatery added successfully');
        navigate('/eateries');
      } else {
        throw new Error(data.message || 'Failed to add eatery');
      }
    } catch (error) {
      console.error('Error adding eatery', error);
      toast.error(error.message || 'Failed to add eatery');
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <Layout title="Add Eatery">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Add Eatery">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Add Eatery">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-6">
            <button
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => navigate('/eateries')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Eateries
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Add Eatery</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Restaurant Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter restaurant name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="restaurant@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cuisine Type</label>
                  <select
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  >
                    <option value="">Select cuisine type</option>
                    {CUISINE_TYPES.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Enter complete address"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block text-sm font-medium text-gray-700">Business Location Search</label>
                <AddressSearch
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Search for eatery location on Google Maps..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
                {selectedLocation && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Location selected</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">{selectedLocation.address}</p>
                    <p className="text-xs text-green-500 mt-1">
                      Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isManualEntry}
                    onChange={(e) => handleManualEntryToggle(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">Not on Google Maps — enter manually</label>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 ${isManualEntry ? '' : 'opacity-50 pointer-events-none'}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Latitude {isManualEntry && <span className="text-red-500">*</span>}</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLatitude}
                      onChange={(e) => setManualLatitude(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="e.g. 12.9715987"
                      disabled={!isManualEntry}
                      required={isManualEntry}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Longitude {isManualEntry && <span className="text-red-500">*</span>}</label>
                    <input
                      type="number"
                      step="any"
                      value={manualLongitude}
                      onChange={(e) => setManualLongitude(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="e.g. 77.5945627"
                      disabled={!isManualEntry}
                      required={isManualEntry}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    required
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PIN Code *</label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter PIN code"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Brief description about the restaurant"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/eateries')}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Add Eatery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddEatery;
