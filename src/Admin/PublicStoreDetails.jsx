import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, DollarSign, Star, Calendar,
  MapPin, User, Phone, Mail, Eye, Search, Filter,
  ShoppingCart, TrendingUp, AlertTriangle, Edit, Save, X, RefreshCw, Trash2, Plus
} from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const PublicStoreDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({ quantity: '', price: '', weightValue: '', weightUnit: '', category: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage] = useState(20); // Fixed items per page
  const [imageViewer, setImageViewer] = useState({ isOpen: false, imageUrl: '', altText: '' });
  const [addProductModal, setAddProductModal] = useState({ isOpen: false, products: [], loading: false, searchTerm: '', selectedProducts: [] });
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState(false);
  const fetchCurrentUser = async () => {
    try {
      setCheckingUser(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
      if (response.status === 401) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
      const data = await response.json();
      if (data.tokenValid === false) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
      if (response.ok && data.admin) {
        setCurrentUser(data.admin);
      } else {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  };

  // Fetch store details with inventory
  const fetchStoreDetails = async (page = 1, searchParam = '', statusParam = 'all', categoryParam = 'all') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: searchParam,
        status: statusParam,
        category: categoryParam,
        events: 'all'
      });

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          setStore(data.merchant);
          console.log('Fetched merchant inventory:', data.merchant);
          setInventory(data.merchant.inventory || []);

          // Update pagination state
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.totalItems);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPrevPage(data.pagination.hasPrevPage);
        } else {
          throw new Error(data.message || 'Failed to fetch store details');
        }
      } else {
        throw new Error('Failed to fetch store details');
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to load store details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchStoreDetails(currentPage, searchTerm, statusFilter, categoryFilter);
    }
  }, [currentUser, currentPage, searchTerm, statusFilter, categoryFilter]);

  // Handle filter changes (reset to page 1)
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  // Handle edit functions
  const startEditing = (item) => {
    setEditingItem(item._id);
    setEditValues({
      quantity: item.quantity || 0,
      price: item.price || 0,
      weightValue: item.weightDimension?.value || '',
      weightUnit: item.weightDimension?.unit || '',
      category: item.category || ''
    });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditValues({ quantity: '', price: '', weightValue: '', weightUnit: '', category: '' });
  };

  const updateInventoryItem = async (itemId, field, value) => {
    try {
      let endpoint, body;

      if (field === 'weight-dimension') {
        endpoint = `${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${itemId}/weight-dimension`;
        body = { value: parseFloat(value.weightValue), unit: value.weightUnit };
      } else if (field === 'quantity') {
        endpoint = `${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${itemId}/quantity`;
        body = { quantity: parseInt(value) };
      } else if (field === 'price') {
        endpoint = `${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${itemId}/price`;
        body = { price: parseFloat(value) };
      } else if (field === 'category') {
        endpoint = `${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${itemId}/category`;
        body = { category: value };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`${field === 'quantity' ? 'Stock' : field === 'price' ? 'Price' : field === 'category' ? 'Category' : 'Weight'} updated successfully`);
          // Refresh the current page data
          fetchStoreDetails(currentPage, searchTerm, statusFilter, categoryFilter);
        } else {
          throw new Error(data.message || `Failed to update ${field}`);
        }
      } else {
        throw new Error(`Failed to update ${field}`);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(error.message || `Failed to update ${field}`);
    }
  };

  const saveChanges = async () => {
    if (!editingItem) return;

    try {
      const currentItem = inventory.find(item => item._id === editingItem);

      // Update quantity if changed
      if (editValues.quantity !== currentItem?.quantity) {
        await updateInventoryItem(editingItem, 'quantity', editValues.quantity);
      }

      // Update price if changed
      if (editValues.price !== currentItem?.price) {
        await updateInventoryItem(editingItem, 'price', editValues.price);
      }

      // Update weight dimension if changed
      const currentWeightValue = currentItem?.weightDimension?.value || '';
      const currentWeightUnit = currentItem?.weightDimension?.unit || '';
      if (editValues.weightValue !== currentWeightValue || editValues.weightUnit !== currentWeightUnit) {
        if (editValues.weightValue && editValues.weightUnit) {
          await updateInventoryItem(editingItem, 'weight-dimension', {
            weightValue: editValues.weightValue,
            weightUnit: editValues.weightUnit
          });
        }
      }

      // Update category if changed
      const currentCategory = currentItem?.category || '';
      if (editValues.category !== currentCategory) {
        await updateInventoryItem(editingItem, 'category', editValues.category);
      }

      cancelEditing();
    } catch (error) {
      // Error already handled in updateInventoryItem
    }
  };

  const deleteInventoryItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}" from the inventory? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Product deleted successfully');
          // Refresh the current page data
          fetchStoreDetails(currentPage, searchTerm, statusFilter, categoryFilter);
        } else {
          throw new Error(data.message || 'Failed to delete product');
        }
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const openImageViewer = (imageUrl, altText) => {
    setImageViewer({ isOpen: true, imageUrl, altText });
  };

  const closeImageViewer = () => {
    setImageViewer({ isOpen: false, imageUrl: '', altText: '' });
  };

  const toggleProductSelection = (product) => {
    setAddProductModal(prev => {
      const isSelected = prev.selectedProducts.some(p => p._id === product._id);
      if (isSelected) {
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.filter(p => p._id !== product._id)
        };
      } else {
        return {
          ...prev,
          selectedProducts: [...prev.selectedProducts, product]
        };
      }
    });
  };

  const openAddProductModal = () => {
    setAddProductModal(prev => ({ ...prev, isOpen: true, products: [], searchTerm: '', selectedProducts: [] }));
    searchGlobalProducts(''); // Load initial products
  };

  const closeAddProductModal = () => {
    setAddProductModal({ isOpen: false, products: [], loading: false, searchTerm: '', selectedProduct: null });
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      searchGlobalProducts(searchTerm);
    }, 500),
    []
  );

  const searchGlobalProducts = async (searchTerm) => {
    try {
      setAddProductModal(prev => ({ ...prev, loading: true }));
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products?search=${encodeURIComponent(searchTerm)}&limit=1000&page=1`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAddProductModal(prev => ({
            ...prev,
            products: data.products || [],
            loading: false
          }));
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error(error.message || 'Failed to search products');
      setAddProductModal(prev => ({ ...prev, loading: false }));
    }
  };

  const addProductToInventory = async () => {
    if (!addProductModal.selectedProducts.length) {
      toast.error('Please select at least one product to add');
      return;
    }

    try {
      // Add each selected product
      for (const product of addProductModal.selectedProducts) {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/add-product`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: 5 // Default quantity as requested
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `Failed to add ${product.name}`);
        }
      }

      toast.success(`${addProductModal.selectedProducts.length} product(s) added to inventory successfully`);
      closeAddProductModal();
      // Refresh the current page data
      fetchStoreDetails(currentPage, searchTerm, statusFilter, categoryFilter);
    } catch (error) {
      console.error('Error adding products:', error);
      toast.error(error.message || 'Failed to add some products');
    }
  };

  // Toggle store open/close status
  const toggleStoreStatus = async () => {
    if (!store) return;

    const newStatus = store.storeStatus === 'open' ? 'closed' : 'open';

    try {
      setUpdatingStoreStatus(true);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeStatus: newStatus
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`Store ${newStatus === 'open' ? 'opened' : 'closed'} successfully`);
          // Refetch store details to get updated lastOpenedAt
          await fetchStoreDetails(currentPage, searchTerm, statusFilter, categoryFilter);
        } else {
          throw new Error(data.message || 'Failed to update store status');
        }
      } else {
        throw new Error('Failed to update store status');
      }
    } catch (error) {
      console.error('Error toggling store status:', error);
      toast.error(error.message || 'Failed to update store status');
    } finally {
      setUpdatingStoreStatus(false);
    }
  };

  // Get unique categories for filter dropdown (from backend response)
  const categories = store?.inventory ? [...new Set(store.inventory.map(item => item.categoryName).filter(Boolean))] : [];

  if (checkingUser) {
    return (
      <Layout title="Public Store Details">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Public Store Details">
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
    <Layout title={store?.businessInfo?.displayName ? `${store.businessInfo.displayName} - Details` : "Public Store Details"}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/public-store')}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Public Stores
                </button>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    fetchStoreDetails(1, searchTerm, statusFilter, categoryFilter);
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh store data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Store Status Toggle */}
              {store && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    {store.storeStatus === 'open' ? 'Store Open' : 'Store Closed'}
                  </span>
                  <button
                    onClick={toggleStoreStatus}
                    disabled={updatingStoreStatus}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      store.storeStatus === 'open' ? 'bg-green-600' : 'bg-gray-200'
                    } ${updatingStoreStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        store.storeStatus === 'open' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {store?.brandingInfo?.logoUrl ? (
                <img
                  src={store.brandingInfo.logoUrl}
                  alt={`${store.businessInfo?.displayName} logo`}
                  className="w-8 h-8 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${store?.brandingInfo?.logoUrl ? 'hidden' : 'flex'}`}>
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {store?.businessInfo?.displayName || 'Public Store Details'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  ID: {store?.businessInfo?.merchantId} • View inventory and details
                </p>
              </div>
            </div>
          </div>

          {/* Store Info Cards */}
          {store && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {store.operationalInfo?.storeAddress?.city}, {store.operationalInfo?.storeAddress?.state}
                  </span>
                </div>
                {store.lastOpenedAt && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Last Opened: {new Date(store.lastOpenedAt).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Kolkata'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inventory Section */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  Store Inventory
                </h2>
                <button
                  onClick={openAddProductModal}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 border border-white border-opacity-30 rounded-lg transition-colors shadow-sm"
                  title="Add product to inventory"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search inventory by name, category, or product ID..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => handleCategoryFilterChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Inventory Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-red-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error loading inventory</h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {inventory.length === 0 ? (
                    <div className="col-span-full bg-gray-50 rounded-lg p-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-16 h-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
                        <p className="text-gray-500 max-w-md">
                          {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                            ? 'Try adjusting your search or filter criteria.'
                            : 'This store has no inventory items yet.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    inventory.map((item, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 flex items-center justify-center p-4">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openImageViewer(item.image, item.name)}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full rounded-lg bg-gray-200 flex items-center justify-center ${item.image ? 'hidden' : 'flex'}`}>
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 flex-1">
                              {item.name}
                            </h3>
                            <div className="flex gap-1 ml-2">
                              {editingItem === item._id ? (
                                <>
                                  <button
                                    onClick={saveChanges}
                                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                                    title="Save changes"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                    title="Cancel editing"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Edit stock and price"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteInventoryItem(item._id, item.name)}
                                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Category:</span>
                              {editingItem === item._id ? (
                                <input
                                  type="text"
                                  value={editValues.category}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                                  placeholder="Category"
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900">{item.category}</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Weight:</span>
                              {editingItem === item._id ? (
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editValues.weightValue}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, weightValue: e.target.value }))}
                                    placeholder="Value"
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                  />
                                  <select
                                    value={editValues.weightUnit}
                                    onChange={(e) => setEditValues(prev => ({ ...prev, weightUnit: e.target.value }))}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                  >
                                    <option value="">Unit</option>
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                    <option value="pcs">pcs</option>
                                  </select>
                                </div>
                              ) : (
                                <span className="text-sm font-medium text-gray-900">
                                  {item.weightDimension?.value && item.weightDimension?.unit
                                    ? `${item.weightDimension.value}${item.weightDimension.unit}`
                                    : 'N/A'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Stock:</span>
                              {editingItem === item._id ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editValues.quantity}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-900">
                                  {item.quantity}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Price:</span>
                              {editingItem === item._id ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editValues.price}
                                  onChange={(e) => setEditValues(prev => ({ ...prev, price: e.target.value }))}
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="text-lg font-bold text-green-600">
                                  ₹{item.price?.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              item.quantity > item.minStock
                                ? 'bg-green-100 text-green-800'
                                : item.quantity > 0
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.quantity > item.minStock ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!hasPrevPage || loading}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'text-blue-600 bg-blue-50 border border-blue-300'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={!hasNextPage || loading}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Image Viewer Modal */}
        {imageViewer.isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={closeImageViewer}
          >
            <div className="relative max-w-4xl max-h-screen p-4">
              <button
                onClick={closeImageViewer}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 text-gray-800 transition-colors z-10 shadow-lg"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={imageViewer.imageUrl}
                alt={imageViewer.altText}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image
              />
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {addProductModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    Add Product to Inventory
                  </h3>
                  <button
                    onClick={closeAddProductModal}
                    className="text-white hover:text-gray-200 transition-colors"
                    title="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search products by name, brand, HSN code, or tags..."
                      value={addProductModal.searchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAddProductModal(prev => ({ ...prev, searchTerm: value }));
                        debouncedSearch(value);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>

                {/* Products List */}
                <div className="max-h-96 overflow-y-auto">
                  {addProductModal.loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : addProductModal.products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-500">
                        {addProductModal.searchTerm ? 'Try adjusting your search terms.' : 'No products available.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addProductModal.products.map((product) => (
                        <div
                          key={product._id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            addProductModal.selectedProducts.some(p => p._id === product._id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => toggleProductSelection(product)}
                        >
                          <div className="flex items-center gap-4">
                            {/* Product Image */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {product.thumbnail ? (
                                <img
                                  src={product.thumbnail}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="w-8 h-8 text-gray-400" />
                              )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-semibold text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span>Category: {product.category?.name || product.category || 'N/A'}</span>
                                {product.brand && <span>Brand: {typeof product.brand === 'object' ? product.brand.name : product.brand}</span>}
                                {product.weightDimension?.value && product.weightDimension?.unit && (
                                  <span>Weight: {product.weightDimension.value}{product.weightDimension.unit}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-lg font-bold text-green-600">
                                  ₹{product.pricing?.mrp?.toFixed(2) || '0.00'}
                                </span>
                                {product.hsnCode && (
                                  <span className="text-sm text-gray-500">HSN: {product.hsnCode}</span>
                                )}
                              </div>
                            </div>

                            {/* Selection Indicator */}
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={addProductModal.selectedProducts.some(p => p._id === product._id)}
                                onChange={() => toggleProductSelection(product)}
                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {addProductModal.selectedProducts.length > 0 && (
                      <span>{addProductModal.selectedProducts.length} product(s) selected</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={closeAddProductModal}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addProductToInventory}
                      disabled={!addProductModal.selectedProducts.length}
                      className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Selected ({addProductModal.selectedProducts.length})
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PublicStoreDetails;