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
  const allowedRoles = ['super_admin', 'admin'];

  const fetchCurrentUser = useCallback(async () => {
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
      setCheckingUser(false);
    }
  }, []);

  useEffect(()=>{ fetchCurrentUser(); }, [fetchCurrentUser]);
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
    averageDeliveryTime: 0,
    onTimeDeliveryRate: 0,
    activeAgents: 0,
    averageAgentRating: 0,
    activeCustomers: 0,
    customerGrowth: 0,
    deliverySuccessRate: 0,
    successRateChange: 0,
    newCustomers: 0,
    returningCustomers: 0,
    customerSatisfaction: 0,
    topAreas: [],
    recentActivity: []
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
      totalOrderValue = 0;
    let prevOrders = 0,
      prevRevenue = 0;
    const len = analyticsData.length;

    analyticsData.forEach((point, idx) => {
      totalOrders += point.orderCount || 0;
      totalRevenue += point.revenue || 0;
      totalOrderValue += point.avgOrderValue || 0;
      // For growth: previous period is all except last day
      if (idx < len - 1) {
        prevOrders += point.orderCount || 0;
        prevRevenue += point.revenue || 0;
      }
    });
    const averageOrderValue = len > 0 ? Math.round(totalOrderValue / len) : 0;

    // Calculate growth
    let orderGrowth = 0,
      revenueGrowth = 0;
    if (len > 1) {
      const last = analyticsData[len - 1];
      const prev = analyticsData[len - 2];
      orderGrowth = prev.orderCount
        ? Math.round(((last.orderCount - prev.orderCount) / prev.orderCount) * 100)
        : 0;
      revenueGrowth = prev.revenue
        ? Math.round(((last.revenue - prev.revenue) / prev.revenue) * 100)
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
      completedOrders: 0,
      pendingOrders: 0,
      productRevenue: 0,
      deliveryRevenue: 0,
      serviceRevenue: 0,
      averageDeliveryTime: 0,
      onTimeDeliveryRate: 0,
      activeAgents: 0,
      averageAgentRating: 0,
      activeCustomers: 0,
      customerGrowth: 0,
      deliverySuccessRate: 0,
      successRateChange: 0,
      newCustomers: 0,
      returningCustomers: 0,
      customerSatisfaction: 0,
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
    const csvHeader = ['Date', 'Orders', 'Revenue', 'Avg Order Value'];
    const csvRows = analytics.map((point) => [
      formatDate(point._id.year, point._id.month, point._id.day),
      point.orderCount || 0,
      point.revenue || 0,
      point.avgOrderValue || 0
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
          <Ban className='w-16 h-16 text-red-500 mb-2'/>
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

  // Line chart for orders & revenue trend
  const ordersLineData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Orders',
        data: chartOrders,
        fill: false,
        borderColor: 'rgba(34,197,94,1)',
        backgroundColor: 'rgba(34,197,94,0.2)',
        tension: 0.3
      },
      {
        label: 'Revenue (₹)',
        data: chartRevenue,
        fill: false,
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const ordersLineOptions = {
    responsive: true,
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Orders' } },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: { display: true, text: 'Revenue (₹)' },
        grid: { drawOnChartArea: false }
      }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
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
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">₹{metrics.totalRevenue.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+{metrics.revenueGrowth}%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-800">{metrics.activeCustomers}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+{metrics.customerGrowth}%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivery Success Rate</p>
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
              Order & Revenue Trends
            </h2>
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

        {/* Revenue Breakdown with Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Revenue Breakdown
            </h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center">
              <Pie data={revenuePieData} />
            </div>
            {/* Revenue Categories */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Product Sales</span>
                </div>
                <span className="font-medium">₹{metrics.productRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Delivery Fees</span>
                </div>
                <span className="font-medium">₹{metrics.deliveryRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Service Charges</span>
                </div>
                <span className="font-medium">₹{metrics.serviceRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Bar Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" />
          <span className="text-lg font-semibold text-gray-800">Order Counts by Day</span>
        </div>
        <div className="overflow-x-auto">
          {analytics.length > 0 ? (
            <Bar data={ordersBarData} options={ordersBarOptions} height={140} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400">
              No data available.
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delivery Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Performance
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Delivery Time</span>
              <span className="font-medium">{metrics.averageDeliveryTime} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">On-time Delivery Rate</span>
              <span className="font-medium text-green-600">{metrics.onTimeDeliveryRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Delivery Agents</span>
              <span className="font-medium">{metrics.activeAgents}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Agent Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium">{metrics.averageAgentRating}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Insights
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">New Customers</span>
              <span className="font-medium">{metrics.newCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Returning Customers</span>
              <span className="font-medium">{metrics.returningCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Average Order Value</span>
              <span className="font-medium">₹{metrics.averageOrderValue}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Customer Satisfaction</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium">{metrics.customerSatisfaction}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Areas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Top Areas
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {metrics.topAreas && metrics.topAreas.length > 0 ? (
                metrics.topAreas.slice(0, 5).map((area, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-gray-800">{area.name}</span>
                    </div>
                    <span className="font-medium">{area.orders} orders</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No area data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border border-gray-100 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'order' ? 'bg-blue-100' :
                    activity.type === 'delivery' ? 'bg-green-100' :
                    activity.type === 'customer' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'order' && <Package className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'delivery' && <Truck className="w-4 h-4 text-green-600" />}
                    {activity.type === 'customer' && <Users className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.description}</p>
                    <p className="text-sm text-gray-600">{new Date(activity.timestamp).toLocaleString()}</p>
                  </div>
                  {activity.value && (
                    <div className="text-right">
                      <p className="font-medium text-gray-800">{activity.value}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </Layout>
  );
}