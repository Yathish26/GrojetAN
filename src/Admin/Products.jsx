import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Edit3, Trash2, X, Loader2, ChevronLeft, ChevronRight, Shield, Download, Package, Image, CircleCheck, XCircle, ChevronDown, Eye, Filter, RotateCcw } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Modal from 'react-modal';
import ChipInput from '../Components/ChipInput';
import LoaderSpinner from '../Components/Loader';
import Layout from '../Components/Layout';

Modal.setAppElement('#root');

const PAGE_SIZE = 20;

function EditInput({ label, name, value, onChange, type = 'text', disabled, required = false, step, min, max, onWheel, maxLength }) {
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
        onWheel={onWheel}
        maxLength={maxLength}
      />
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [viewModalIsOpen, setViewModalIsOpen] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorylist, setCategorylist] = useState([]);
  const [filters, setFilters] = useState({ category: '', status: 'all', sort: 'name_asc', startsWith: 'all' });
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);

  // Controlled input for search box before search button is pressed
  const [pendingSearch, setPendingSearch] = useState('');

  // File upload states for edit modal
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [originalThumbnailUrl, setOriginalThumbnailUrl] = useState(null);
  const [originalImageUrls, setOriginalImageUrls] = useState([]);
  const [initialOriginalImageUrls, setInitialOriginalImageUrls] = useState([]); // For Cloudinary deletion tracking
  const [uploadingImages, setUploadingImages] = useState(false);

  // Preview states for edit modal
  const [selectedThumbnailPreview, setSelectedThumbnailPreview] = useState(null);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);

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

      // startsWith filter
      if (params.startsWith !== undefined) {
        if (params.startsWith && params.startsWith !== 'all') query.append('startsWith', params.startsWith);
      } else if (filters.startsWith && filters.startsWith !== 'all') {
        query.append('startsWith', filters.startsWith);
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
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
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
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setCategorylist(data.categories || []);
    } catch (error) {
      toast.error('Failed to load categories. Please refresh the page.');
    }
  }, [navigate]);

  // Fetch total available products count
  const fetchAvailableCount = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      query.append('page', '1');
      query.append('limit', '1'); // We only need the total count

      // Apply current filters
      if (searchTerm) {
        query.append('search', searchTerm);
      }
      if (filters.category) {
        query.append('category', filters.category);
      }
      if (filters.status && filters.status !== 'all') {
        query.append('status', filters.status);
      }
      if (filters.startsWith && filters.startsWith !== 'all') {
        query.append('startsWith', filters.startsWith);
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products?${query}`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch available count');
      const data = await response.json();
      if (data.tokenValid === false) {
        return;
      }
      setTotalAvailable(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch available count', error);
    }
  }, [searchTerm, filters.category, filters.status, filters.startsWith]);

  useEffect(() => {
    fetchCurrentUser();
    fetchCategories();
    fetchAvailableCount();
  }, [fetchCurrentUser, fetchCategories, fetchAvailableCount]);

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
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      toast.success(data.message);
      // Refresh the requested products list
      fetchRequestedProducts(requestPage);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    setExportDropdownOpen(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/export`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to export products');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Products exported to Excel successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle export to JSON
  const handleExportJSON = async () => {
    setIsExporting(true);
    setExportDropdownOpen(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/export/json`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to export products to JSON');
      const data = await response.json();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Products exported to JSON successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle export to CSV
  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportDropdownOpen(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/export/csv`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to export products to CSV');
      const csvText = await response.text();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Products exported to CSV successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExporting(false);
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

  // Refetch whenever page, searchTerm, filters.category, filters.status, filters.sort, filters.startsWith change
  useEffect(() => {
    if (isAuthorized) {
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status, sort: filters.sort, startsWith: filters.startsWith });
    }
    // eslint-disable-next-line
  }, [page, searchTerm, filters.category, filters.status, filters.sort, filters.startsWith, isAuthorized]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownOpen && !event.target.closest('.export-dropdown')) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownOpen]);

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
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      toast.success('Product deleted successfully');
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status, sort: filters.sort, startsWith: filters.startsWith });
      fetchAvailableCount();
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
    const productCopy = JSON.parse(JSON.stringify(product));
    // Ensure variants is always an array
    if (!productCopy.variants) {
      productCopy.variants = [];
    }
    setEditProduct(productCopy);
    setOriginalThumbnailUrl(product.thumbnail || null);
    setOriginalImageUrls([...(product.images || [])]);
    setInitialOriginalImageUrls([...(product.images || [])]); // Store initial state for deletion tracking
    setSelectedThumbnailFile(null);
    setSelectedImageFiles([]);
    setSelectedThumbnailPreview(null);
    setSelectedImagePreviews([]);
    setEditModalIsOpen(true);
  };
  const closeEditModal = () => {
    setEditModalIsOpen(false);
    setEditProduct(null);
    setSelectedThumbnailFile(null);
    setSelectedImageFiles([]);
    setOriginalThumbnailUrl(null);
    setOriginalImageUrls([]);
    setInitialOriginalImageUrls([]);
    setSelectedThumbnailPreview(null);
    setSelectedImagePreviews([]);
    setUploadingImages(false);
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

  const openImageViewer = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUrl(null);
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
    if (file) {
      setSelectedThumbnailPreview(URL.createObjectURL(file));
    } else {
      setSelectedThumbnailPreview(null);
    }
  };

  const handleImageFileSelect = (files) => {
    setSelectedImageFiles(files);
    if (files && files.length > 0) {
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setSelectedImagePreviews(newPreviews);
    } else {
      setSelectedImagePreviews([]);
    }
  };

  // Drag and drop handlers for edit modal
  const handleThumbnailDragOver = (e) => {
    e.preventDefault();
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleThumbnailFileSelect(file);
      }
    }
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const currentFiles = selectedImageFiles || [];
      const currentPreviews = selectedImagePreviews || [];
      setSelectedImageFiles([...currentFiles, ...imageFiles]);
      const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
      setSelectedImagePreviews([...currentPreviews, ...newPreviews]);
    }
  };

  const removeThumbnail = () => {
    setSelectedThumbnailFile(null);
    setSelectedThumbnailPreview(null);
  };

  const removeOriginalImage = (index) => {
    setOriginalImageUrls(prev => prev.filter((_, i) => i !== index));
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
      let finalThumbnail = originalThumbnailUrl;
      let finalImages = [...(originalImageUrls || [])];

      // Upload thumbnail if file selected
      if (selectedThumbnailFile) {
        const uploadedUrl = await uploadImage(selectedThumbnailFile, 'products');
        finalThumbnail = uploadedUrl;
      }

      // Upload additional images if files selected
      if (selectedImageFiles && selectedImageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          selectedImageFiles.map(file => uploadImage(file, 'products'))
        );
        finalImages = [...finalImages, ...uploadedUrls];
      }

      // Delete images that are no longer needed
      const imagesToDelete = [];

      // Check if thumbnail was removed or replaced
      if (originalThumbnailUrl && finalThumbnail !== originalThumbnailUrl) {
        imagesToDelete.push(originalThumbnailUrl);
      }

      // Check which original images are no longer in finalImages
      if (initialOriginalImageUrls && initialOriginalImageUrls.length > 0) {
        for (const originalUrl of initialOriginalImageUrls) {
          if (!finalImages.includes(originalUrl)) {
            imagesToDelete.push(originalUrl);
          }
        }
      }

      // Delete images from Cloudinary
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
          console.warn('Failed to delete image from Cloudinary:', deleteError);
        }
      }

      // Prepare base product data (without variants)
      const baseProductData = {
        ...editProduct,
        thumbnail: finalThumbnail,
        images: finalImages,
        customFields: (editProduct.customFields || []).filter(field => field.key.trim() && field.value.trim()),
        // Only include weightDimension if both value and unit are provided
        weightDimension: (editProduct.weightDimension?.value && editProduct.weightDimension?.unit)
          ? {
            value: parseFloat(editProduct.weightDimension.value),
            unit: editProduct.weightDimension.unit
          }
          : undefined,
        variants: [] // Remove variants from base product
      };

      // Update the base product
      const baseResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/${editProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(baseProductData),
      });

      if (baseResponse.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }
      if (!baseResponse.ok) {
        const errorData = await baseResponse.json();
        throw new Error(errorData.message || 'Failed to update base product');
      }

      const baseData = await baseResponse.json();
      if (baseData.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      // Handle variants - create separate products for each variant
      const variants = editProduct.variants || [];
      if (variants.length > 0) {
        for (const variant of variants) {
          if (!variant.name || !variant.pricing?.mrp) continue; // Skip invalid variants

          const variantProductData = {
            name: variant.name, // Use only the variant name, not base name + variant name
            description: editProduct.description,
            brand: editProduct.brand,
            category: editProduct.category?._id || editProduct.category,
            hsnCode: editProduct.hsnCode,
            thumbnail: finalThumbnail,
            images: finalImages,
            tags: editProduct.tags || [],
            customFields: editProduct.customFields?.filter(field => field.key.trim() && field.value.trim()) || [],
            weightDimension: (variant.weightDimension?.value && variant.weightDimension?.unit)
              ? {
                value: parseFloat(variant.weightDimension.value),
                unit: variant.weightDimension.unit
              }
              : undefined,
            pricing: {
              mrp: parseFloat(variant.pricing.mrp)
            },
            isActive: variant.isActive !== false, // Default to true if not specified
            variants: [] // No sub-variants for variant products
          };

          // Create new product for this variant
          const variantResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(variantProductData),
          });

          if (!variantResponse.ok) {
            const errorData = await variantResponse.json();
            console.warn(`Failed to create variant product "${variant.name}":`, errorData.message);
            // Continue with other variants even if one fails
          } else {
            const variantData = await variantResponse.json();
            if (variantData.tokenValid === false) {
              navigate('/login', { replace: true });
              return;
            }
          }
        }
      }

      toast.success(`Product${variants.length > 0 ? ` and ${variants.length} variant${variants.length > 1 ? 's' : ''}` : ''} saved successfully`);
      fetchProducts({ page, search: searchTerm, category: filters.category, status: filters.status, sort: filters.sort, startsWith: filters.startsWith });
      fetchAvailableCount();
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
    fetchAvailableCount();
  };

  // Filter handlers for dropdowns, triggers fetch
  const handleCategoryFilter = (e) => {
    setFilters(f => ({ ...f, category: e.target.value }));
    setPage(1);
    fetchAvailableCount();
  };
  const handleStatusFilter = (e) => {
    setFilters(f => ({ ...f, status: e.target.value }));
    setPage(1);
    fetchAvailableCount();
  };
  const handleStartsWithFilter = (e) => {
    setFilters(f => ({ ...f, startsWith: e.target.value }));
    setPage(1);
    fetchAvailableCount();
  };
  const handleSortFilter = (e) => {
    setFilters(f => ({ ...f, sort: e.target.value }));
    setPage(1);
    fetchAvailableCount();
  };

  // Loading current user (guard)
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Delete Modal */}
          <Modal
            isOpen={confirmDeleteVisible}
            onRequestClose={() => !isDeleting && setConfirmDeleteVisible(false)}
            className="fixed inset-0 flex items-center justify-center p-4"
          >
            <div className="bg-red-50 border border-red-500 shadow-xl p-4 md:p-6 w-full max-w-sm mx-4">
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">Products</h1>
                  {!loading && totalAvailable > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {totalAvailable.toLocaleString()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="mt-1 text-sm text-gray-500">Manage and organize your product inventory</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/products/requests')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Shield size={16} className="mr-2" />
                  Requested Products
                </button>
                <div className="relative">
                  <button
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    disabled={isExporting}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${isExporting
                      ? 'bg-purple-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
                  >
                    {isExporting ? (
                      <Loader2 className="animate-spin mr-2" size={16} />
                    ) : (
                      <Download size={16} className="mr-2" />
                    )}
                    {isExporting ? 'Exporting...' : 'Export'}
                    {!isExporting && <ChevronDown size={16} className="ml-2" />}
                  </button>
                  {exportDropdownOpen && !isExporting && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={handleExportExcel}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                          📊 Export to Excel
                        </button>
                        <button
                          onClick={handleExportJSON}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                          📄 Export to JSON
                        </button>
                        <button
                          onClick={handleExportCSV}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        >
                          📋 Export to CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/products/add')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Add Product
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Search className="w-6 h-6" />
                Search & Filters
              </h2>
            </div>
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 max-w-lg">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search products by name..."
                        value={pendingSearch}
                        onChange={(e) => setPendingSearch(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSearch();
                        }}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Search size={16} className="mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Category:</span>
                  <select
                    value={filters.category}
                    onChange={handleCategoryFilter}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categorylist.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {[
                      { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'active', label: 'Active', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                      { key: 'no_photos', label: 'No Photos', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                      { key: 'no_tags', label: 'No Tags', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                      { key: 'no_description', label: 'No Description', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleStatusFilter({ target: { value: key } })}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${filters.status === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Starts With Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Starts with:</span>
                  <select
                    value={filters.startsWith}
                    onChange={handleStartsWithFilter}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Letters</option>
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                      <option key={letter} value={letter}>
                        {letter}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={filters.sort}
                    onChange={handleSortFilter}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name_asc">A - Z</option>
                    <option value="name_desc">Z - A</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="created_desc">Newest First</option>
                    <option value="created_asc">Oldest First</option>
                    <option value="updated_desc">Last Updated First</option>
                    <option value="updated_asc">Oldest Updated First</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <button
                  onClick={() => {
                    setPendingSearch('');
                    setSearchTerm('');
                    setFilters({ category: '', status: 'all', sort: 'name_asc', startsWith: 'all' });
                    setPage(1);
                    fetchProducts(1, '', { category: '', status: 'all', sort: 'name_asc', startsWith: 'all' });
                    fetchAvailableCount();
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Reset
                </button>
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
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white shadow overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th> */}
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight/Dim</th>
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
                                    <img
                                      className="h-10 w-10 rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      src={product.thumbnail}
                                      alt={product.name}
                                      onClick={() => openImageViewer(product.thumbnail)}
                                    />
                                  </div>
                                )}
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.name}>{product.name}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs" title={product.brand}>{product.brand}</div>
                                </div>
                              </div>
                            </td>
                            {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.hsnCode || '—'}</td> */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.weightDimension?.value && product.weightDimension?.unit
                                ? `${product.weightDimension.value}${product.weightDimension.unit}`
                                : '—'}
                            </td>
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
                                onClick={() => openViewModal(product)}
                                className="text-blue-600 hover:text-blue-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="View Details"
                                disabled={confirmDeleteVisible}
                              >
                                <Eye size={18} />
                              </button>
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

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {products.map((product) => (
                    <div key={product._id} className="bg-white shadow border border-gray-200 rounded-none p-4">
                      <div className="flex items-start space-x-3">
                        {product.thumbnail && (
                          <img
                            className="h-16 w-16 rounded-none object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                            src={product.thumbnail}
                            alt={product.name}
                            onClick={() => openImageViewer(product.thumbnail)}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.name}>{product.name}</h3>
                              <p className="text-sm text-gray-500 truncate max-w-xs" title={product.brand}>{product.brand}</p>
                              <p className="text-sm text-gray-600 mt-1 truncate max-w-xs" title={product.category_string || product.category?.name || 'Uncategorized'}>
                                {product.category_string || product.category?.name || 'Uncategorized'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2 flex-shrink-0 max-w-[100px]">
                              <span className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full text-center
                              ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <div className="text-sm font-medium text-gray-900 text-right">
                                ₹{product.pricing?.mrp?.toFixed(2) ?? '0.00'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-xs text-gray-500 break-words flex-1 min-w-0 pr-2">
                              HSN: {product.hsnCode || '—'} |
                              Weight: {product.weightDimension?.value && product.weightDimension?.unit
                                ? `${product.weightDimension.value}${product.weightDimension.unit}`
                                : '—'}
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                              <button
                                onClick={() => openViewModal(product)}
                                className="text-blue-600 hover:text-blue-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="View Details"
                                disabled={confirmDeleteVisible}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => openEditModal(product)}
                                className="text-green-600 hover:text-green-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Edit"
                                disabled={confirmDeleteVisible}
                              >
                                <Edit size={16} />
                              </button>
                              {currentUser?.role === 'super_admin' && (
                                <button
                                  onClick={() => {
                                    setProductIdToDelete(product._id);
                                    setConfirmDeleteVisible(true);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete"
                                  disabled={confirmDeleteVisible}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Showing {products.length ? ((page - 1) * PAGE_SIZE + 1) : 0}
                    -
                    {products.length ? ((page - 1) * PAGE_SIZE + products.length) : 0}
                    &nbsp;of {totalProducts} products
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded disabled:opacity-50 flex items-center text-sm"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline ml-1">Prev</span>
                    </button>
                    <span className="px-2 text-sm">{page} / {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => handlePageChange(page + 1)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded disabled:opacity-50 flex items-center text-sm"
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )
          }
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={editModalIsOpen}
          onRequestClose={closeEditModal}
          className="z-[60]"
          overlayClassName="fixed inset-0 bg-white flex items-center justify-center z-[55]"
          contentLabel="Edit Product"
        >
          <div className="bg-white shadow-2xl max-w-full md:max-w-4xl h-[95vh] rounded-lg overflow-hidden flex flex-col p-4">
            <div className="bg-green-600 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Edit3 size={20} />
                  Edit Product
                </h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">


              {editProduct && (
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 p-4 ">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <EditInput
                        label="Product Name*"
                        maxLength={100}
                        name="name"
                        value={editProduct.name}
                        onChange={handleEditChange}
                        disabled={isSaving || currentUser?.role === 'inventory_manager'}
                        required
                      />
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">HSN Code</label>
                        <input
                          type="text"
                          maxLength={20}
                          name="hsnCode"
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={editProduct.hsnCode || ''}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                            setEditProduct(prev => ({ ...prev, hsnCode: sanitizedValue }));
                          }}
                          disabled={isSaving || currentUser?.role === 'inventory_manager'}
                          placeholder="e.g. 08081000"
                          onKeyDown={(e) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                      </div>
                      <EditInput
                        label="Brand"
                        maxLength={100}
                        name="brand"
                        value={editProduct.brand}
                        onChange={handleEditChange}
                        disabled={isSaving || currentUser?.role === 'inventory_manager'}
                      />
                      {/* Weight/Dimension */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Weight/Dimension</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            name="weightDimension.value"
                            value={editProduct.weightDimension?.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditProduct(prev => ({
                                ...prev,
                                weightDimension: {
                                  ...prev.weightDimension,
                                  value: value
                                }
                              }));
                            }}
                            className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={isSaving || currentUser?.role === 'inventory_manager'}
                            placeholder="e.g. 500"
                            min="0"
                            step="0.01"
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => {
                              if (['e', 'E', '+', '-'].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                          />
                          <select
                            name="weightDimension.unit"
                            value={editProduct.weightDimension?.unit || ''}
                            onChange={(e) => {
                              const unit = e.target.value;
                              setEditProduct(prev => ({
                                ...prev,
                                weightDimension: {
                                  ...prev.weightDimension,
                                  unit: unit
                                }
                              }));
                            }}
                            className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={isSaving || currentUser?.role === 'inventory_manager'}
                          >
                            <option value="">Select Unit</option>
                            {/* Weight units */}
                            <option value="g">Gram</option>
                            <option value="kg">Kilogram</option>
                            <option value="ml">Milliliter</option>
                            <option value="l">Liter</option>
                            {/* Dimension units */}
                            <option value="cm">Centimeter</option>
                            <option value="mm">Millimeter</option>
                            <option value="inch">Inch</option>
                            <option value="feet">Feet</option>
                            <option value="meter">Meter</option>
                            {/* Quantity units */}
                            <option value="pack">Pack</option>
                            <option value="piece">Piece</option>
                            <option value="pcs">Pcs</option>
                            <option value="unit">Unit</option>
                            <option value="dozen">Dozen</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">e.g. 500ml, 1kg, 250g, 12inch, 30cm, 1pack</p>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Category</label>
                        <select
                          name="category"
                          value={editProduct.category?._id || ''}
                          onChange={handleEditChange}
                          className="w-full px-3 py-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-green-500"
                          disabled={isSaving || currentUser?.role === 'inventory_manager'}
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
                            disabled={isSaving || currentUser?.role === 'inventory_manager'}
                          />
                          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-gray-50 p-4 ">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Pricing</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <EditInput
                        label="MRP (₹)*"
                        maxLength={6}
                        name="pricing.mrp"
                        value={editProduct.pricing?.mrp}
                        onChange={handleEditChange}
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isSaving || currentUser?.role === 'inventory_manager'}
                        required
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="bg-gray-50 p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Product Variants</h3>
                    <div className="space-y-4">
                      {(editProduct.variants || []).map((variant, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-md font-medium text-gray-700">Variant {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const newVariants = (editProduct.variants || []).filter((_, i) => i !== index);
                                setEditProduct({ ...editProduct, variants: newVariants });
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              disabled={isSaving || currentUser?.role === 'inventory_manager'}
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-1">Variant Name*</label>
                              <input
                                type="text"
                                value={variant.name || ''}
                                onChange={(e) => {
                                  const newVariants = [...(editProduct.variants || [])];
                                  newVariants[index] = { ...newVariants[index], name: e.target.value };
                                  setEditProduct({ ...editProduct, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={isSaving || currentUser?.role === 'inventory_manager'}
                                placeholder="e.g., 500ml, 1kg, Small"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-1">Weight/Dimension</label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  value={variant.weightDimension?.value || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const newVariants = [...(editProduct.variants || [])];
                                    newVariants[index] = {
                                      ...newVariants[index],
                                      weightDimension: {
                                        ...newVariants[index].weightDimension,
                                        value: value
                                      }
                                    };
                                    setEditProduct({ ...editProduct, variants: newVariants });
                                  }}
                                  className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  disabled={isSaving || currentUser?.role === 'inventory_manager'}
                                  placeholder="e.g. 500"
                                  min="0"
                                  step="0.01"
                                  onWheel={(e) => e.target.blur()}
                                  onKeyDown={(e) => {
                                    if (['e', 'E', '+', '-'].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                />
                                <select
                                  value={variant.weightDimension?.unit || ''}
                                  onChange={(e) => {
                                    const unit = e.target.value;
                                    const newVariants = [...(editProduct.variants || [])];
                                    newVariants[index] = {
                                      ...newVariants[index],
                                      weightDimension: {
                                        ...newVariants[index].weightDimension,
                                        unit: unit
                                      }
                                    };
                                    setEditProduct({ ...editProduct, variants: newVariants });
                                  }}
                                  className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                  disabled={isSaving || currentUser?.role === 'inventory_manager'}
                                >
                                  <option value="">Unit</option>
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
                            </div>
                            <div>
                              <label className="block text-gray-700 text-sm font-medium mb-1">MRP (₹)*</label>
                              <input
                                type="number"
                                value={variant.pricing?.mrp || ''}
                                onChange={(e) => {
                                  const mrp = e.target.value;
                                  const newVariants = [...(editProduct.variants || [])];
                                  newVariants[index] = {
                                    ...newVariants[index],
                                    pricing: {
                                      ...newVariants[index].pricing,
                                      mrp: parseFloat(mrp) || 0
                                    }
                                  };
                                  setEditProduct({ ...editProduct, variants: newVariants });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={isSaving || currentUser?.role === 'inventory_manager'}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                onWheel={(e) => e.target.blur()}
                                onKeyDown={(e) => {
                                  if (['e', 'E', '+', '-'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                required
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`variant-active-${index}`}
                                checked={variant.isActive !== false}
                                onChange={(e) => {
                                  const newVariants = [...(editProduct.variants || [])];
                                  newVariants[index] = { ...newVariants[index], isActive: e.target.checked };
                                  setEditProduct({ ...editProduct, variants: newVariants });
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                disabled={isSaving || currentUser?.role === 'inventory_manager'}
                              />
                              <label htmlFor={`variant-active-${index}`} className="ml-2 text-sm text-gray-700">
                                Active
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = [...(editProduct.variants || []), {
                            name: '',
                            weightDimension: { value: '', unit: '' },
                            pricing: { mrp: 0 },
                            isActive: true
                          }];
                          setEditProduct({ ...editProduct, variants: newVariants });
                        }}
                        className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                        disabled={isSaving || currentUser?.role === 'inventory_manager'}
                      >
                        <Plus size={16} />
                        Add Variant
                      </button>
                    </div>
                  </div>

                  {/* Media Section */}
                  <div className="bg-gray-50 p-4 ">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Media</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Thumbnail</label>

                        {/* Modern File Upload */}
                        <div className="space-y-3">
                          {!selectedThumbnailFile && !selectedThumbnailPreview ? (
                            <div
                              onDragOver={handleThumbnailDragOver}
                              onDrop={handleThumbnailDrop}
                              className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors duration-200 p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                              onClick={() => document.getElementById('thumbnail-file-input-edit').click()}
                            >
                              <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Drop thumbnail image here or click to browse</p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CircleCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-green-800 truncate">
                                    {selectedThumbnailFile?.name || 'Thumbnail selected'}
                                  </p>
                                  <p className="text-xs text-green-600">Ready to upload</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={removeThumbnail}
                                  className="flex-shrink-0 p-1 hover:bg-green-100 rounded-full transition-colors"
                                >
                                  <XCircle className="h-4 w-4 text-green-600" />
                                </button>
                              </div>
                              {selectedThumbnailPreview && (
                                <div className="mt-2">
                                  <img
                                    src={selectedThumbnailPreview}
                                    alt="Thumbnail preview"
                                    className="h-20 w-20 object-cover border rounded"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <input
                            id="thumbnail-file-input-edit"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleThumbnailFileSelect(e.target.files[0])}
                            className="hidden"
                            disabled={isSaving || uploadingImages}
                          />

                          {originalThumbnailUrl && !selectedThumbnailFile && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500">Current thumbnail:</p>
                                <button
                                  type="button"
                                  onClick={() => setOriginalThumbnailUrl(null)}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="relative inline-block mt-1">
                                <img
                                  src={originalThumbnailUrl}
                                  alt="Current thumbnail"
                                  className="h-20 w-20 object-cover border rounded"
                                  onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Image+not+found'; }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setOriginalThumbnailUrl(null)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">Additional Images</label>

                        {/* Modern File Upload */}
                        <div className="space-y-3">
                          <div
                            onDragOver={handleImageDragOver}
                            onDrop={handleImageDrop}
                            className="border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors duration-200 p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                            onClick={() => document.getElementById('images-file-input-edit').click()}
                          >
                            <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Drop additional images here or click to browse</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
                          </div>

                          <input
                            id="images-file-input-edit"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageFileSelect(Array.from(e.target.files))}
                            className="hidden"
                            disabled={isSaving || uploadingImages}
                          />

                          {/* Selected Files Display */}
                          {selectedImageFiles && selectedImageFiles.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                              {selectedImageFiles.map((file, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                  <CircleCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-800 truncate">{file.name}</p>
                                    <p className="text-xs text-green-600">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  {selectedImagePreviews[index] && (
                                    <img
                                      src={selectedImagePreviews[index]}
                                      alt={`Preview ${index}`}
                                      className="h-8 w-8 object-cover border rounded flex-shrink-0"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="flex-shrink-0 p-1 hover:bg-green-100 rounded-full transition-colors"
                                  >
                                    <XCircle className="h-4 w-4 text-green-600" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <input
                            id="images-file-input-edit"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageFileSelect(Array.from(e.target.files))}
                            className="hidden"
                            disabled={isSaving || uploadingImages}
                          />

                          {/* Current Images Display */}
                          {originalImageUrls && originalImageUrls.length > 0 && !selectedImageFiles?.length && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs text-gray-500">Current images:</p>
                                <button
                                  type="button"
                                  onClick={() => setOriginalImageUrls([])}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                >
                                  Remove all
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {originalImageUrls.map((img, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={img}
                                      alt={`Current ${index}`}
                                      className="h-12 w-12 object-cover border rounded"
                                      onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Image+not+found'; }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeOriginalImage(index)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
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
                          disabled={isSaving || currentUser?.role === 'inventory_manager'}
                          rows={4}
                          maxLength={3000}
                        />

                      </div>
                      <ChipInput
                        label="Tags"
                        values={editProduct.tags || []}
                        setValues={vals => setEditProduct({ ...editProduct, tags: vals })}
                        disabled={isSaving || currentUser?.role === 'inventory_manager'}
                        maxTags={10}
                        placeholder="Add tag and press Enter or comma"
                      />

                      {/* Custom Fields */}
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">Custom Attributes</label>
                        <div className="space-y-2">
                          {(editProduct.customFields || []).map((field, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Key (e.g., Type)"
                                value={field.key || ''}
                                onChange={(e) => {
                                  const newFields = [...(editProduct.customFields || [])];
                                  newFields[index] = { ...newFields[index], key: e.target.value };
                                  setEditProduct({ ...editProduct, customFields: newFields });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                disabled={isSaving || currentUser?.role === 'inventory_manager'}
                              />
                              <input
                                type="text"
                                placeholder="Value (e.g., Veg)"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...(editProduct.customFields || [])];
                                  newFields[index] = { ...newFields[index], value: e.target.value };
                                  setEditProduct({ ...editProduct, customFields: newFields });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                disabled={isSaving || currentUser?.role === 'inventory_manager'}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newFields = (editProduct.customFields || []).filter((_, i) => i !== index);
                                  setEditProduct({ ...editProduct, customFields: newFields });
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                disabled={isSaving || currentUser?.role === 'inventory_manager'}
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newFields = [...(editProduct.customFields || []), { key: '', value: '' }];
                              setEditProduct({ ...editProduct, customFields: newFields });
                            }}
                            className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                            disabled={isSaving || currentUser?.role === 'inventory_manager'}
                          >
                            <Plus size={16} />
                            Add Custom Attribute
                          </button>
                        </div>
                      </div>

                      {/* Highlights and Search Keywords removed from product edit form */}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 border-t flex-shrink-0">
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
            </div>
          </div>
        </Modal>
      </div >

      {/* View Product Modal */}
      <Modal
        isOpen={viewModalIsOpen}
        onRequestClose={closeViewModal}
        className="p-4 z-[60]"
        overlayClassName="fixed inset-0 bg-white flex items-center justify-center z-[55]"
        contentLabel="Product Details Viewer"
      >
        <div className="bg-white shadow-2xl max-w-full md:max-w-5xl h-[95vh] rounded-lg overflow-hidden flex flex-col">
          <div className="bg-green-600 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Eye size={20} />
                Product Details
              </h2>
              <button
                onClick={closeViewModal}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">

            <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto">
              {viewProduct && (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Package size={20} />
                      Basic Information
                    </h3>
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
                        <label className="block text-sm font-medium text-gray-600">HSN Code</label>
                        <p className="text-sm text-gray-900 mt-1">{viewProduct.hsnCode || '—'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${viewProduct.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {viewProduct.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Weight/Dimension</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewProduct.weightDimension?.value && viewProduct.weightDimension?.unit
                            ? `${viewProduct.weightDimension.value}${viewProduct.weightDimension.unit}`
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">MRP</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">₹{viewProduct.pricing?.mrp?.toFixed(2) ?? '0.00'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Selling Price</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">₹{viewProduct.pricing?.sellingPrice?.toFixed(2) ?? '0.00'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Cost Price</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">₹{viewProduct.pricing?.costPrice?.toFixed(2) ?? '0.00'}</p>
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
                  {(viewProduct.thumbnail || (viewProduct.images && viewProduct.images.length > 0)) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Image size={20} />
                        Images
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {viewProduct.thumbnail && (
                          <div className="relative">
                            <img
                              src={viewProduct.thumbnail}
                              alt="Thumbnail"
                              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-blue-500"
                              onClick={() => openImageViewer(viewProduct.thumbnail)}
                            />
                            <span className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">Thumbnail</span>
                          </div>
                        )}
                        {viewProduct.images && viewProduct.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openImageViewer(image)}
                            />
                            <span className="absolute top-1 left-1 bg-gray-500 text-white text-xs px-2 py-1 rounded">Image {index + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {viewProduct.tags && viewProduct.tags.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {viewProduct.tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Attributes */}
                  {viewProduct.customFields && viewProduct.customFields.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Attributes</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewProduct.customFields.map((field, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">{field.key}:</span>
                              <span className="text-sm text-gray-900">{field.value}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Created At</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewProduct.createdAt ? new Date(viewProduct.createdAt).toLocaleString() : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Updated At</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewProduct.updatedAt ? new Date(viewProduct.updatedAt).toLocaleString() : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Product ID</label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{viewProduct._id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Stock Status</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewProduct.stock?.quantity !== undefined ? `${viewProduct.stock.quantity} units` : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        isOpen={imageViewerVisible}
        onRequestClose={closeImageViewer}
        className="p-4 z-[60]"
        overlayClassName="fixed inset-0 bg-white flex items-center justify-center z-[55]"
        contentLabel="Product Image Viewer"
      >
        <div className="bg-white shadow-2xl max-w-full md:max-w-4xl w-full h-[95vh] rounded-lg overflow-hidden flex flex-col">
          <div className="bg-green-600 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Image size={20} />
                Product Image
              </h2>
              <button
                onClick={closeImageViewer}
                className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {selectedImageUrl && (
              <img
                src={selectedImageUrl}
                alt="Product"
                className="max-w-full max-h-80 md:max-h-96 object-contain mx-auto"
                style={{ maxHeight: '70vh' }}
              />
            )}
          </div>
        </div>
      </Modal>
    </Layout>
  );
}