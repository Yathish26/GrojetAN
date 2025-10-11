import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiUser, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Ban, Loader } from 'lucide-react';
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

  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];

  const fetchCurrentUser = useCallback( async () => {
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
        if (response.ok && data.admin){
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

  useEffect(()=>{ fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  useEffect(() => {
    if (isAuthorized){
      fetchUsers();
      fetchTotalUsers();
    }
  }, [currentPage, isAuthorized]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users?page=${currentPage}`,
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
        `${import.meta.env.VITE_SERVER}/admin/users/count`,
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

  // Show loading spinner while loading
  if (checkingUser) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
    </div>
  );

  if (!isAuthorized) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Ban className='w-16 h-16 text-red-500 mb-2'/>
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
      setLoading(true);
      setSearching(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/search?q=${encodeURIComponent(searchTerm)}`,
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
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = searching ? users : users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = searching ? 1 : Math.ceil(totalUsers / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout title="Users">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <FiUsers className="mr-2 sm:mr-3 text-green-600" size={24} />
              <span className="hidden sm:inline">Users Management</span>
              <span className="sm:hidden">Users</span>
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all registered users</p>
          </div>
          <div className="bg-white px-3 py-2 sm:px-4 sm:py-3 shadow border border-gray-200 flex items-center gap-2">
            <FiUser className="text-green-500" size={18} />
            <span className="text-gray-700 text-sm sm:text-base">
              <span className="font-bold">{totalUsers}</span> Users
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 sm:p-6 shadow-sm border border-gray-200">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" size={18} />
              </span>
              <input
                type="text"
                placeholder="Search by name or email"
                className="pl-10 pr-4 py-2 sm:py-3 w-full border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 sm:py-3 bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 whitespace-nowrap"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="animate-spin h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 rounded-full border-green-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              <FiUsers size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">No users found. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.personalInfo.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.personalInfo.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold ${
                            user.status.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => navigate(`/users/${user._id}`)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors duration-200"
                            >
                              View Details
                            </button>
                          </div>
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
                    <div key={user._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10">
                          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser className="w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{user.personalInfo.name}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {user.personalInfo.phone || 'No phone'}
                              </p>
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold ml-2 flex-shrink-0 ${
                              user.status.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="text-xs text-gray-500">
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => navigate(`/users/${user._id}`)}
                              className="px-3 py-2 bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors duration-200"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {!searching && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <FiChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                      <FiChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastUser, totalUsers)}</span> of{' '}
                      <span className="font-medium">{totalUsers}</span> users
                    </div>
                    <nav className="inline-flex shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-2 py-2 border bg-white text-sm font-medium ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50 border-gray-300'
                        } transition-colors duration-200`}
                      >
                        <FiChevronLeft className="h-5 w-5" />
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
                            className={`px-4 py-2 border-t border-b bg-white text-sm font-medium ${
                              currentPage === pageNum
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
                        className={`px-2 py-2 border bg-white text-sm font-medium ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-50 border-gray-300'
                        } transition-colors duration-200`}
                      >
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}