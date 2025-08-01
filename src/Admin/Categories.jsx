import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  CircleCheck,
  XCircle,
  Loader2,
  Star,
  ListOrdered,
  Search,
  Filter,
  RotateCcw,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Categories() {
  const navigate = useNavigate();
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

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      // Sort categories by order for consistent display
      const sortedCategories = data.categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(sortedCategories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
      const endpoint = `${import.meta.env.VITE_SERVER}/admin/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `${endpoint}/${editingCategory}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // <-- use cookie
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save category');
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
      fetchCategories();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setLoading(true);

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

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category');
      }

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

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterMainCategory('');
    setFilterIsActive('all');
    setFilterShowOnHome('all');
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
      <div className="overflow-x-auto  shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Show on Home</th>
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
                        className="h-8 w-8 mr-1  object-cover"
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
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 cursor-pointer hover:text-red-900 flex items-center justify-center"
                    title="Delete Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">

      <div className="bg-white border border-gray-200  overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Categories Management</h2>

          <div className="flex items-center">
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
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold hover:bg-green-700 shadow-sm"
            >
              <Plus size={18} className="mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                <Search size={14} className="inline-block mr-1" /> Search by Name
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search category name..."
                className="w-full px-3 py-2 border border-gray-300  focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>

            {/* Main Category Filter */}
            <div>
              <label htmlFor="filterMainCategory" className="block text-sm font-medium text-gray-700 mb-1">
                <ListOrdered size={14} className="inline-block mr-1" /> Filter by Main Category
              </label>
              <select
                id="filterMainCategory"
                value={filterMainCategory}
                onChange={(e) => setFilterMainCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300  focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              >
                <option value="">All Main Categories</option>
                {mainCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Status Filter */}
            <div>
              <label htmlFor="filterIsActive" className="block text-sm font-medium text-gray-700 mb-1">
                <CircleCheck size={14} className="inline-block mr-1" /> Filter by Status
              </label>
              <select
                id="filterIsActive"
                value={filterIsActive}
                onChange={(e) => setFilterIsActive(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300  focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Show on Home Filter */}
            <div>
              <label htmlFor="filterShowOnHome" className="block text-sm font-medium text-gray-700 mb-1">
                <Star size={14} className="inline-block mr-1" /> Filter by Homepage
              </label>
              <select
                id="filterShowOnHome"
                value={filterShowOnHome}
                onChange={(e) => setFilterShowOnHome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300  focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              >
                <option value="all">All Homepage Statuses</option>
                <option value="true">Show on Home</option>
                <option value="false">Don't Show on Home</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300  shadow-sm transition-colors duration-200"
              >
                <RotateCcw size={16} className="mr-2" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-4">
          {renderCategories()}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white/60  flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl  shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
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
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image && (
                    <div className="mt-2 p-2 border border-gray-200  bg-gray-50 flex items-center">
                      <span className="text-xs text-gray-500 mr-2">Preview:</span>
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="max-h-20 max-w-full object-contain  shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/100x50/E0E0E0/888888?text=Image+Error';
                        }}
                      />
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300  text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white  hover:bg-green-700 disabled:opacity-70 flex items-center justify-center transition-colors duration-200 shadow-sm"
                >
                  {loading && <Loader2 className="animate-spin mr-2" size={18} />}
                  {editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md  shadow-xl animate-fade-in-up">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "<span className="font-semibold">{categoryToDelete.name}</span>"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300  text-gray-700 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white  hover:bg-red-700 disabled:opacity-70 flex items-center justify-center transition-colors duration-200 shadow-sm"
                >
                  {loading && <Loader2 className="animate-spin mr-2" size={18} />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}