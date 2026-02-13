import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Search, AlertTriangle, CheckCircle, XCircle, Edit, Save, X, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, TreePine, Trash2, Plus, Check } from 'lucide-react';
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
  const [eventsFilter, setEventsFilter] = useState('all');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [stockCounts, setStockCounts] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });
  const [editingWeight, setEditingWeight] = useState(null);
  const [editedWeightValue, setEditedWeightValue] = useState('');
  const [editedWeightUnit, setEditedWeightUnit] = useState('');
  const [editingMarkupPrice, setEditingMarkupPrice] = useState(null);
  const [editedMarkupPrice, setEditedMarkupPrice] = useState('');

  // Add Product Modal States
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productHasMore, setProductHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState([]);
  const [addingProduct, setAddingProduct] = useState(null);
  const [productCart, setProductCart] = useState([]);

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
      if (params.events !== undefined) {
        query.append('events', params.events);
      } else if (eventsFilter !== 'all') {
        query.append('events', eventsFilter);
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

          // Extract unique categories from inventory
          const categories = [...new Set(data.merchant.inventory?.map(item => item.category) || [])];
          setAvailableCategories(categories.sort());
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
  }, [id, navigate, page, searchTerm, statusFilter, categoryFilter, eventsFilter]);

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

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && id) {
      fetchMerchantInventory();
    }
  }, [currentUser, id, fetchMerchantInventory]);

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

  const handleEventsFilter = (events) => {
    setEventsFilter(events);
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setEventsFilter('all');
    setSearchTerm('');
    setPendingSearch('');
    setPage(1);
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

  const handleToggleChristmas = async (item) => {
    const isChristmas = item.events?.includes('C2025');
    const updatedEvents = isChristmas
      ? (item.events || []).filter(event => event !== 'C2025')
      : [...(item.events || []), 'C2025'];

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/events`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: updatedEvents }),
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
          toast.success(isChristmas ? 'Removed from Christmas collection' : 'Added to Christmas collection');
          // Update local state
          setInventory(prev => prev.map(inv =>
            inv._id === item._id
              ? { ...inv, events: updatedEvents }
              : inv
          ));
        } else {
          throw new Error(data.message || 'Failed to update Christmas status');
        }
      } else {
        throw new Error('Failed to update Christmas status');
      }
    } catch (error) {
      console.error('Error updating Christmas status:', error);
      toast.error(error.message || 'Failed to update Christmas status');
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

  // Fetch available products for adding to inventory
  const fetchAvailableProducts = useCallback(async (pageNum = 1, search = '', category = '', isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setProductLoading(true);
      }

      const query = new URLSearchParams();
      query.append('page', pageNum.toString());
      query.append('limit', '20');
      if (search) query.append('search', search);
      if (category && category !== 'all') query.append('category', category);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products?${query}`, {
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
          const products = data.products.map(product => ({
            _id: product._id,
            name: product.name,
            category: product.category?.name || 'Unknown',
            price: product.pricing?.mrp || 0,
            image: product.thumbnail,
            weightDimension: product.weightDimension,
            hsnCode: product.hsnCode,
            brand: product.brand,
            description: product.description,
          }));

          if (isLoadMore) {
            setAvailableProducts(prev => [...prev, ...products]);
          } else {
            setAvailableProducts(products);
          }

          setProductHasMore(data.products.length === 20); // Assuming limit is 20
          setProductPage(pageNum);
        } else {
          throw new Error(data.message || 'Failed to fetch products');
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setProductLoading(false);
    }
  }, [navigate]);

  // Fetch product categories
  const fetchProductCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductCategories(data.categories || []);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [navigate]);

  // Add product to cart
  const handleAddToCart = (product) => {
    if (productCart.find(item => item._id === product._id)) {
      toast.info(`${product.name} is already in cart`);
      return;
    }
    setProductCart(prev => [...prev, product]);
    toast.success(`${product.name} added to cart`);
  };

  // Remove product from cart
  const handleRemoveFromCart = (productId) => {
    setProductCart(prev => prev.filter(item => item._id !== productId));
  };

  // Add all products in cart to merchant inventory
  const handleAddCartToInventory = async () => {
    if (productCart.length === 0) {
      toast.error('No products in cart');
      return;
    }

    setAddingProduct('cart');
    try {
      const promises = productCart.map(product =>
        fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/add-product`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: product._id,
            quantity: 5, // Default quantity
          }),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      const successful = results.filter(result => result.success).length;
      const failed = results.length - successful;

      if (successful > 0) {
        toast.success(`Successfully added ${successful} product${successful > 1 ? 's' : ''} to inventory`);
        setShowAddProductModal(false);
        setProductCart([]);
        // Refetch inventory to show the new items
        fetchMerchantInventory({ page: 1, search: '' });
      }

      if (failed > 0) {
        toast.error(`Failed to add ${failed} product${failed > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error adding products to inventory:', error);
      toast.error('Failed to add products to inventory');
    } finally {
      setAddingProduct(null);
    }
  };

  // Handle opening add product modal
  const openAddProductModal = () => {
    setShowAddProductModal(true);
    setProductSearchQuery('');
    setSelectedCategory('all');
    setProductPage(1);
    setProductHasMore(true);
    setProductCart([]); // Reset cart
    fetchProductCategories();
    fetchAvailableProducts(1, '', 'all');
  };

  // Handle product search
  const handleProductSearch = () => {
    setProductPage(1);
    setProductHasMore(true);
    fetchAvailableProducts(1, productSearchQuery, selectedCategory);
  };

  // Handle category filter change
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setProductPage(1);
    setProductHasMore(true);
    fetchAvailableProducts(1, productSearchQuery, category);
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
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Events Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Events:</span>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'christmas', label: 'Christmas', color: 'bg-green-100 text-green-700 hover:bg-green-200' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => handleEventsFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        eventsFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {key === 'christmas' && <TreePine className="h-3 w-3 inline mr-1" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || categoryFilter !== 'all' || eventsFilter !== 'all' || searchTerm) && (
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
                onClick={openAddProductModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
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
                                  className="h-12 w-12 rounded-lg object-cover mr-4 border border-gray-200"
                                  src={item.image}
                                  alt={item.name}
                                />
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  <TreePine
                                    className={`h-4 w-4 cursor-pointer transition-colors ${
                                      item.events?.includes('C2025') ? 'text-green-600' : 'text-gray-400'
                                    }`}
                                    onClick={() => handleToggleChristmas(item)}
                                    title={item.events?.includes('C2025') ? 'Remove from Christmas collection' : 'Add to Christmas collection'}
                                  />
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-hidden flex flex-col">
            <div className="mt-3 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Products to Inventory</h3>
                <button
                  onClick={() => setShowAddProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Left side - Product search and list */}
              <div className="flex-1 pr-4 border-r border-gray-200">
                {/* Search and Filter */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleProductSearch()}
                          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleProductSearch}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                      Search
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">All Categories</option>
                      {productCategories.map(category => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Products List */}
                <div className="max-h-96 overflow-y-auto">
                  {productLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-600">Loading products...</span>
                    </div>
                  ) : availableProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No products found</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Try adjusting your search terms or category filter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableProducts.map((product) => {
                        const isInCart = productCart.find(item => item._id === product._id);
                        return (
                          <div key={product._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                              {product.image && (
                                <img
                                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                                  src={product.image}
                                  alt={product.name}
                                />
                              )}
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                                <p className="text-sm text-gray-500">{product.category}</p>
                                <p className="text-sm text-gray-600">₹{product.price}</p>
                                {product.weightDimension && (
                                  <p className="text-xs text-gray-500">
                                    {product.weightDimension.value} {product.weightDimension.unit}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={isInCart}
                              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isInCart
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {isInCart ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  In Cart
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Load More */}
                {productHasMore && !productLoading && availableProducts.length > 0 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => fetchAvailableProducts(productPage + 1, productSearchQuery, selectedCategory, true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </div>

              {/* Right side - Cart */}
              <div className="flex-1 pl-4 flex flex-col">
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Cart ({productCart.length})</h4>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {productCart.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">Cart is empty</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Add products from the left panel to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productCart.map((product) => (
                        <div key={product._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-green-50">
                          <div className="flex items-center space-x-4">
                            {product.image && (
                              <img
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                                src={product.image}
                                alt={product.name}
                              />
                            )}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-500">{product.category}</p>
                              <p className="text-sm text-gray-600">₹{product.price}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(product._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {productCart.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleAddCartToInventory}
                      disabled={addingProduct === 'cart'}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingProduct === 'cart' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding Products...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add {productCart.length} Product{productCart.length > 1 ? 's' : ''} to Inventory
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MerchantInventory;