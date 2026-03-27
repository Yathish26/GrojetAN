import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, MapPin, Mail, Phone, Star, ChefHat } from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

const EateryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [eatery, setEatery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

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

  const fetchEatery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/eateries/${id}`, { credentials: 'include' });
      const data = await response.json();
      if (response.ok && data.success) {
        setEatery(data.eatery);
      } else {
        throw new Error(data.message || 'Failed to fetch eatery details');
      }
    } catch (error) {
      console.error('Error fetching eatery details:', error);
      toast.error(error.message || 'Failed to load eatery details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) fetchEatery();
  }, [currentUser]);

  if (checkingUser) {
    return (
      <Layout title="Eatery Details">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Eatery Details">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading || !eatery) {
    return (
      <Layout title="Eatery Details">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Eatery Details">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/eateries')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </button>
          <button
            onClick={() => navigate(`/eateries/${id}/edit`)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Info</h3>
              <p><strong>Name:</strong> {eatery.displayName}</p>
              <p><strong>Email:</strong> {eatery.email}</p>
              <p><strong>Phone:</strong> {eatery.mobile}</p>
              <p><strong>Cuisine:</strong> {eatery.cuisineType || eatery.cuisine || 'N/A'}</p>
              <p><strong>Description:</strong> {eatery.description || 'N/A'}</p>
              <p><strong>Status:</strong> {eatery.status}</p>
              <p><strong>Store Status:</strong> {eatery.storeStatus}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
              <p>{eatery.address?.street}</p>
              <p>{eatery.address?.city}, {eatery.address?.state}</p>
              <p>{eatery.address?.country} - {eatery.address?.pincode}</p>
              {eatery.address?.landmark && <p><strong>Landmark:</strong> {eatery.address.landmark}</p>}
              <p><strong>Lat/Lng:</strong> {eatery.address?.coordinates?.latitude || '-'}, {eatery.address?.coordinates?.longitude || '-'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{eatery.totalOrders || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{eatery.totalRevenue?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Rating</p>
              <p className="text-2xl font-bold flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-400" /> {eatery.rating || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EateryDetails;
