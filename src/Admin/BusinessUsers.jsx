import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Users, Mail, Phone, Calendar, Search, Loader2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Layout from '../Components/Layout';

const BusinessUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const fetchBusinessUsers = async (search = '') => {
    try {
      setError(null);
      if (!search) {
        setLoading(true);
      } else {
        setSearching(true);
      }

      let fetchedUsers = [];

      if (search) {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER}/admin/users/search?q=${encodeURIComponent(search)}&businessOnly=true`,
          { credentials: 'include' }
        );

        if (response.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch business users');
        }

        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }

        fetchedUsers = data.users || [];
      } else {
        const pageSize = 100;
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = await fetch(
            `${import.meta.env.VITE_SERVER}/admin/users?page=${page}&businessOnly=true`,
            { credentials: 'include' }
          );

          if (response.status === 401) {
            navigate('/login', { replace: true });
            return;
          }

          if (!response.ok) {
            throw new Error('Failed to fetch business users');
          }

          const data = await response.json();
          if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
          }

          fetchedUsers = [...fetchedUsers, ...(data.users || [])];
          totalPages = Number(data.pagination?.totalPages) || 1;
          page += 1;

          if ((data.users || []).length < pageSize) {
            break;
          }
        }
      }

      setUsers(fetchedUsers);
      setTotalUsers(fetchedUsers.length);
    } catch (err) {
      setUsers([]);
      setError(err.message || 'Failed to fetch business users');
      toast.error(err.message || 'Failed to fetch business users');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchBusinessUsers();
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      fetchBusinessUsers(value.trim());
    }, 500);

    setSearchTimeout(timeoutId);
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    fetchBusinessUsers();
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      if (!users.length) {
        toast.error('No business users to export');
        return;
      }

      const rows = users.map((user, index) => ({
        'S. No': index + 1,
        'Name': user?.personalInfo?.name || 'N/A',
        'Phone': user?.personalInfo?.phone || 'N/A',
        'Email': user?.personalInfo?.email || 'N/A',
        'Joined': formatDate(user?.createdAt),
        'Status': user?.status?.accountStatus || 'N/A',
        'Business User': 'Yes'
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Business Users');

      const now = new Date();
      const dateLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const searchLabel = searchTerm.trim() ? `-${searchTerm.trim().replace(/\s+/g, '-')}` : '';

      XLSX.writeFile(workbook, `business-users${searchLabel}-${dateLabel}.xlsx`);
      toast.success('Business users exported successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export business users');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Layout title="Business Users">
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BriefcaseBusiness className="mr-2 h-6 w-6 text-blue-600" />
            Business Users
          </h1>
          <p className="text-gray-600">Users flagged as business users from the main users list</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="mr-2 h-5 w-5 text-gray-600" />
              Total Business Users: {totalUsers}
            </h2>

            <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, phone, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 sm:text-sm"
                  disabled={loading || searching}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={loading || searching}
                  >
                    <span className="text-gray-400 hover:text-gray-600">×</span>
                  </button>
                )}
                {searching && (
                  <div className="absolute inset-y-0 right-8 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                )}
              </div>

              <button
                onClick={handleExportExcel}
                disabled={loading || searching || isExporting || users.length === 0}
                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-3" />
                Loading business users...
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No business users found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Business</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const userId = user._id || user.id;
                    return (
                      <tr
                        key={userId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/users/${userId}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {(user?.personalInfo?.name || 'B').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user?.personalInfo?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">Business account</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-gray-400" />
                            {user?.personalInfo?.phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-gray-400" />
                            {user?.personalInfo?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            {formatDate(user?.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${user?.status?.accountStatus === 'active'
                            ? 'bg-green-100 text-green-800'
                            : user?.status?.accountStatus === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : user?.status?.accountStatus === 'suspended'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {user?.status?.accountStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            Yes
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BusinessUsers;
