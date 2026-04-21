import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import {
  Line,
  Bar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function Finance() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [chartData, setChartData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [gigwithdrawals, setGigwithdrawals] = useState([]);
  const [gigwithdrawalsSummary, setGigwithdrawalsSummary] = useState({});
  const [loadingGigwithdrawals, setLoadingGigwithdrawals] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);

  // Map frontend period to API period
  const getApiPeriod = (period) => {
    switch (period) {
      case '12months': return '1y';
      case '30days': return '30d';
      case '7days': return '7d';
      case '1day': return 'today';
      default: return '7d';
    }
  };

  // Dummy finance data
  const [financeData, setFinanceData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingPayments: 0,
    monthlyRevenue: [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Aug', amount: 0 },
      { month: 'Sep', amount: 0 },
      { month: 'Oct', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Dec', amount: 0 }
    ]
  });

  // Function to get revenue data based on selected period
  const getRevenueData = () => {
    if (!chartData.length) {
      return { labels: [], merchantData: [], xpressData: [] };
    }

    let labels = [];
    let merchantData = [];
    let xpressData = [];

    switch (selectedPeriod) {
      case '12months':
        // Group by month
        const monthlyData = {};
        chartData.forEach(item => {
          const date = new Date(item._id.year, item._id.month - 1, item._id.day);
          const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { merchant: 0, xpress: 0 };
          }
          monthlyData[monthKey].merchant += item.revenue;
          monthlyData[monthKey].xpress += item.xpressRevenue;
        });
        labels = Object.keys(monthlyData);
        merchantData = labels.map(key => monthlyData[key].merchant);
        xpressData = labels.map(key => monthlyData[key].xpress);
        break;
      case '30days':
      case '7days':
        labels = chartData.map(item => {
          const date = new Date(item._id.year, item._id.month - 1, item._id.day);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        merchantData = chartData.map(item => item.revenue);
        xpressData = chartData.map(item => item.xpressRevenue);
        break;
      case '1day':
        labels = chartData.map(item => {
          const date = new Date(item._id.year, item._id.month - 1, item._id.day);
          return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        });
        merchantData = chartData.map(item => item.revenue);
        xpressData = chartData.map(item => item.xpressRevenue);
        break;
      default:
        labels = chartData.map(item => {
          const date = new Date(item._id.year, item._id.month - 1, item._id.day);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        merchantData = chartData.map(item => item.revenue);
        xpressData = chartData.map(item => item.xpressRevenue);
    }
    return { labels, merchantData, xpressData };
  };

  // Chart data
  const monthlyRevenueData = {
    labels: getRevenueData().labels,
    datasets: [
      {
        label: 'Merchant Revenue (₹)',
        data: getRevenueData().merchantData,
        fill: false,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      },
      {
        label: 'Xpress Revenue (₹)',
        data: getRevenueData().xpressData,
        fill: false,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      }
    ]
  };

  const monthlyRevenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Payment methods bar chart
  const paymentMethodsData = {
    labels: ['UPI', 'Credit/Debit Card', 'Cash on Delivery', 'Net Banking', 'Wallet'],
    datasets: [
      {
        label: 'Payment Volume (₹)',
        data: [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }
    ]
  };

  const paymentMethodsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Volume: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Calculate totals from chart data
  const totalMerchantRevenue = chartData.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalXpressRevenue = chartData.reduce((sum, item) => sum + (item.xpressRevenue || 0), 0);

  const allowedRoles = ['super_admin', 'admin'];

  // Function to fetch transactions
  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/transactions`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Function to fetch gigwithdrawals
  const fetchGigwithdrawals = async () => {
    setLoadingGigwithdrawals(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/gigwithdrawals`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setGigwithdrawals(data.withdrawals);
        setGigwithdrawalsSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch gigwithdrawals', err);
    } finally {
      setLoadingGigwithdrawals(false);
    }
  };

  // Function to update withdrawal status
  const updateWithdrawalStatus = async (withdrawalId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/gigwithdrawals/${withdrawalId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Status updated successfully');
        fetchGigwithdrawals(); // Refresh the data
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error('Failed to update status');
    }
  };

  // Function to handle paid confirmation
  const handlePaidConfirmation = async () => {
    if (selectedWithdrawal) {
      // Update the status to completed
      // NOTE: Backend should automatically deduct the withdrawal amount from agent's wallet when status is set to 'completed'
      await updateWithdrawalStatus(selectedWithdrawal._id, 'completed');
      setShowPaidModal(false);
      setSelectedWithdrawal(null);
    }
  };

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const apiPeriod = getApiPeriod(selectedPeriod);
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/chart-data?period=${apiPeriod}`, { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          setChartData(data.analyticsData);
        }
      } catch (err) {
        console.error('Failed to fetch chart data', err);
      }
    };

    if (currentUser) {
      fetchChartData();
    }
  }, [selectedPeriod, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
      fetchGigwithdrawals();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
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
        setError('Failed to authenticate. Please try again.');
        setRedirecting(true);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // Prevent blink: show nothing if redirecting
  if (redirecting) return null;

  if (loading) {
    return (
      <Layout title="Finance">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Finance">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Finance">
      <div className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor financial performance and key metrics</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Merchant Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalMerchantRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Total from selected period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Xpress Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalXpressRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">Total from selected period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{(totalMerchantRevenue + totalXpressRevenue).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">Combined revenue</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Revenue Trend */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Revenue Trend</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
                  >
                    <option value="12months">Last 12 Months</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="1day">Last 24 Hours</option>
                  </select>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="h-64">
                <Line data={monthlyRevenueData} options={monthlyRevenueOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* GIG Payouts Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-900">GIG Payouts</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchGigwithdrawals}
                disabled={loadingGigwithdrawals}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh payouts"
              >
                <RefreshCw className={`h-5 w-5 ${loadingGigwithdrawals ? 'animate-spin' : ''}`} />
              </button>
              <Wallet className="h-5 w-5 text-green-500" />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-green-600">Total Amount</p>
              <p className="text-lg font-bold text-green-800">₹{gigwithdrawalsSummary.totalAmount?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-lg font-bold text-yellow-800">{gigwithdrawalsSummary.pendingCount || 0}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-600">Processing</p>
              <p className="text-lg font-bold text-blue-800">{gigwithdrawalsSummary.processingCount || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-lg font-bold text-green-800">{gigwithdrawalsSummary.completedCount || 0}</p>
            </div>
          </div>

          {loadingGigwithdrawals ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-gray-200 border border-gray-100 rounded-lg overflow-hidden">
                {gigwithdrawals.slice(0, 10).map((withdrawal) => (
                  <div key={withdrawal._id} className="p-4 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">₹{withdrawal.withdrawalAmount.toLocaleString()}</p>
                        <button
                          onClick={() => navigate(`/admin/delivery-agent-details/${withdrawal.deliveryAgentId._id}`)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {withdrawal.deliveryAgentId ? `${withdrawal.deliveryAgentId.personalInfo?.firstName || ''} ${withdrawal.deliveryAgentId.personalInfo?.lastName || ''}`.trim() || 'N/A' : 'N/A'}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">{withdrawal.deliveryAgentId?.personalInfo?.phone || ''}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          withdrawal.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : withdrawal.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : withdrawal.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                        {withdrawal.status !== 'completed' && (
                          <>
                            <select
                              value={withdrawal.status}
                              onChange={(e) => updateWithdrawalStatus(withdrawal._id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed</option>
                            </select>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowPaidModal(true);
                              }}
                              className="mt-1 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              Paid
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(withdrawal.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {withdrawal.transactionId && (
                      <p className="text-xs text-gray-500">Txn: {withdrawal.transactionId}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gigwithdrawals.slice(0, 10).map((withdrawal) => (
                      <tr key={withdrawal._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => navigate(`/delivery-agents/${withdrawal.deliveryAgentId._id}`)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <div>
                              <p className="font-medium">{withdrawal.deliveryAgentId ? `${withdrawal.deliveryAgentId.personalInfo?.firstName || ''} ${withdrawal.deliveryAgentId.personalInfo?.lastName || ''}`.trim() || 'N/A' : 'N/A'}</p>
                              <p className="text-gray-500">{withdrawal.deliveryAgentId?.personalInfo?.phone || ''}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{withdrawal.withdrawalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            withdrawal.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : withdrawal.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : withdrawal.status === 'processing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {withdrawal.status === 'completed' ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <select
                                value={withdrawal.status}
                                onChange={(e) => updateWithdrawalStatus(withdrawal._id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                              </select>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowPaidModal(true);
                                }}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                              >
                                Paid
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {gigwithdrawals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No payout requests found
                </div>
              )}
            </>
          )}
        </div>

        {/* Transaction History Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions (Razorpay Online)</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchTransactions}
                disabled={loadingTransactions}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh transactions"
              >
                <RefreshCw className={`h-5 w-5 ${loadingTransactions ? 'animate-spin' : ''}`} />
              </button>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          {loadingTransactions ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-gray-200 border border-gray-100 rounded-lg overflow-hidden">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-900">₹{transaction.amount.toLocaleString()}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'captured'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : transaction.status === 'refunded'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-2">{transaction.contact || 'N/A'}</p>
                    <p className="text-xs text-gray-500 mt-1">{transaction.description || 'No description'}</p>
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <p>
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="capitalize">Method: {transaction.method || 'N/A'}</p>
                      <p className="break-all">ID: {transaction.id}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.slice(0, 10).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-gray-900">
                        {transaction.contact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {transaction.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {transaction.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'captured'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : transaction.status === 'refunded'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No transactions found
                </div>
              )}
            </>
          )}
        </div>

        {/* Paid Confirmation Modal */}
        {showPaidModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowPaidModal(false)}>
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Confirm Payment</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to mark this withdrawal as paid? This will change the status to Completed and deduct ₹{selectedWithdrawal.withdrawalAmount.toLocaleString()} from the agent's wallet.
                  </p>
                </div>
                <div className="flex items-center px-4 py-3">
                  <button
                    onClick={() => setShowPaidModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 mr-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaidConfirmation}
                    className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

    </Layout>
  );
}