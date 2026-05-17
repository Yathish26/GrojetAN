import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout.jsx';
import { Users, Calendar, Phone, Search, Pencil, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Subscription() {
  const navigate = useNavigate();
  const [subscribedUsers, setSubscribedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingDayTo, setEditingDayTo] = useState('');
  const [savingDayTo, setSavingDayTo] = useState(false);
  const [adminRole] = useState(() => {
    try {
      const cachedAdmin = localStorage.getItem('adminUser');
      return cachedAdmin ? JSON.parse(cachedAdmin)?.role || '' : '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    fetchSubscribedUsers();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      fetchSubscribedUsers(value);
    }, 500);

    setSearchTimeout(timeoutId);
  };

  const clearSearch = () => {
    setSearchTerm('');
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    fetchSubscribedUsers();
  };

  const fetchSubscribedUsers = async (search = '') => {
    try {
      setError(null);
      if (!search) {
        setLoading(true);
      } else {
        setSearching(true);
      }

      const url = search
        ? `${import.meta.env.VITE_SERVER}/admin/users/subscribed-users?search=${encodeURIComponent(search)}`
        : `${import.meta.env.VITE_SERVER}/admin/users/subscribed-users`;

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSubscribedUsers(data.users || []);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to fetch subscribed users');
      }
    } catch (err) {
      setSubscribedUsers([]);
      setError(err.message || 'Failed to fetch subscribed users');
      toast.error(err.message || 'Failed to fetch subscribed users');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserId = (user) => user._id || user.id;

  const formatDateForInput = (dateString) => {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleEditDayTo = (user) => {
    setEditingUserId(getUserId(user));
    setEditingDayTo(formatDateForInput(user.dayTo));
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingDayTo('');
  };

  const handleSaveDayTo = async (user) => {
    const userId = getUserId(user);

    if (!editingDayTo) {
      toast.error('Please select a valid end date.');
      return;
    }

    try {
      setSavingDayTo(true);

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${userId}/subscription`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            isSubscribed: true,
            dayTo: editingDayTo,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update subscription end date');
      }

      const updatedUser = data.user;
      setSubscribedUsers((prevUsers) =>
        prevUsers.map((item) =>
          getUserId(item) === userId
            ? {
                ...item,
                dayTo: updatedUser?.dayTo || editingDayTo,
                dayFrom: updatedUser?.dayFrom || item.dayFrom,
                subscriptionDate: updatedUser?.subscriptionDate || item.subscriptionDate,
              }
            : item
        )
      );
      toast.success('Subscription end date updated successfully.');
      handleCancelEdit();
    } catch (err) {
      toast.error(err.message || 'Failed to update subscription end date');
    } finally {
      setSavingDayTo(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold mb-2">Error</div>
            <div className="text-gray-600">{error}</div>
            <button
              onClick={fetchSubscribedUsers}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Subscribed Users
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and view all subscribed users
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Total Subscribers: {subscribedUsers.length}
            </h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 sm:text-sm transition-colors"
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          

          <div className="overflow-x-auto">
            {subscribedUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No subscribed users found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Subscription Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Day From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Day To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                      G-Coins
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribedUsers.map((user) => {
                    const userId = getUserId(user);
                    const isEditing = editingUserId === userId;

                    return (
                    <tr
                      key={userId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/users/${userId}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="mr-2 h-4 w-4 text-gray-400" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                          {formatDate(user.subscriptionDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.dayFrom ? formatDate(user.dayFrom) : user.subscriptionDate ? formatDate(user.subscriptionDate) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isEditing ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="date"
                              value={editingDayTo}
                              onChange={(e) => setEditingDayTo(e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={savingDayTo}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveDayTo(user)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                              disabled={savingDayTo}
                              title="Save Day To"
                            >
                              {savingDayTo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed"
                              disabled={savingDayTo}
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <span>{user.dayTo ? formatDate(user.dayTo) : '-'}</span>
                            {adminRole === 'super_admin' && (
                              <button
                                type="button"
                                onClick={() => handleEditDayTo(user)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                                title="Edit Day To"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.gcoins || 0}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
