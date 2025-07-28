import React, { useState, useEffect } from 'react';
import { FiUsers, FiUser, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchTotalUsers();
    // eslint-disable-next-line
  }, [currentPage]);

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
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
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
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch total users count');
      }

      setTotalUsers(data.count || 0);
    } catch (error) {
      console.error('Error fetching total users:', error);
      toast.error(error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality if your API supports it
    // For now, we'll just filter the existing users client-side
    // You should replace this with an actual API search call
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setUsers(filtered);
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <FiUsers className="text-3xl text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-4 py-2 shadow flex items-center gap-2">
              <FiUser className="text-green-500" />
              <span className="text-gray-700">
                <span className="font-bold">{totalUsers}</span> Users
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 shadow mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search by name or email"
                className="pl-10 pr-4 py-2 w-full border focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-green-600 text-white hover:bg-green-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin h-10 w-10 border-t-2 border-b-2 rounded-full border-green-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No users found. Try adjusting your search.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold ${user.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {user.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button className="text-red-600 hover:text-red-800 px-3 py-1 transition">
                            Action
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastUser, totalUsers)}</span> of{' '}
                  <span className="font-medium">{totalUsers}</span> users
                </div>
                <nav className="inline-flex shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-2 py-2 border bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
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
                        className={`px-4 py-2 border-t border-b bg-white text-sm font-medium ${currentPage === pageNum
                          ? 'z-10 bg-green-50 border-green-500 text-green-600'
                          : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        style={{ borderLeft: i === 0 ? undefined : 'none', borderRight: i === 4 ? undefined : 'none' }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-2 border bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}