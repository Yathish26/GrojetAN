import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Smartphone, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Layout from '../Components/Layout';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function UserAnalytics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [versionData, setVersionData] = useState([]);
  const [versionLoading, setVersionLoading] = useState(true);
  const [deviceData, setDeviceData] = useState([]);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  // 🔐 Auth check (Always fetch from server)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setCheckingUser(true);
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
          credentials: 'include'
        });
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
        setRedirecting(true);
        navigate('/login', { replace: true });
      } finally {
        setCheckingUser(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);
  // Fetch data after authentication
  useEffect(() => {
    if (currentUser) {
      fetchUserAnalytics();
      fetchUserGrowthData();
      fetchVersionData();
      fetchDeviceData();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUserGrowthData();
    }
  }, [selectedPeriod, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, currentUser]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/users`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        // Handle unauthorized - redirect to login
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user analytics');
      }

      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      // Set default values on error
      setAnalyticsData({
        totalUsers: 0,
        newUsersToday: 0,
        topDevice: 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGrowthData = async () => {
    try {
      setChartLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/users/growth?period=${selectedPeriod}`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user growth data');
      }

      const data = await response.json();
      if (data.success) {
        setChartData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch chart data');
      }
    } catch (error) {
      console.error('Error fetching user growth data:', error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchVersionData = async () => {
    try {
      setVersionLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/users/versions`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch version data');
      }

      const data = await response.json();
      if (data.success) {
        setVersionData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch version data');
      }
    } catch (error) {
      console.error('Error fetching version data:', error);
      setVersionData([]);
    } finally {
      setVersionLoading(false);
    }
  };

  const fetchDeviceData = async () => {
    try {
      setDeviceLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/users/devices`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch device data');
      }

      const data = await response.json();
      if (data.success) {
        setDeviceData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch device data');
      }
    } catch (error) {
      console.error('Error fetching device data:', error);
      setDeviceData([]);
    } finally {
      setDeviceLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = '') => {
    setUsersLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/analytics/users/list?page=${page}&limit=${usersPerPage}&search=${encodeURIComponent(search)}`, {
        credentials: 'include',
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalUsers(data.data.totalUsers || 0);
        setCurrentPage(page);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      toast.error('Error fetching users');
    } finally {
      setUsersLoading(false);
    }
  };
  // Show loading while checking auth
  if (checkingUser || redirecting) {
    return (
      <Layout title="User Analytics">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  // Show unauthorized if no user
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Unauthorized</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const getChartOptions = () => {
    const isLongPeriod = selectedPeriod === '90d' || selectedPeriod === '1y';
    const maxTicks = isLongPeriod ? 6 : 7; // Fewer labels for longer periods
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Users: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        },
        x: {
          ticks: {
            maxTicksLimit: maxTicks,
            callback: function(value, index) {
              if (chartData[index]) {
                const date = new Date(chartData[index].date);
                if (selectedPeriod === '1y') {
                  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                } else if (selectedPeriod === '90d') {
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
              }
              return '';
            }
          }
        }
      }
    };
  };

  const chartDataConfig = {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: 'Daily Registrations',
        data: chartData.map(item => item.users),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Bar chart options for version distribution
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = versionData[context.dataIndex];
            return `${item.version}: ${item.count} users (${item.percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const barChartData = {
    labels: versionData.map(item => item.version),
    datasets: [
      {
        label: 'Users by Version',
        data: versionData.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Pie chart options for device distribution
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = deviceData[context.dataIndex];
            return `${item.platform}: ${item.count} users (${item.percentage}%)`;
          }
        }
      }
    }
  };

  const pieChartData = {
    labels: deviceData.map(item => item.platform),
    datasets: [
      {
        data: deviceData.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue for Android
          'rgba(16, 185, 129, 0.8)',  // Green for iOS
          'rgba(245, 158, 11, 0.8)',  // Orange for others
          'rgba(239, 68, 68, 0.8)',   // Red for unknown
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const stats = [
    {
      title: 'Total Users',
      value: analyticsData.totalUsers?.toLocaleString() || '0',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'New Users Today',
      value: analyticsData.newUsersToday || '0',
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Top Device',
      value: analyticsData.topDevice || 'N/A',
      icon: Smartphone,
      color: 'bg-indigo-500'
    }
  ];

  const formatShortDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  return (
    <Layout title="User Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive insights into user behavior and engagement</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <BarChart3 className="w-5 h-5" />
            <span>Real-time data</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Growth Trend</h3>
                  <div className="flex space-x-1">
                    {[
                      { key: '7d', label: '7D' },
                      { key: '30d', label: '30D' },
                      { key: '90d', label: '90D' },
                      { key: '1y', label: '1Y' }
                    ].map((period) => (
                      <button
                        key={period.key}
                        onClick={() => setSelectedPeriod(period.key)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                          selectedPeriod === period.key
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  {chartLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : chartData.length > 0 ? (
                    <Line options={getChartOptions()} data={chartDataConfig} />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h3>
                <div className="h-64">
                  {deviceLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : deviceData.length > 0 ? (
                    <Pie options={pieChartOptions} data={pieChartData} />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No device data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Version Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Version Distribution</h3>
                <div className="h-64">
                  {versionLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : versionData.length > 0 ? (
                    <Bar options={barChartOptions} data={barChartData} />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No version data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">User List</h3>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {totalUsers} users
                  </div>
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : users.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
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
                            App Version
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr 
                            key={user._id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/users/${user._id}`)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.email || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.phone || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.appVersion || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.createdAt ? formatShortDate(user.createdAt) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-700">
                        Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No users found</h3>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? 'Try adjusting your search terms' : 'No users have been registered yet'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}