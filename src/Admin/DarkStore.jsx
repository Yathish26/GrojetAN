import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Plus,
  Edit,
  Trash2,
  Package,
  Users,
  TrendingUp,
  Shield,
  MapPin,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function DarkStore() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const local = localStorage.getItem('adminUser');
        if (local) {
          setCurrentUser(JSON.parse(local));
        } else {
          const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
          const data = await response.json();
          if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
          }
          if (response.ok && data.admin) {
            setCurrentUser(data.admin);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
          }
        }
      } catch (err) {
        console.error('Failed to fetch current user', err);
      } finally {
        setCheckingUser(false);
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  if (checkingUser) {
    return (
      <Layout title="Dark Store (Beta)">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Dark Store (Beta)">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Dummy data for dark stores
  const darkStores = [
    {
      id: 1,
      name: 'Mangalore Central Dark Store',
      location: '123 Hampankatta, Mangalore',
      status: 'Beta Testing',
      inventory: 1250,
      ordersToday: 45,
      efficiency: 92,
      avgPrepTime: '8 min',
      activePickers: 6
    },
    {
      id: 2,
      name: 'Kadri Dark Store',
      location: '456 Kadri Hills, Mangalore',
      status: 'Pilot',
      inventory: 980,
      ordersToday: 32,
      efficiency: 88,
      avgPrepTime: '12 min',
      activePickers: 4
    },
    {
      id: 3,
      name: 'Udupi Dark Store',
      location: '789 Car Street, Udupi',
      status: 'Beta Testing',
      inventory: 1450,
      ordersToday: 67,
      efficiency: 95,
      avgPrepTime: '6 min',
      activePickers: 8
    },
    {
      id: 4,
      name: 'Surathkal Dark Store',
      location: '321 NITK Road, Surathkal',
      status: 'Pilot',
      inventory: 1100,
      ordersToday: 38,
      efficiency: 89,
      avgPrepTime: '10 min',
      activePickers: 5
    },
    {
      id: 5,
      name: 'Kankanady Dark Store',
      location: '654 Kankanady Bypass, Mangalore',
      status: 'Beta Testing',
      inventory: 1350,
      ordersToday: 52,
      efficiency: 91,
      avgPrepTime: '7 min',
      activePickers: 7
    }
  ];

  return (
    <Layout title="Dark Store (Beta)">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dark Store (Beta)</h1>
            <p className="text-gray-600 mt-1">Automated fulfillment centers for faster delivery</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Dark Store
          </button>
        </div>

        {/* Dark Store Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Dark Stores
            </h2>
            <p className="text-sm text-gray-600 mt-1">Monitor automated fulfillment operations</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {darkStores.map((store) => (
                <div key={store.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{store.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store.status === 'Beta Testing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {store.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{store.location}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <Package className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">{store.inventory}</p>
                      <p className="text-xs text-gray-600">Items</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">{store.ordersToday}</p>
                      <p className="text-xs text-gray-600">Orders Today</p>
                    </div>
                    <div className="text-center">
                      <Users className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">{store.efficiency}%</p>
                      <p className="text-xs text-gray-600">Efficiency</p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">{store.avgPrepTime}</p>
                      <p className="text-xs text-gray-600">Avg Prep Time</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-600">Active Pickers:</span>
                    <span className="font-medium">{store.activePickers}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 flex items-center justify-center gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                    <button className="flex-1 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 flex items-center justify-center gap-1">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Beta Features Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Beta Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">AI-Powered Inventory</h4>
              <p className="text-sm text-gray-600">Automated stock prediction and reordering</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Smart Routing</h4>
              <p className="text-sm text-gray-600">Optimized picker paths for faster fulfillment</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Real-time Analytics</h4>
              <p className="text-sm text-gray-600">Live performance monitoring and insights</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Automated Quality Control</h4>
              <p className="text-sm text-gray-600">AI-driven order verification and packing</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}