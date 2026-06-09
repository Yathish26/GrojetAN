import React, { useState, useEffect, useRef } from 'react';
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
  const [redirecting, setRedirecting] = useState(false);
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
  const [characterCounts, setCharacterCounts] = useState({
    title: 0,
    description: 0,
    location: 0
  });
  const formRef = useRef(null);

  const allowedRoles = ['super_admin', 'admin'];

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

      if (response.status === 401) {
        navigate('/login');
        return;
      }

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

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        toast.success(editingId ? 'Job updated successfully' : 'Job added successfully');
        setFormData({ title: '', description: '', location: '', locationType: 'on-site', jobType: '' });
        setCharacterCounts({ title: 0, description: 0, location: 0 });
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
    setCharacterCounts({
      title: job.title.length,
      description: job.description.length,
      location: job.location.length
    });
    setEditingId(job._id);

    // Scroll to form and focus on title input
    setTimeout(() => {
      if (formRef.current) {
        // Ensure smooth scrolling is enabled
        document.documentElement.style.scrollBehavior = 'smooth';
        
        try {
          // Try scrollIntoView first
          formRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        } catch (error) {
          // Fallback to manual scroll
          const elementTop = formRef.current.getBoundingClientRect().top;
          const absoluteElementTop = elementTop + window.pageYOffset;
          window.scrollTo({
            top: absoluteElementTop - 20,
            behavior: 'smooth'
          });
        }
        
        // Focus on the title input after scrolling
        setTimeout(() => {
          const titleInput = formRef.current.querySelector('input[type="text"]');
          if (titleInput) {
            titleInput.focus();
            // Ensure input is visible
            titleInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 1000); // Wait for scroll to complete
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/jobs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

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

  const updateCharacterCounts = (field, value) => {
    setCharacterCounts(prev => ({
      ...prev,
      [field]: value.length
    }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (['title', 'description', 'location'].includes(field)) {
      updateCharacterCounts(field, value);
    }
  };

  if (checkingUser) {
    return (
      <Layout title="Careers">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Careers">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Careers">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Briefcase className='w-16 h-16 text-red-500 mb-4'/>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Admins and Super Admins can manage careers.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Careers">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Careers Management</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage job postings and career opportunities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Add/Edit Job Form */}
          <div ref={formRef} className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Plus className="w-6 h-6" />
                {editingId ? 'Edit Job' : 'Add New Job'}
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter job title"
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {characterCounts.title}/100
                    </div>
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
                      onChange={(e) => handleFormChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter job location"
                      required
                    />
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {characterCounts.location}/100
                    </div>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    maxLength={5000}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter job description"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {characterCounts.description}/5000
                  </div>
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
                      onClick={() => {
                        setFormData({ title: '', description: '', location: '', locationType: 'on-site', jobType: '' });
                        setCharacterCounts({ title: 0, description: 0, location: 0 });
                        setEditingId(null);
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Briefcase className="w-6 h-6" />
                Job Listings ({jobs.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                <span className="ml-3 text-gray-600 font-medium">Loading jobs...</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <Briefcase size={40} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No jobs added yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <div key={job._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12">
                        <div className="w-full h-full rounded-lg bg-green-100 flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Type:</span> {job.jobType}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Location:</span> {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="font-medium">Work:</span> {job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(job)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(job._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-gray-400">
                            Posted: {new Date(job.createdAt).toLocaleDateString('en-IN')}
                            {job.updatedAt !== job.createdAt && (
                              <span className="ml-2">• Updated: {new Date(job.updatedAt).toLocaleDateString('en-IN')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}