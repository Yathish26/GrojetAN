import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  CreditCard, 
  Truck, 
  CircleCheck, 
  AlertCircle, 
  XCircle, 
  Edit3,
  Save,
  X,
  MessageSquare,
  MapPin as LocationIcon,
  Timer,
  DollarSign,
  Star,
  Eye,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetails() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  
  console.log('OrderDetails - orderId from params:', orderId);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteConfirmError, setDeleteConfirmError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    console.log('fetchOrderDetails called with orderId:', orderId);
    try {
      const url = `${import.meta.env.VITE_SERVER}/admin/orders/${orderId}`;
      console.log('Fetching from URL:', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrder(data.order);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const assignDeliveryAgent = async (agentId) => {
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/assign-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ deliveryAgentId: agentId })
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to assign delivery agent');
      }

      setOrder(data.order);
      toast.success('Delivery agent assigned successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
    setDeleteConfirmError('');
  };

  const confirmDeleteOrder = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteConfirmError('Please type "DELETE" to confirm');
      return;
    }

    setUpdating(true);
    setShowDeleteConfirm(false);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('Order deleted successfully');
      navigate('/orders');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditField = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEditField = async () => {
    if (!editValue.trim()) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ [editingField]: editValue })
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      setOrder(data.order);
      setEditingField(null);
      setEditValue('');
      toast.success('Order updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusValue = (status) => {
    return typeof status === 'string' ? status : status?.current || 'unknown';
  };

  const getStatusIcon = (status) => {
    const statusValue = getStatusValue(status);
    switch (statusValue) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CircleCheck className="w-5 h-5 text-blue-500" />;
      case 'preparing':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CircleCheck className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    const statusValue = getStatusValue(status);
    switch (statusValue) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'The requested order could not be found.'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="font-medium capitalize">{getStatusValue(order.status).replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items ({order.items?.length || 0})
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.items?.map((item, index) => {
                  const imageUrl = item.image || item.productId?.images?.[0] || item.productId?.thumbnail;
                  const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${import.meta.env.VITE_SERVER}${imageUrl}`;
                  
                  return (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={fullImageUrl}
                          alt={item.productId?.name || 'Product'}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            // Try without server prefix if it failed
                            if (fullImageUrl !== imageUrl) {
                              e.target.src = imageUrl;
                            } else {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <Package className="w-6 h-6 text-gray-400" style={{ display: imageUrl ? 'none' : 'block' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.productId?.name || item.name || 'Product Name'}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-500">Unit Price: ₹{item.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">₹{item.quantity * item.price}</p>
                    </div>
                  </div>
                  );
                }) || (
                  <p className="text-gray-500 text-center py-8">No items found</p>
                )}
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.statusHistory?.map((status, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(status.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 capitalize">
                        {status.status.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(status.timestamp).toLocaleString()}
                      </p>
                      {status.note && (
                        <p className="text-sm text-gray-500 mt-1">{status.note}</p>
                      )}
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No timeline data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{order.customer?.name || 'Customer Name'}</p>
                  <p className="text-sm text-gray-600">{order.customer?.email || 'No email'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-800">{order.customer?.phone || 'No phone'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium text-gray-800">
                    {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Merchant/Store Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Merchant Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{order.merchantLandmark?.name || 'Store Name'}</p>
                  <p className="text-sm text-gray-600">{order.merchantLandmark?.phone || 'No phone'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Store Address</p>
                  <p className="font-medium text-gray-800">
                    {order.merchantLandmark?.address?.street}, {order.merchantLandmark?.address?.city}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.merchantLandmark?.address?.state} - {order.merchantLandmark?.address?.zipCode}
                  </p>
                </div>
              </div>

              {order.store?.businessInfo && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 mb-2">Business Info</p>
                  <div className="space-y-1 text-sm text-orange-700">
                    <p>Legal Name: {order.store.businessInfo.legalName || 'N/A'}</p>
                    <p>Display Name: {order.store.businessInfo.displayName || 'N/A'}</p>
                    {order.store.businessInfo.website && <p>Website: {order.store.businessInfo.website}</p>}
                  </div>
                </div>
              )}

              {order.store?.operationalInfo && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">Operational Info</p>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>Hours: {order.store.operationalInfo.openingTime || 'N/A'} - {order.store.operationalInfo.closingTime || 'N/A'}</p>
                    <p>Store Type: {order.store.operationalInfo.storeType || 'N/A'}</p>
                  </div>
                </div>
              )}

              {order.store?.ownerInfo && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800 mb-2">Owner Contact</p>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>Name: {order.store.ownerInfo.fullName || 'N/A'}</p>
                    <p>Mobile: {order.store.ownerInfo.mobile || 'N/A'}</p>
                    <p>Email: {order.store.ownerInfo.email || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Estimated Time</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {order.deliveryInfo?.estimatedTime || 'N/A'} min
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    {order.deliveryInfo?.distance || 'N/A'} km
                  </p>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Priority</span>
                </div>
                <p className="text-sm text-purple-700 capitalize">
                  {order.deliveryInfo?.priority || 'normal'}
                </p>
              </div>

              {order.deliveryInfo?.deliveryInstructions && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Delivery Instructions</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {order.deliveryInfo.deliveryInstructions}
                  </p>
                </div>
              )}

              {order.deliveryInfo?.deliverySlot && (
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-800">Delivery Slot</span>
                  </div>
                  <p className="text-sm text-indigo-700">
                    {order.deliveryInfo.deliverySlot.startTime ? new Date(order.deliveryInfo.deliverySlot.startTime).toLocaleTimeString() : 'N/A'} - 
                    {order.deliveryInfo.deliverySlot.endTime ? new Date(order.deliveryInfo.deliverySlot.endTime).toLocaleTimeString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Assignment Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {order.assignment?.deliveryAgent ? (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Delivery Agent Assigned</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Agent ID: {order.assignment.deliveryAgent}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">No Agent Assigned</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Order is waiting for agent assignment
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {order.assignment?.assignedAt && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Assigned At</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {new Date(order.assignment.assignedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {order.assignment?.acceptedAt && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CircleCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Accepted At</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {new Date(order.assignment.acceptedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {order.assignment?.pickedUpAt && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Picked Up At</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      {new Date(order.assignment.pickedUpAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {order.assignment?.deliveredAt && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CircleCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Delivered At</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {new Date(order.assignment.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {order.assignment?.estimatedDeliveryTime && (
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-800">Est. Delivery</span>
                    </div>
                    <p className="text-sm text-indigo-700">
                      {new Date(order.assignment.estimatedDeliveryTime).toLocaleString()}
                    </p>
                  </div>
                )}

                {order.assignment?.actualDeliveryTime && (
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-800">Actual Delivery</span>
                    </div>
                    <p className="text-sm text-teal-700">
                      {new Date(order.assignment.actualDeliveryTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {order.assignment?.rejectedBy && order.assignment.rejectedBy.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Rejected By Agents</span>
                  </div>
                  <div className="space-y-1">
                    {order.assignment.rejectedBy.map((rejection, index) => (
                      <p key={index} className="text-sm text-red-700">
                        Agent {rejection.agentId} - {new Date(rejection.rejectedAt).toLocaleString()}
                        {rejection.reason && ` (${rejection.reason})`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Total</span>
                <span className="font-medium">₹{order.pricing?.itemsTotal || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">₹{order.pricing?.deliveryFee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">₹{order.pricing?.platformFee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span className="font-medium">₹{order.pricing?.taxes || 0}</span>
              </div>
              {order.pricing?.tip > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Tip</span>
                  <span>₹{order.pricing.tip}</span>
                </div>
              )}
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.pricing.discount}</span>
                </div>
              )}
              {order.pricing?.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{order.pricing.couponDiscount}</span>
                </div>
              )}
              {order.pricing?.couponCode && (
                <div className="flex justify-between text-purple-600">
                  <span>Coupon Code</span>
                  <span className="font-mono">{order.pricing.couponCode}</span>
                </div>
              )}
              <hr className="my-3" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span>₹{order.pricing?.totalAmount || order.totalAmount || 0}</span>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Payment Method</span>
                  </div>
                  <p className="font-medium text-gray-800 capitalize mt-1">
                    {order.payment?.method || order.paymentMethod || 'Not specified'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    (order.payment?.status || order.paymentStatus) === 'paid' ? 'text-green-600' : 
                    (order.payment?.status || order.paymentStatus) === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Status: {order.payment?.status || order.paymentStatus || 'Unknown'}
                  </p>
                </div>

                {order.payment?.transactionId && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">Transaction ID</span>
                    </div>
                    <p className="font-medium text-blue-800 mt-1 font-mono text-sm">
                      {order.payment.transactionId}
                    </p>
                  </div>
                )}

                {order.payment?.paidAt && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Paid At</span>
                    </div>
                    <p className="font-medium text-green-800 mt-1">
                      {new Date(order.payment.paidAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {order.payment?.gatewayResponse && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-purple-600">Gateway Response</span>
                    </div>
                    <div className="mt-2 text-xs text-purple-700 font-mono bg-purple-100 p-2 rounded">
                      {typeof order.payment.gatewayResponse === 'object' 
                        ? JSON.stringify(order.payment.gatewayResponse, null, 2)
                        : order.payment.gatewayResponse
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Agent */}
          {order.deliveryAgent && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Agent
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{order.deliveryAgent.name}</p>
                    <p className="text-sm text-gray-600">{order.deliveryAgent.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    Rating: {order.deliveryAgent.rating || 'No rating'}
                  </span>
                </div>

                {order.delivery?.currentLocation && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <LocationIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Live Location</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Lat: {order.delivery.currentLocation.lat}, 
                      Lng: {order.delivery.currentLocation.lng}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery Agent Earnings */}
          {order.earnings && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Agent Earnings
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Base Delivery Fee</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900">
                      ₹{order.earnings.deliveryFee || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Tip</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-900">
                      ₹{order.earnings.tip || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Distance Bonus</span>
                    </div>
                    <p className="text-lg font-semibold text-purple-900">
                      ₹{order.earnings.distanceBonus || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Priority Bonus</span>
                    </div>
                    <p className="text-lg font-semibold text-orange-900">
                      ₹{order.earnings.priorityBonus || 0}
                    </p>
                  </div>
                </div>

                <hr className="my-3" />

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">Total Earnings</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{order.earnings.total || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tracking Information */}
          {order.tracking && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <LocationIcon className="w-5 h-5" />
                  Tracking Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {order.tracking.agentLocation && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <LocationIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Agent Location</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Lat: {order.tracking.agentLocation.latitude}, 
                      Lng: {order.tracking.agentLocation.longitude}
                    </p>
                    {order.tracking.agentLocation.lastUpdated && (
                      <p className="text-xs text-blue-600 mt-1">
                        Last updated: {new Date(order.tracking.agentLocation.lastUpdated).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {order.tracking.estimatedArrival && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Estimated Arrival</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {new Date(order.tracking.estimatedArrival).toLocaleString()}
                    </p>
                  </div>
                )}

                {order.tracking.deliveryOTP && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Delivery OTP</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-purple-900">
                      {order.tracking.deliveryOTP}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Share this OTP with the customer for delivery verification
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Details */}
          {order.cancellation && getStatusValue(order.status) === 'cancelled' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Cancellation Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Cancellation Reason</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {order.cancellation.reason || 'No reason provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Cancelled By</span>
                    </div>
                    <p className="text-sm text-gray-700 capitalize">
                      {order.cancellation.cancelledBy || 'Unknown'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Cancelled At</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {order.cancellation.cancelledAt ? new Date(order.cancellation.cancelledAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Refund Amount</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-900">
                      ₹{order.cancellation.refundAmount || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Refund Status</span>
                    </div>
                    <p className={`text-sm font-medium ${
                      order.cancellation.refundStatus === 'processed' ? 'text-green-600' :
                      order.cancellation.refundStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {order.cancellation.refundStatus || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Requests */}
          {order.specialRequests && order.specialRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Special Requests ({order.specialRequests.filter(req => req.isActive).length})
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {order.specialRequests.filter(req => req.isActive).map((request, index) => (
                    <div key={index} className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800 capitalize">
                          {request.type.replace('_', ' ')}
                        </span>
                      </div>
                      {request.description && (
                        <p className="text-sm text-indigo-700 mt-1">
                          {request.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customer Feedback */}
          {order.feedback && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Customer Feedback
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {order.feedback.deliveryRating && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Delivery Rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < order.feedback.deliveryRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-blue-700 ml-2">
                          {order.feedback.deliveryRating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {order.feedback.foodRating && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Food Rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < order.feedback.foodRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-green-700 ml-2">
                          {order.feedback.foodRating}/5
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {order.feedback.deliveryComment && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Delivery Comment</span>
                    </div>
                    <p className="text-sm text-blue-700 italic">
                      "{order.feedback.deliveryComment}"
                    </p>
                  </div>
                )}

                {order.feedback.foodComment && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Food Comment</span>
                    </div>
                    <p className="text-sm text-green-700 italic">
                      "{order.feedback.foodComment}"
                    </p>
                  </div>
                )}

                {order.feedback.submittedAt && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Feedback Submitted</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {new Date(order.feedback.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Order Metrics
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-800">Order Age</span>
                  </div>
                  <p className="text-lg font-semibold text-indigo-900">
                    {order.orderAge || 0} min
                  </p>
                  <p className="text-xs text-indigo-600">
                    Time since order was placed
                  </p>
                </div>

                {order.actualDeliveryDuration && (
                  <div className="p-3 bg-teal-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-800">Delivery Duration</span>
                    </div>
                    <p className="text-lg font-semibold text-teal-900">
                      {order.actualDeliveryDuration} min
                    </p>
                    <p className="text-xs text-teal-600">
                      Actual time taken for delivery
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              {getStatusValue(order.status) === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  disabled={updating}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Confirm Order
                </button>
              )}
              
              {getStatusValue(order.status) === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus('preparing')}
                  disabled={updating}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Start Preparing
                </button>
              )}
              
              {getStatusValue(order.status) === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus('out_for_delivery')}
                  disabled={updating}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Out for Delivery
                </button>
              )}
              
              {getStatusValue(order.status) === 'out_for_delivery' && (
                <button
                  onClick={() => updateOrderStatus('delivered')}
                  disabled={updating}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              )}
              
              {!['delivered', 'cancelled'].includes(getStatusValue(order.status)) && (
                <button
                  onClick={() => updateOrderStatus('cancelled')}
                  disabled={updating}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}
              
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Print Order
              </button>
              
              <button
                onClick={deleteOrder}
                disabled={updating}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Delete Order</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete order <strong>#{order.orderNumber}</strong>? This will permanently remove the order and all associated data.
                </p>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE here"
                    autoFocus
                  />
                  {deleteConfirmError && (
                    <p className="text-sm text-red-600">{deleteConfirmError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  disabled={updating || deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Deleting...' : 'Delete Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
