import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  Truck, Search, Filter, MapPin,
  Clock, User, Package, Navigation,
  CircleCheck, XCircle, AlertCircle, Calendar,
  RefreshCw, Download,
  Ban,
  IndianRupee, X, Phone, Navigation2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Xpress = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [stats, setStats] = useState({});
  const [xpressActive, setXpressActive] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
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
        search: currentSearch,
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress?${queryParams}`,
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
      console.error('Error fetching Xpress orders:', error);
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
        `${import.meta.env.VITE_SERVER}/admin/xpress/stats/overview?${queryParams}`,
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
      console.error('Error fetching Xpress stats:', error);
    }
  };

  const fetchXpressStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/app-controls/xpress-status`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setXpressActive(data.xpressActive);
      }
    } catch (error) {
      console.error('Error fetching xpress status:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        toast.success('Order status updated successfully');
        fetchOrders();
        fetchStats();
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const updateXpressStatus = async (type, status) => {
    setPendingStatus({ type, status });
    setShowConfirmModal(true);
  };

  const confirmStatusUpdate = async () => {
    const { type, status } = pendingStatus;
    setShowConfirmModal(false);
    setPendingStatus(null);

    try {
      const body = { xpressActive: status };
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/app-controls/xpress-status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(body)
        }
      );

      if (response.ok) {
        setXpressActive(status);
        toast.success(`Xpress service ${status ? 'enabled' : 'disabled'} successfully`);
      } else {
        toast.error(`Failed to ${status ? 'enable' : 'disable'} Xpress service`);
      }
    } catch (error) {
      console.error('Error updating xpress status:', error);
      toast.error(`Failed to ${status ? 'enable' : 'disable'} Xpress ${type}`);
    }
  };

  const exportOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/export/excel?${queryParams}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'xpress-orders.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Orders exported successfully');
      } else {
        toast.error('Failed to export orders');
      }
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    }
  };

  const checkUser = useCallback(async () => {
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
    } catch (error) {
      console.error('Error checking user:', error);
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const isAuthorized = allowedRoles.includes(currentUser?.role);

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [currentSearch, filters.status, filters.paymentMethod]);

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
      fetchStats();
      fetchXpressStatus();
    }
  }, [currentUser, pagination.page, currentSearch, filters, isAuthorized]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'picked_up':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle size={16} />;
      case 'picked_up':
        return <Package size={16} />;
      case 'in_transit':
        return <Navigation size={16} />;
      case 'delivered':
        return <CircleCheck size={16} />;
      case 'cancelled':
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const isRazorpayPending = (order) => (
    order?.pricing?.paymentMethod !== 'cod' && order?.pricing?.paymentStatus === 'pending'
  );

  const getPaymentBadgeClasses = (order) => {
    if (order?.pricing?.paymentMethod === 'cod') {
      return 'bg-green-100 text-green-800 border-green-200';
    }

    if (order?.pricing?.paymentStatus === 'paid') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }

    if (order?.pricing?.paymentStatus === 'refund_pending') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }

    if (order?.pricing?.paymentStatus === 'failed') {
      return 'bg-red-100 text-red-800 border-red-200';
    }

    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getPaymentLabel = (order) => {
    if (order?.pricing?.paymentMethod === 'cod') {
      return 'Cash';
    }

    if (order?.pricing?.paymentStatus === 'paid') {
      return 'Razorpay Paid';
    }

    if (order?.pricing?.paymentStatus === 'refund_pending') {
      return 'Refund Pending';
    }

    if (order?.pricing?.paymentStatus === 'failed') {
      return 'Razorpay Failed';
    }

    return 'Razorpay Pending';
  };

  const getPaymentMeta = (order) => {
    if (order?.pricing?.paymentMethod === 'cod') {
      return 'Collect on delivery';
    }

    if (order?.pricing?.paymentStatus === 'paid') {
      return order?.razorpaySignature ? 'Signature verified' : 'Payment confirmed';
    }

    if (order?.pricing?.paymentStatus === 'refund_pending') {
      return 'Awaiting refund processing';
    }

    if (order?.pricing?.paymentStatus === 'failed') {
      return 'Payment not captured';
    }

    return 'Waiting for payment confirmation';
  };

  if (checkingUser) {
    return (
      <Layout title="Xpress">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Xpress">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout title="Xpress">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Ban className='w-16 h-16 text-red-500 mb-2'/>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Admins and Super Admins can view Xpress orders.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Xpress Orders">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xpress Orders</h1>
            <p className="text-gray-600">Manage and monitor Xpress delivery orders</p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-orange-50 px-3 sm:px-4 py-2 rounded-lg border border-orange-200 shadow-sm w-full">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${xpressActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-semibold text-gray-800">Xpress Service</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={xpressActive}
                  onChange={(e) => updateXpressStatus('active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-red-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className={`ml-2 text-xs font-medium ${xpressActive ? 'text-green-600' : 'text-red-600'}`}>
                  {xpressActive ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
              <button
                onClick={exportOrders}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={() => {
                  fetchOrders();
                  fetchStats();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inTransitOrders || 0}</p>
              </div>
              <Navigation className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveredOrders || 0}</p>
              </div>
              <CircleCheck className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Order #, name, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && setCurrentSearch(searchTerm)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setCurrentSearch(searchTerm)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="block md:hidden divide-y divide-gray-200">
            {loading ? (
              <div className="px-4 py-6 text-center">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-500">Loading orders...</span>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">No orders found</div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/xpress/${order._id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}{' '}
                        • {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${isRazorpayPending(order) ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{isRazorpayPending(order) ? 'Razorpay pending' : order.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {order.userId ? order.userId.personalInfo.name : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone size={14} className="mr-1" />
                      {order.userId?.personalInfo?.phone || 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                    <div>
                      <p className="text-gray-500">Assigned To</p>
                      <p className="text-gray-800 mt-1">
                        {order.assignment?.agent ? `${order.assignment.agent.personalInfo.firstName} ${order.assignment.agent.personalInfo.lastName || ''}`.trim() : 'Not Assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="text-gray-800 mt-1">₹{order.pricing?.finalCost || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment</p>
                      <p className="text-gray-800 mt-1">{getPaymentLabel(order)}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{getPaymentMeta(order)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">First Order</p>
                      <p className="text-gray-800 mt-1">{order.isFirstOrder ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[100px]">Distance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell min-w-[100px]">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">First Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Source</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500">Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr 
                      key={order._id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/xpress/${order._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                    
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.userId ? order.userId.personalInfo.name : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone size={14} className="mr-1" />
                            {order.userId?.personalInfo?.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm font-medium text-gray-900">
                          {order.pricing?.distance ? `${order.pricing.distance} km` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.pricing?.eta ? `${order.pricing.eta} mins` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.assignment?.agent ? `${order.assignment.agent.personalInfo.firstName} ${order.assignment.agent.personalInfo.lastName || ''}`.trim() : 'Not Assigned'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone size={14} className="mr-1" />
                            {order.assignment?.agent?.personalInfo?.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{order.pricing?.finalCost || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.pricing?.distance?.toFixed(1)} km • {order.pricing?.eta} min
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentBadgeClasses(order)}`}>
                          {order.pricing?.paymentMethod === 'cod' ? '💵' : '💳'}
                          <span className="ml-1">
                            {getPaymentLabel(order)}
                          </span>
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {getPaymentMeta(order)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isRazorpayPending(order) ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{isRazorpayPending(order) ? 'Razorpay pending' : order.status.replace('_', ' ')}</span>
                        </span>
                        {!isRazorpayPending(order) && order?.pricing?.paymentMethod !== 'cod' && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order?.razorpayPaymentId ? `Payment ID: ${order.razorpayPaymentId}` : 'Awaiting payment reference'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          {order.packageDetails?.category || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.packageDetails?.size || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.isFirstOrder
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {order.isFirstOrder ? 'Yes' : 'No'}
                        </span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      ‹
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      ›
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {pendingStatus?.status ? `Enable Xpress ${pendingStatus?.type === 'active' ? 'Service' : 'Sleep'}` : `Disable Xpress ${pendingStatus?.type === 'active' ? 'Service' : 'Sleep'}`}
                </h3>
                <p className="text-sm text-gray-600">Confirm your action</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to <span className={`font-semibold ${pendingStatus?.status ? 'text-green-600' : 'text-red-600'}`}>
                  {pendingStatus?.status ? 'enable' : 'disable'}
                </span> Xpress {pendingStatus?.type === 'active' ? 'service' : 'sleep'}?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This will {pendingStatus?.status ? (pendingStatus?.type === 'active' ? 'allow new Xpress orders and enable all delivery operations' : 'enable Xpress sleep mode') : (pendingStatus?.type === 'active' ? 'stop accepting new Xpress orders and disable delivery operations' : 'disable Xpress sleep mode')}.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  pendingStatus?.status 
                    ? (pendingStatus?.type === 'active' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700')
                    : (pendingStatus?.type === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700')
                }`}
              >
                {pendingStatus?.status ? 'Enable' : 'Disable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Xpress;