import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import { Gift, Plus, Search, Filter, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const InlineOffer = () => {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const navigate = useNavigate();

  const [inlineOffers, setInlineOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    merchantId: '',
    discountCap: '',
    discountPrice: ''
  });

  const allowedRoles = ['super_admin', 'admin'];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setCheckingUser(true);
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
          credentials: 'include'
        });

        if (response.status === 401) {
          navigate('/login');
          return;
        }

        const data = await response.json();
        setCurrentUser(data.admin);
        console.log('Current user data:', data.admin);
        console.log('User role:', data.admin?.role);
        console.log('Allowed roles:', allowedRoles);
        console.log('Is authorized:', data.admin && allowedRoles.includes(data.admin.role));
      } catch (error) {
        console.error('Error checking user:', error);
        navigate('/login');
      } finally {
        setCheckingUser(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && allowedRoles.includes(currentUser.role)) {
      fetchInlineOffers();
    }
  }, [currentUser]);

  const fetchInlineOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/inline-offers`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInlineOffers(data.inlineOffers || []);
      } else {
        toast.error('Failed to fetch inline offers');
      }
    } catch (error) {
      console.error('Error fetching inline offers:', error);
      toast.error('Failed to fetch inline offers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.merchantId || !formData.discountCap || !formData.discountPrice) {
      toast.error('All fields are required');
      return;
    }

    try {
      setLoading(true);
      const url = editingOffer
        ? `${import.meta.env.VITE_SERVER}/inline-offers/${editingOffer._id}`
        : `${import.meta.env.VITE_SERVER}/inline-offers`;

      const method = editingOffer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingOffer ? 'Inline offer updated successfully' : 'Inline offer created successfully');
        setFormData({ merchantId: '', discountCap: '', discountPrice: '' });
        setShowForm(false);
        setEditingOffer(null);
        fetchInlineOffers();
      } else {
        toast.error(data.message || 'Failed to save inline offer');
      }
    } catch (error) {
      console.error('Error saving inline offer:', error);
      toast.error('Failed to save inline offer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      merchantId: offer.merchantId,
      discountCap: offer.discountCap.toString(),
      discountPrice: offer.discountPrice.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this inline offer?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/inline-offers/${offerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Inline offer deleted successfully');
        fetchInlineOffers();
      } else {
        toast.error('Failed to delete inline offer');
      }
    } catch (error) {
      console.error('Error deleting inline offer:', error);
      toast.error('Failed to delete inline offer');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (offer) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/inline-offers/${offer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !offer.isActive })
      });

      if (response.ok) {
        toast.success(`Inline offer ${!offer.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchInlineOffers();
      } else {
        toast.error('Failed to update inline offer status');
      }
    } catch (error) {
      console.error('Error updating inline offer status:', error);
      toast.error('Failed to update inline offer status');
    } finally {
      setLoading(false);
    }
  };

  const isAuthorized = currentUser && allowedRoles.includes(currentUser.role);
  console.log('isAuthorized check:', isAuthorized, 'currentUser:', currentUser, 'role:', currentUser?.role);

  if (checkingUser) {
    return (
      <Layout title="Inline Offer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout title="Inline Offer">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Inline Offer">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Inline Offer Management</h1>
              <p className="text-gray-600">Manage automatic merchant-specific discounts</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingOffer(null);
                setFormData({ merchantId: '', discountCap: '', discountPrice: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="h-4 w-4" />
              {showForm ? 'Cancel' : 'Add Inline Offer'}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingOffer ? 'Edit Inline Offer' : 'Create New Inline Offer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant ID
                  </label>
                  <input
                    type="text"
                    value={formData.merchantId}
                    onChange={(e) => setFormData({ ...formData, merchantId: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., GDM877"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.discountCap}
                    onChange={(e) => setFormData({ ...formData, discountCap: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Minimum subtotal"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Discount amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingOffer ? 'Update' : 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOffer(null);
                    setFormData({ merchantId: '', discountCap: '', discountPrice: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inline Offers</p>
                <p className="text-2xl font-bold text-gray-900">{inlineOffers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Gift className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Offers</p>
                <p className="text-2xl font-bold text-gray-900">{inlineOffers.filter(offer => offer.isActive).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Gift className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Offers</p>
                <p className="text-2xl font-bold text-gray-900">{inlineOffers.filter(offer => !offer.isActive).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inline Offers</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount Cap (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount Price (₹)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && inlineOffers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading inline offers...</p>
                    </td>
                  </tr>
                ) : inlineOffers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Gift className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Inline Offers Yet</h3>
                        <p className="text-gray-500 mb-4">Get started by creating your first inline offer</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Inline Offer
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inlineOffers.map((offer) => (
                    <tr key={offer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {offer.merchantId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{offer.discountCap}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{offer.discountPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          offer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(offer)}
                          className={`hover:text-gray-900 ${offer.isActive ? 'text-orange-600' : 'text-green-600'}`}
                          title={offer.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {offer.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InlineOffer;