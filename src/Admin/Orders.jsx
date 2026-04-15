import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  ShoppingCart, Search, Filter, MapPin,
  Clock, User, Package, Truck, CircleCheck,
  XCircle, AlertCircle, Calendar, DollarSign,
  RefreshCw, Download,
  Ban,
  IndianRupee, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    deliveryType: '',
    dateRange: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [stats, setStats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const allowedRoles = ['super_admin', 'admin'];
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/orders?${queryParams}`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (data.success) {
        setOrders(data.orders);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/orders/stats/overview?${queryParams}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = (e) => {
    if (!isAuthorized) return;
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleFilterChange = (key, value) => {
    if (!isAuthorized) return;
    
    if (key === 'dateRange') {
      if (value === 'custom') {
        // For custom range, don't set startDate and endDate automatically
        setFilters(prev => ({ 
          ...prev, 
          dateRange: value,
          startDate: prev.startDate || '',
          endDate: prev.endDate || ''
        }));
      } else {
        const dateRange = getDateRange(value);
        setFilters(prev => ({ 
          ...prev, 
          dateRange: value,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }));
      }
    } else if (key === 'startDate' || key === 'endDate') {
      setFilters(prev => ({ 
        ...prev, 
        [key]: value,
        dateRange: 'custom' // Set to custom when manually changing dates
      }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      packing: 'bg-yellow-100 text-yellow-800',
      ready_for_pickup: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      confirmed: <CircleCheck size={16} />,
      packing: <Clock size={16} />,
      ready_for_pickup: <Package size={16} />,
      picked_up: <Truck size={16} />,
      out_for_delivery: <MapPin size={16} />,
      delivered: <CircleCheck size={16} />,
      cancelled: <XCircle size={16} />,
      refunded: <RefreshCw size={16} />
    };
    return icons[status] || <AlertCircle size={16} />;
  };

  const getPaymentStatusColor = (method) => {
    const colors = {
      cash: 'bg-blue-100 text-blue-800',
      razorpay: 'bg-purple-100 text-purple-800',
      paypal: 'bg-orange-100 text-orange-800',
      stripe: 'bg-indigo-100 text-indigo-800',
      upi: 'bg-green-100 text-green-800'
    };
    return colors[method?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusIcon = (method) => {
    const icons = {
      cash: <IndianRupee size={12} />,
      razorpay: <CircleCheck size={12} />,
      paypal: <CircleCheck size={12} />,
      stripe: <CircleCheck size={12} />,
      upi: <CircleCheck size={12} />
    };
    return icons[method?.toLowerCase()] || <AlertCircle size={12} />;
  };

  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate = '';
    let endDate = '';

    switch (range) {
      case 'today':
        startDate = today.toISOString().split('T')[0];
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().split('T')[0];
        break;
      case 'last7days':
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = last7Days.toISOString().split('T')[0];
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().split('T')[0];
        break;
      case 'last30days':
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = last30Days.toISOString().split('T')[0];
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().split('T')[0];
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString().split('T')[0];
        break;
      default:
        startDate = '';
        endDate = '';
    }

    return { startDate, endDate };
  };

  const formatStatusText = (status) => {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const exportToExcel = async () => {
    try {
      toast.loading('Exporting orders to Excel...', { id: 'export' });
      
      const queryParams = new URLSearchParams({
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/orders/export?${queryParams}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to export orders');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers or default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'orders.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Orders exported successfully!', { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders', { id: 'export' });
    }
  };

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
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  // Prevent blink: show nothing if redirecting
  if (redirecting) return null;

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
      fetchStats();
    }
  }, [pagination.page, filters, isAuthorized]);

  // Guard states
  if (checkingUser) {
    return (
      <Layout title="Orders Management">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Ban className='w-16 h-16 text-red-500 mb-2'/>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins and Super Admins can view orders.</p>
      </div>
    );
  }

  return (
    <Layout title="Orders Management">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
                  <p className="mt-1 text-sm text-gray-500">Monitor and manage all customer orders</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={fetchOrders}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Download size={16} className="mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Orders</p>
                    <p className="text-3xl font-bold text-white">{stats.totalOrders || 0}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Active Orders</p>
                    <p className="text-3xl font-bold text-white">{stats.activeOrders || 0}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            {/* <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <IndianRupee className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Search className="w-6 h-6" />
              Search & Filters
            </h2>
          </div>
          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="flex gap-4">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by order number, customer name, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Search size={16} className="mr-2" />
                  Search
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Date Range:</span>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="thisMonth">This Month</option>
                  <option value="lastMonth">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">End Date:</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Order Status:</span>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packing">Packing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash on Delivery</option>
                  <option value="razorpay">Razorpay</option>
                </select>
              </div>

              {/* Delivery Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Delivery Type:</span>
                <select
                  value={filters.deliveryType}
                  onChange={(e) => handleFilterChange('deliveryType', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(filters.dateRange || filters.status || filters.paymentMethod || filters.deliveryType || searchTerm) && (
                <button
                  onClick={() => {
                    setFilters({
                      status: '',
                      paymentMethod: '',
                      deliveryType: '',
                      dateRange: '',
                      startDate: '',
                      endDate: ''
                    });
                    setSearchTerm('');
                    setPagination(prev => ({ ...prev, page: 1 }));
                    fetchOrders();
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Package className="w-6 h-6" />
              Orders ({orders.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500">
              <ShoppingCart size={40} className="mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base">No orders found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Merchant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order._id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer.name || order.customer.phone || 'Customer'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customer.phone || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.store?.storeId?.businessInfo?.displayName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.store?.storeId?.ownerInfo?.mobile || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-xs font-medium ${getStatusColor(order.status.current)}`}>
                            {getStatusIcon(order.status.current)}
                            {formatStatusText(order.status.current)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{order.pricing.totalAmount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-xs font-medium ${getPaymentStatusColor(order.payment.method)}`}>
                            {getPaymentStatusIcon(order.payment.method)}
                            {order.payment.method ? (order.payment.method === 'cash' ? 'Cash on Delivery' : formatStatusText(order.payment.method)) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.assignment?.status === 'accepted' && order.delivery?.agentName ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.delivery.agentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.delivery.agentPhone || 'N/A'}
                              </div>
                            </div>
                          ) : order.assignment?.status === 'pending' ? (
                            <span className="text-sm text-yellow-600">Agent assigned (pending acceptance)</span>
                          ) : (
                            <span className="text-sm text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.source === 'website'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {order.source === 'website' ? '🌐 Website' : '📱 Mobile App'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                <div className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <div key={order._id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${order._id}`)}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12">
                          <div className="w-full h-full rounded-none bg-gray-200 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                #{order.orderNumber}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(order.createdAt).toLocaleDateString('en-IN')} • {order.items.length} item(s)
                              </p>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(order.status.current)}`}>
                              {getStatusIcon(order.status.current)}
                              {formatStatusText(order.status.current)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="text-xs">
                              <span className="text-gray-500">Customer:</span>
                              <div className="font-medium text-gray-900 truncate">
                                {order.customer.name || order.customer.phone || 'Customer'}
                              </div>
                              <div className="text-gray-600">{order.customer.phone || 'N/A'}</div>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Merchant:</span>
                              <div className="font-medium text-gray-900 truncate">
                                {order.store?.storeId?.businessInfo?.displayName || 'N/A'}
                              </div>
                              <div className="text-gray-600">{order.store?.storeId?.ownerInfo?.mobile || ''}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="text-xs">
                              <span className="text-gray-500">Amount:</span>
                              <div className="font-medium text-gray-900">₹{order.pricing.totalAmount}</div>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Payment:</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium ${getPaymentStatusColor(order.payment.method)}`}>
                                {getPaymentStatusIcon(order.payment.method)}
                                {order.payment.method ? (order.payment.method === 'cash' ? 'Cash on Delivery' : formatStatusText(order.payment.method)) : 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="text-xs">
                              <span className="text-gray-500">Source:</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.source === 'website'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {order.source === 'website' ? '🌐 Website' : '📱 Mobile App'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-none text-xs font-medium ${getStatusColor(order.status.current)}`}>
                                {getStatusIcon(order.status.current)}
                                {formatStatusText(order.status.current)}
                              </span>
                            </div>
                            {order.assignment?.status === 'accepted' && order.delivery?.agentName && (
                              <div className="text-xs text-gray-500 text-right">
                                <div className="font-medium">{order.delivery.agentName}</div>
                                <div>{order.delivery.agentPhone || 'N/A'}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs sm:text-sm text-gray-700">
                    Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-none bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                        if (pageNum > pagination.totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            className={`px-2.5 py-1.5 text-xs sm:text-sm border rounded-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                              pagination.page === pageNum
                                ? 'bg-green-500 text-white border-green-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-none bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
