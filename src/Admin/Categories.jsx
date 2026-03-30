import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  CircleCheck,
  XCircle,
  X,
  Loader2,
  Star,
  ListOrdered,
  Search,
  Filter,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout';
import * as XLSX from 'xlsx';
import { VERSION } from '../../version.js';

export default function Categories() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const allowedRoles = ['super_admin', 'admin', 'inventory_manager'];

  useEffect(() => {
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
    fetchCurrentUser();
  }, [navigate]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // New states for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMainCategory, setFilterMainCategory] = useState('');
  const [filterIsActive, setFilterIsActive] = useState('all'); // 'all', 'true', 'false'
  const [filterShowOnHome, setFilterShowOnHome] = useState('all'); // 'all', 'true', 'false'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);

  const mainCategories = [
    "Grocery & Kitchen",
    "Snacks & Drinks",
    "Beauty & Personal Care",
    "Household Essentials",
    "Health & Wellness",
  ]

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mainCategory: '',
    image: '',
    isActive: true,
    showOnHome: false,
    order: 0
  });

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
        credentials: 'include', // <-- use cookie
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      // Categories are already sorted by order from backend
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const createLog = useCallback(async (message) => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER}/admin/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          level: 'INFO',
          message,
          user: currentUser?.name || currentUser?.email || 'Admin',
          platform: 'Admin',
          version: VERSION,
        }),
      });
    } catch (error) {
      console.error('Failed to create log:', error);
    }
  }, [currentUser]);

  const buildCategoryCreateMessage = useCallback((categoryName) => {
    const adminName = currentUser?.name || currentUser?.email || 'Admin';
    return `${adminName} Added category-${categoryName}.`;
  }, [currentUser]);

  const buildCategoryEditMessage = useCallback((categoryName) => {
    const adminName = currentUser?.name || currentUser?.email || 'Admin';
    return `${adminName} Edited category-${categoryName}.`;
  }, [currentUser]);

  const buildCategoryDeleteMessage = useCallback((categoryName) => {
    const adminName = currentUser?.name || currentUser?.email || 'Admin';
    return `${adminName} Deleted category-${categoryName}.`;
  }, [currentUser]);

  useEffect(() => {
    if (isAuthorized) fetchCategories();
  }, [fetchCategories, isAuthorized]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Prepare form for editing
  const handleEditClick = (category) => {
    setEditingCategory(category._id);
    setFormData({
      name: category.name,
      mainCategory: category.mainCategory,
      image: category.image || '',
      isActive: category.isActive,
      showOnHome: category.showOnHome,
      order: category.order || 0
    });
    setOriginalImageUrl(category.image || null); // Store original image URL
    setSelectedFile(null); // Clear any previously selected file
    setIsModalOpen(true);
  };

  // Prepare for deletion
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = formData.image;

      // Upload image if a file was selected
      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          // Upload failed, stop submission
          setLoading(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      const endpoint = `${import.meta.env.VITE_SERVER}/admin/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `${endpoint}/${editingCategory}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // <-- use cookie
        body: JSON.stringify({ ...formData, image: finalImageUrl }),
      });

      if (response.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save category');
      }

      if (!editingCategory) {
        const savedCategoryName = data.category?.name || formData.name;
        await createLog(buildCategoryCreateMessage(savedCategoryName));
      } else {
        const savedCategoryName = data.category?.name || formData.name;
        await createLog(buildCategoryEditMessage(savedCategoryName));
      }

      toast.success(
        editingCategory
          ? 'Category updated successfully!'
          : 'Category added successfully!'
      );

      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({
        name: '',
        mainCategory: '',
        image: '',
        isActive: true,
        showOnHome: false,
        order: 0
      });
      setSelectedFile(null); // Clear selected file
      setOriginalImageUrl(null); // Clear original image URL
      fetchCategories();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection (store file for later upload)
  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: previewUrl }));
    }
  };

  // Handle image upload (called during form submission)
  const uploadImage = async () => {
    if (!selectedFile) return null;

    const toastId = toast.loading('Uploading image...', { duration: 0 });

    const formDataUpload = new FormData();
    formDataUpload.append('file', selectedFile);
    // categorize uploads under the "categories" folder for easier S3 organization
    formDataUpload.append('folder', 'categories');

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload/s3`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      const data = await response.json();

      if (response.ok) {
        // If editing and there's an original image, delete it from S3
        if (editingCategory && originalImageUrl) {
          try {
            await fetch(`${import.meta.env.VITE_SERVER}/image/delete/s3`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ imageUrl: originalImageUrl }),
              credentials: 'include',
            });
          } catch (deleteError) {
            console.warn('Failed to delete old image from S3:', deleteError);
          }
        }

        toast.success('Image uploaded successfully!', { id: toastId });
        // s3 endpoint returns `url` instead of `imageUrl`
        return data.url;
      } else {
        toast.error(data.error || 'Upload failed', { id: toastId });
        return null;
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Upload failed', { id: toastId });
      return null;
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);

      // Delete the category image from S3 if it exists
      if (categoryToDelete.image) {
        try {
          await fetch(`${import.meta.env.VITE_SERVER}/image/delete/s3`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageUrl: categoryToDelete.image }),
            credentials: 'include',
          });
          // We don't show error for delete failure, as the category deletion is more important
        } catch (deleteError) {
          console.warn('Failed to delete image from S3:', deleteError);
        }
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include', // <-- use cookie
      });

      if (response.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

      await createLog(buildCategoryDeleteMessage(categoryToDelete.name));

      toast.success('Category deleted successfully!');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered categories based on search and filter criteria
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply main category filter
    if (filterMainCategory) {
      filtered = filtered.filter(category =>
        category.mainCategory === filterMainCategory
      );
    }

    // Apply isActive filter
    if (filterIsActive !== 'all') {
      const isActiveBool = filterIsActive === 'true';
      filtered = filtered.filter(category =>
        category.isActive === isActiveBool
      );
    }

    // Apply showOnHome filter
    if (filterShowOnHome !== 'all') {
      const showOnHomeBool = filterShowOnHome === 'true';
      filtered = filtered.filter(category =>
        category.showOnHome === showOnHomeBool
      );
    }

    return filtered;
  }, [categories, searchTerm, filterMainCategory, filterIsActive, filterShowOnHome]);

  // Handle search
  const handleSearch = () => {
    // The search is handled in real-time by the useMemo for filteredCategories
    // This function is here for the search button if needed
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterMainCategory('');
    setFilterIsActive('all');
    setFilterShowOnHome('all');
  };

  // Handle export to Excel
  const handleExportToExcel = () => {
    const data = filteredCategories.map(category => ({
      Name: category.name,
      MainCategory: category.mainCategory,
      IsActive: category.isActive ? 'Yes' : 'No',
      ShowOnHome: category.showOnHome ? 'Yes' : 'No',
      Order: category.order,
      ProductCount: category.productCount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    XLSX.writeFile(wb, 'categories.xlsx');
    toast.success('Categories exported to Excel successfully!');
  };

  // Render categories list
  const renderCategories = () => {
    if (loading && categories.length === 0) {
      return (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
          <span className="ml-3 text-gray-600 text-lg">Loading categories...</span>
        </div>
      );
    }

    if (filteredCategories.length === 0 && !loading) {
      return (
        <div className="p-8 text-center text-gray-500 text-lg">
          No categories found matching your criteria.
        </div>
      );
    }

    return (
      <>
        <div className="block md:hidden space-y-3 p-3 sm:p-4">
          {filteredCategories.map(category => (
            <div key={category._id} className={`border rounded-lg p-4 ${!category.isActive ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{category.mainCategory}</p>
                </div>
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-10 w-10 object-cover rounded"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/40x40/E0E0E0/888888?text=N/A`;
                    }}
                  />
                ) : (
                  <ImageIcon size={20} className="text-gray-400" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <span className="text-gray-500">Status</span>
                  <div className="mt-1">
                    {category.isActive ? (
                      <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Homepage</span>
                  <div className="mt-1">
                    {category.showOnHome ? (
                      <CircleCheck className="text-green-500" size={16} />
                    ) : (
                      <XCircle className="text-red-500" size={16} />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Products</span>
                  <p className="text-gray-800 mt-1">{category.productCount || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Order</span>
                  <p className="text-gray-800 mt-1">{category.order}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEditClick(category)}
                  className="text-green-600 cursor-pointer hover:text-green-900 flex items-center justify-center"
                  title="Edit Category"
                >
                  <Edit size={16} />
                </button>
                {currentUser?.role === 'super_admin' && (
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 cursor-pointer hover:text-red-900 flex items-center justify-center"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Show on Home</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map(category => (
                <tr key={category._id} className={!category.isActive ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{category.mainCategory}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.image && (
                      <a
                        href={category.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:underline text-sm flex items-center"
                      >
                        <img
                          src={category.image}
                          alt={category.name}
                          className="h-8 w-8 mr-1 object-cover"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/32x32/E0E0E0/888888?text=N/A`;
                          }}
                        />
                      </a>
                    )}
                    {!category.image && (
                      <ImageIcon size={20} className="text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {category.showOnHome ? (
                      <CircleCheck className="text-green-500 mx-auto" size={18} />
                    ) : (
                      <XCircle className="text-red-500 mx-auto" size={18} />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.productCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.order}
                  </td>
                  <td className="px-6 py-4 flex whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(category)}
                      className="text-green-600 cursor-pointer hover:text-green-900 mr-4 flex items-center justify-center"
                      title="Edit Category"
                    >
                      <Edit size={16} />
                    </button>
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="text-red-600 cursor-pointer hover:text-red-900 flex items-center justify-center"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  if (checkingUser) {
    return (
      <Layout title="Categories">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-.293-1.035l-6-10a2 2 0 00-3.414 0l-6 10A2 2 0 004 13v6a2 2 0 002 2z" /></svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins and Super Admins can manage categories.</p>
      </div>
    );
  }
  return (
    <Layout title="Categories">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage and organize product categories</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportToExcel}
                  className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                >
                  <FileSpreadsheet size={16} className="mr-2" />
                  Export to Excel
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      mainCategory: '',
                      image: '',
                      isActive: true,
                      showOnHome: false,
                      order: 0
                    });
                    setSelectedFile(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
                >
                  <Plus size={16} className="mr-2" />
                  Add Category
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
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 sm:max-w-lg">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search categories by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                  >
                    <Search size={16} className="mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                {/* Main Category Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600">Main Category:</span>
                  <select
                    value={filterMainCategory}
                    onChange={(e) => setFilterMainCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                  >
                    <option value="">All Categories</option>
                    {mainCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Status Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600">Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden w-full sm:w-auto">
                    {[
                      { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'true', label: 'Active', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'false', label: 'Inactive', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => setFilterIsActive(key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterIsActive === key
                            ? color.replace('hover:', '')
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show on Home Filter */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-600">Homepage:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden w-full sm:w-auto">
                    {[
                      { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'true', label: 'Show', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                      { key: 'false', label: 'Hide', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => setFilterShowOnHome(key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${filterShowOnHome === key
                            ? color.replace('hover:', '')
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Filters */}
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
                >
                  <RotateCcw size={14} className="mr-1" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {renderCategories()}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden rounded-lg">
            <div className="bg-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Plus size={20} />
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-6 pt-4 sm:pt-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="mainCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Main Category *
                  </label>
                  <select
                    id="mainCategory"
                    name="mainCategory"
                    value={formData.mainCategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                    required
                  >
                    <option value="">Select a main category</option>
                    {mainCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {selectedFile && <p className="text-sm text-green-600 mt-1">Image selected: {selectedFile.name}</p>}
                  {formData.image && !selectedFile && (
                    <div className="mt-2">
                      <img src={formData.image} alt="Current" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                  {formData.image && selectedFile && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600">New image preview:</p>
                      <img src={formData.image} alt="Preview" className="w-20 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    id="order"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    onKeyDown={(e) => {
                    if (['e', 'E', '+', '-'].includes(e.key)) {
                    e.preventDefault();
                        }
                     }}
                  />
                </div>

                <div className="space-y-3 col-span-1 md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Active
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showOnHome"
                      name="showOnHome"
                      checked={formData.showOnHome}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <label htmlFor="showOnHome" className="ml-2 text-sm text-gray-700 cursor-pointer">
                      Show on Homepage
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                >
                  {(loading || uploadingImage) && <Loader2 className="animate-spin mr-2" size={16} />}
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl max-w-md w-full overflow-hidden rounded-lg">
            <div className="bg-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Trash2 size={20} />
                  Confirm Deletion
                </h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-2 hover:bg-red-500 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Category</h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete "<span className="font-semibold text-gray-900">{categoryToDelete.name}</span>"? This action cannot be undone and will permanently remove the category and its image.
                  </p>
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
                    >
                      {loading && <Loader2 className="animate-spin mr-2" size={16} />}
                      Delete Category
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
    </Layout>
  );
}
