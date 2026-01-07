import React, { useState, useEffect } from 'react';
import { BarChart3, Cloud, TrendingUp, Users, Activity, Database, Zap, Shield, RefreshCw } from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';
import {
  Line,
  Bar,
  Doughnut
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

const CloudAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCloudWatchData();
  }, []);

  const fetchCloudWatchData = async () => {
    try {
      setError(null);

      // Fetch dashboard metrics
      const dashboardResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/cloudwatch/dashboard`, {
        credentials: 'include',
      });

      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch CloudWatch dashboard data');
      }

      const dashboardData = await dashboardResponse.json();

      if (dashboardData.tokenValid === false) {
        return;
      }

      if (dashboardData.success && dashboardData.data) {
        setAnalyticsData(dashboardData.data);
      }

      // Fetch chart data
      const [networkResponse, performanceResponse, applicationResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_SERVER}/admin/cloudwatch/network-history?hours=24`, {
          credentials: 'include',
        }),
        fetch(`${import.meta.env.VITE_SERVER}/admin/cloudwatch/performance-history?hours=24`, {
          credentials: 'include',
        }),
        fetch(`${import.meta.env.VITE_SERVER}/admin/cloudwatch/application-history?hours=24`, {
          credentials: 'include',
        })
      ]);

      if (networkResponse.ok && performanceResponse.ok && applicationResponse.ok) {
        const networkData = await networkResponse.json();
        const performanceData = await performanceResponse.json();
        const applicationData = await applicationResponse.json();

        if (networkData.success && performanceData.success && applicationData.success) {
          setChartData({
            network: networkData.data,
            performance: performanceData.data,
            application: applicationData.data
          });
        }
      }

    } catch (error) {
      console.error('CloudWatch data fetch error:', error);
      setError(error.message);
      // Fallback data
      setAnalyticsData({
        infrastructure: {
          cpuUtilization: 65.4,
          memoryUtilization: 72.1,
          networkIn: 2.4,
          networkOut: 1.8,
          diskReadOps: 15420,
          timestamp: new Date().toISOString()
        },
        application: {
          avgResponseTime: 145,
          maxResponseTime: 320,
          minResponseTime: 45,
          errorRate: 0.02,
          requestCount: 8923401,
          timestamp: new Date().toISOString()
        },
        database: {
          activeConnections: 45,
          maxConnections: 67,
          avgQueryTime: 12.5,
          maxQueryTime: 89.3,
          timestamp: new Date().toISOString()
        },
        cost: {
          estimatedCharges: 245.67,
          currency: 'USD',
          timestamp: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      });

      // Fallback chart data
      setChartData({
        network: {
          networkIn: [
            { timestamp: new Date(Date.now() - 20*3600000), value: 1.2 },
            { timestamp: new Date(Date.now() - 16*3600000), value: 0.8 },
            { timestamp: new Date(Date.now() - 12*3600000), value: 2.1 },
            { timestamp: new Date(Date.now() - 8*3600000), value: 3.4 },
            { timestamp: new Date(Date.now() - 4*3600000), value: 2.8 },
            { timestamp: new Date(), value: 1.9 }
          ],
          networkOut: [
            { timestamp: new Date(Date.now() - 20*3600000), value: 0.9 },
            { timestamp: new Date(Date.now() - 16*3600000), value: 0.6 },
            { timestamp: new Date(Date.now() - 12*3600000), value: 1.8 },
            { timestamp: new Date(Date.now() - 8*3600000), value: 2.9 },
            { timestamp: new Date(Date.now() - 4*3600000), value: 2.3 },
            { timestamp: new Date(), value: 1.4 }
          ]
        },
        performance: {
          cpu: [
            { timestamp: new Date(Date.now() - 20*3600000), value: 45 },
            { timestamp: new Date(Date.now() - 16*3600000), value: 52 },
            { timestamp: new Date(Date.now() - 12*3600000), value: 48 },
            { timestamp: new Date(Date.now() - 8*3600000), value: 65 },
            { timestamp: new Date(Date.now() - 4*3600000), value: 58 },
            { timestamp: new Date(), value: analyticsData?.infrastructure?.cpuUtilization || 62 }
          ],
          memory: [
            { timestamp: new Date(Date.now() - 20*3600000), value: 68 },
            { timestamp: new Date(Date.now() - 16*3600000), value: 72 },
            { timestamp: new Date(Date.now() - 12*3600000), value: 65 },
            { timestamp: new Date(Date.now() - 8*3600000), value: 78 },
            { timestamp: new Date(Date.now() - 4*3600000), value: 71 },
            { timestamp: new Date(), value: analyticsData?.infrastructure?.memoryUtilization || 69 }
          ]
        },
        application: {
          requestCount: [
            { timestamp: new Date(Date.now() - 20*3600000), value: 520 },
            { timestamp: new Date(Date.now() - 16*3600000), value: 680 },
            { timestamp: new Date(Date.now() - 12*3600000), value: 450 },
            { timestamp: new Date(Date.now() - 8*3600000), value: 890 },
            { timestamp: new Date(Date.now() - 4*3600000), value: 720 },
            { timestamp: new Date(), value: 650 }
          ]
        }
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCloudWatchData();
    toast.success('CloudWatch data refreshed');
  };

  const metrics = [
    {
      title: 'CPU Utilization',
      value: analyticsData?.infrastructure?.cpuUtilization ? `${analyticsData.infrastructure.cpuUtilization}%` : 'N/A',
      icon: Activity,
      color: 'bg-blue-500',
      change: analyticsData?.infrastructure?.cpuUtilization ? `${analyticsData.infrastructure.cpuUtilization > 70 ? '-' : '+'}${Math.abs(analyticsData.infrastructure.cpuUtilization - 70).toFixed(1)}%` : 'N/A'
    },
    {
      title: 'Memory Usage',
      value: analyticsData?.infrastructure?.memoryUtilization ? `${analyticsData.infrastructure.memoryUtilization}%` : 'N/A',
      icon: Database,
      color: 'bg-green-500',
      change: analyticsData?.infrastructure?.memoryUtilization ? `${analyticsData.infrastructure.memoryUtilization > 75 ? '-' : '+'}${Math.abs(analyticsData.infrastructure.memoryUtilization - 75).toFixed(1)}%` : 'N/A'
    },
    {
      title: 'Avg Response Time',
      value: analyticsData?.application?.avgResponseTime ? `${analyticsData.application.avgResponseTime}ms` : 'N/A',
      icon: Zap,
      color: 'bg-yellow-500',
      change: analyticsData?.application?.avgResponseTime ? `${analyticsData.application.avgResponseTime < 150 ? '-' : '+'}${Math.abs(analyticsData.application.avgResponseTime - 150).toFixed(0)}ms` : 'N/A'
    },
    {
      title: 'API Requests',
      value: analyticsData?.application?.requestCount ? analyticsData.application.requestCount.toLocaleString() : 'N/A',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+22.1%'
    },
    {
      title: 'Active DB Connections',
      value: analyticsData?.database?.activeConnections ? analyticsData.database.activeConnections.toString() : 'N/A',
      icon: Database,
      color: 'bg-indigo-500',
      change: analyticsData?.database?.activeConnections ? `${analyticsData.database.activeConnections > 50 ? '+' : '-'}${Math.abs(analyticsData.database.activeConnections - 50)}` : 'N/A'
    },
    {
      title: 'Error Rate',
      value: analyticsData?.application?.errorRate ? `${(analyticsData.application.errorRate * 100).toFixed(2)}%` : 'N/A',
      icon: Shield,
      color: 'bg-red-500',
      change: analyticsData?.application?.errorRate ? `${analyticsData.application.errorRate < 0.05 ? '-' : '+'}${(Math.abs(analyticsData.application.errorRate - 0.05) * 100).toFixed(2)}%` : 'N/A'
    },
    {
      title: 'Network In',
      value: analyticsData?.infrastructure?.networkIn ? `${analyticsData.infrastructure.networkIn} GB` : 'N/A',
      icon: Cloud,
      color: 'bg-cyan-500',
      change: '+15.3%'
    },
    {
      title: 'Est. Monthly Cost',
      value: analyticsData?.cost?.estimatedCharges ? `$${analyticsData.cost.estimatedCharges}` : 'N/A',
      icon: TrendingUp,
      color: 'bg-emerald-500',
      change: '+7.8%'
    }
  ];

  // Chart data configurations
  const networkChartData = {
    labels: chartData?.network?.networkIn?.map(point =>
      new Date(point.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      })
    ) || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Network In (GB)',
        data: chartData?.network?.networkIn?.map(point => point.value) || [1.2, 0.8, 2.1, 3.4, 2.8, 1.9],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Network Out (GB)',
        data: chartData?.network?.networkOut?.map(point => point.value) || [0.9, 0.6, 1.8, 2.9, 2.3, 1.4],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const performanceChartData = {
    labels: ['CPU', 'Memory', 'Disk I/O', 'Network'],
    datasets: [
      {
        label: 'Current Usage (%)',
        data: [
          analyticsData?.infrastructure?.cpuUtilization || 0,
          analyticsData?.infrastructure?.memoryUtilization || 0,
          45, // Disk I/O placeholder
          30  // Network utilization placeholder
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const networkChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} GB`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Data Transfer (GB)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  const performanceChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)'
        }
      }
    }
  };

  const costBreakdownData = {
    labels: ['EC2 Instances', 'RDS Database', 'S3 Storage', 'CloudFront', 'Other'],
    datasets: [
      {
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const costBreakdownOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    }
  };

  const performanceHistoryData = {
    labels: chartData?.performance?.cpu?.map(point =>
      new Date(point.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      })
    ) || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'CPU Utilization (%)',
        data: chartData?.performance?.cpu?.map(point => point.value) || [45, 52, 48, 65, 58, 62],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Memory Usage (%)',
        data: chartData?.performance?.memory?.map(point => point.value) || [68, 72, 65, 78, 71, 69],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  };

  const performanceHistoryOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Usage (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  const apiRequestsData = {
    labels: chartData?.application?.requestCount?.map(point =>
      new Date(point.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      })
    ) || ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'API Requests',
        data: chartData?.application?.requestCount?.map(point => point.value) || [520, 680, 450, 890, 720, 650],
        borderColor: 'rgba(147, 51, 234, 1)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const apiRequestsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Requests'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time (IST)'
        }
      }
    }
  };

  if (loading) {
    return (
      <Layout title="Cloud Analytics">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Cloud Analytics">
        <div className="flex flex-col items-center justify-center py-12">
          <Cloud className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">CloudWatch Unavailable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCloudWatchData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cloud Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cloud className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cloud Analytics Dashboard</h1>
              <p className="text-gray-600">Monitor your AWS infrastructure performance and usage metrics</p>
              {analyticsData?.lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {new Date(analyticsData.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className={`text-sm mt-1 ${
                    metric.change.startsWith('+') ? 'text-green-600' :
                    metric.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.color}`}>
                  <metric.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Network Traffic Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Network Traffic (24h)
            </h3>
            <div className="h-64">
              <Line data={networkChartData} options={networkChartOptions} />
            </div>
          </div>

          {/* Performance Overview Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resource Utilization
            </h3>
            <div className="h-64">
              <Bar data={performanceChartData} options={performanceChartOptions} />
            </div>
          </div>
        </div>

        {/* Additional Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cost Breakdown Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cost Breakdown
            </h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={costBreakdownData} options={costBreakdownOptions} />
            </div>
          </div>

          {/* Performance History Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance History (24h)
            </h3>
            <div className="h-64">
              <Line data={performanceHistoryData} options={performanceHistoryOptions} />
            </div>
          </div>
        </div>

        {/* API Requests Chart */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              API Requests Over Time (24h)
            </h3>
            <div className="h-64">
              <Line data={apiRequestsData} options={apiRequestsOptions} />
            </div>
          </div>
        </div>

        {/* Cloud Services Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AWS Services Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">EC2 Instances</p>
                <p className="text-sm text-gray-600">
                  CPU: {analyticsData?.infrastructure?.cpuUtilization ? `${analyticsData.infrastructure.cpuUtilization}%` : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">RDS Database</p>
                <p className="text-sm text-gray-600">
                  Connections: {analyticsData?.database?.activeConnections || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Monthly Cost</p>
                <p className="text-sm text-gray-600">
                  ${analyticsData?.cost?.estimatedCharges || 'N/A'} USD
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Application</p>
                <p className="text-sm text-gray-600">
                  Response: {analyticsData?.application?.avgResponseTime ? `${analyticsData.application.avgResponseTime}ms` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Cloud Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Activity className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Infrastructure metrics updated</p>
                <p className="text-xs text-gray-500">
                  {analyticsData?.infrastructure?.timestamp
                    ? new Date(analyticsData.infrastructure.timestamp).toLocaleString()
                    : 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Application performance monitored</p>
                <p className="text-xs text-gray-500">
                  {analyticsData?.application?.timestamp
                    ? new Date(analyticsData.application.timestamp).toLocaleString()
                    : 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Database className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Database metrics collected</p>
                <p className="text-xs text-gray-500">
                  {analyticsData?.database?.timestamp
                    ? new Date(analyticsData.database.timestamp).toLocaleString()
                    : 'Recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Cloud className="h-5 w-5 text-cyan-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Cost analysis updated</p>
                <p className="text-xs text-gray-500">
                  {analyticsData?.cost?.timestamp
                    ? new Date(analyticsData.cost.timestamp).toLocaleString()
                    : 'Recently'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CloudAnalytics;