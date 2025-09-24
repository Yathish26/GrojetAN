import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, X, Loader2, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Modal from 'react-modal';
import ChipInput from '../Components/ChipInput';
import LoaderSpinner from '../Components/Loader';
import Layout from '../Components/Layout';

Modal.setAppElement('#root');

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorylist, setCategorylist] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: 'all', sort: 'name_asc' });
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Controlled input for search box before search button is pressed
  const [pendingSearch, setPendingSearch] = useState('');

  // File upload states for edit modal
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState(null);
  const [originalImageUrls, setOriginalImageUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

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

      // sort filter
      if (params.sort !== undefined) {
        if (params.sort) query.append('sort', params.sort);
      } else if (filters.sort) {
        query.append('sort', filters.sort);
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
  }, [navigate, page, searchTerm, filters.category, filters.status, filters.sort]);

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

  // Update request status
  const updateRequestStatus = async (requestId, status) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to update request status');
      const data = await response.json();
      toast.success(data.message);
      // Refresh the requested products list
      fetchRequestedProducts(requestPage);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // First load
  useEffect(() => {
    if (isAuthorized) {
      fetchProducts({ page: 1 });
      setPage(1);
      fetchCategories();
    }
    // eslint-disable-next-line
  }, [isAuthorized]);

  // Refetch whenever page, searchTerm, filters.category, filters.status, filters.sort change
  useEffect(() => {
    if (isAuthorized) {
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status, sort: filters.sort });
    }
    // eslint-disable-next-line
  }, [page, searchTerm, filters.category, filters.status, filters.sort, isAuthorized]);

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
    
    // Find the product to get image URLs
    const productToDelete = products.find(p => p._id === productIdToDelete);
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete images from Cloudinary if they exist
      const imagesToDelete = [];
      
      // Add thumbnail image
      if (productToDelete.thumbnail) {
        imagesToDelete.push(productToDelete.thumbnail);
      }
      
      // Add images from images array
      if (productToDelete.images && productToDelete.images.length > 0) {
        imagesToDelete.push(...productToDelete.images);
      }
      
      // Delete all images from Cloudinary
      for (const imageUrl of imagesToDelete) {
        try {
          await fetch(`${import.meta.env.VITE_SERVER}/image/delete/cloudinary`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl }),
          });
        } catch (deleteError) {
          console.warn(`Failed to delete image from Cloudinary: ${imageUrl}`, deleteError);
          // Continue with other deletions even if one fails
        }
      }
      
      // Now delete the product from backend
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
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status, sort: filters.sort });
      // If this was the last product on this page, go back one page
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setConfirmDeleteVisible(false);
      setProductIdToDelete(null);
      setIsDeleting(false);
    }
  };

  // Edit modal handlers
  const openEditModal = (product) => {
    setEditProduct(JSON.parse(JSON.stringify(product)));
    setOriginalThumbnailUrl(product.thumbnail || null);
    setOriginalImageUrls([...(product.images || [])]);
    setSelectedThumbnailFile(null);
    setSelectedImageFiles([]);
    setEditModalIsOpen(true);
  };
  const closeEditModal = () => {
    setEditModalIsOpen(false);
    setEditProduct(null);
    setSelectedThumbnailFile(null);
    setSelectedImageFiles([]);
    setOriginalThumbnailUrl(null);
    setOriginalImageUrls([]);
    setUploadingImages(false);
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
  // File upload handlers for edit modal
  const handleThumbnailFileSelect = (file) => {
    setSelectedThumbnailFile(file);
    // Clear URL if file is selected
    if (file) {
      setEditProduct(prev => ({ ...prev, thumbnail: '' }));
    }
  };

  const handleImageFileSelect = (files) => {
    setSelectedImageFiles(files);
    // Clear URL inputs if files are selected
    if (files && files.length > 0) {
      setEditProduct(prev => ({ ...prev, images: [] }));
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async (file, folder = 'products') => {
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload/cloudinary`, {
      method: 'POST',
      body: formDataUpload,
    });

    const data = await response.json();

    if (response.ok) {
      return data.imageUrl;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  };

  // Save product
  const handleSave = async () => {
    if (!editProduct || !editProduct._id) return;
    setIsSaving(true);
    setUploadingImages(true);
    
    try {
      let finalThumbnail = editProduct.thumbnail;
      let finalImages = [...(editProduct.images || [])];

      // Upload thumbnail if file selected
      if (selectedThumbnailFile) {
        const uploadedUrl = await uploadImage(selectedThumbnailFile, 'products');
        
        // Delete old thumbnail if it exists
        if (originalThumbnailUrl) {
          try {
            await fetch(`${import.meta.env.VITE_SERVER}/image/delete/cloudinary`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imageUrl: originalThumbnailUrl }),
            });
          } catch (deleteError) {
            console.warn('Failed to delete old thumbnail:', deleteError);
          }
        }
        
        finalThumbnail = uploadedUrl;
      }

      // Upload additional images if files selected
      if (selectedImageFiles && selectedImageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          selectedImageFiles.map(file => uploadImage(file, 'products'))
        );
        
        // Delete old images if they exist
        if (originalImageUrls && originalImageUrls.length > 0) {
          for (const oldImageUrl of originalImageUrls) {
            try {
              await fetch(`${import.meta.env.VITE_SERVER}/image/delete/cloudinary`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageUrl: oldImageUrl }),
              });
            } catch (deleteError) {
              console.warn('Failed to delete old image:', deleteError);
            }
          }
        }
        
        finalImages = uploadedUrls;
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/${editProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...editProduct,
          thumbnail: finalThumbnail,
          images: finalImages
        }),
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
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status, sort: filters.sort });
      closeEditModal();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
      setUploadingImages(false);
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
  const handleSortFilter = (e) => {
    setFilters(f => ({ ...f, sort: e.target.value }));
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
    <Layout title="Products">
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">

        {/* Delete Modal */}
        <Modal
          isOpen={confirmDeleteVisible}
          onRequestClose={() => !isDeleting && setConfirmDeleteVisible(false)}
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
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center">
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Deleting...
                  </span>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>

        </Modal>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700">Product Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/products/requests')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 cursor-pointer shadow flex items-center gap-2"
            >
              <Shield size={18} />
              <span>Requested Products</span>
            </button>
            <button
              onClick={() => navigate('/products/add')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 cursor-pointer shadow flex items-center gap-2 self-end md:self-auto"
            >
              <Plus size={18} />
              <span>Add Product</span>
            </button>
          </div>
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
            <div className="relative">
              <select
                className="w-full p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filters.sort}
                onChange={handleSortFilter}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.hsnCode || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.category_string || product.category?.name || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            ₹{product.pricing?.mrp?.toFixed(2) ?? '0.00'}
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
                              className="text-green-600 hover:text-green-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                              disabled={confirmDeleteVisible}
                            >
                              <Edit size={18} />
                            </button>
                            {currentUser?.role === 'super_admin' && (
                              <button
                                onClick={() => {
                                  setProductIdToDelete(product._id);
                                  setConfirmDeleteVisible(true);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete"
                                disabled={confirmDeleteVisible}
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
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
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">HSN Code</label>
                    <input
                      type="text"
                      name="hsnCode"
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={editProduct.hsnCode || ''}
                      onChange={(e) => {
                        const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        setEditProduct(prev => ({ ...prev, hsnCode: sanitizedValue }));
                      }}
                      disabled={isSaving}
                      placeholder="e.g. 08081000"
                    />
                  </div>
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

              {/* Media Section */}
              <div className="bg-gray-50 p-4 ">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Media</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Thumbnail</label>
                    
                    {/* File Upload Option */}
                    <div className="space-y-2 mb-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleThumbnailFileSelect(e.target.files[0])}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isSaving || uploadingImages}
                      />
                      {selectedThumbnailFile && (
                        <p className="text-sm text-green-600">Selected: {selectedThumbnailFile.name}</p>
                      )}
                      <p className="text-xs text-gray-500">Or enter URL below</p>
                    </div>

                    {/* URL Input Option */}
                    <input
                      type="url"
                      name="thumbnail"
                      value={editProduct.thumbnail}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving || uploadingImages || selectedThumbnailFile}
                      placeholder="https://example.com/image.jpg"
                    />
                    {(editProduct.thumbnail || selectedThumbnailFile) && (
                      <div className="mt-2">
                        <img
                          src={selectedThumbnailFile ? URL.createObjectURL(selectedThumbnailFile) : editProduct.thumbnail}
                          alt="Thumbnail preview"
                          className="h-20 object-contain border"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Image+not+found'; }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Additional Images</label>
                    
                    {/* File Upload Option */}
                    <div className="space-y-2 mb-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageFileSelect(Array.from(e.target.files))}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isSaving || uploadingImages}
                      />
                      {selectedImageFiles && selectedImageFiles.length > 0 && (
                        <p className="text-sm text-green-600">
                          Selected: {selectedImageFiles.length} file{selectedImageFiles.length > 1 ? 's' : ''}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Or enter URLs below</p>
                    </div>

                    {/* URL Input Option */}
                    <textarea
                      name="images"
                      value={editProduct.images?.join(', ') || ''}
                      onChange={(e) => setEditProduct({
                        ...editProduct,
                        images: e.target.value.split(',').map(url => url.trim()).filter(Boolean)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={isSaving || uploadingImages || selectedImageFiles.length > 0}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedImageFiles && selectedImageFiles.length > 0 ? (
                        selectedImageFiles.map((file, index) => (
                          <img
                            key={index}
                            src={URL.createObjectURL(file)}
                            alt={`Selected ${index}`}
                            className="h-12 object-contain border"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Image+not+found'; }}
                          />
                        ))
                      ) : (
                        editProduct.images?.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Product ${index}`}
                            className="h-12 object-contain border"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Image+not+found'; }}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
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
              className={`px-4 py-2  text-white ${isSaving || uploadingImages ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={isSaving || uploadingImages}
            >
              {isSaving || uploadingImages ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin mr-2" size={16} />
                  {uploadingImages ? 'Uploading...' : 'Saving...'}
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </Modal>
      </div >
    </Layout>
  );
}