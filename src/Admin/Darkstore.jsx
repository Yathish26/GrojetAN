import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../Components/Layout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

const Darkstore = () => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [darkstoreProducts, setDarkstoreProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Cart state
  const [cart, setCart] = useState([]);
  const [seller, setSeller] = useState('');

  const fetchDarkstoreProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/darkstore`, {
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
    } catch (err) {
      setError(err.message || 'Unable to load darkstore products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDarkstoreProducts();
  }, [fetchDarkstoreProducts]);


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
  }, [page, searchTerm]);

  const handleEnterAddMode = () => {
    setIsAddMode(true);
    setPage(1); // Reset to first page when opening
    fetchProducts(1);
  };

  const handleExitAddMode = () => {
    setIsAddMode(false);
    setCart([]); // Clear cart when exiting
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProducts(newPage);
    }
  };

  const handleSearch = () => {
    fetchProducts(1); // Reset to first page when searching
  };

  const addToCart = (product) => {
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
      <div className={`max-w-7xl mx-auto ${cart.length > 0 ? 'mr-80' : ''} transition-all duration-300`}>
        {!isAddMode && (
          <button onClick={handleEnterAddMode} className="bg-blue-500 text-white px-4 py-2 rounded flex items-center mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Products
          </button>
        )}
        {isAddMode && (
          <button onClick={handleExitAddMode} className="bg-gray-500 text-white px-4 py-2 rounded flex items-center mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Darkstore
          </button>
        )}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="p-4 border-b border-neutral-200 bg-green-500 mb-6 flex justify-center">
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, brand, or category"
                    className="w-full sm:w-80 border border-neutral-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="hidden sm:inline-flex items-center gap-2 bg-green-100 text-neutral-800 px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-200"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </button>
                  <button
                    onClick={() => fetchProducts(1)}
                    className="hidden sm:inline-flex items-center gap-2 bg-green-100 text-neutral-800 px-3 py-2 rounded border border-neutral-300 hover:bg-neutral-200"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9M20 20v-5h-.581m-15.357-2a8.003 8.003 0 0015.357 2" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">{totalProducts} products</span>
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-4 border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-[550px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-neutral-500">Loading products…</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500">No products found.</div>
                ) : (
                  filteredProducts.map(product => (
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
                      <div className="text-sm text-neutral-600 whitespace-nowrap">
                        {product.pricing?.mrp ? `₹${product.pricing.mrp}` : 'No price'}
                      </div>
                      {cart.some(item => item._id === product._id) ? (
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
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-neutral-600">
                    Showing page {page} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <span className="px-2 text-sm">{page} / {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Darkstore Products Mode
            <div className="mt-6">
              {error && (
                <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-4 border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-[550px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-neutral-500">Loading darkstore products…</div>
                ) : darkstoreProducts.length === 0 ? (
                  <div className="py-10 text-center text-neutral-500">No products in darkstore.</div>
                ) : (
                  darkstoreProducts.map(product => (
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
                            {product.brand ? `${product.brand} • ` : ''}{product.category_string || 'Uncategorized'}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-neutral-600 whitespace-nowrap">
                        Qty: {product.quantity}
                      </div>
                      <div className="text-sm text-neutral-600 whitespace-nowrap">
                        ₹{product.price}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Floating Cart */}
        {cart.length > 0 && (
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl border-l border-neutral-200 z-40 flex flex-col">
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
                    if (!response.ok) throw new Error('Failed to add to darkstore');
                    toast.success('Products added to darkstore successfully!');
                    setCart([]);
                    setSeller('');
                    setIsAddMode(false);
                    fetchDarkstoreProducts(); // Refresh darkstore products
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
    </Layout>
  );
};

export default Darkstore;