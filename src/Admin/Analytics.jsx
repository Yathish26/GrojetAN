import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Truck,
  Star,
  Clock,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  ArrowUp,
  ShoppingCart,
  Target,
  MapPin,
  Ban
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import {
  Line,
  Bar,
  Pie
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

// Set Chart.js default font family
ChartJS.defaults.font.family = 'inherit';

// Helper to format date as DD/MM/YYYY
const formatDate = (year, month, day) => {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

export default function Analytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const allowedRoles = ['super_admin', 'admin'];

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
      setError('Failed to authenticate. Please try again.');
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);

  // Prevent blink: show nothing if redirecting
  if (redirecting) return null;

  const isAuthorized = allowedRoles.includes(currentUser?.role);

  // Derived metrics
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    orderGrowth: 0,
    revenueGrowth: 0,
    completedOrders: 0,
    pendingOrders: 0,
    productRevenue: 0,
    deliveryRevenue: 0,
    serviceRevenue: 0,
    onTimeDeliveryRate: 0,
    activeAgents: 0,
    averageAgentRating: 0,
    activeCustomers: 0,
    customerGrowth: 0,
    deliverySuccessRate: 0,
    successRateChange: 0,
    newCustomers: 0,
    returningCustomers: 0,
    todaysMerchantOrders: 0,
    todaysXpressOrders: 0,
    topAreas: [],
    recentActivity: [],
    // Xpress Orders
    totalXpressOrders: 0,
    totalXpressRevenue: 0,
    xpressOrderGrowth: 0,
    xpressRevenueGrowth: 0,
    completedXpressOrders: 0,
    pendingXpressOrders: 0
  });

  useEffect(() => {
    if (isAuthorized) {
      fetchAnalytics();
    }
    // eslint-disable-next-line
  }, [timeRange, isAuthorized]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chart data
      const chartResponse = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/analytics/chart-data?period=${timeRange}`,
        { credentials: 'include' }
      );

      if (!chartResponse.ok) throw new Error('Failed to fetch chart data');

      const chartData = await chartResponse.json();
      if (chartData.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      const analyticsData = chartData.analyticsData || [];
      setAnalytics(analyticsData);

      // Fetch dashboard metrics
      const dashboardResponse = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/analytics/dashboard?period=${timeRange}`,
        { credentials: 'include' }
      );

      if (!dashboardResponse.ok) throw new Error('Failed to fetch dashboard data');

      const dashboardData = await dashboardResponse.json();
      if (dashboardData.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (dashboardData.success && dashboardData.data) {
        setMetrics(dashboardData.data);
      } else {
        // Fallback to calculated metrics if dashboard endpoint fails
        calculateFallbackMetrics(analyticsData);
      }

    } catch (error) {
      console.error('Analytics fetch error:', error);
      setError(error.message);

      // Fallback to calculated metrics
      calculateFallbackMetrics([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateFallbackMetrics = (analyticsData) => {
    // Calculate basic metrics from chart data as fallback
    let totalOrders = 0,
      totalRevenue = 0,
      totalOrderValue = 0,
      totalXpressOrders = 0,
      totalXpressRevenue = 0,
      totalXpressOrderValue = 0;
    let prevOrders = 0,
      prevRevenue = 0,
      prevXpressOrders = 0,
      prevXpressRevenue = 0;
    const len = analyticsData.length;

    analyticsData.forEach((point, idx) => {
      totalOrders += point.orderCount || 0;
      totalRevenue += point.revenue || 0;
      totalOrderValue += point.avgOrderValue || 0;
      totalXpressOrders += point.xpressOrderCount || 0;
      totalXpressRevenue += point.xpressRevenue || 0;
      totalXpressOrderValue += point.xpressAvgOrderValue || 0;
      // For growth: previous period is all except last day
      if (idx < len - 1) {
        prevOrders += point.orderCount || 0;
        prevRevenue += point.revenue || 0;
        prevXpressOrders += point.xpressOrderCount || 0;
        prevXpressRevenue += point.xpressRevenue || 0;
      }
    });
    const averageOrderValue = len > 0 ? Math.round(totalOrderValue / len) : 0;
    const xpressAverageOrderValue = len > 0 ? Math.round(totalXpressOrderValue / len) : 0;

    // Calculate growth
    let orderGrowth = 0,
      revenueGrowth = 0,
      xpressOrderGrowth = 0,
      xpressRevenueGrowth = 0;
    if (len > 1) {
      const last = analyticsData[len - 1];
      const prev = analyticsData[len - 2];
      orderGrowth = prev.orderCount
        ? Math.round(((last.orderCount - prev.orderCount) / prev.orderCount) * 100)
        : 0;
      revenueGrowth = prev.revenue
        ? Math.round(((last.revenue - prev.revenue) / prev.revenue) * 100)
        : 0;
      xpressOrderGrowth = prev.xpressOrderCount
        ? Math.round(((last.xpressOrderCount - prev.xpressOrderCount) / prev.xpressOrderCount) * 100)
        : 0;
      xpressRevenueGrowth = prev.xpressRevenue
        ? Math.round(((last.xpressRevenue - prev.xpressRevenue) / prev.xpressRevenue) * 100)
        : 0;
    }

    // Set basic metrics with zeros for unavailable data
    setMetrics(prev => ({
      ...prev,
      totalOrders,
      totalRevenue,
      averageOrderValue,
      orderGrowth,
      revenueGrowth,
      totalXpressOrders,
      totalXpressRevenue,
      xpressOrderGrowth,
      xpressRevenueGrowth,
      completedOrders: 0,
      pendingOrders: 0,
      productRevenue: 0,
      deliveryRevenue: 0,
      serviceRevenue: 0,
      onTimeDeliveryRate: 0,
      activeAgents: 0,
      averageAgentRating: 0,
      activeCustomers: 0,
      customerGrowth: 0,
      deliverySuccessRate: 0,
      successRateChange: 0,
      newCustomers: 0,
      returningCustomers: 0,
      todaysMerchantOrders: 0,
      todaysXpressOrders: 0,
      topAreas: [],
      recentActivity: []
    }));
  };

  const refreshAnalytics = async () => {
    if (!isAuthorized) return;
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const exportAnalytics = () => {
    if (!isAuthorized) return;
    // Export daily analytics as CSV
    const csvHeader = ['Date', 'Merchant Orders', 'Merchant Revenue', 'Merchant Avg Order Value', 'Xpress Orders', 'Xpress Revenue', 'Xpress Avg Order Value'];
    const csvRows = analytics.map((point) => [
      formatDate(point._id.year, point._id.month, point._id.day),
      point.orderCount || 0,
      point.revenue || 0,
      point.avgOrderValue || 0,
      point.xpressOrderCount || 0,
      point.xpressRevenue || 0,
      point.xpressAvgOrderValue || 0
    ]);
    const csvContent =
      [csvHeader, ...csvRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grojet-analytics-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully');
  };

  // Guard states
  if (checkingUser) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }
  if (!isAuthorized) {
    return (
      <Layout title="Analytics">
        <div className="flex flex-col items-center justify-center py-12">
          <Ban className='w-16 h-16 text-red-500 mb-2' />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Admins and Super Admins can view analytics.</p>
        </div>
      </Layout>
    );
  }

  // CHART DATA
  const chartLabels = analytics.map((point) =>
    formatDate(point._id.year, point._id.month, point._id.day)
  );
  const chartOrders = analytics.map((point) => point.orderCount || 0);
  const chartRevenue = analytics.map((point) => point.revenue || 0);
  const chartXpressOrders = analytics.map((point) => point.xpressOrderCount || 0);
  const chartXpressRevenue = analytics.map((point) => point.xpressRevenue || 0);

  // Pie chart for revenue breakdown
  const revenuePieData = {
    labels: ['Product Sales', 'Delivery Fees', 'Service Charges'],
    datasets: [
      {
        label: 'Revenue',
        data: [
          metrics.productRevenue,
          metrics.deliveryRevenue,
          metrics.serviceRevenue
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(251, 146, 60, 0.7)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const revenuePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  // Line chart for orders trend
  const ordersLineData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Merchant Orders',
        data: chartOrders,
        fill: false,
        borderColor: 'rgba(34,197,94,1)',
        backgroundColor: 'rgba(34,197,94,0.2)',
        tension: 0.3
      },
      {
        label: 'Xpress Orders',
        data: chartXpressOrders,
        fill: false,
        borderColor: 'rgba(239,68,68,1)',
        backgroundColor: 'rgba(239,68,68,0.2)',
        tension: 0.3
      }
    ]
  };

  const ordersLineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Orders' } }
    }
  };

  // Bar chart for orders per day
  const ordersBarData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Orders',
        data: chartOrders,
        backgroundColor: 'rgba(34,197,94,0.6)'
      }
    ]
  };

  const ordersBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  if (loading) {
    return (
      <Layout title="Analytics">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Analytics">
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Analytics Unavailable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Analytics">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into your grocery delivery business</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={refreshAnalytics}
              disabled={refreshing}
              type="button"
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportAnalytics}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Merchant Orders</p>
                <p className="text-2xl font-bold text-gray-800">{metrics.totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+{metrics.orderGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">Xpress Orders</p>
                <p className="text-2xl font-bold text-gray-800">{metrics.totalXpressOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">+{metrics.xpressOrderGrowth}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-600 uppercase">TODAY'S ORDERS</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-lg font-bold text-green-600">{metrics.todaysMerchantOrders || 0}</p>
                    <p className="text-xs text-gray-500">Merchant</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{metrics.todaysXpressOrders || 0}</p>
                    <p className="text-xs text-gray-500">Xpress</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-gray-500">Total: {(metrics.todaysMerchantOrders || 0) + (metrics.todaysXpressOrders || 0)}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase">DELIVERY SUCCESS RATE</p>
                <p className="text-2xl font-bold text-gray-800">{metrics.deliverySuccessRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">+{metrics.successRateChange}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Trends with Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Order Trends
              </h2>
              <p className="text-sm text-gray-600 mt-1">Merchant Orders (Green), Xpress Orders (Red)</p>
            </div>
            <div className="p-6">
              {analytics.length > 0 ? (
                <Line data={ordersLineData} options={ordersLineOptions} height={230} />
              ) : (
                <div className="h-52 flex items-center justify-center text-gray-400">
                  No data available.
                </div>
              )}
              {/* Order Status Breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{metrics.completedOrders}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{metrics.pendingOrders}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}