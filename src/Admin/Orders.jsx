import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  ShoppingCart, Search, Filter, Eye, MapPin,
  Clock, User, Package, Truck, CircleCheck,
  XCircle, AlertCircle, Calendar, DollarSign,
  RefreshCw, Download,
  Ban
} from 'lucide-react';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    deliveryType: '',
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
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/orders/stats/overview`,
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
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!isAuthorized) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        toast.success('Order status updated successfully');
        fetchOrders();
        fetchStats();
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
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

  const formatStatusText = (status) => {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const StatCard = ({ title, value, icon: Icon, color = 'text-gray-600' }) => (
    <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className={`text-lg sm:text-2xl font-bold ${color} mt-1`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${color} flex-shrink-0 ml-2`} />
      </div>
    </div>
  );

  const fetchCurrentUser = useCallback(async () => {
    try {
      const local = localStorage.getItem('adminUser');
      if (local) {
        setCurrentUser(JSON.parse(local));
      } else {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
        const data = await response.json();
        if (data.tokenValid === false) {
          window.location.replace('/login');
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

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  useEffect(() => {
    if (isAuthorized) {
      fetchOrders();
      fetchStats();
    }
  }, [pagination.page, filters, isAuthorized]);

  // Guard states
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
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
      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingCart className="mr-2 sm:mr-3 text-green-600" size={24} />
                <span className="hidden sm:inline">Orders Management</span>
                <span className="sm:hidden">Orders</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor and manage all customer orders</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <StatCard
              title="Total Orders"
              value={stats.totalOrders || 0}
              icon={ShoppingCart}
              color="text-blue-600"
            />
            <StatCard
              title="Today's Orders"
              value={stats.todayOrders || 0}
              icon={Calendar}
              color="text-green-600"
            />
            <StatCard
              title="Active Orders"
              value={stats.activeOrders || 0}
              icon={Clock}
              color="text-orange-600"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              color="text-purple-600"
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search by order number, customer name, or phone..."
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </form>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
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

                <select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>

                <button
                  onClick={fetchOrders}
                  className="px-4 py-2 sm:py-3 bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2 transition-colors duration-200 whitespace-nowrap"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-500"></div>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('en-IN')}
                            </div>
                            <div className="text-xs text-gray-400">
                              {order.items.length} item(s)
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
                          <div className={`text-xs ${
                            order.payment.status === 'paid' ? 'text-green-600' : 
                            order.payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {order.payment.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.delivery && order.delivery.agentName ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.delivery.agentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.delivery.agentPhone || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="text-green-600 hover:text-green-900"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <select
                              value={order.status.current}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className="text-xs border border-gray-300 rounded-none px-2 py-1 focus:ring-2 focus:ring-green-500"
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="packing">Packing</option>
                              <option value="ready_for_pickup">Ready for Pickup</option>
                              <option value="picked_up">Picked Up</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
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
                    <div key={order._id} className="p-4 hover:bg-gray-50">
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

                          <div className="grid grid-cols-1 gap-3 mb-3">
                            <div className="text-xs">
                              <span className="text-gray-500">Amount:</span>
                              <div className="font-medium text-gray-900">₹{order.pricing.totalAmount}</div>
                              <div className={`text-xs ${
                                order.payment.status === 'paid' ? 'text-green-600' : 
                                order.payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                              }`}>
                                {order.payment.status}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => navigate(`/orders/${order._id}`)}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <select
                                value={order.status.current}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                className="text-xs border border-gray-300 rounded-none px-2 py-1 focus:ring-2 focus:ring-green-500"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="packing">Packing</option>
                                <option value="ready_for_pickup">Ready for Pickup</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            {order.delivery && order.delivery.agentName && (
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
