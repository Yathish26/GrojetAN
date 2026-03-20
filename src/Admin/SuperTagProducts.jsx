import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, PackageSearch, Search, Filter, SlidersHorizontal, XCircle, Store, Tag as TagIcon, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function SuperTagProducts() {
  const navigate = useNavigate();
  const { tagName } = useParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [merchantFilter, setMerchantFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  
  // Filter options
  const [categories, setCategories] = useState([]);
  const [merchants, setMerchants] = useState([]);

  const fetchSuperTagProducts = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/super-tags/${encodeURIComponent(tagName)}/products?page=${page}&limit=30`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        const newProducts = data.products || [];
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        setCount(data.count || 0);
        setHasMore(Boolean(data.hasMore));
      } else {
        toast.error(data.message || 'Failed to fetch super tag products');
      }
    } catch (error) {
      console.error('Error fetching super tag products:', error);
      toast.error('Failed to fetch super tag products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (tagName) {
      setCurrentPage(1);
      setProducts([]);
      setFilteredProducts([]);
      fetchSuperTagProducts(1, false);
    }
  }, [tagName]);

  // Extract filter options from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
      const uniqueMerchants = [...new Set(products.map(p => p.merchantName).filter(Boolean))].sort();
      
      setCategories(uniqueCategories);
      setMerchants(uniqueMerchants);
    }
  }, [products]);

  // Load more products when scrolling to bottom
  const loadMoreProducts = () => {
    if (hasMore && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchSuperTagProducts(nextPage, true);
    }
  };

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, currentPage]);

  // Filter products based on search term and filters
  useEffect(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((product) => {
        return (
          (product.name || '').toLowerCase().includes(searchLower) ||
          (product.merchantName || '').toLowerCase().includes(searchLower) ||
          (product.merchantId || '').toLowerCase().includes(searchLower) ||
          (product.category || '').toLowerCase().includes(searchLower) ||
          (product.brand || '').toLowerCase().includes(searchLower) ||
          (product.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Apply merchant filter
    if (merchantFilter !== 'all') {
      filtered = filtered.filter(product => product.merchantName === merchantFilter);
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(product => {
        const price = product.price || 0;
        switch (priceFilter) {
          case 'low': return price < 50;
          case 'medium': return price >= 50 && price < 200;
          case 'high': return price >= 200;
          default: return true;
        }
      });
    }

    // Apply stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        const quantity = product.quantity || 0;
        switch (stockFilter) {
          case 'out': return quantity === 0;
          case 'low': return quantity > 0 && quantity <= 10;
          case 'in': return quantity > 10;
          default: return true;
        }
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, merchantFilter, priceFilter, stockFilter]);

  return (
    <Layout title={`${tagName} Products`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/super-tags')}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Back to Super Tags"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tagName} Products</h1>
              <p className="text-sm text-gray-600">All products tagged under {tagName}</p>
            </div>
          </div>

          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 uppercase tracking-wide">Total Products</p>
            <p className="text-xl font-bold text-green-800">{count}</p>
          </div>
        </div>

        {/* Search Bar */}
        {!loading && products.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products by name, merchant, category, brand, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium transition-colors ${
                  showFilters ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {(categoryFilter !== 'all' || merchantFilter !== 'all' || priceFilter !== 'all' || stockFilter !== 'all') && (
                  <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {[categoryFilter, merchantFilter, priceFilter, stockFilter].filter(f => f !== 'all').length}
                  </span>
                )}
              </button>
              {searchTerm && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{filteredProducts.length} of {count} products</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && !loading && products.length > 0 && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4" />
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Merchant Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Store className="h-4 w-4" />
                  Merchant
                </label>
                <select
                  value={merchantFilter}
                  onChange={(e) => setMerchantFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Merchants</option>
                  {merchants.map(merchant => (
                    <option key={merchant} value={merchant}>{merchant}</option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Price Range
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Prices</option>
                  <option value="low">Low (&lt; ₹50)</option>
                  <option value="medium">Medium (₹50-₹200)</option>
                  <option value="high">High (&gt; ₹200)</option>
                </select>
              </div>

              {/* Stock Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Package className="h-4 w-4" />
                  Stock Status
                </label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Stock</option>
                  <option value="in">In Stock (&gt;10)</option>
                  <option value="low">Low Stock (1-10)</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setMerchantFilter('all');
                  setPriceFilter('all');
                  setStockFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-600">
            <Loader2 className="animate-spin mr-2" size={20} />
            Loading {tagName} products...
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <PackageSearch size={42} className="mx-auto text-gray-400 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No {tagName} Products Found</h2>
            <p className="text-gray-600">No inventory items are tagged with {tagName} yet.</p>
          </div>
        ) : filteredProducts.length === 0 && (searchTerm || categoryFilter !== 'all' || merchantFilter !== 'all' || priceFilter !== 'all' || stockFilter !== 'all') ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Filter size={42} className="mx-auto text-gray-400 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">No matching products</h2>
            <p className="text-gray-600 mb-4">No products match your current filters. Try adjusting your search or filter criteria.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setCategoryFilter('all');
                  setMerchantFilter('all');
                  setPriceFilter('all');
                  setStockFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hide Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Product</th>
                    <th className="text-left px-4 py-3 font-semibold">Merchant</th>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Weight</th>
                    <th className="text-left px-4 py-3 font-semibold">Price</th>
                    <th className="text-left px-4 py-3 font-semibold">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((item) => (
                    <tr key={item.inventoryItemId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || 'Product image'}
                              className="h-10 w-10 rounded-md object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.name || 'Unnamed Product'}</p>
                            {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{item.merchantName || '-'}</p>
                        {item.merchantId && <p className="text-xs text-gray-500">{item.merchantId}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.category || '-'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.weightDimension?.value && item.weightDimension?.unit 
                          ? `${item.weightDimension.value} ${item.weightDimension.unit}` 
                          : '-'
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-900">Rs {Number(item.price || 0).toFixed(2)}</td>
                      <td className={`px-4 py-3 ${item.quantity === 0 ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {item.quantity ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}