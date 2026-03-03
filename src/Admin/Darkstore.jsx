import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import { ChevronLeft, ChevronRight, Eye, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from 'react-modal';

Modal.setAppElement('#root');

const PAGE_SIZE = 20;

const Darkstore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [darkstoreProducts, setDarkstoreProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Darkstore pagination states
  const [darkstorePage, setDarkstorePage] = useState(1);
  const [darkstoreTotalPages, setDarkstoreTotalPages] = useState(1);
  const [darkstoreTotalProducts, setDarkstoreTotalProducts] = useState(0);

  // Darkstore search state
  const [darkstoreSearchTerm, setDarkstoreSearchTerm] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [seller, setSeller] = useState('');

  // Filters state
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', sort: 'name_asc' });
  const [darkstoreFilters, setDarkstoreFilters] = useState({ category: '', sort: 'name_asc' });

  // View modal states
  const [viewProduct, setViewProduct] = useState(null);
  const [viewModalIsOpen, setViewModalIsOpen] = useState(false);

  // Image viewer states
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  // Bulk selection states
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Quantity changes state
  const [quantityChanges, setQuantityChanges] = useState({});

  const isAddMode = location.pathname.endsWith('/add');

  const darkstoreLookup = useMemo(() => {
    const idSet = new Set();
    const nameSet = new Set();

    darkstoreProducts.forEach(product => {
      if (product.productId) {
        idSet.add(product.productId.toString());
      }
      if (product.name) {
        nameSet.add(product.name.toLowerCase());
      }
    });

    return { idSet, nameSet };
  }, [darkstoreProducts]);

  const isProductAlreadyInDarkstore = useCallback((product) => {
    if (!product) return false;

    const productId = product._id?.toString();
    if (productId && darkstoreLookup.idSet.has(productId)) {
      return true;
    }

    const productName = product.name?.toLowerCase();
    return productName ? darkstoreLookup.nameSet.has(productName) : false;
  }, [darkstoreLookup]);

  const fetchDarkstoreProducts = useCallback(async (pageNum = 1, search = '') => {
    setLoading(true);
    setError('');
    setSelectedProducts([]);
    try {
      const query = new URLSearchParams();
      query.append('page', pageNum);
      query.append('limit', PAGE_SIZE);

      // Add search if present
      if (search.trim()) {
        query.append('search', search.trim());
      }

      // Add category filter
      if (darkstoreFilters.category) {
        query.append('category', darkstoreFilters.category);
      }

      // Add sort filter
      if (darkstoreFilters.sort) {
        query.append('sort', darkstoreFilters.sort);
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/darkstore?${query}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch darkstore products');
      }

      const data = await response.json();

      if (data.tokenValid === false) {
        throw new Error('Session expired. Please log in again.');
      }

      setDarkstoreProducts(data.products || []);
      const changes = {};
      (data.products || []).forEach(product => {
        changes[product._id] = product.quantity;
      });
      setQuantityChanges(changes);
      setDarkstoreTotalPages(data.totalPages || 1);
      setDarkstoreTotalProducts(data.total || 0);
      setDarkstorePage(pageNum);
    } catch (err) {
      setError(err.message || 'Unable to load darkstore products');
    } finally {
      setLoading(false);
    }
  }, [darkstoreFilters]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      if (data.tokenValid === false) {
        throw new Error('Session expired. Please log in again.');
      }
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchDarkstoreProducts();
  }, [fetchDarkstoreProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Refetch products when filters change
  useEffect(() => {
    if (isAddMode) {
      fetchProducts(1);
    }
  }, [filters, isAddMode]);

  // Refetch darkstore products when darkstore filters change
  useEffect(() => {
    if (!isAddMode) {
      fetchDarkstoreProducts(1, darkstoreSearchTerm);
    }
  }, [darkstoreFilters, isAddMode]);


  const fetchProducts = useCallback(async (pageNum = page) => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      query.append('page', pageNum);
      query.append('limit', PAGE_SIZE);

      // Add search if present
      if (searchTerm.trim()) {
        query.append('search', searchTerm.trim());
      }

      // Add category filter
      if (filters.category) {
        query.append('category', filters.category);
      }

      // Add sort filter
      if (filters.sort) {
        query.append('sort', filters.sort);
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products?${query}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      if (data.tokenValid === false) {
        throw new Error('Session expired. Please log in again.');
      }

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || 'Unable to load products');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filters]);

  const handleEnterAddMode = () => {
    setPage(1); // Reset to first page when opening
    fetchProducts(1);
    navigate('/darkstore/add');
  };

  const handleExitAddMode = () => {
    setCart([]); // Clear cart when exiting
    setDarkstorePage(1); // Reset to first page when returning to darkstore
    setDarkstoreSearchTerm(''); // Clear search when returning to darkstore
    setSelectedProducts([]); // Clear selected products
    fetchDarkstoreProducts(1);
    navigate('/darkstore');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProducts(newPage);
    }
  };

  const handleDarkstorePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= darkstoreTotalPages) {
      fetchDarkstoreProducts(newPage, darkstoreSearchTerm);
    }
  };

  const handleDarkstoreSearch = () => {
    fetchDarkstoreProducts(1, darkstoreSearchTerm); // Reset to first page when searching
  };

  const handleSearch = () => {
    fetchProducts(1); // Reset to first page when searching
  };

  // Filter handlers
  const handleCategoryFilter = (e) => {
    setFilters(prev => ({ ...prev, category: e.target.value }));
  };

  const handleSortFilter = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  const handleDarkstoreCategoryFilter = (e) => {
    setDarkstoreFilters(prev => ({ ...prev, category: e.target.value }));
  };

  const handleDarkstoreSortFilter = (e) => {
    setDarkstoreFilters(prev => ({ ...prev, sort: e.target.value }));
  };

  // View modal handlers
  const openViewModal = (product) => {
    setViewProduct(product);
    setViewModalIsOpen(true);
  };
  const closeViewModal = () => {
    setViewModalIsOpen(false);
    setViewProduct(null);
  };

  // Image viewer handlers
  const openImageViewer = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };
  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUrl(null);
  };

  // Bulk selection handlers
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === darkstoreProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(darkstoreProducts.map(p => p._id));
    }
  };

  const handleBulkRemove = async () => {
    if (selectedProducts.length === 0) return;
    const productNames = darkstoreProducts.filter(p => selectedProducts.includes(p._id)).map(p => p.name).join(', ');
    if (!window.confirm(`Are you sure you want to remove the following products: ${productNames}?`)) {
      return;
    }

    try {
      for (const productId of selectedProducts) {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/darkstore/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`Failed to remove product ${productId}`);
        }
      }
      toast.success('Selected products removed from darkstore successfully');
      setSelectedProducts([]);
      fetchDarkstoreProducts(darkstorePage);
    } catch (err) {
      console.error('Bulk remove error:', err);
      toast.error(err.message || 'Failed to remove selected products');
    }
  };

  // Remove product from darkstore
  const removeFromDarkstore = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the darkstore?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/darkstore/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove product from darkstore');
      }

      const data = await response.json();
      toast.success(data.message || 'Product removed from darkstore successfully');
      
      // Refresh the darkstore products list
      fetchDarkstoreProducts(darkstorePage);
    } catch (err) {
      console.error('Remove from darkstore error:', err);
      toast.error(err.message || 'Failed to remove product from darkstore');
    }
  };

  // Update product quantity in darkstore
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/darkstore/${productId}/quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }

      const data = await response.json();
    } catch (err) {
      console.error('Update quantity error:', err);
      throw err;
    }
  };

  const addToCart = (product) => {
    if (isProductAlreadyInDarkstore(product)) {
      toast.error('Product has already been added to darkstore');
      return;
    }
    const existingProduct = cart.find(item => item._id === product._id);
    if (existingProduct) {
      toast.error('Product already added to cart');
      return;
    }
    setCart(prevCart => [...prevCart, { ...product, quantity: 1 }]);
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId) => {
    const product = cart.find(item => item._id === productId);
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
    if (product) {
      toast.success(`${product.name} removed from cart`);
    }
  };

  const filteredProducts = useMemo(() => {
    return products; // Server-side filtering now
  }, [products]);
  return (
    <Layout title="Darkstore">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${cart.length > 0 ? 'lg:mr-80' : ''} transition-all duration-300`}>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full">
          {!isAddMode && (
            <button onClick={handleEnterAddMode} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center w-full sm:w-auto sm:ml-auto">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Products
            </button>
          )}
          {isAddMode && (
            <button onClick={handleExitAddMode} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center justify-center w-full sm:w-auto sm:ml-auto">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Darkstore
            </button>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="p-4 border-b border-neutral-200 bg-black mb-6 flex justify-center">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h1 className="text-2xl font-bold text-white">Darkstore</h1>
            </div>
          </div>

          {isAddMode ? (
            // Add Products Mode
            <div className="mt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col sm:flex-row w-full gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, brand, or category"
                    className="w-full sm:w-80 border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleSearch}
                      className="inline-flex items-center justify-center gap-2 bg-green-100 text-neutral-800 px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-200 w-full sm:w-auto"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({ category: '', sort: 'name_asc' });
                        fetchProducts(1);
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-green-100 text-neutral-800 px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-200 w-full sm:w-auto"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">Category:</span>
                    <select
                      value={filters.category}
                      onChange={handleCategoryFilter}
                      className="px-3 py-2 text-sm border border-neutral-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">Sort by:</span>
                    <select
                      value={filters.sort}
                      onChange={handleSortFilter}
                      className="px-3 py-2 text-sm border border-neutral-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    >
                      <option value="name_asc">A - Z</option>
                      <option value="name_desc">Z - A</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="created_desc">Newest First</option>
                      <option value="created_asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-4 border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-[550px] overflow-y-auto">
                {!loading && filteredProducts.length > 0 && (
                  <div className="hidden md:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-neutral-200 font-medium text-sm">
                    <span className="flex-1">Product</span>
                    <span className="min-w-[100px] text-right">Price</span>
                    <span className="min-w-[120px] text-center">Actions</span>
                  </div>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-neutral-500">Loading products…</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500">No products found.</div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      {filteredProducts.map(product => {
                        const alreadyInDarkstore = isProductAlreadyInDarkstore(product);
                        return (
                          <div key={product._id} className="flex items-center gap-4 px-4 py-3">
                            <div className="flex items-center flex-1 min-w-0">
                              {product.thumbnail && (
                                <div className="flex-shrink-0 h-10 w-10 mr-3">
                                  <img
                                    className="h-10 w-10 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                    src={product.thumbnail}
                                    alt={product.name}
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-neutral-900 truncate">{product.name}</div>
                                <div className="text-sm text-neutral-600 truncate">
                                  {product.brand ? `${product.brand} • ` : ''}{product.category?.name || 'Uncategorized'}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-neutral-600 whitespace-nowrap text-right min-w-[100px]">
                              {product.pricing?.mrp ? `₹${product.pricing.mrp}` : 'No price'}
                            </div>
                            <div className="flex items-center justify-center gap-2 min-w-[120px]">
                              <button
                                onClick={() => openViewModal(product)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {alreadyInDarkstore ? (
                                <div className="flex items-center justify-center px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm font-medium border border-amber-200">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  In Darkstore
                                </div>
                              ) : cart.some(item => item._id === product._id) ? (
                                <div className="flex items-center justify-center px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium border border-green-200">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Added
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(product)}
                                  className="flex items-center justify-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="md:hidden divide-y divide-neutral-200">
                      {filteredProducts.map(product => {
                        const alreadyInDarkstore = isProductAlreadyInDarkstore(product);
                        return (
                          <div key={product._id} className="px-4 py-3 space-y-3">
                            <div className="flex items-start gap-3">
                              {product.thumbnail && (
                                <img
                                  src={product.thumbnail}
                                  alt={product.name}
                                  className="h-14 w-14 rounded object-cover flex-shrink-0 border border-neutral-200"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-neutral-900 break-words">{product.name}</div>
                                <div className="text-sm text-neutral-600 break-words">
                                  {product.brand ? `${product.brand} • ` : ''}{product.category?.name || 'Uncategorized'}
                                </div>
                                <div className="text-sm text-neutral-700 mt-1">
                                  {product.pricing?.mrp ? `₹${product.pricing.mrp}` : 'No price'}
                                </div>
                              </div>
                              <button
                                onClick={() => openViewModal(product)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              {alreadyInDarkstore ? (
                                <div className="flex items-center justify-center px-3 py-1 bg-amber-100 text-amber-800 rounded text-sm font-medium border border-amber-200 w-full sm:w-auto">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  In Darkstore
                                </div>
                              ) : cart.some(item => item._id === product._id) ? (
                                <div className="flex items-center justify-center px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium border border-green-200 w-full sm:w-auto">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Added
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(product)}
                                  className="inline-flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium w-full sm:w-auto"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add to Cart
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-neutral-600 text-center md:text-left">
                    Showing page {page} of {totalPages}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      <ChevronLeft size={16} />
                      <span className="ml-1 hidden sm:inline">Previous</span>
                    </button>
                    <span className="px-2 text-sm">{page} / {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      <span className="mr-1 hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Darkstore Products Mode
            <div className="mt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col sm:flex-row w-full gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, brand, or category"
                    className="w-full sm:w-80 border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={darkstoreSearchTerm}
                    onChange={e => setDarkstoreSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDarkstoreSearch()}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleDarkstoreSearch}
                      className="inline-flex items-center justify-center gap-2 bg-green-100 text-neutral-800 px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-200 w-full sm:w-auto"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                    <button
                      onClick={() => {
                        setDarkstoreSearchTerm('');
                        setDarkstoreFilters({ category: '', sort: 'name_asc' });
                        fetchDarkstoreProducts(1);
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-green-100 text-neutral-800 px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-200 w-full sm:w-auto"
                      disabled={loading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">Category:</span>
                    <select
                      value={darkstoreFilters.category}
                      onChange={handleDarkstoreCategoryFilter}
                      className="px-3 py-2 text-sm border border-neutral-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">Sort by:</span>
                    <select
                      value={darkstoreFilters.sort}
                      onChange={handleDarkstoreSortFilter}
                      className="px-3 py-2 text-sm border border-neutral-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    >
                      <option value="name_asc">A - Z</option>
                      <option value="name_desc">Z - A</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="created_desc">Newest First</option>
                      <option value="created_asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={handleBulkRemove}
                    className="bg-red-500 text-white px-4 py-2 rounded flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Selected ({selectedProducts.length})
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-4 border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-[550px] overflow-y-auto">
                {!loading && darkstoreProducts.length > 0 && (
                  <div className="hidden md:flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-neutral-200 font-medium text-sm">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === darkstoreProducts.length && darkstoreProducts.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4"
                    />
                    <span>Select All</span>
                    <span className="flex-1">Product</span>
                    <div className="min-w-[140px] flex items-center gap-2">
                      <span>Quantity</span>
                    </div>
                    <span className="min-w-[70px] text-right">Price</span>
                    <span className="min-w-[80px] text-center">Weight</span>
                    <span className="min-w-[120px] text-center">Actions</span>
                  </div>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-neutral-500">Loading darkstore products…</div>
                ) : darkstoreProducts.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500">No products in darkstore.</div>
                ) : (
                  <>
                    <div className="hidden md:block">
                      {darkstoreProducts.map(product => (
                        <div key={product._id} className="flex items-center gap-4 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => handleSelectProduct(product._id)}
                            className="w-4 h-4"
                          />
                          <div className="flex items-center flex-1 min-w-0">
                            {product.thumbnail && (
                              <div className="flex-shrink-0 h-10 w-10 mr-3">
                                <img
                                  className="h-10 w-10 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  src={product.thumbnail}
                                  alt={product.name}
                                  onClick={() => openImageViewer(product.thumbnail)}
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-neutral-900 truncate">{product.name}</div>
                              <div className="text-sm text-neutral-600 truncate">
                                {product.brand ? `${product.brand} • ` : ''}{product.category_string || 'Uncategorized'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-2 min-w-[140px]">
                            <span className="text-xs text-neutral-500 font-medium">Qty:</span>
                            <div className="flex items-center border border-blue-200 rounded-md overflow-hidden">
                              <button
                                onClick={() => setQuantityChanges(prev => ({ ...prev, [product._id]: Math.max(0, (prev[product._id] !== undefined ? prev[product._id] : product.quantity) - 1) }))}
                                className="w-7 h-7 flex items-center justify-center text-blue-600 hover:text-blue-900 hover:bg-blue-50 border-r border-blue-200"
                                title="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-2 py-1 text-sm text-neutral-700 font-medium min-w-[30px] text-center bg-white">
                                {quantityChanges[product._id] !== undefined ? quantityChanges[product._id] : product.quantity}
                              </span>
                              <button
                                onClick={() => setQuantityChanges(prev => ({ ...prev, [product._id]: (prev[product._id] !== undefined ? prev[product._id] : product.quantity) + 1 }))}
                                className="w-7 h-7 flex items-center justify-center text-blue-600 hover:text-blue-900 hover:bg-blue-50 border-l border-blue-200"
                                title="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            {quantityChanges[product._id] !== product.quantity && (
                              <button
                                onClick={async () => {
                                  const newQty = quantityChanges[product._id] !== undefined ? quantityChanges[product._id] : product.quantity;
                                  if (newQty === product.quantity) {
                                    toast.info('No changes to update');
                                    return;
                                  }
                                  try {
                                    await updateQuantity(product._id, newQty);
                                    toast.success('Quantity updated successfully');
                                    // Update the local state
                                    setQuantityChanges(prev => ({ ...prev, [product._id]: newQty }));
                                    fetchDarkstoreProducts(darkstorePage);
                                  } catch (err) {
                                    toast.error('Failed to update quantity');
                                  }
                                }}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center hover:bg-green-600 ml-1"
                                title="Update Quantity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600 whitespace-nowrap text-right min-w-[70px]">
                            ₹{product.price}
                          </div>
                          <div className="text-sm text-neutral-600 whitespace-nowrap text-center min-w-[80px]">
                            {product.weightDimension?.value && product.weightDimension?.unit
                              ? `${product.weightDimension.value}${product.weightDimension.unit}`
                              : 'N/A'}
                          </div>
                          <div className="flex items-center justify-center gap-2 min-w-[120px]">
                            <button
                              onClick={() => openViewModal(product)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => removeFromDarkstore(product._id, product.name)}
                              className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-medium border border-red-300 rounded hover:bg-red-50"
                              title="Remove from Darkstore"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="md:hidden divide-y divide-neutral-200">
                      {darkstoreProducts.map(product => (
                        <div key={product._id} className="px-4 py-3 space-y-3">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => handleSelectProduct(product._id)}
                              className="mt-1 w-4 h-4"
                            />
                            {product.thumbnail && (
                              <img
                                src={product.thumbnail}
                                alt={product.name}
                                className="h-14 w-14 rounded object-cover flex-shrink-0 border border-neutral-200"
                                onClick={() => openImageViewer(product.thumbnail)}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-neutral-900 break-words">{product.name}</div>
                              <div className="text-sm text-neutral-600 break-words">
                                {product.brand ? `${product.brand} • ` : ''}{product.category_string || 'Uncategorized'}
                              </div>
                              <div className="text-sm text-neutral-700 mt-1">₹{product.price}</div>
                              <div className="text-xs text-neutral-500">
                                {product.weightDimension?.value && product.weightDimension?.unit
                                  ? `${product.weightDimension.value}${product.weightDimension.unit}`
                                  : 'Weight: N/A'}
                              </div>
                            </div>
                            <button
                              onClick={() => openViewModal(product)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center border border-blue-200 rounded-md overflow-hidden">
                              <button
                                onClick={() => setQuantityChanges(prev => ({ ...prev, [product._id]: Math.max(0, (prev[product._id] !== undefined ? prev[product._id] : product.quantity) - 1) }))}
                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-900 hover:bg-blue-50 border-r border-blue-200"
                                title="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-3 py-1 text-sm text-neutral-700 font-medium min-w-[40px] text-center bg-white">
                                {quantityChanges[product._id] !== undefined ? quantityChanges[product._id] : product.quantity}
                              </span>
                              <button
                                onClick={() => setQuantityChanges(prev => ({ ...prev, [product._id]: (prev[product._id] !== undefined ? prev[product._id] : product.quantity) + 1 }))}
                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-900 hover:bg-blue-50 border-l border-blue-200"
                                title="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            {quantityChanges[product._id] !== product.quantity && (
                              <button
                                onClick={async () => {
                                  const newQty = quantityChanges[product._id] !== undefined ? quantityChanges[product._id] : product.quantity;
                                  if (newQty === product.quantity) {
                                    toast.info('No changes to update');
                                    return;
                                  }
                                  try {
                                    await updateQuantity(product._id, newQty);
                                    toast.success('Quantity updated successfully');
                                    setQuantityChanges(prev => ({ ...prev, [product._id]: newQty }));
                                    fetchDarkstoreProducts(darkstorePage);
                                  } catch (err) {
                                    toast.error('Failed to update quantity');
                                  }
                                }}
                                className="bg-green-500 text-white px-3 py-2 rounded text-xs flex items-center hover:bg-green-600"
                                title="Update Quantity"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-1">Update</span>
                              </button>
                            )}
                            <button
                              onClick={() => removeFromDarkstore(product._id, product.name)}
                              className="text-red-600 hover:text-red-800 px-3 py-2 text-xs font-medium border border-red-300 rounded hover:bg-red-50"
                              title="Remove from Darkstore"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Darkstore Pagination */}
              {darkstoreTotalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-neutral-600 text-center md:text-left">
                    Showing page {darkstorePage} of {darkstoreTotalPages} ({darkstoreTotalProducts} products)
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      disabled={darkstorePage === 1}
                      onClick={() => handleDarkstorePageChange(darkstorePage - 1)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      <ChevronLeft size={16} />
                      <span className="ml-1 hidden sm:inline">Previous</span>
                    </button>
                    <span className="px-2 text-sm">{darkstorePage} / {darkstoreTotalPages}</span>
                    <button
                      disabled={darkstorePage === darkstoreTotalPages}
                      onClick={() => handleDarkstorePageChange(darkstorePage + 1)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      <span className="mr-1 hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Cart */}
        {cart.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 h-[70vh] lg:inset-auto lg:top-0 lg:right-0 lg:h-full w-full lg:w-80 bg-white shadow-xl border-t lg:border-t-0 lg:border-l border-neutral-200 z-40 flex flex-col rounded-t-2xl lg:rounded-none">
            {/* Cart Header */}
            <div className="p-4 border-b border-neutral-200 bg-green-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13l-1.1 5M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8" />
                  </svg>
                  <h3 className="font-semibold text-white">Cart ({cart.length})</h3>
                </div>
                <button
                  onClick={() => setCart([])}
                  className="text-white hover:text-red-200 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {cart.map(product => (
                  <div key={product._id} className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                    <div className="flex items-start gap-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.thumbnail ? (
                          <img
                            className="w-12 h-12 rounded object-cover"
                            src={product.thumbnail}
                            alt={product.name}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center">
                            <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 text-sm truncate">{product.name}</h4>
                        <p className="text-xs text-neutral-600 truncate">
                          {product.brand && `${product.brand} • `}{product.category?.name || 'Uncategorized'}
                        </p>
                        
                        {/* Quantity and Price Row */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">Qty:</span>
                            <span className="font-medium text-neutral-900">{product.quantity || 1}</span>
                          </div>
                          <div className="font-semibold text-green-600">
                            ₹{product.pricing?.mrp || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
                        title="Remove from cart"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-neutral-900">Total Items:</span>
                <span className="font-semibold text-neutral-900">{cart.length}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-neutral-900">Total Value:</span>
                <span className="font-semibold text-green-600">
                  ₹{cart.reduce((total, product) => total + (product.pricing?.mrp || 0), 0)}
                </span>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-900 mb-1">Seller</label>
                <input
                  type="text"
                  value={seller}
                  onChange={e => setSeller(e.target.value)}
                  className="w-full border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter seller name"
                />
              </div>
              <button
                onClick={async () => {
                  if (cart.length === 0) {
                    toast.error('Cart is empty');
                    return;
                  }
                  const products = cart.map(item => ({
                    product: item._id,
                    quantity: item.quantity || 1,
                    price: item.pricing?.mrp || 0
                  }));
                  try {
                    const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/darkstore`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ seller: seller.trim(), products })
                    });
                    const data = await response.json().catch(() => ({}));
                    if (!response.ok) {
                      throw new Error(data.message || 'Failed to add to darkstore');
                    }
                    toast.success(data.message || 'Products added to darkstore successfully!');
                    setCart([]);
                    setSeller('');
                    await fetchDarkstoreProducts(); // Refresh darkstore products
                    navigate('/darkstore');
                  } catch (err) {
                    toast.error(err.message || 'Error adding to darkstore');
                  }
                }}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors font-medium"
              >
                Confirm Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Product Modal */}
      <Modal
        isOpen={viewModalIsOpen}
        onRequestClose={closeViewModal}
        className="p-4 z-[60]"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[55]"
        contentLabel="Product Details Viewer"
      >
        <div className="bg-white shadow-2xl max-w-full md:max-w-4xl h-[90vh] rounded-lg overflow-hidden flex flex-col">
          <div className="bg-black px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Eye size={20} />
                Product Details
              </h2>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {viewProduct && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Product Name</label>
                      <p className="text-sm text-gray-900 mt-1">{viewProduct.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Brand</label>
                      <p className="text-sm text-gray-900 mt-1">{viewProduct.brand || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Category</label>
                      <p className="text-sm text-gray-900 mt-1">{viewProduct.category_string || viewProduct.category?.name || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Price</label>
                      <p className="text-sm text-gray-900 mt-1">₹{viewProduct.pricing?.mrp || viewProduct.price || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewProduct.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Description</h3>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{viewProduct.description}</div>
                  </div>
                )}

                {/* Images */}
                {viewProduct.thumbnail && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Image</h3>
                    <div className="flex justify-center">
                      <img
                        src={viewProduct.thumbnail}
                        alt={viewProduct.name}
                        className="max-w-full h-auto max-h-96 rounded-lg shadow-md"
                      />
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Quantity in Darkstore</label>
                      <p className="text-sm text-gray-900 mt-1">{viewProduct.quantity || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Darkstore Price</label>
                      <p className="text-sm text-gray-900 mt-1">₹{viewProduct.price || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Seller</label>
                      <p className="text-sm text-gray-900 mt-1">{viewProduct.seller || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      {imageViewerVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]" onClick={closeImageViewer}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={closeImageViewer}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImageUrl}
              alt="Product Image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Darkstore;