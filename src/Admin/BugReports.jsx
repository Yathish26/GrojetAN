import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Bug, AlertTriangle, CheckCircle, Clock, XCircle, Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LoaderSpinner from '../Components/Loader';
import Layout from '../Components/Layout';

export default function BugReports() {
  const [bugReports, setBugReports] = useState([]);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin'];

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const fetchCurrentUser = useCallback(async () => {
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
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  useEffect(() => {
    if (isAuthorized) {
      fetchBugReports();
      fetchStats();
    }
  }, [currentPage, statusFilter, priorityFilter, isAuthorized]);

  const fetchBugReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: reportsPerPage,
        status: statusFilter,
        priority: priorityFilter,
        search: searchTerm
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/bug-reports?${params}`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch bug reports');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setBugReports(data.bugReports || []);
      setTotalReports(data.pagination?.totalReports || 0);
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/bug-reports/stats/overview`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateBugReport = async (id, updates) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/bug-reports/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update bug report');
      }

      const data = await response.json();
      toast.success('Bug report updated successfully');

      // Update the local state
      setBugReports(prev => prev.map(report =>
        report._id === id ? data.bugReport : report
      ));

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating bug report:', error);
      toast.error(error.message);
    }
  };

  const deleteBugReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bug report?')) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/bug-reports/${id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete bug report');
      }

      toast.success('Bug report deleted successfully');
      setBugReports(prev => prev.filter(report => report._id !== id));
      setTotalReports(prev => prev - 1);
      fetchStats();
    } catch (error) {
      console.error('Error deleting bug report:', error);
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'in_review': return <AlertTriangle size={16} className="text-blue-500" />;
      case 'resolved': return <CheckCircle size={16} className="text-green-500" />;
      case 'dismissed': return <XCircle size={16} className="text-gray-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleRowExpansion = (reportId) => {
    setExpandedRows(prev => {
      const newSet = new Set();
      if (!prev.has(reportId)) {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  if (checkingUser) {
    return <LoaderSpinner />;
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Bug size={64} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">You need super admin privileges to access bug reports.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Bug Reports</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage and monitor bug reports from users</p>
                </div>
              </div>
            </div>
          </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Reports</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Bug className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Pending</p>
                    <p className="text-3xl font-bold text-white">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Resolved</p>
                    <p className="text-3xl font-bold text-white">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Recent (7 days)</p>
                    <p className="text-3xl font-bold text-white">{stats.recent}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-600 px-6 py-4">
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
                      placeholder="Search bug reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && fetchBugReports()}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={fetchBugReports}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
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

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'all', label: 'All Status', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                    { key: 'in_review', label: 'In Review', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                    { key: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'dismissed', label: 'Dismissed', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Priority:</span>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'all', label: 'All Priority', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'low', label: 'Low', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                    { key: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                    { key: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setPriorityFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${priorityFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setSearchTerm('');
                    fetchBugReports();
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bug Reports List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="bg-gray-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Bug className="w-6 h-6" />
              Bug Reports ({totalReports})
            </h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-green-200 border-t-green-600 rounded-full"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading bug reports...</span>
            </div>
          ) : bugReports.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No bug reports found</h3>
              <p className="text-gray-600">Bug reports will appear here when users submit them.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bugReports.map((report) => (
                      <React.Fragment key={report._id}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleRowExpansion(report._id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {report.user?.personalInfo?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {report.user?.personalInfo?.phone || report.user?.personalInfo?.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {report.title}
                            </div>
                            <div className={`text-sm text-gray-500 ${expandedRows.has(report._id) ? '' : 'max-w-xs truncate'}`}>
                              {report.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                              <span className="capitalize">{report.priority}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(report.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <select
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                value={report.status}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateBugReport(report._id, { status: e.target.value });
                                }}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_review">In Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                              </select>
                              <select
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                value={report.priority}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateBugReport(report._id, { priority: e.target.value });
                                }}
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBugReport(report._id);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRows.has(report._id) && (
                          <tr className="bg-gray-50">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="text-sm text-gray-700">
                                <strong>Full Description:</strong>
                                <div className="mt-2 whitespace-pre-wrap">{report.description}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-6">
                {bugReports.length === 0 ? (
                  <div className="text-center py-12">
                    <Bug className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-500">No bug reports found</p>
                    <p className="text-sm text-gray-400">Bug reports will appear here when users submit them.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bugReports.map((report) => (
                      <div key={report._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-red-100 flex items-center justify-center overflow-hidden flex-shrink-0 rounded-lg">
                            <Bug className="w-7 h-7 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                  {report.title}
                                </h3>
                                <p className="text-sm text-gray-500">{report.user?.personalInfo?.name || 'Unknown User'}</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                                  {getStatusIcon(report.status)} {report.status.replace('_', ' ')}
                                </span>
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(report.priority)}`}>
                                  {report.priority}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{report.user?.personalInfo?.phone || report.user?.personalInfo?.email}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatDate(report.createdAt)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <div className="text-sm text-gray-600">
                                {report.description.length > 100 ? `${report.description.substring(0, 100)}...` : report.description}
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                  value={report.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateBugReport(report._id, { status: e.target.value });
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_review">In Review</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="dismissed">Dismissed</option>
                                </select>
                                <select
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                  value={report.priority}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    updateBugReport(report._id, { priority: e.target.value });
                                  }}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="critical">Critical</option>
                                </select>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBugReport(report._id);
                                  }}
                                  className="text-red-600 hover:text-red-900 p-1"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalReports > reportsPerPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalReports / reportsPerPage)))}
                      disabled={currentPage === Math.ceil(totalReports / reportsPerPage)}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * reportsPerPage + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * reportsPerPage, totalReports)}</span> of{' '}
                        <span className="font-medium">{totalReports}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <FiChevronLeft size={16} />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {currentPage}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalReports / reportsPerPage)))}
                          disabled={currentPage === Math.ceil(totalReports / reportsPerPage)}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <FiChevronRight size={16} />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
}