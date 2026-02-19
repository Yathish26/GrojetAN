import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, Check, X, XCircle, Package,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const AddMerchantInventory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Product search states
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productHasMore, setProductHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState([]);
  const [productCart, setProductCart] = useState([]);
  const [addingProduct, setAddingProduct] = useState(null);

  // Product modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Refs
  const productsScrollRef = useRef(null);
  const loadingMoreRef = useRef(false);

  // Fetch merchant details
  const fetchMerchantDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}?mode=edit`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        if (data.success) {
          setMerchant(data.merchant);
        } else {
          throw new Error(data.message || 'Failed to fetch merchant details');
        }
      } else {
        throw new Error('Failed to fetch merchant details');
      }
    } catch (error) {
      console.error('Error fetching merchant details:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to load merchant details');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

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
      fetchMerchantDetails();
    }
  }, [currentUser, id, fetchMerchantDetails]);

  // Fetch available products for adding to inventory
  const fetchAvailableProducts = useCallback(async (pageNum = 1, search = '', category = '', isLoadMore = false) => {
    try {
      setProductLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: 20,
        excludeMerchant: id
      });

      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('category', category);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      const transformedProducts = data.products.map(product => ({
        _id: product._id,
        name: product.name,
        category: product.category,
        price: product.pricing?.mrp || 0,
        image: product.thumbnail,
        weightDimension: product.weightDimension,
        hsnCode: product.hsnCode,
        brand: product.brand,
        description: product.description,
        tags: product.tags || [],
      }));

      if (isLoadMore) {
        setAvailableProducts(prev => [...prev, ...transformedProducts]);
      } else {
        setAvailableProducts(transformedProducts);
      }

      setProductHasMore(data.products.length === 20);
      setProductPage(pageNum);

    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setProductLoading(false);
    }
  }, [id]);

  // Fetch product categories
  const fetchProductCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setProductCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProductCategories();
      fetchAvailableProducts(1, '', 'all');
    }
  }, [currentUser, fetchProductCategories, fetchAvailableProducts]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (!productsScrollRef.current || loadingMoreRef.current || !productHasMore || productLoading) {
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = productsScrollRef.current;
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

      // Load more when scrolled 85% or more
      if (scrollPercentage >= 85) {
        loadingMoreRef.current = true;
        fetchAvailableProducts(productPage + 1, productSearchQuery, selectedCategory, true).finally(() => {
          loadingMoreRef.current = false;
        });
      }
    };

    const scrollElement = productsScrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [productPage, productSearchQuery, selectedCategory, productHasMore, productLoading, fetchAvailableProducts]);

  // Add product to cart
  const handleAddToCart = (product) => {
    if (productCart.find(item => item._id === product._id)) {
      toast.error('Product already in cart');
      return;
    }
    setProductCart(prev => [...prev, product]);
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
        setProductCart([]);
      }

      if (failed > 0) {
        toast.error(`Failed to add ${failed} product${failed > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error adding products to inventory:', error);
      toast.error(error.message || 'Failed to add products to inventory');
    } finally {
      setAddingProduct(null);
    }
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

  // Handle opening product details modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading merchant details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading merchant</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <button
            onClick={fetchMerchantDetails}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/merchants/${id}/inventory`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Inventory
                </button>
                <div className="border-l border-gray-300 pl-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Add Products to Inventory
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Merchant: <span className="font-mono text-gray-700">{merchant?.businessInfo?.displayName || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side - Product search and list */}
            <div className="lg:col-span-2">
              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex gap-4 items-end">
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 whitespace-nowrap">Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="px-3 py-3 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="all">All Categories</option>
                      {productCategories.map(category => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleProductSearch}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Products List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">Available Products</h2>
                </div>

                <div className="max-h-96 overflow-y-auto" ref={productsScrollRef}>
                  {availableProducts.length === 0 && productLoading ? (
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
                    <div className="divide-y divide-gray-200">
                      {availableProducts.map((product) => {
                        const isInCart = productCart.find(item => item._id === product._id);
                        return (
                          <div key={product._id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                {product.image && (
                                  <img
                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                    src={product.image}
                                    alt={product.name}
                                    onClick={() => openProductModal(product)}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                                  <p className="text-sm text-gray-500 truncate">{product.category?.name || 'Unknown'}</p>
                                  {product.weightDimension && (
                                    <p className="text-xs text-gray-500">{product.weightDimension.value} {product.weightDimension.unit}</p>
                                  )}
                                  <p className="text-sm text-gray-600">₹{product.price}</p>
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Cart */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">Cart ({productCart.length})</h3>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {productCart.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-sm font-medium text-gray-900">Cart is empty</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Add products from the left panel to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {productCart.map((product) => (
                        <div key={product._id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {product.image && (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                  src={product.image}
                                  alt={product.name}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                                <p className="text-xs text-gray-500 truncate">{product.category?.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-600">₹{product.price}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(product._id)}
                              className="inline-flex items-center p-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {productCart.length > 0 && (
                  <div className="p-6 border-t border-gray-200">
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
                        <p className="text-sm text-gray-500">Category: {selectedProduct.category?.name || 'Unknown'}</p>
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
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={productCart.find(item => item._id === selectedProduct._id)}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${
                      productCart.find(item => item._id === selectedProduct._id)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {productCart.find(item => item._id === selectedProduct._id) ? (
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
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default AddMerchantInventory;