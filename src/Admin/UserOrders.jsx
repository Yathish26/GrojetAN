import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiShoppingBag,
  FiCalendar,
  FiMapPin,
  FiCreditCard,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout.jsx';

export default function UserOrders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUserDetails();
    fetchUserOrders(currentPage);
  }, [id, currentPage]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login');
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.message);
    }
  };

  const fetchUserOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/orders?page=${page}&limit=10`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(data.pagination);

      // Debug: Log the first order's items to see image data
      if (data.orders && data.orders.length > 0 && data.orders[0].items && data.orders[0].items.length > 0) {
        console.log('Sample order item:', data.orders[0].items[0]);
        console.log('Item image:', data.orders[0].items[0].image);
        console.log('Product images:', data.orders[0].items[0].productId?.images);
        console.log('Product thumbnail:', data.orders[0].items[0].productId?.thumbnail);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const currentStatus = status?.current || status;
    switch (currentStatus?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    const currentStatus = status?.current || status;
    switch (currentStatus?.toLowerCase()) {
      case 'delivered':
        return <FiCheckCircle className="text-green-600" />;
      case 'cancelled':
        return <FiXCircle className="text-red-600" />;
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'confirmed':
        return <FiPackage className="text-blue-600" />;
      case 'preparing':
        return <FiPackage className="text-blue-600" />;
      case 'out_for_delivery':
        return <FiTruck className="text-orange-600" />;
      default:
        return <FiPackage className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !user) {
    return (
      <Layout title="User Orders">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 rounded-full border-green-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Orders">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(`/users/${id}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <FiArrowLeft className="text-xl" />
            <span>Back to User Details</span>
          </button>
        </div>

        {/* User Info Header */}
        {user && (
          <div className="bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user.personalInfo?.name || 'N/A'}</h1>
                <p className="text-blue-100">{user.personalInfo?.email || user.personalInfo?.phone || 'N/A'}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-blue-100 text-sm">
                    Total Orders: {pagination?.total || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white shadow-lg">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-slate-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FiShoppingBag className="text-gray-600" />
              Order History ({pagination?.total || 0})
            </h3>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-t-2 border-b-2 rounded-full border-blue-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <FiShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
                <p className="text-gray-500">This user hasn't placed any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">Order #{order.orderNumber || order._id.slice(-8)}</h4>
                            <button
                              onClick={() => navigate(`/orders/${order._id}`)}
                              className="inline-flex items-center cursor-pointer px-2 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <FiCalendar className="text-gray-400" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status?.current)}`}>
                          {order.status?.current?.charAt(0).toUpperCase() + order.status?.current?.slice(1)}
                        </span>
                        <p className="text-lg font-bold text-gray-800 mt-1">₹{order.pricing?.totalAmount?.toLocaleString() || order.totalAmount?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    {/* Merchant Info */}
                    {order.store?.storeId && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                        <FiMapPin className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {order.store.storeId.businessInfo?.displayName || 'Store'}
                        </span>
                        {order.store.storeId.operationalInfo?.storeAddress && (
                          <span className="text-sm text-gray-500">
                            • {order.store.storeId.operationalInfo.storeAddress.city}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      <h5 className="text-sm font-medium text-gray-700">Items ({order.items?.length || 0})</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.items?.slice(0, 3).map((item, index) => {
                          const imageUrl = item.image || item.productId?.images?.[0] || item.productId?.thumbnail;
                          const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${import.meta.env.VITE_SERVER}${imageUrl}`;

                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              {imageUrl ? (
                                <img
                                  src={fullImageUrl}
                                  alt={item.productId?.name || item.name}
                                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                                <FiPackage className="text-gray-400 text-lg" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.productId?.name || item.name}</p>
                                <p className="text-xs text-gray-600">Qty: {item.quantity} × ₹{item.price}</p>
                                <p className="text-xs text-gray-500">₹{(item.quantity * item.price).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })}
                        {order.items?.length > 3 && (
                          <div className="flex items-center justify-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-500">+{order.items.length - 3} more items</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Payment:</span>
                        <p className="font-medium flex items-center gap-1">
                          <FiCreditCard className="text-gray-400" />
                          {order.payment?.method ? order.payment.method.charAt(0).toUpperCase() + order.payment.method.slice(1) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <p className="font-medium">{order.orderType || 'Delivery'}</p>
                      </div>
                      {order.customer?.address && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Delivery Address:</span>
                          <p className="font-medium text-xs">
                            {order.customer.address.street}, {order.customer.address.city}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft />
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm border border-gray-300 rounded bg-blue-50 text-blue-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={!pagination.hasNextPage}
                    className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}