import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart,
  BarChart3
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

export default function Finance() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dummy finance data
  const [financeData, setFinanceData] = useState({
    totalRevenue: 1250000,
    totalExpenses: 750000,
    netProfit: 500000,
    pendingPayments: 150000,
    monthlyRevenue: [
      { month: 'Jan', amount: 95000 },
      { month: 'Feb', amount: 102000 },
      { month: 'Mar', amount: 115000 },
      { month: 'Apr', amount: 108000 },
      { month: 'May', amount: 122000 },
      { month: 'Jun', amount: 135000 },
      { month: 'Jul', amount: 128000 },
      { month: 'Aug', amount: 142000 },
      { month: 'Sep', amount: 138000 },
      { month: 'Oct', amount: 145000 },
      { month: 'Nov', amount: 152000 },
      { month: 'Dec', amount: 160000 }
    ]
  });

  // Chart data
  const monthlyRevenueData = {
    labels: financeData.monthlyRevenue.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: financeData.monthlyRevenue.map(item => item.amount),
        fill: true,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
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
          label: function(context) {
            return `Revenue: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  // Expense breakdown pie chart
  const expenseBreakdownData = {
    labels: ['Operations', 'Marketing', 'Delivery', 'Platform Fees', 'Other'],
    datasets: [
      {
        label: 'Expenses',
        data: [250000, 150000, 200000, 100000, 50000],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const expenseBreakdownOptions = {
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
          label: function(context) {
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

  // Payment methods bar chart
  const paymentMethodsData = {
    labels: ['UPI', 'Credit/Debit Card', 'Cash on Delivery', 'Net Banking', 'Wallet'],
    datasets: [
      {
        label: 'Payment Volume (₹)',
        data: [650000, 250000, 100000, 150000, 50000],
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
          label: function(context) {
            return `Volume: ₹${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  const allowedRoles = ['super_admin', 'admin'];

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
      <div className="p-6">
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
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{financeData.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12.5% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Wallet className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">₹{financeData.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">+8.2% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-gray-900">₹{financeData.netProfit.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+15.3% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">₹{financeData.pendingPayments.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-600">Awaiting settlement</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Revenue Trend</h2>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-600">Last 12 months</span>
              </div>
            </div>
            <div className="h-64">
              <Line data={monthlyRevenueData} options={monthlyRevenueOptions} />
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Expense Breakdown</h2>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">Current month</span>
              </div>
            </div>
            <div className="h-64">
              <Pie data={expenseBreakdownData} options={expenseBreakdownOptions} />
            </div>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Payment Methods Distribution</h2>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-600">By transaction volume</span>
            </div>
          </div>
          <div className="h-64">
            <Bar data={paymentMethodsData} options={paymentMethodsOptions} />
          </div>
        </div>

        {/* Additional Finance Info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Order Payment #12345</p>
                  <p className="text-sm text-gray-600">Customer: John Doe</p>
                </div>
                <span className="text-green-600 font-semibold">+₹2,450</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Delivery Fee</p>
                  <p className="text-sm text-gray-600">Merchant: Pizza Palace</p>
                </div>
                <span className="text-red-600 font-semibold">-₹150</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium text-gray-900">Commission</p>
                  <p className="text-sm text-gray-600">Platform fee</p>
                </div>
                <span className="text-red-600 font-semibold">-₹245</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Margins</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Gross Margin</span>
                <span className="font-semibold text-green-600">40%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full" style={{ width: '40%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Net Margin</span>
                <span className="font-semibold text-blue-600">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '32%' }}></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Operating Margin</span>
                <span className="font-semibold text-purple-600">28%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}