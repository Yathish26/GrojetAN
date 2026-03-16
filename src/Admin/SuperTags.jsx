import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

export default function SuperTags() {
  const [superTags, setSuperTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Fetch super tags
  const fetchSuperTags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/super-tags`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setSuperTags(data.superTags || []);
      } else {
        toast.error('Failed to fetch super tags');
      }
    } catch (error) {
      console.error('Error fetching super tags:', error);
      toast.error('Failed to fetch super tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperTags();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingTag
        ? `${import.meta.env.VITE_SERVER}/admin/super-tags/${editingTag._id}`
        : `${import.meta.env.VITE_SERVER}/admin/super-tags`;

      const method = editingTag ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingTag ? 'Super tag updated successfully' : 'Super tag created successfully');
        setShowModal(false);
        setEditingTag(null);
        setFormData({
          name: '',
          description: ''
        });
        fetchSuperTags();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save super tag');
      }
    } catch (error) {
      console.error('Error saving super tag:', error);
      toast.error('Failed to save super tag');
    }
  };

  // Handle edit
  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || ''
    });
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this super tag?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/super-tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Super tag deleted successfully');
        fetchSuperTags();
      } else {
        toast.error('Failed to delete super tag');
      }
    } catch (error) {
      console.error('Error deleting super tag:', error);
      toast.error('Failed to delete super tag');
    }
  };

  if (loading) {
    return (
      <Layout title="Super Tags">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Super Tags">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Super Tags</h1>
            <p className="text-gray-600">Manage special tags for products and categories</p>
          </div>
          <button
            onClick={() => {
              setEditingTag(null);
              setFormData({
                name: '',
                description: ''
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Create Super Tag
          </button>
        </div>

        {/* Super Tags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {superTags.map((tag) => (
            <div
              key={tag._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{tag.name}</h3>
                </div>
              </div>

              {tag.description && (
                <p className="text-gray-600 text-sm mb-4">{tag.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Created: {new Date(tag.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag._id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {superTags.length === 0 && (
          <div className="text-center py-12">
            <Tag size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Super Tags Yet</h3>
            <p className="text-gray-600 mb-4">Create your first super tag to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Super Tag
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingTag ? 'Edit Super Tag' : 'Create Super Tag'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter tag name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Enter tag description"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingTag ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}