import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, X, Loader2, ChevronLeft, ChevronRight, Layout, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Modal from 'react-modal';
import ChipInput from '../Components/ChipInput';
import LoaderSpinner from '../Components/Loader';

Modal.setAppElement('#root');

const DEFAULT_VARIANT = { label: '', price: 0, mrp: 0, stock: 0, unit: '', image: '' };
const PAGE_SIZE = 20;

function EditInput({ label, name, value, onChange, type = 'text', disabled, required = false, step, min, max }) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        name={name}
        className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        step={step}
        min={min}
        max={max}
      />
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorylist, setCategorylist] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: 'all' });
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Controlled input for search box before search button is pressed
  const [pendingSearch, setPendingSearch] = useState('');

  const navigate = useNavigate();

  // Current user / role guard
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin', 'inventory_manager'];

  const fetchCurrentUser = useCallback(async () => {
    try {
      const local = localStorage.getItem('adminUser');
      if (local) {
        setCurrentUser(JSON.parse(local));
        return;
      }
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (response.ok && data.admin) {
        setCurrentUser(data.admin);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const isAuthorized = allowedRoles.includes(currentUser?.role);

  // Fetch products using backend's paginated and filtered API
  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.append('page', params.page || page);
      query.append('limit', PAGE_SIZE);

      // search
      if (params.search !== undefined) {
        query.append('search', params.search);
      } else if (searchTerm) {
        query.append('search', searchTerm);
      }

      // category filter
      if (params.category !== undefined) {
        if (params.category) query.append('category', params.category);
      } else if (filters.category) {
        query.append('category', filters.category);
      }

      // status filter
      if (params.status !== undefined) {
        if (params.status && params.status !== 'all') query.append('status', params.status);
      } else if (filters.status && filters.status !== 'all') {
        query.append('status', filters.status);
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products?${query}`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotalProducts(data.total || 0);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [navigate, page, searchTerm, filters.category, filters.status]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategorylist(data.categories || []);
    } catch (error) {
      toast.error('Failed to load categories. Please refresh the page.');
    }
  }, [navigate]);

  // First load
  useEffect(() => {
    if (isAuthorized) {
      fetchProducts({ page: 1 });
      setPage(1);
      fetchCategories();
    }
    // eslint-disable-next-line
  }, [isAuthorized]);

  // Refetch whenever page, searchTerm, filters.category, filters.status change
  useEffect(() => {
    if (isAuthorized) {
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status });
    }
    // eslint-disable-next-line
  }, [page, searchTerm, filters.category, filters.status, isAuthorized]);

  // Memoized categories for filter dropdown
  const categories = useMemo(() => {
    return [
      ...new Map(
        products
          .filter(p => p.category)
          .map(p => [p.category._id, p.category.name])
      ).entries()
    ].map(([id, name]) => ({ id, name }));
  }, [products]);

  // Delete product
  const handleDelete = async () => {
    if (!productIdToDelete) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/${productIdToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
      toast.success('Product deleted successfully');
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status });
      // If this was the last product on this page, go back one page
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setConfirmDeleteVisible(false);
      setProductIdToDelete(null);
    }
  };

  // Edit modal handlers
  const openEditModal = (product) => {
    setEditProduct(JSON.parse(JSON.stringify(product)));
    setEditModalIsOpen(true);
  };
  const closeEditModal = () => {
    setEditModalIsOpen(false);
    setEditProduct(null);
  };

  const modalContentRef = useRef(null);

  useEffect(() => {
    if (editModalIsOpen && modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  }, [editModalIsOpen]);

  // Edit input change handler (supports nested fields)
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditProduct(prev => {
      let updated = { ...prev };
      if (name === 'category') {
        const selectedCategory = categorylist.find(cat => cat._id === value);
        updated.category = selectedCategory || null;
      } else if (name.includes('.')) {
        const keys = name.split('.');
        let obj = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          obj[keys[i]] = obj[keys[i]] ? { ...obj[keys[i]] } : {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = type === 'checkbox' ? checked : value;
      } else {
        updated[name] = type === 'checkbox' ? checked : value;
      }
      return updated;
    });
  };

  // Variant handlers
  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    const fieldName = name.replace(`variants[${index}].`, '');
    setEditProduct(prev => {
      const variants = prev.variants ? [...prev.variants] : [];
      variants[index] = { ...variants[index], [fieldName]: value };
      return { ...prev, variants };
    });
  };
  const addVariant = () => {
    setEditProduct(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { ...DEFAULT_VARIANT }]
    }));
  };
  const removeVariant = (index) => {
    setEditProduct(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // Save product
  const handleSave = async () => {
    if (!editProduct || !editProduct._id) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/${editProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editProduct),
      });
      if (response.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }
      toast.success('Product updated successfully');
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status });
      closeEditModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Search button handler
  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    setPage(1);
  };

  // Filter handlers for dropdowns, triggers fetch
  const handleCategoryFilter = (e) => {
    setFilters(f => ({ ...f, category: e.target.value }));
    setPage(1);
  };
  const handleStatusFilter = (e) => {
    setFilters(f => ({ ...f, status: e.target.value }));
    setPage(1);
  };

  // Loading current user (guard)
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins and Super Admins can access products management.</p>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">

        {/* Delete Modal */}
        <Modal
          isOpen={confirmDeleteVisible}
          onRequestClose={() => setConfirmDeleteVisible(false)}
          className="fixed inset-0 flex items-center justify-center p-4"
        >
          <div className="bg-red-50 border border-red-500 shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-red-700 mb-2">Danger Zone</h2>
            <p className="text-red-600 mb-1 font-semibold">This action is critical and cannot be undone.</p>
            <p className="text-red-500 mb-6">Are you sure you want to delete this product? This will permanently remove it from the system.</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDeleteVisible(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>

        </Modal>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Product Management</h1>
          <button
            onClick={() => navigate('/products/add')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 cursor-pointer shadow flex items-center gap-2 self-end md:self-auto"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-64 flex">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button
              onClick={handleSearch}
              className="ml-2 px-3 py-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white rounded"
              title="Search"
            >
              <Search size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                className="w-full p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filters.category}
                onChange={handleCategoryFilter}
              >
                <option value="">All Categories</option>
                {categorylist.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                className="w-full p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filters.status}
                onChange={handleStatusFilter}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {
          loading && (
            <div className="flex items-center flex-col gap-4 justify-center h-64">
              <LoaderSpinner />
              <p className="ml-3 text-gray-600">Loading products...</p>
            </div>
          )
        }

        {/* No products */}
        {
          !loading && products.length === 0 && (
            <div className="bg-white  shadow overflow-hidden border border-gray-200 p-8 text-center">
              <p className="text-gray-500">No products found. Add your first product!</p>
            </div>
          )
        }

        {/* Product Table */}
        {
          !loading && products.length > 0 && (
            <>
              <div className="bg-white  shadow overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.thumbnail && (
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 " src={product.thumbnail} alt={product.name} />
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-500">{product.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.sku || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category_string || product.category?.name || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            {product.stock?.quantity ?? 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            ₹{product.pricing?.sellingPrice?.toFixed(2) ?? '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setProductIdToDelete(product._id);
                                setConfirmDeleteVisible(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Pagination controls */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing {products.length ? ((page - 1) * PAGE_SIZE + 1) : 0}
                  -
                  {products.length ? ((page - 1) * PAGE_SIZE + products.length) : 0}
                  &nbsp;of {totalProducts} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded disabled:opacity-50 flex items-center"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </button>
                  <span className="px-2">{page} / {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded disabled:opacity-50 flex items-center"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )
        }

        {/* Edit Modal */}
        <Modal
          isOpen={editModalIsOpen}
          onRequestClose={closeEditModal}
          className="relative bg-white  p-6 shadow-xl max-w-4xl mx-auto my-8 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 z-10">
            <h2 className="text-xl font-bold text-gray-800">Edit Product</h2>
            <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          {editProduct && (
            <div className="space-y-6">
              {/* Basic Information Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditInput
                    label="Product Name*"
                    name="name"
                    value={editProduct.name}
                    onChange={handleEditChange}
                    disabled={isSaving}
                    required
                  />
                  <EditInput
                    label="SKU*"
                    name="sku"
                    value={editProduct.sku}
                    onChange={handleEditChange}
                    disabled={isSaving}
                    required
                  />
                  <EditInput
                    label="Brand"
                    name="brand"
                    value={editProduct.brand}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Category</label>
                    <select
                      name="category"
                      value={editProduct.category?._id || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving}
                    >
                      <option value="">Select Category</option>
                      {categorylist.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <EditInput
                    label="Barcode"
                    name="barcode"
                    value={editProduct.barcode}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={!!editProduct.isActive}
                        onChange={handleEditChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        disabled={isSaving}
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        name="isFeatured"
                        checked={!!editProduct.isFeatured}
                        onChange={handleEditChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        disabled={isSaving}
                      />
                      <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                        Featured
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EditInput
                    label="MRP (₹)*"
                    name="pricing.mrp"
                    value={editProduct.pricing?.mrp}
                    onChange={handleEditChange}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isSaving}
                    required
                  />
                  <EditInput
                    label="Selling Price (₹)*"
                    name="pricing.sellingPrice"
                    value={editProduct.pricing?.sellingPrice}
                    onChange={handleEditChange}
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isSaving}
                    required
                  />
                  <EditInput
                    label="Discount Percent"
                    name="pricing.discountPercent"
                    value={editProduct.pricing?.discountPercent}
                    onChange={handleEditChange}
                    type="number"
                    min="0"
                    max="100"
                    disabled={isSaving}
                  />
                  <EditInput
                    label="Offer Tag"
                    name="pricing.offerTag"
                    value={editProduct.pricing?.offerTag}
                    onChange={handleEditChange}
                    disabled={isSaving}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-1">Tax</label>
                    <div className="grid grid-cols-2 gap-4">
                      <EditInput
                        label="GST Rate (%)"
                        name="tax.gstRate"
                        value={editProduct.tax?.gstRate}
                        onChange={handleEditChange}
                        type="number"
                        min="0"
                        max="100"
                        disabled={isSaving}
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includedInPrice"
                          name="tax.includedInPrice"
                          checked={!!editProduct.tax?.includedInPrice}
                          onChange={handleEditChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          disabled={isSaving}
                        />
                        <label htmlFor="includedInPrice" className="ml-2 text-sm text-gray-700">
                          Included in Price
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock & Delivery Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Stock & Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditInput
                    label="Stock Quantity*"
                    name="stock.quantity"
                    value={editProduct.stock?.quantity}
                    onChange={handleEditChange}
                    type="number"
                    min="0"
                    disabled={isSaving}
                    required
                  />
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Stock Status</label>
                    <select
                      name="stock.status"
                      value={editProduct.stock?.status}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving}
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="limited">Limited Stock</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isInstant"
                      name="delivery.isInstant"
                      checked={!!editProduct.delivery?.isInstant}
                      onChange={handleEditChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      disabled={isSaving}
                    />
                    <label htmlFor="isInstant" className="ml-2 text-sm text-gray-700">
                      Instant Delivery
                    </label>
                  </div>
                  <EditInput
                    label="Delivery Time (minutes)"
                    name="delivery.deliveryTimeInMinutes"
                    value={editProduct.delivery?.deliveryTimeInMinutes}
                    onChange={handleEditChange}
                    type="number"
                    min="0"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Media Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Thumbnail URL</label>
                    <input
                      type="url"
                      name="thumbnail"
                      value={editProduct.thumbnail}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving}
                      placeholder="https://example.com/image.jpg"
                    />
                    {editProduct.thumbnail && (
                      <div className="mt-2">
                        <img
                          src={editProduct.thumbnail}
                          alt="Thumbnail preview"
                          className="h-20 object-contain border "
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Image+not+found'; }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Image URLs (comma separated)</label>
                    <textarea
                      name="images"
                      value={editProduct.images?.join(', ') || ''}
                      onChange={(e) => setEditProduct({
                        ...editProduct,
                        images: e.target.value.split(',').map(url => url.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editProduct.images?.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Product ${index}`}
                          className="h-12 object-contain border "
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Image+not+found'; }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Variants</h3>
                {editProduct.variants?.map((variant, index) => (
                  <div key={index} className="mb-4 p-3 border ">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <EditInput
                        label="Label"
                        name={`variants[${index}].label`}
                        value={variant.label}
                        onChange={(e) => handleVariantChange(index, e)}
                        disabled={isSaving}
                      />
                      <EditInput
                        label="Price (₹)"
                        name={`variants[${index}].price`}
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, e)}
                        type="number"
                        step="0.01"
                        disabled={isSaving}
                      />
                      <EditInput
                        label="MRP (₹)"
                        name={`variants[${index}].mrp`}
                        value={variant.mrp}
                        onChange={(e) => handleVariantChange(index, e)}
                        type="number"
                        step="0.01"
                        disabled={isSaving}
                      />
                      <EditInput
                        label="Stock"
                        name={`variants[${index}].stock`}
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, e)}
                        type="number"
                        disabled={isSaving}
                      />
                      <EditInput
                        label="Unit"
                        name={`variants[${index}].unit`}
                        value={variant.unit}
                        onChange={(e) => handleVariantChange(index, e)}
                        disabled={isSaving}
                      />
                      <EditInput
                        label="Image URL"
                        name={`variants[${index}].image`}
                        value={variant.image}
                        onChange={(e) => handleVariantChange(index, e)}
                        disabled={isSaving}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="mt-2 text-red-500 text-sm hover:text-red-700"
                      disabled={isSaving}
                    >
                      Remove Variant
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-2 text-green-600 hover:text-green-800 flex items-center text-sm"
                  disabled={isSaving}
                >
                  <Plus size={16} className="mr-1" />
                  Add Variant
                </button>
              </div>

              {/* Content Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Content</h3>
                <div className="space-y-4">
                  <div>
                    <div className='flex justify-between items-center mb-2'>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                      <span className="text-xs text-gray-500">
                        {100 - (editProduct.description?.length || 0)} / 100
                      </span>
                    </div>
                    <textarea
                      name="description"
                      value={editProduct.description || ''}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving}
                      rows={4}
                      maxLength={100}
                    />

                  </div>
                  <ChipInput
                    label="Tags"
                    values={editProduct.tags || []}
                    setValues={vals => setEditProduct({ ...editProduct, tags: vals })}
                    disabled={isSaving}
                    maxTags={10}
                    placeholder="Add tag and press Enter or comma"
                  />
                  <ChipInput
                    label="Highlights"
                    values={editProduct.highlights || []}
                    setValues={vals => setEditProduct({ ...editProduct, highlights: vals })}
                    disabled={isSaving}
                    maxTags={3}
                    placeholder="Add highlight and press Enter or comma"
                  />
                  <ChipInput
                    label="Search Keywords"
                    values={editProduct.searchKeywords || []}
                    setValues={vals => setEditProduct({ ...editProduct, searchKeywords: vals })}
                    disabled={isSaving}
                    maxTags={10}
                    placeholder="Add keyword and press Enter or comma"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 sticky bottom-0 bg-white py-3 border-t">
            <button
              onClick={closeEditModal}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300  text-gray-800"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-2  text-white ${isSaving ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </Modal>
      </div >
  );
}