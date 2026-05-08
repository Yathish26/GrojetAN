import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiUser, FiSearch, FiChevronLeft, FiChevronRight, FiDownload, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Ban } from 'lucide-react';
import LoaderSpinner from '../Components/Loader';
import Layout from '../Components/Layout';


export default function Users() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [searching, setSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [hasEmailFilter, setHasEmailFilter] = useState(false);
  const [showBusinessOnly, setShowBusinessOnly] = useState(false);

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];

  // Helper function to format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format date and time in IST as DD/MM/YYYY HH:MM AM/PM
  const formatDateTimeIST = (dateString) => {
    const date = new Date(dateString);
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(date.getTime() + istOffset);
    
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const year = istDate.getUTCFullYear();
    let hours = istDate.getUTCHours();
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    hours = String(hours).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
  };

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

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers();
      fetchTotalUsers();
      fetchStats();
    }
  }, [currentPage, isAuthorized, hasEmailFilter, showBusinessOnly]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users?page=${currentPage}&hasEmail=${hasEmailFilter}&businessOnly=${showBusinessOnly}`,
        {
          credentials: 'include', // <-- send cookie for auth
        }
      );

      if (response.status === 401) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalUsers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/count?hasEmail=${hasEmailFilter}&businessOnly=${showBusinessOnly}`,
        {
          credentials: 'include', // <-- send cookie for auth
        }
      );

      if (response.status === 401) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch total users count');
      }

      setTotalUsers(data.count || 0);
    } catch (error) {
      console.error('Error fetching total users:', error);
      toast.error(error.message);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/stats`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Show loading spinner while loading
  if (checkingUser) return (
    <Layout title="Users">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
      </div>
    </Layout>
  );

  if (!isAuthorized) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Ban className='w-16 h-16 text-red-500 mb-2' />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
      <p className="text-gray-600">Only Admins and Super Admins can view users.</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <LoaderSpinner />
    </div>
  );

  // Prevent blink: render nothing while redirecting
  if (redirecting) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      // If search is empty, restore full user list and count
      setSearching(false);
      fetchUsers();
      fetchTotalUsers();
      return;
    }
    try {
      setSearchLoading(true);
      setSearching(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/search?q=${encodeURIComponent(searchTerm)}&hasEmail=${hasEmailFilter}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setUsers(data.users || []);
      setTotalUsers(data.users?.length || 0);
      setCurrentPage(1); // Optionally reset pagination for search results
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error(error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Pagination logic
  const currentUsers = users;
  const totalPages = searching ? 1 : Math.ceil(totalUsers / usersPerPage);

  // Calculate display indices for pagination info
  const displayStartIndex = searching ? 1 : (currentPage - 1) * usersPerPage + 1;
  const displayEndIndex = searching ? users.length : (currentPage - 1) * usersPerPage + currentUsers.length;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleExport = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/export?hasEmail=${hasEmailFilter}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Users exported successfully!');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  return (
    <Layout title="Users">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage and monitor all registered users</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Export to Excel
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-gray-600 px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Users</p>
                      <p className="text-3xl font-bold text-white">{stats.total || totalUsers}</p>
                    </div>
                    <FiUsers className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gray-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <FiSearch className="w-6 h-6" />
                Search Users
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSearch} className="flex flex-col gap-4">
                <div className="w-full sm:max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hasEmailFilter}
                      onChange={(e) => {
                        setHasEmailFilter(e.target.checked);
                        if (searching) {
                          setSearching(false);
                          setSearchTerm('');
                        }
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Has Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => { setShowBusinessOnly(v => !v); setCurrentPage(1); }}>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showBusinessOnly ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showBusinessOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-sm text-gray-700">Business Users Only</span>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                  >
                    <FiSearch className="w-4 h-4 mr-2" />
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gray-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <FiUsers className="w-6 h-6" />
                Users ({totalUsers})
              </h2>
            </div>
            {(loading || searchLoading) ? (
              <div className="flex justify-center items-center p-4 sm:p-8 lg:p-12">
                <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 border-t-2 border-b-2 rounded-full border-green-500"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 sm:p-8 lg:p-12 text-center text-gray-500">
                <FiUsers size={32} className="mx-auto mb-4 text-gray-300" />
                <p className="text-xs sm:text-sm lg:text-base">No users found. Try adjusting your search.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          App Version
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Last Opened
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/users/${user._id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {user.personalInfo?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.personalInfo?.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {user.status.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.appVersion?.current || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.appVersion?.lastUpdated ? formatDateTimeIST(user.appVersion.lastUpdated) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <div key={user._id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/users/${user._id}`)}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12">
                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                              <FiUser className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0 mr-2">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {user.personalInfo?.name || 'N/A'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {user.personalInfo?.phone || 'No phone'}
                                </p>
                              </div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold flex-shrink-0 ${user.status.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {user.status.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Joined: {formatDate(user.createdAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              App Version: {user.appVersion?.current || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Last Opened: {user.appVersion?.lastUpdated && Math.abs(new Date(user.appVersion.lastUpdated) - new Date(user.createdAt)) > 60000 ? formatDateTimeIST(user.appVersion.lastUpdated) : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {!searching && (
                  <div className="px-2 sm:px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <FiChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Previous
                      </button>
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                        <FiChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="text-xs sm:text-sm text-gray-700">
                        Showing <span className="font-medium">{displayStartIndex}</span> to{' '}
                        <span className="font-medium">{Math.min(displayEndIndex, totalUsers)}</span> of{' '}
                        <span className="font-medium">{totalUsers}</span> users
                      </div>
                      <nav className="inline-flex shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => paginate(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`px-2 py-2 border bg-white text-sm font-medium ${currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50 border-gray-300'
                            } transition-colors duration-200`}
                        >
                          <FiChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => paginate(pageNum)}
                              className={`px-3 sm:px-4 py-2 border-t border-b bg-white text-xs sm:text-sm font-medium ${currentPage === pageNum
                                ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                } transition-colors duration-200`}
                              style={{
                                borderLeft: i === 0 ? undefined : 'none',
                                borderRight: i === 4 ? undefined : 'none'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-2 py-2 border bg-white text-sm font-medium ${currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50 border-gray-300'
                            } transition-colors duration-200`}
                        >
                          <FiChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </nav>
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