import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3
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
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [chartData, setChartData] = useState([]);

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
    const fetchCurrentUser = async () => {
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
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

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
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor financial performance and key metrics</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
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

          <div className="bg-white rounded-lg shadow p-6">
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

          <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Revenue Trend</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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

    </Layout>
  );
}