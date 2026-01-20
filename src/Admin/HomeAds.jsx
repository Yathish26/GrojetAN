import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  Image, Search, Filter, Eye, Plus, RefreshCw,
  Edit, Trash2, ToggleLeft, ToggleRight, AlertCircle,
  ExternalLink, ShoppingCart, User, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const HomeAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    isActive: '',
    linkType: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];
  const navigate = useNavigate();

  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    image: '',
    link: '',
    linkType: 'none',
    merchantId: '',
    productId: '',
    categoryId: '',
    appNavigateMerchantId: '',
    displayOrder: 0,
    targetAudience: 'all',
    isActive: true
  });

  const fetchAds = async () => {
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
        `${import.meta.env.VITE_SERVER}/admin/home-ads?${queryParams}`,
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
        setAds(data.ads);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || data.ads.length,
          totalPages: data.pagination?.totalPages || 1
        }));
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to fetch ads');
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
      fetchAds();
    }
  }, [currentUser, pagination.page, searchTerm, filters]);

  const handleSearch = (e) => {
    if (!isAuthorized) return;
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAds();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const isAuthorized = currentUser && allowedRoles.includes(currentUser.role);

  const openAddModal = () => {
    if (!isAuthorized) return;
    setFormData({
      title: '',
      image: '',
      link: '',
      linkType: 'none',
      merchantId: '',
      productId: '',
      categoryId: '',
      appNavigateMerchantId: '',
      displayOrder: 0,
      targetAudience: 'all',
      isActive: true
    });
    setImagePreview(null);
    setShowAddModal(true);
  };

  const openEditModal = (ad) => {
    if (!isAuthorized) return;
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      image: ad.image,
      link: ad.link || '',
      linkType: ad.linkType,
      merchantId: ad.merchantId || '',
      productId: ad.productId || '',
      categoryId: ad.categoryId || '',
      appNavigateMerchantId: ad.appNavigateMerchantId || '',
      displayOrder: ad.displayOrder,
      targetAudience: ad.targetAudience,
      isActive: ad.isActive
    });
    setImagePreview(ad.image);
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return;

    try {
      const url = showAddModal
        ? `${import.meta.env.VITE_SERVER}/admin/home-ads`
        : `${import.meta.env.VITE_SERVER}/admin/home-ads/${selectedAd._id}`;

      const method = showAddModal ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Ad ${showAddModal ? 'created' : 'updated'} successfully`);
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        fetchAds();
      } else {
        toast.error(data.message || 'Failed to save ad');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad');
    }
  };

  const handleDelete = async (adId) => {
    if (!isAuthorized) return;

    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/home-ads/${adId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Ad deleted successfully');
        fetchAds();
      } else {
        toast.error(data.message || 'Failed to delete ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  const handleToggleActive = async (adId, currentStatus) => {
    if (!isAuthorized) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/home-ads/${adId}/toggle`,
        {
          method: 'PATCH',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Ad ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchAds();
      } else {
        toast.error(data.message || 'Failed to toggle ad status');
      }
    } catch (error) {
      console.error('Error toggling ad status:', error);
      toast.error('Failed to toggle ad status');
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
      image: '',
      link: '',
      linkType: 'none',
      merchantId: '',
      productId: '',
      categoryId: '',
      displayOrder: 0,
      startDate: '',
      endDate: '',
      targetAudience: 'all',
      isActive: true
    });
    setImagePreview(null);
  };

  const getLinkTypeIcon = (linkType) => {
    switch (linkType) {
      case 'external': return <ExternalLink className="w-4 h-4" />;
      case 'product': return <ShoppingCart className="w-4 h-4" />;
      case 'merchant': return <User className="w-4 h-4" />;
      case 'category': return <Filter className="w-4 h-4" />;
      default: return null;
    }
  };

  const getLinkTypeLabel = (linkType) => {
    switch (linkType) {
      case 'external': return 'External Link';
      case 'product': return 'Product';
      case 'merchant': return 'Merchant';
      case 'category': return 'Category';
      default: return 'None';
    }
  };

  if (checkingUser) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 sm:h-12 sm:w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="ml-4 text-red-600">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
              <Image className="w-8 h-8 mr-3 text-green-600" />
              Home Ads Management
            </h1>
            <p className="text-gray-600 mt-1">Manage homepage advertisements and banners</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={fetchAds}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Ad
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Search ads by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </form>
            <div className="flex gap-2">
              <select
                value={filters.isActive}
                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <select
                value={filters.linkType}
                onChange={(e) => handleFilterChange('linkType', e.target.value)}
                className="px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Link Types</option>
                <option value="none">None</option>
                <option value="external">External Link</option>
                <option value="product">Product</option>
                <option value="merchant">Merchant</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ads Table */}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ads.map((ad) => (
                      <tr key={ad._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <img className="h-12 w-12 object-cover rounded" src={ad.image} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                              <div className="text-sm text-gray-500">
                                Created: {new Date(ad.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getLinkTypeIcon(ad.linkType)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getLinkTypeLabel(ad.linkType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ad.displayOrder}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ad.appNavigateMerchantId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium ${
                            ad.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {ad.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(ad)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleActive(ad._id, ad.isActive)}
                              className={ad.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {ad.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(ad._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
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
                {ads.map((ad) => (
                  <div key={ad._id} className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img className="h-12 w-12 object-cover rounded mr-3" src={ad.image} alt="" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                          <div className="flex items-center mt-1">
                            {getLinkTypeIcon(ad.linkType)}
                            <span className="ml-1 text-xs text-gray-500">
                              {getLinkTypeLabel(ad.linkType)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(ad._id, ad.isActive)}
                          className={`p-1 ${ad.isActive ? 'text-yellow-600' : 'text-green-600'}`}
                        >
                          {ad.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(ad)}
                          className="p-1 text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad._id)}
                          className="p-1 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Order: {ad.displayOrder}</span>
                      <span>App ID: {ad.appNavigateMerchantId || 'N/A'}</span>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        ad.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {ads.length === 0 && (
                <div className="text-center py-12">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No ads found</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  {showAddModal ? 'Add New Ad' : 'Edit Ad'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        maxLength={100}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
                      <select
                        value={formData.linkType}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="none">None</option>
                        <option value="external">External Link</option>
                        <option value="product">Product</option>
                        <option value="merchant">Merchant</option>
                        <option value="category">Category</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">App Navigate Merchant ID</label>
                      <input
                        type="text"
                        value={formData.appNavigateMerchantId}
                        onChange={(e) => setFormData(prev => ({ ...prev, appNavigateMerchantId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter merchant ID for app navigation"
                      />
                    </div>

                    {formData.linkType === 'external' && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">External Link</label>
                        <input
                          type="url"
                          value={formData.link}
                          onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    {formData.linkType === 'product' && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product ID</label>
                        <input
                          type="text"
                          value={formData.productId}
                          onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter product ID"
                        />
                      </div>
                    )}

                    {formData.linkType === 'merchant' && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Merchant ID</label>
                        <input
                          type="text"
                          value={formData.merchantId}
                          onChange={(e) => setFormData(prev => ({ ...prev, merchantId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter merchant ID"
                        />
                      </div>
                    )}

                    {formData.linkType === 'category' && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category ID</label>
                        <input
                          type="text"
                          value={formData.categoryId}
                          onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter category ID"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                      <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="all">All Users</option>
                        <option value="new">New Users</option>
                        <option value="returning">Returning Users</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ad Image *
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Image Requirements:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Recommended dimensions: <strong>1600 × 750 pixels</strong></li>
                              <li>Aspect ratio: 16:7.5 (landscape banner format)</li>
                              <li>Maximum file size: 5MB</li>
                              <li>Supported formats: JPG, PNG, WebP</li>
                              <li>High-quality images work best for banner display</li>
                            </ul>
                          </div>
                        </div>
                      </div>
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
                              alt="Ad preview"
                              className="w-full max-w-md h-32 object-cover border border-gray-300 rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      {showAddModal ? 'Create Ad' : 'Update Ad'}
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

export default HomeAds;