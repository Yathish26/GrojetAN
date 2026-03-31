import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout';
import { VERSION } from '../../version.js';

export default function FoodCategories() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const allowedRoles = ['super_admin', 'admin'];

  // Food categories data
  const [foodCategories, setFoodCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Add category modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    photo: null,
    isActive: true
  });
  const [addLoading, setAddLoading] = useState(false);

  // Edit category modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
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
  }, [navigate]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Fetch food categories from backend
  const fetchFoodCategories = useCallback(async () => {
    try {
      setFetchingCategories(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/food-categories?${params}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setFoodCategories(data.categories || []);
      } else {
        toast.error(data.message || 'Failed to fetch food categories');
      }
    } catch (error) {
      console.error('Error fetching food categories:', error);
      toast.error('Failed to load food categories');
    } finally {
      setFetchingCategories(false);
    }
  }, [searchTerm, filterStatus, navigate]);

  useEffect(() => {
    if (currentUser) {
      fetchFoodCategories();
    }
  }, [currentUser, fetchFoodCategories]);

  const handleToggleStatus = async (categoryId) => {
    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/food-categories/${categoryId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the local state instead of refetching to avoid potential duplicate toasts
        setFoodCategories(prevCategories => 
          prevCategories.map(cat => 
            cat._id === categoryId ? data.category : cat
          )
        );
        
        toast.success(data.message || 'Category status updated successfully');
      } else {
        toast.error(data.message || 'Failed to update category status');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error('Failed to update category status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (!newCategory.photo) {
      toast.error('Category photo is required');
      return;
    }

    try {
      setAddLoading(true);

      const formData = new FormData();
      formData.append('name', newCategory.name.trim());
      formData.append('photo', newCategory.photo);
      formData.append('isActive', newCategory.isActive);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/food-categories`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the local state instead of refetching to avoid potential duplicate toasts
        setFoodCategories(prevCategories => [...prevCategories, data.category]);
        
        // Reset form and close modal
        setNewCategory({
          name: '',
          photo: null,
          isActive: true
        });
        setShowAddModal(false);
        toast.success('Food category added successfully');
      } else {
        toast.error(data.message || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();

    if (!editingCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setEditLoading(true);

      const formData = new FormData();
      formData.append('name', editingCategory.name.trim());
      if (editingCategory.photo) {
        formData.append('photo', editingCategory.photo);
      }
      formData.append('isActive', editingCategory.isActive);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/food-categories/${editingCategory._id}`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the local state instead of refetching to avoid potential duplicate toasts
        setFoodCategories(prevCategories => 
          prevCategories.map(cat => 
            cat._id === editingCategory._id ? data.category : cat
          )
        );
        
        // Reset form and close modal
        setEditingCategory(null);
        setShowEditModal(false);
        toast.success('Food category updated successfully');
      } else {
        toast.error(data.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCategory = (categoryId) => {
    const category = foodCategories.find(cat => cat._id === categoryId);
    if (category) {
      setEditingCategory({
        _id: category._id,
        name: category.name,
        photo: null, // Reset photo for new upload
        existingPhoto: category.photo, // Keep existing photo URL
        isActive: category.isActive
      });
      setShowEditModal(true);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this food category? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/food-categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update the local state instead of refetching to avoid potential duplicate toasts
        setFoodCategories(prevCategories =>
          prevCategories.filter(cat => cat._id !== categoryId)
        );

        toast.success(data.message || 'Food category deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingUser) {
    return (
      <Layout title="Food Categories">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
        </div>
      </Layout>
    );
  }

  // Authorization check
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins can manage food categories.</p>
      </div>
    );
  }

  return (
    <Layout title="Food Categories">
      <div className="min-h-screen bg-gray-50">
        <Toaster />

        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Food Categories</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage food categories for product classification
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search food categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="sm:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Categories</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {fetchingCategories ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {foodCategories.map((category) => (
              <div
                key={category._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      {category.photo && (
                        <div className="mb-4">
                          <img
                            src={category.photo}
                            alt={category.name}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {category.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditCategory(category._id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit category"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(category._id)}
                        disabled={loading}
                        className={`p-1 transition-colors ${
                          category.isActive
                            ? 'text-gray-400 hover:text-red-600'
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={category.isActive ? 'Deactivate category' : 'Activate category'}
                      >
                        {category.isActive ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteCategory(category._id)}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                ))}
              </div>

              {foodCategories.length === 0 && !fetchingCategories && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No food categories found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first food category.'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Add Food Category</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g. Snacks, Beverages"
                      required
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Photo *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewCategory(prev => ({ ...prev, photo: e.target.files[0] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a photo for this food category (max 5MB)</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newCategory.isActive}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Active (visible to users)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Category
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && editingCategory && (
          <div className="fixed inset-0 bg-gray-600/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Food Category</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCategory(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleEditCategorySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g. Snacks, Beverages"
                      required
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Photo
                    </label>
                    {editingCategory.existingPhoto && (
                      <div className="mb-2">
                        <img
                          src={editingCategory.existingPhoto}
                          alt="Current photo"
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <p className="text-xs text-gray-500 mt-1">Current photo</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, photo: e.target.files[0] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a new photo to replace the current one (max 5MB, optional)</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editingCategory.isActive}
                      onChange={(e) => setEditingCategory(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
                      Active (visible to users)
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingCategory(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Category
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}