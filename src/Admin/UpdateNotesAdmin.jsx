import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiSmartphone,
  FiMonitor,
  FiShoppingCart,
  FiTruck,
  FiX,
  FiSave,
  FiCalendar,
  FiTag
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout.jsx';

export default function UpdateNotesAdmin() {
  const navigate = useNavigate();
  const [updateNotes, setUpdateNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [filterApp, setFilterApp] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    app: '',
    version: '',
    features: [''],
    releaseDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchUpdateNotes();
  }, []);

  const fetchUpdateNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/update-notes`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.status === 403) {
        toast.error('Access denied. Super admin privileges required.');
        navigate('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch update notes');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login');
        return;
      }
      setUpdateNotes(data.updateNotes || []);
    } catch (error) {
      console.error('Error fetching update notes:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!formData.app || !formData.version) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.features.length === 0 || formData.features[0].trim() === '') {
      toast.error('Please add at least one feature');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/update-notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...formData,
            features: formData.features.filter(f => f.trim() !== '')
          }),
        }
      );

      if (response.ok) {
        toast.success('Update note created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchUpdateNotes();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create update note');
      }
    } catch (error) {
      console.error('Error creating update note:', error);
      toast.error('Failed to create update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!formData.app || !formData.version) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.features.length === 0 || formData.features[0].trim() === '') {
      toast.error('Please add at least one feature');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/update-notes/${selectedNote._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...formData,
            features: formData.features.filter(f => f.trim() !== '')
          }),
        }
      );

      if (response.ok) {
        toast.success('Update note updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchUpdateNotes();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update update note');
      }
    } catch (error) {
      console.error('Error updating update note:', error);
      toast.error('Failed to update update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/update-notes/${selectedNote._id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('Update note deleted successfully');
        setShowDeleteModal(false);
        setSelectedNote(null);
        fetchUpdateNotes();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete update note');
      }
    } catch (error) {
      console.error('Error deleting update note:', error);
      toast.error('Failed to delete update note');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      app: '',
      version: '',
      features: [''],
      releaseDate: '',
      isActive: true
    });
  };

  const openEditModal = (note) => {
    setSelectedNote(note);
    setFormData({
      app: note.app,
      version: note.version,
      features: note.features.length > 0 ? note.features : [''],
      releaseDate: note.releaseDate ? new Date(note.releaseDate).toISOString().split('T')[0] : '',
      isActive: note.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (note) => {
    setSelectedNote(note);
    setShowDeleteModal(true);
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const getAppIcon = (app) => {
    switch (app) {
      case 'admin_panel': return <FiMonitor className="text-blue-600" />;
      case 'customer_app': return <FiSmartphone className="text-green-600" />;
      case 'merchant_app': return <FiShoppingCart className="text-purple-600" />;
      case 'delivery_agent_app': return <FiTruck className="text-orange-600" />;
      default: return <FiTag className="text-gray-600" />;
    }
  };

  const getAppName = (app) => {
    switch (app) {
      case 'admin_panel': return 'Admin Panel';
      case 'customer_app': return 'Customer App';
      case 'merchant_app': return 'Merchant App';
      case 'delivery_agent_app': return 'Delivery Agent App';
      default: return app;
    }
  };

  const filteredNotes = filterApp === 'all'
    ? updateNotes
    : updateNotes.filter(note => note.app === filterApp);

  if (loading) {
    return (
      <Layout title="Update Notes">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-4 border-t-green-500 rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Update Notes">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Update Notes Management</h1>
            <p className="text-gray-600 mt-1">Manage app updates and version releases</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition"
          >
            <FiPlus className="text-sm" />
            Add Update Note
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-lg">
          <div className="px-6 py-4 border-b">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <span className="text-sm font-medium text-gray-700">Filter by App:</span>
              <select
                value={filterApp}
                onChange={(e) => setFilterApp(e.target.value)}
                className="px-3 py-2 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Apps</option>
                <option value="admin_panel">Admin Panel</option>
                <option value="customer_app">Customer App</option>
                <option value="merchant_app">Merchant App</option>
                <option value="delivery_agent_app">Delivery Agent App</option>
              </select>
            </div>
          </div>
        </div>

        {/* Update Notes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div key={note._id} className="bg-white shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAppIcon(note.app)}
                    <div>
                      <h3 className="font-semibold text-gray-800">{getAppName(note.app)}</h3>
                      <p className="text-sm text-gray-600">v{note.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium">
                        Active
                      </span>
                    )}
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(note)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition"
                        title="Edit"
                      >
                        <FiEdit3 className="text-sm" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(note)}
                        className="p-1 text-red-600 hover:text-red-800 transition"
                        title="Delete"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FiCalendar className="text-gray-400" />
                  <span>Released: {new Date(note.releaseDate).toLocaleDateString()}</span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Features ({note.features.length})</h4>
                  <ul className="space-y-1">
                    {note.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span className="flex-1">{feature}</span>
                      </li>
                    ))}
                    {note.features.length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{note.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created: {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <FiTag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Update Notes Found</h3>
            <p className="text-gray-500">
              {filterApp === 'all' ? 'No update notes have been created yet.' : `No update notes found for ${getAppName(filterApp)}.`}
            </p>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Create Update Note</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App *
                    </label>
                    <select
                      value={formData.app}
                      onChange={(e) => setFormData(prev => ({ ...prev, app: e.target.value }))}
                      className="w-full p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={submitting}
                    >
                      <option value="">Select App</option>
                      <option value="admin_panel">Admin Panel</option>
                      <option value="customer_app">Customer App</option>
                      <option value="merchant_app">Merchant App</option>
                      <option value="delivery_agent_app">Delivery Agent App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version *
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="e.g., 1.2.3"
                      className="w-full p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                      className="w-full p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features *
                  </label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature description"
                        className="flex-1 p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={submitting}
                      />
                      {formData.features.length > 1 && (
                        <button
                          onClick={() => removeFeature(index)}
                          className="px-3 py-3 bg-red-100 text-red-600 hover:bg-red-200 transition"
                          disabled={submitting}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    disabled={submitting}
                  >
                    <FiPlus className="text-sm" />
                    Add Feature
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    disabled={submitting}
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Mark as active version
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Edit Update Note</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App *
                    </label>
                    <select
                      value={formData.app}
                      onChange={(e) => setFormData(prev => ({ ...prev, app: e.target.value }))}
                      className="w-full p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={submitting}
                    >
                      <option value="">Select App</option>
                      <option value="admin_panel">Admin Panel</option>
                      <option value="customer_app">Customer App</option>
                      <option value="merchant_app">Merchant App</option>
                      <option value="delivery_agent_app">Delivery Agent App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version *
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="e.g., 1.2.3"
                      className="w-full p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                      className="w-full p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features *
                  </label>
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature description"
                        className="flex-1 p-3 border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={submitting}
                      />
                      {formData.features.length > 1 && (
                        <button
                          onClick={() => removeFeature(index)}
                          className="px-3 py-3 bg-red-100 text-red-600 hover:bg-red-200 transition"
                          disabled={submitting}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    disabled={submitting}
                  >
                    <FiPlus className="text-sm" />
                    Add Feature
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    disabled={submitting}
                  />
                  <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
                    Mark as active version
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateNote}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Delete Update Note</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the update note for <strong>{getAppName(selectedNote.app)} v{selectedNote.version}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedNote(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteNote}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete Note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}