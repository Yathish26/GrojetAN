import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';

export default function GcoinsHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactionHistory();
  }, [currentPage, searchQuery]);

  const fetchTransactionHistory = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
      });

      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/gcoins/history?${queryParams.toString()}`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }

      const data = await response.json();
      console.log('Received transaction data:', data);
      if (data.tokenValid === false) {
        return;
      }
      setTransactions(data.transactions);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Layout title="G-Coins History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/gcoins')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Back to G-Coins</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">G-Coins Transaction History</h1>
            <p className="text-gray-600">View all G-Coins additions and removals</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiTrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Transactions</h3>
                <p className="text-2xl font-bold text-blue-600">{totalItems.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FiTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Added</h3>
                <p className="text-2xl font-bold text-green-600">
                  {transactions.filter(t => t.type === 'add').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-full">
                <FiTrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Removed</h3>
                <p className="text-2xl font-bold text-red-600">
                  {transactions.filter(t => t.type === 'remove').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-5">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search by user name or phone number"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <FiClock className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading transaction history...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                Error: {error}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr key={transaction._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{formatDate(transaction.createdAt)}</div>
                          <div className="text-xs text-gray-400">{formatTime(transaction.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div>{transaction.userId?.personalInfo?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{transaction.userId?.personalInfo?.email || ''}</div>
                          <div className="text-xs text-gray-500">{transaction.userId?.personalInfo?.phone || ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'add'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'add' ? 'Added' : 'Removed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={transaction.type === 'add' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'add' ? '+' : '-'}{transaction.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={transaction.reason || 'N/A'}>
                          {transaction.reason || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.adminId?.name || transaction.adminId?.email || 'System'}
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
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalItems)} of {totalItems} entries
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