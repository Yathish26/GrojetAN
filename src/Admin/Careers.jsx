import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function Careers() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    locationType: 'on-site',
    jobType: ''
  });
  const [editingId, setEditingId] = useState(null);

  const allowedRoles = ['super_admin', 'admin'];

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const local = localStorage.getItem('adminUser');
        if (local) {
          setCurrentUser(JSON.parse(local));
        } else {
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
        }
      } catch (err) {
        console.error('Failed to fetch current user', err);
      } finally {
        setCheckingUser(false);
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && !allowedRoles.includes(currentUser.role)) {
      navigate('/', { replace: true });
      return;
    }
    if (currentUser) {
      fetchJobs();
    }
  }, [currentUser, navigate]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/jobs`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (response.ok) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim() || !formData.jobType.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const url = editingId
        ? `${import.meta.env.VITE_SERVER}/admin/jobs/${editingId}`
        : `${import.meta.env.VITE_SERVER}/admin/jobs`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingId ? 'Job updated successfully' : 'Job added successfully');
        setFormData({ title: '', description: '' });
        setEditingId(null);
        fetchJobs();
      } else {
        toast.error('Failed to save job');
      }
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location,
      locationType: job.locationType,
      jobType: job.jobType
    });
    setEditingId(job._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/jobs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        toast.success('Job deleted successfully');
        fetchJobs();
      } else {
        toast.error('Failed to delete job');
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast.error('Failed to delete job');
    }
  };

  const handleCancel = () => {
    setFormData({ title: '', description: '', location: '', locationType: 'on-site', jobType: '' });
    setEditingId(null);
  };

  if (checkingUser) {
    return (
      <Layout title="Careers">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return (
    <Layout title="Careers">
      <div className="space-y-6">
        {/* Add/Edit Job Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Job' : 'Add New Job'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                maxLength={100}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter job title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select Job Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                maxLength={100}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter job location"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Type
              </label>
              <select
                value={formData.locationType}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="on-site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={200}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter job description"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Update Job' : 'Add Job'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Listings</h2>

          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No jobs added yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <span><strong>Type:</strong> {job.jobType}</span>
                        <span><strong>Location:</strong> {job.location}</span>
                        <span><strong>Work Type:</strong> {job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)}</span>
                      </div>
                      <p className="text-gray-600 mt-2">{job.description}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Created: {new Date(job.createdAt).toLocaleDateString('en-IN')}
                        {job.updatedAt !== job.createdAt && (
                          <span> | Updated: {new Date(job.updatedAt).toLocaleDateString('en-IN')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(job)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}