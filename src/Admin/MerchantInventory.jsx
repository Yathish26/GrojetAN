import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Search, AlertTriangle, CheckCircle, XCircle, Edit, Save, X, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, Trash2, Plus, Check, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

const MerchantInventory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pendingSearch, setPendingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [allCategories, setAllCategories] = useState([]);
  const [stockCounts, setStockCounts] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });
  const [editingWeight, setEditingWeight] = useState(null);
  const [editedWeightValue, setEditedWeightValue] = useState('');
  const [editedWeightUnit, setEditedWeightUnit] = useState('');
  const [editingMarkupPrice, setEditingMarkupPrice] = useState(null);
  const [editedMarkupPrice, setEditedMarkupPrice] = useState('');

  // Product modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch merchant details with inventory
  const fetchMerchantInventory = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      query.append('page', params.page || page);
      query.append('limit', '20'); // Fixed limit for now
      if (params.search !== undefined) {
        query.append('search', params.search);
      } else if (searchTerm) {
        query.append('search', searchTerm);
      }
      if (params.status !== undefined) {
        query.append('status', params.status);
      } else if (statusFilter !== 'all') {
        query.append('status', statusFilter);
      }
      if (params.category !== undefined) {
        query.append('category', params.category);
      } else if (categoryFilter !== 'all') {
        query.append('category', categoryFilter);
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}?${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          setMerchant(data.merchant);
          setInventory(data.merchant.inventory || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalItems(data.pagination?.totalItems || 0);
          setStockCounts(data.stockCounts || { inStock: 0, lowStock: 0, outOfStock: 0 });

          // Categories are fetched separately
        } else {
          throw new Error(data.message || 'Failed to fetch merchant inventory');
        }
      } else {
        throw new Error('Failed to fetch merchant inventory');
      }
    } catch (error) {
      console.error('Error fetching merchant inventory:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to load merchant inventory');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, page, searchTerm, statusFilter, categoryFilter]);

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
      return;
    } finally {
      setCheckingUser(false);
    }
  };

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}?limit=1000`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          const categories = [...new Set(data.merchant.inventory?.map(item => item.category) || [])];
          setAllCategories(categories.sort());
        }
      }
    } catch (error) {
      console.error('Error fetching all categories:', error);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && id) {
      fetchAllCategories();
      fetchMerchantInventory();
    }
  }, [currentUser, id, fetchAllCategories, fetchMerchantInventory]);

  // Filter inventory based on search term (removed - now handled by backend)
  // const filteredInventory = inventory.filter(item =>
  //   item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   item.productId.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // Use inventory directly since backend handles filtering
  const filteredInventory = inventory;

  // Search handler
  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    setPage(1); // Reset to first page when searching
  };

  // Filter handlers
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1); // Reset to first page when filtering
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
    setPendingSearch('');
    setPage(1);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/export-excel`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `merchant_${id}_inventory.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Inventory exported successfully');
      } else {
        toast.error('Failed to export inventory');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory');
    }
  };

  // Restock out of stock items
  const handleRestock = async () => {
    if (!window.confirm('Are you sure you want to restock all out of stock items? This will add 1 unit to each item that is currently out of stock.')) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/restock`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success(`Successfully restocked ${data.restockedCount} items`);
          // Refetch inventory to show updated stock
          fetchMerchantInventory({ page, search: searchTerm });
        } else {
          throw new Error(data.message || 'Failed to restock items');
        }
      } else {
        throw new Error('Failed to restock items');
      }
    } catch (error) {
      console.error('Error restocking items:', error);
      toast.error(error.message || 'Failed to restock items');
    } finally {
      setUpdating(false);
    }
  };

  // Make all items out of stock
  const handleMakeOutOfStock = async () => {
    if (!window.confirm('Are you sure you want to make all items out of stock? This will set the quantity of all in-stock items to 0.')) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/make-out-of-stock`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success(`Successfully made ${data.data.updatedCount} items out of stock`);
          // Refetch inventory to show updated stock
          fetchMerchantInventory({ page, search: searchTerm });
        } else {
          throw new Error(data.message || 'Failed to make items out of stock');
        }
      } else {
        throw new Error('Failed to make items out of stock');
      }
    } catch (error) {
      console.error('Error making items out of stock:', error);
      toast.error(error.message || 'Failed to make items out of stock');
    } finally {
      setUpdating(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: XCircle };
    if (quantity <= minStock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const handleEditPrice = (item) => {
    setEditingItem(item._id);
    setEditedPrice(item.price.toString());
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditedPrice('');
  };

  const handleSavePrice = async (item) => {
    const newPrice = parseFloat(editedPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/price`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: newPrice }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Price updated successfully');
          setEditingItem(null);
          setEditedPrice('');
          // Refetch the current page to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm });
        } else {
          throw new Error(data.message || 'Failed to update price');
        }
      } else {
        throw new Error('Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error.message || 'Failed to update price');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditWeight = (item) => {
    setEditingWeight(item._id);
    setEditedWeightValue(item.weightDimension?.value?.toString() || '');
    setEditedWeightUnit(item.weightDimension?.unit || '');
  };

  const handleCancelEditWeight = () => {
    setEditingWeight(null);
    setEditedWeightValue('');
    setEditedWeightUnit('');
  };

  const handleSaveWeight = async (item) => {
    const value = parseFloat(editedWeightValue);
    const unit = editedWeightUnit.trim();
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid weight value');
      return;
    }
    if (!unit) {
      toast.error('Please enter a valid weight unit');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/weight-dimension`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, unit }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Weight dimension updated successfully');
          setEditingWeight(null);
          setEditedWeightValue('');
          setEditedWeightUnit('');
          // Refetch the current page to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm });
        } else {
          throw new Error(data.message || 'Failed to update weight dimension');
        }
      } else {
        throw new Error('Failed to update weight dimension');
      }
    } catch (error) {
      console.error('Error updating weight dimension:', error);
      toast.error(error.message || 'Failed to update weight dimension');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditMarkupPrice = (item) => {
    setEditingMarkupPrice(item._id);
    setEditedMarkupPrice(item.markupPrice?.toString() || '0');
  };

  const handleCancelEditMarkupPrice = () => {
    setEditingMarkupPrice(null);
    setEditedMarkupPrice('');
  };

  const handleSaveMarkupPrice = async (item) => {
    const markupPrice = parseFloat(editedMarkupPrice);
    if (isNaN(markupPrice) || markupPrice < 0) {
      toast.error('Please enter a valid markup price');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/markup-price`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markupPrice }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Markup price updated successfully');
          setEditingMarkupPrice(null);
          setEditedMarkupPrice('');
          // Refetch the current page to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm });
        } else {
          throw new Error(data.message || 'Failed to update markup price');
        }
      } else {
        throw new Error('Failed to update markup price');
      }
    } catch (error) {
      console.error('Error updating markup price:', error);
      toast.error(error.message || 'Failed to update markup price');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from this merchant's inventory? This action cannot be undone.`)) {
      return;
    }

    setRemoving(item._id);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Item removed from inventory successfully');
          // Remove from local state
          setInventory(prev => prev.filter(inv => inv._id !== item._id));
          // Refetch to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm });
        } else {
          throw new Error(data.message || 'Failed to remove item');
        }
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  // Handle opening product details modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  if (checkingUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading inventory</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchMerchantInventory}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/merchants/${id}`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Merchant
                </button>
                <div className="border-l border-gray-300 pl-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {merchant?.businessInfo?.displayName || 'Merchant'} Inventory
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Merchant ID: <span className="font-mono text-gray-700">{merchant?.businessInfo?.merchantId || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search inventory by name, category, or product ID..."
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'low_stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                    { key: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => handleStatusFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        statusFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Restock Button */}
          <div className="mb-8">
            <div className="flex gap-4">
              <button
                onClick={handleRestock}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Restocking...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Restock Out of Stock
                  </>
                )}
              </button>
              <button
                onClick={handleMakeOutOfStock}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Make All Out of Stock
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/merchants/${id}/inventory/add`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Restock adds 1 unit to out of stock items • Make out of stock sets all in-stock items to 0
            </p>
          </div>

          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{totalItems}</dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">In Stock</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stockCounts.inStock}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stockCounts.lowStock}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stockCounts.outOfStock}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
                <div className="text-sm text-gray-500">
                  {totalItems} total items
                </div>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No inventory items found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'This merchant has no inventory items yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Markup Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item, index) => {
                      const stockStatus = getStockStatus(item.quantity, item.minStock);
                      const StatusIcon = stockStatus.icon;

                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {item.image && (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover mr-4 border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  src={item.image}
                                  alt={item.name}
                                  onClick={() => openProductModal(item)}
                                />
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingWeight === item._id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={editedWeightValue}
                                  onChange={(e) => setEditedWeightValue(e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  min="0"
                                  step="0.01"
                                  placeholder="Value"
                                  disabled={updating}
                                />
                                <select
                                  value={editedWeightUnit}
                                  onChange={(e) => setEditedWeightUnit(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  disabled={updating}
                                >
                                  <option value="">Select Unit</option>
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                  <option value="ml">ml</option>
                                  <option value="l">l</option>
                                  <option value="pack">pack</option>
                                  <option value="piece">piece</option>
                                  <option value="unit">unit</option>
                                  <option value="dozen">dozen</option>
                                  <option value="cm">cm</option>
                                  <option value="mm">mm</option>
                                  <option value="inch">inch</option>
                                  <option value="feet">feet</option>
                                  <option value="meter">meter</option>
                                  <option value="other">other</option>
                                </select>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-900">
                                {item.weightDimension ? `${item.weightDimension.value} ${item.weightDimension.unit}` : 'N/A'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">
                              {item.quantity} / {item.maxStock}
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {item.minStock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {editingItem === item._id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={editedPrice}
                                  onChange={(e) => setEditedPrice(e.target.value)}
                                  className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  min="0"
                                  step="0.01"
                                  disabled={updating}
                                />
                              </div>
                            ) : (
                              <span className="text-lg">₹{item.price}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {editingMarkupPrice === item._id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={editedMarkupPrice}
                                  onChange={(e) => setEditedMarkupPrice(e.target.value)}
                                  className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  min="0"
                                  step="0.01"
                                  disabled={updating}
                                />
                              </div>
                            ) : (
                              <span className="text-lg">₹{item.markupPrice || 0}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              <StatusIcon size={14} />
                              {stockStatus.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingItem === item._id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                  onClick={() => handleSavePrice(item)}
                                  disabled={updating}
                                >
                                  <Save size={14} className="mr-1" />
                                  Save
                                </button>
                                <button
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                  onClick={handleCancelEdit}
                                  disabled={updating}
                                >
                                  <X size={14} className="mr-1" />
                                  Cancel
                                </button>
                              </div>
                            ) : editingWeight === item._id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                  onClick={() => handleSaveWeight(item)}
                                  disabled={updating}
                                >
                                  <Save size={14} className="mr-1" />
                                  Save
                                </button>
                                <button
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                  onClick={handleCancelEditWeight}
                                  disabled={updating}
                                >
                                  <X size={14} className="mr-1" />
                                  Cancel
                                </button>
                              </div>
                            ) : editingMarkupPrice === item._id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                  onClick={() => handleSaveMarkupPrice(item)}
                                  disabled={updating}
                                >
                                  <Save size={14} className="mr-1" />
                                  Save
                                </button>
                                <button
                                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                  onClick={handleCancelEditMarkupPrice}
                                  disabled={updating}
                                >
                                  <X size={14} className="mr-1" />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                  onClick={() => handleEditPrice(item)}
                                >
                                  <Edit size={14} className="mr-1.5" />
                                  Edit Price
                                </button>
                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                  onClick={() => handleEditWeight(item)}
                                >
                                  <Edit size={14} className="mr-1.5" />
                                  Edit Weight
                                </button>
                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                                  onClick={() => handleEditMarkupPrice(item)}
                                >
                                  <Edit size={14} className="mr-1.5" />
                                  Edit Markup Price
                                </button>
                                <button
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                                  onClick={() => handleRemoveItem(item)}
                                  disabled={removing === item._id}
                                >
                                  {removing === item._id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700 mr-1.5"></div>
                                      Removing...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 size={14} className="mr-1.5" />
                                      Remove
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{inventory.length ? ((page - 1) * 20 + 1) : 0}</span> to{' '}
                  <span className="font-medium">{inventory.length ? ((page - 1) * 20 + inventory.length) : 0}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                    Page {page} of {totalPages}
                  </span>
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 z-40 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowProductModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-60">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {selectedProduct.image && (
                      <img
                        className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                      />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-500">Category: {selectedProduct.category}</p>
                      {selectedProduct.brand && (
                        <p className="text-sm text-gray-500">Brand: {selectedProduct.brand}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pricing Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">MRP:</span>
                        <span className="text-sm font-medium">₹{selectedProduct.price}</span>
                      </div>
                      {selectedProduct.markupPrice && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Markup Price:</span>
                          <span className="text-sm font-medium">₹{selectedProduct.markupPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Details</h4>
                    <div className="space-y-2">
                      {selectedProduct.weightDimension && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Weight:</span>
                          <span className="text-sm font-medium">
                            {selectedProduct.weightDimension.value} {selectedProduct.weightDimension.unit}
                          </span>
                        </div>
                      )}
                      {selectedProduct.hsnCode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">HSN Code:</span>
                          <span className="text-sm font-medium">{selectedProduct.hsnCode}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Stock:</span>
                        <span className="text-sm font-medium">{selectedProduct.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Min Stock:</span>
                        <span className="text-sm font-medium">{selectedProduct.minStock}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProduct.description}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 sm:ml-3 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default MerchantInventory;