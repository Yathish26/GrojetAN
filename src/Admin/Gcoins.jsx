import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiCalendar, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';

export default function Gcoins() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const [addingCoins, setAddingCoins] = useState(false);
  const [removeAmount, setRemoveAmount] = useState('');
  const [removeReason, setRemoveReason] = useState('');
  const [removingCoins, setRemovingCoins] = useState(false);
  const [actionType, setActionType] = useState(null); // 'add' or 'remove'

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/with-gcoins?page=${currentPage}&limit=10`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle unauthorized
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        // Handle invalid token
        return;
      }
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoins = async (userId) => {
    if (!addAmount || parseInt(addAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setAddingCoins(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/${userId}/add-gcoins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ amount: parseInt(addAmount) })
      });

      if (!response.ok) {
        throw new Error('Failed to add G-Coins');
      }

      const data = await response.json();
      if (data.success) {
        // Update the user's gcoins in the local state
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, orderHistory: { ...user.orderHistory, gcoins: (user.orderHistory?.gcoins || 0) + parseInt(addAmount) } }
            : user
        ));
        setEditingUser(null);
        setAddAmount('');
        setActionType(null);
        alert('G-Coins added successfully!');
      }
    } catch (err) {
      alert('Error adding G-Coins: ' + err.message);
    } finally {
      setAddingCoins(false);
    }
  };

  const handleRemoveCoins = async (userId) => {
    if (!removeAmount || parseInt(removeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!removeReason.trim()) {
      alert('Please enter a reason for removing G-Coins');
      return;
    }

    const currentGcoins = users.find(u => u._id === userId)?.orderHistory?.gcoins || 0;
    if (parseInt(removeAmount) > currentGcoins) {
      alert('Cannot remove more G-Coins than the user currently has');
      return;
    }

    try {
      setRemovingCoins(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/${userId}/remove-gcoins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          amount: parseInt(removeAmount),
          reason: removeReason.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove G-Coins');
      }

      const data = await response.json();
      if (data.success) {
        // Update the user's gcoins in the local state
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, orderHistory: { ...user.orderHistory, gcoins: (user.orderHistory?.gcoins || 0) - parseInt(removeAmount) } }
            : user
        ));
        setEditingUser(null);
        setRemoveAmount('');
        setRemoveReason('');
        setActionType(null);
        alert('G-Coins removed successfully!');
      }
    } catch (err) {
      alert('Error removing G-Coins: ' + err.message);
    } finally {
      setRemovingCoins(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  return (
    <Layout title="Users with G-Coins">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiTrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Users with G-Coins</h3>
                <p className="text-2xl font-bold text-blue-600">{totalItems.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div 
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/gcoins/history')}
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FiCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">G-Coins History</h3>
                <p className="text-sm text-gray-600">View transaction logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FiClock className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Users with G-Coins</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading users...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users with G-Coins found
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      G-Coins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user, index) => (
                    <tr key={user._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.personalInfo?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.personalInfo?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.personalInfo?.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                        {user.orderHistory?.gcoins || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingUser === user._id ? (
                          actionType === 'add' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={addAmount}
                                onChange={(e) => setAddAmount(e.target.value)}
                                placeholder="Enter G-Coins"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="1"
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddCoins(user._id)}
                                disabled={addingCoins || !addAmount}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {addingCoins ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  setAddAmount('');
                                  setActionType(null);
                                }}
                                className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                              >
                                ✕
                              </button>
                            </div>
                          ) : actionType === 'remove' ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  value={removeAmount}
                                  onChange={(e) => setRemoveAmount(e.target.value)}
                                  placeholder="Amount"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  min="1"
                                  max={user.orderHistory?.gcoins || 0}
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleRemoveCoins(user._id)}
                                  disabled={removingCoins || !removeAmount || !removeReason.trim()}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  {removingCoins ? '...' : '✓'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUser(null);
                                    setRemoveAmount('');
                                    setRemoveReason('');
                                    setActionType(null);
                                  }}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                >
                                  ✕
                                </button>
                              </div>
                              <input
                                type="text"
                                value={removeReason}
                                onChange={(e) => setRemoveReason(e.target.value)}
                                placeholder="Reason for removal"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                maxLength="200"
                              />
                            </div>
                          ) : null
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingUser(user._id);
                                setActionType('add');
                              }}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user._id);
                                setActionType('remove');
                              }}
                              disabled={(user.orderHistory?.gcoins || 0) === 0}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}