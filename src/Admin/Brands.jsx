import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Package,
  Users,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function Brands() {
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
      <Layout title="Brands">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Brands">
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

  // Dummy data for brands
  const brands = [
    {
      id: 1,
      name: 'FreshMart',
      logo: 'https://via.placeholder.com/100x100?text=FM',
      category: 'Grocery',
      productsCount: 245,
      description: 'Premium grocery and fresh produce brand'
    },
    {
      id: 2,
      name: 'TechHub',
      logo: 'https://via.placeholder.com/100x100?text=TH',
      category: 'Electronics',
      productsCount: 189,
      description: 'Latest technology gadgets and accessories'
    },
    {
      id: 3,
      name: 'FashionPlus',
      logo: 'https://via.placeholder.com/100x100?text=FP',
      category: 'Fashion',
      productsCount: 156,
      description: 'Trendy clothing and fashion accessories'
    },
    {
      id: 4,
      name: 'HomeStyle',
      logo: 'https://via.placeholder.com/100x100?text=HS',
      category: 'Home & Garden',
      productsCount: 98,
      description: 'Home decor and gardening essentials'
    },
    {
      id: 5,
      name: 'BeautyGlow',
      logo: 'https://via.placeholder.com/100x100?text=BG',
      category: 'Beauty',
      productsCount: 134,
      description: 'Cosmetics and personal care products'
    },
    {
      id: 6,
      name: 'SportFit',
      logo: 'https://via.placeholder.com/100x100?text=SF',
      category: 'Sports',
      productsCount: 87,
      description: 'Sports equipment and fitness gear'
    },
    {
      id: 7,
      name: 'BookWorld',
      logo: 'https://via.placeholder.com/100x100?text=BW',
      category: 'Books',
      productsCount: 567,
      description: 'Books, novels, and educational materials'
    },
    {
      id: 8,
      name: 'ToyLand',
      logo: 'https://via.placeholder.com/100x100?text=TL',
      category: 'Toys',
      productsCount: 203,
      description: 'Toys and games for all ages'
    },
    {
      id: 9,
      name: 'AutoParts',
      logo: 'https://via.placeholder.com/100x100?text=AP',
      category: 'Automotive',
      productsCount: 145,
      description: 'Car parts and automotive accessories'
    },
    {
      id: 10,
      name: 'PetCare',
      logo: 'https://via.placeholder.com/100x100?text=PC',
      category: 'Pet Supplies',
      productsCount: 76,
      description: 'Pet food, toys, and care products'
    }
  ];

  return (
    <Layout title="Brands">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
            <p className="text-gray-600 mt-1">List of all available product brands</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Brand
          </button>
        </div>

        {/* Brands Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Store className="h-5 w-5" />
              All Brands ({brands.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-lg object-cover mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{brand.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{brand.productsCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{brand.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}