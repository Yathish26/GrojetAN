import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  Gift, Search, Filter, Eye, Plus, RefreshCw,
  Edit, Trash2, ToggleLeft, ToggleRight, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: '',
    discountType: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];
  const navigate = useNavigate();

  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    conditions: ['*Conditions apply'],
    code: '',
    image: 'https://i.ibb.co/84gvTFq4/image.png',
    isActive: true,
    minimumOrderValue: 0,
    discountType: 'free_delivery',
    discountValue: 0,
    maxDiscount: 0,
    applicableFor: 'all',
    validFrom: '',
    validTo: ''
  });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => value !== '')
        )
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/offers?${queryParams}`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login');
        return;
      }
      if (data.success) {
        setOffers(data.offers);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  const checkUser = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/auth/profile`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.admin);

        if (!allowedRoles.includes(data.admin.role)) {
          navigate('/unauthorized');
          return;
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (currentUser && allowedRoles.includes(currentUser.role)) {
      fetchOffers();
    }
  }, [currentUser, pagination.page, searchTerm, filters]);

  const handleSearch = (e) => {
    if (!isAuthorized) return;
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOffers();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const isAuthorized = currentUser && allowedRoles.includes(currentUser.role);

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, '']
    }));
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index, value) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => i === index ? value : condition)
    }));
  };

  const openAddModal = () => {
    if (!isAuthorized) return;
    setFormData({
      title: '',
      description: '',
      conditions: ['*Conditions apply'],
      code: '',
      image: 'https://i.ibb.co/84gvTFq4/image.png',
      isActive: true,
      minimumOrderValue: 0,
      discountType: 'free_delivery',
      discountValue: 0,
      maxDiscount: 0,
      applicableFor: 'all',
      validFrom: '',
      validTo: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (offer) => {
    if (!isAuthorized) return;
    setSelectedOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      conditions: Array.isArray(offer.conditions) ? offer.conditions : [offer.conditions || '*Conditions apply'],
      code: offer.code,
      image: offer.image,
      isActive: offer.isActive,
      minimumOrderValue: offer.minimumOrderValue,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      maxDiscount: offer.maxDiscount,
      applicableFor: offer.applicableFor,
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
      validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : ''
    });
    setImagePreview(offer.image); // Set image preview for editing
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return;

    try {
      const url = showAddModal
        ? `${import.meta.env.VITE_SERVER}/admin/offers`
        : `${import.meta.env.VITE_SERVER}/admin/offers/${selectedOffer._id}`;

      const method = showAddModal ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Offer ${showAddModal ? 'created' : 'updated'} successfully`);
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        fetchOffers();
      } else {
        toast.error(data.message || 'Failed to save offer');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    }
  };

  const handleDelete = async (offerId) => {
    if (!isAuthorized) return;

    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/offers/${offerId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Offer deleted successfully');
        fetchOffers();
      } else {
        toast.error(data.message || 'Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const toggleStatus = async (offer) => {
    if (!isAuthorized) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/offers/${offer._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isActive: !offer.isActive })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Offer ${!offer.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchOffers();
      } else {
        toast.error(data.message || 'Failed to update offer status');
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      toast.error('Failed to update offer status');
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload`, {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image: data.url }));
        setImagePreview(data.url);
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      conditions: ['*Conditions apply'],
      code: '',
      image: '',
      isActive: true,
      minimumOrderValue: 0,
      discountType: 'percentage',
      discountValue: 0,
      maxDiscount: 0,
      applicableFor: 'all',
      validFrom: '',
      validTo: ''
    });
    setImagePreview(null);
    setUploadingImage(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (checkingUser) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">Unauthorized access</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <Gift className="mr-2 sm:mr-3 text-green-600" size={24} />
              <span className="hidden sm:inline">Offers Management</span>
              <span className="sm:hidden">Offers</span>
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage promotional offers and discounts</p>
          </div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex items-center justify-center text-sm"
          >
            <Plus size={18} className="mr-2" />
            Add Offer
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search offers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <select
                value={filters.discountType}
                onChange={(e) => handleFilterChange('discountType', e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="">All Types</option>
                <option value="free_delivery">Free Delivery</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>

              <button
                onClick={fetchOffers}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 flex items-center justify-center text-sm whitespace-nowrap"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-8 w-8 sm:h-12 sm:w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <tr key={offer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 object-cover" src={offer.image} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{offer.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                            {offer.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {offer.discountType === 'free_delivery' ? 'Free Delivery' :
                           offer.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium ${
                            offer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {offer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(offer)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => toggleStatus(offer)}
                              className={offer.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {offer.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button
                              onClick={() => handleDelete(offer._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {offers.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-500">
                    No offers found matching your criteria.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {offers.map((offer) => (
                      <div key={offer._id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-16 h-16">
                            <img className="w-full h-full object-cover rounded-lg" src={offer.image} alt="" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 truncate">{offer.title}</h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.description}</p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium ml-2 flex-shrink-0 ${
                                offer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {offer.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                                {offer.code}
                              </span>
                              <span className="text-xs text-gray-600">
                                {offer.discountType === 'free_delivery' ? 'Free Delivery' :
                                 offer.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => openEditModal(offer)}
                                  className="text-blue-600 hover:text-blue-900 p-1"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => toggleStatus(offer)}
                                  className={`p-1 ${offer.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                                >
                                  {offer.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                </button>
                                <button
                                  onClick={() => handleDelete(offer._id)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} offers
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  {showAddModal ? 'Add New Offer' : 'Edit Offer'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="free_delivery">Free Delivery</option>
                        <option value="percentage">Percentage Discount</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Value</label>
                      <input
                        type="number"
                        value={formData.minimumOrderValue}
                        onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderValue: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                      />
                    </div>

                    {formData.discountType !== 'free_delivery' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formData.discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                          </label>
                          <input
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Discount (₹)</label>
                          <input
                            type="number"
                            value={formData.maxDiscount}
                            onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            min="0"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Applicable For</label>
                      <select
                        value={formData.applicableFor}
                        onChange={(e) => setFormData(prev => ({ ...prev, applicableFor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">All Users</option>
                        <option value="new_customers">New Customers</option>
                        <option value="existing_customers">Existing Customers</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valid To</label>
                      <input
                        type="date"
                        value={formData.validTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, validTo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Offer Image</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          disabled={uploadingImage}
                        />
                        {uploadingImage && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="animate-spin h-4 w-4 border-4 border-green-200 border-t-green-500 rounded-full"></div>
                            Uploading image...
                          </div>
                        )}
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Offer preview"
                              className="w-24 h-24 sm:w-32 sm:h-32 object-cover border border-gray-300 rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
                      {formData.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={condition}
                            onChange={(e) => updateCondition(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="text-red-600 hover:text-red-900 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCondition}
                        className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Condition
                      </button>
                    </div>

                    <div className="sm:col-span-2 flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      {showAddModal ? 'Create Offer' : 'Update Offer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Offers;