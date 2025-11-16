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
  Trash2,
  Download
} from 'lucide-react';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';
import { Store, Home } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

// Pre-render lucide icons into small SVG marker images (data URIs will be created later when window.google is available)
const PIN_PATH = 'M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z';
let STORE_MARKER_SVG = null;
let HOME_MARKER_SVG = null;
try {
  // render lucide icons to static markup
  const storeInner = ReactDOMServer.renderToStaticMarkup(<Store width="16" height="16" stroke="#ffffff" fill="none" />);
  const homeInner = ReactDOMServer.renderToStaticMarkup(<Home width="16" height="16" stroke="#ffffff" fill="none" />);

  STORE_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="${PIN_PATH}" fill="#dc2626" stroke="white" stroke-width="2"/> <g transform="translate(12,6)">${storeInner}</g></svg>`;
  HOME_MARKER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="${PIN_PATH}" fill="#16a34a" stroke="white" stroke-width="2"/> <g transform="translate(12,6)">${homeInner}</g></svg>`;
} catch (e) {
  // ignore — fallback to emoji-based SVGs already present in file
  console.warn('Could not pre-render lucide marker SVGs:', e);
}

export default function OrderDetails() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  // Helper function to format time duration
  const formatTimeDuration = (minutes) => {
    if (!minutes || minutes < 0) return '0 min';

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

    return parts.join(' ');
  };

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
      console.log('Order data received:', data);
      console.log('Order tracking data:', data.order?.tracking);
      console.log('Order status:', data.order?.status);
      console.log('getStatusValue result:', data.order?.status ? getStatusValue(data.order.status) : 'N/A');
      console.log('Delivery address coordinates:', data.order?.deliveryAddress?.coordinates);
      console.log('Delivery address full:', data.order?.deliveryAddress);
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
      case 'packing':
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
      case 'packing':
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
          className="bg-green-600 text-white px-4 py-2 rounded-none hover:bg-green-700 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 no-print">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-gray-100 rounded-none transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
            <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')} at {new Date(order.createdAt).toLocaleTimeString('en-IN')}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-none border ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="font-medium capitalize">{getStatusValue(order.status).replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
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
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-100 rounded-none">
                      <div className="w-16 h-16 bg-gray-100 rounded-none flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img
                            src={fullImageUrl}
                            alt={item.productId?.name || 'Product'}
                            className="w-full h-full object-cover rounded-none"
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
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
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
                    <div className={`w-8 h-8 rounded-none flex items-center justify-center ${index === 0 ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                      {getStatusIcon(status.status)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 capitalize">
                        {status.status.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(status.timestamp).toLocaleString('en-IN')}
                      </p>
                      {status.note && (
                        <p className="text-sm text-gray-500 mt-1">{status.note}</p>
                      )}
                    </div>
                  </div>
                )) || (
                    <p className="text-gray-500 text-center py-4">No timeline data available</p>
                  )}

                {/* Live Tracking Section */}
                {(() => {
                  const hasTracking = !!order?.tracking;
                  const status = order?.status;
                  const statusValue = status ? getStatusValue(status) : null;
                  const isOutForDelivery = statusValue === 'out_for_delivery';
                  const shouldShow = hasTracking && isOutForDelivery;

                  console.log('Tracking Debug:', {
                    orderId: order?.id,
                    hasTracking,
                    status,
                    statusValue,
                    isOutForDelivery,
                    shouldShow,
                    trackingData: order?.tracking
                  });

                  return true; // Temporarily force show for debugging
                })() && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2 mb-3">
                      <Truck className="w-4 h-4" />
                      Live Tracking
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-none">
                        <div className="w-6 h-6 bg-blue-100 rounded-none flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">Current Status</p>
                          <p className="text-xs text-blue-600 capitalize">
                            {order?.tracking?.status || 'Out for delivery'}
                          </p>
                        </div>
                      </div>

                      {order?.tracking?.estimatedDeliveryTime && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-none">
                          <div className="w-6 h-6 bg-green-100 rounded-none flex items-center justify-center">
                            <Clock className="w-3 h-3 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">Estimated Delivery</p>
                            <p className="text-xs text-green-600">
                              {new Date(order.tracking.estimatedDeliveryTime).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Map Section */}
                      <div className="border rounded-none overflow-hidden">
                        <GoogleMap
                          center={
                            order?.tracking?.agentLocation
                              ? {
                                  lat: order.tracking.agentLocation.latitude,
                                  lng: order.tracking.agentLocation.longitude
                                }
                              : order?.deliveryAddress?.coordinates
                              ? {
                                  lat: order.deliveryAddress.coordinates.latitude,
                                  lng: order.deliveryAddress.coordinates.longitude
                                }
                              : order?.merchantLandmark?.address?.coordinates
                              ? {
                                  lat: order.merchantLandmark.address.coordinates.latitude,
                                  lng: order.merchantLandmark.address.coordinates.longitude
                                }
                              : { lat: 12.9716, lng: 77.5946 } // Default to Bangalore
                          }
                          zoom={15}
                          style={{ height: '300px', width: '100%' }}
                        >
                          {/* Store Location Marker */}
                          {order?.merchantLandmark?.address?.coordinates && (
                            <Marker
                              position={{
                                lat: order.merchantLandmark.address.coordinates.latitude,
                                lng: order.merchantLandmark.address.coordinates.longitude
                              }}
                              title="Store Location"
                              icon={{
                                url: STORE_MARKER_SVG ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(STORE_MARKER_SVG) : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z" fill="#dc2626" stroke="white" stroke-width="2"/>
                                    <circle cx="20" cy="12" r="4" fill="white"/>
                                    <text x="20" y="16" text-anchor="middle" fill="#dc2626" font-size="12" font-weight="bold">🏪</text>
                                  </svg>
                                `),
                                scaledSize: window.google && window.google.maps ? new window.google.maps.Size(40, 40) : undefined,
                                anchor: window.google && window.google.maps ? new window.google.maps.Point(20, 32) : undefined
                              }}
                              infoContent={`
                                <div style="max-width: 200px;">
                                  <strong>${order?.merchantLandmark?.name || 'Store Location'}</strong><br/>
                                  ${order?.merchantLandmark?.address?.street || ''}<br/>
                                  ${order?.merchantLandmark?.address?.city || ''}, ${order?.merchantLandmark?.address?.state || ''} - ${order?.merchantLandmark?.address?.zipCode || ''}
                                </div>
                              `}
                            />
                          )}

                          {/* Agent Location Marker */}
                          {order?.tracking?.agentLocation && (
                            <Marker
                              position={{
                                lat: order.tracking.agentLocation.latitude,
                                lng: order.tracking.agentLocation.longitude
                              }}
                              title="Delivery Agent"
                              icon={{
                                url: '/assets/bikerider.png',
                                scaledSize: window.google && window.google.maps ? new window.google.maps.Size(40, 40) : undefined,
                                anchor: window.google && window.google.maps ? new window.google.maps.Point(20, 40) : undefined
                              }}
                              infoContent={`
                                <div style="max-width: 200px;">
                                  <strong>Delivery Agent</strong><br/>
                                  Currently at this location<br/>
                                  ${order?.tracking?.agentLocation?.lastUpdated ? `Last updated: ${new Date(order.tracking.agentLocation.lastUpdated).toLocaleString('en-IN')}` : ''}
                                </div>
                              `}
                            />
                          )}

                          {/* Delivery Location Marker */}
                          {order?.deliveryAddress && (
                            <Marker
                              position={
                                order?.deliveryAddress?.coordinates
                                  ? {
                                      lat: order.deliveryAddress.coordinates.latitude,
                                      lng: order.deliveryAddress.coordinates.longitude
                                    }
                                  : // If no coordinates, use store location as fallback (this would need geocoding in real implementation)
                                  order?.merchantLandmark?.address?.coordinates
                                  ? {
                                      lat: order.merchantLandmark.address.coordinates.latitude,
                                      lng: order.merchantLandmark.address.coordinates.longitude
                                    }
                                  : { lat: 12.9716, lng: 77.5946 } // Default fallback
                              }
                              title="Delivery Location"
                              icon={{
                                url: HOME_MARKER_SVG ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(HOME_MARKER_SVG) : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z" fill="#16a34a" stroke="white" stroke-width="2"/>
                                    <circle cx="20" cy="12" r="4" fill="white"/>
                                    <text x="20" y="16" text-anchor="middle" fill="#16a34a" font-size="12" font-weight="bold">🏠</text>
                                  </svg>
                                `),
                                scaledSize: window.google && window.google.maps ? new window.google.maps.Size(40, 40) : undefined,
                                anchor: window.google && window.google.maps ? new window.google.maps.Point(20, 32) : undefined
                              }}
                              infoContent={`
                                <div style="max-width: 200px;">
                                  <strong>Delivery Address</strong><br/>
                                  ${order?.deliveryAddress?.street || ''}<br/>
                                  ${order?.deliveryAddress?.city || ''}, ${order?.deliveryAddress?.state || ''} - ${order?.deliveryAddress?.zipCode || ''}
                                  ${order?.deliveryAddress?.coordinates ? `<br/>📍 ${order.deliveryAddress.coordinates.latitude.toFixed(4)}, ${order.deliveryAddress.coordinates.longitude.toFixed(4)}` : ''}
                                </div>
                              `}
                            />
                          )}
                        </GoogleMap>
                      </div>

                      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Store Location</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Delivery Agent</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>Delivery Address</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-none flex items-center justify-center">
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
                    {order.deliveryAddress?.state} - {order.deliveryAddress?.zipCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Merchant/Store Information */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Merchant Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-none flex items-center justify-center">
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
                <div className="p-3 bg-orange-50 rounded-none">
                  <p className="text-sm font-medium text-orange-800 mb-2">Business Info</p>
                  <div className="space-y-1 text-sm text-orange-700">
                    <p>Display Name: {order.store.businessInfo.displayName || 'N/A'}</p>
                    {order.store.businessInfo.website && <p>Website: {order.store.businessInfo.website}</p>}
                  </div>
                </div>
              )}

              {order.store?.operationalInfo && (
                <div className="p-3 bg-blue-50 rounded-none">
                  <p className="text-sm font-medium text-blue-800 mb-2">Operational Info</p>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>Hours: {order.store.operationalInfo.openingTime || 'N/A'} - {order.store.operationalInfo.closingTime || 'N/A'}</p>
                    <p>Store Type: {order.store.operationalInfo.storeType || 'N/A'}</p>
                  </div>
                </div>
              )}

              {order.store?.ownerInfo && (
                <div className="p-3 bg-green-50 rounded-none">
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
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-none">
                  <div className="flex items-center gap-2 mb-1">
                    <Timer className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Estimated Time</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {order.deliveryInfo?.estimatedTime || 'N/A'} min
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-none">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    {order.deliveryInfo?.distance || 'N/A'} km
                  </p>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Priority</span>
                </div>
                <p className="text-sm text-purple-700 capitalize">
                  {order.deliveryInfo?.priority || 'normal'}
                </p>
              </div>

              {order.deliveryInfo?.deliveryInstructions && (
                <div className="p-3 bg-yellow-50 rounded-none">
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
                <div className="p-3 bg-indigo-50 rounded-none">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-800">Delivery Slot</span>
                  </div>
                  <p className="text-sm text-indigo-700">
                    {order.deliveryInfo.deliverySlot.startTime ? new Date(order.deliveryInfo.deliverySlot.startTime).toLocaleTimeString('en-IN') : 'N/A'} -
                    {order.deliveryInfo.deliverySlot.endTime ? new Date(order.deliveryInfo.deliverySlot.endTime).toLocaleTimeString('en-IN') : 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Details */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Assignment Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {order.assignment?.deliveryAgent ? (
                <div className="p-3 bg-green-50 rounded-none">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Delivery Agent Assigned</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Agent ID: {order.assignment.deliveryAgent}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 rounded-none">
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
                  <div className="p-3 bg-blue-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Assigned At</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {new Date(order.assignment.assignedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {order.assignment?.acceptedAt && (
                  <div className="p-3 bg-green-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <CircleCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Accepted At</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {new Date(order.assignment.acceptedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {order.assignment?.pickedUpAt && (
                  <div className="p-3 bg-purple-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Picked Up At</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      {new Date(order.assignment.pickedUpAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {order.assignment?.deliveredAt && (
                  <div className="p-3 bg-green-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <CircleCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Delivered At</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {new Date(order.assignment.deliveredAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {order.assignment?.estimatedDeliveryTime && (
                  <div className="p-3 bg-indigo-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-800">Est. Delivery</span>
                    </div>
                    <p className="text-sm text-indigo-700">
                      {new Date(order.assignment.estimatedDeliveryTime).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {order.assignment?.actualDeliveryTime && (
                  <div className="p-3 bg-teal-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <Timer className="w-4 h-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-800">Actual Delivery</span>
                    </div>
                    <p className="text-sm text-teal-700">
                      {new Date(order.assignment.actualDeliveryTime).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              {order.assignment?.rejectedBy && order.assignment.rejectedBy.length > 0 && (
                <div className="p-3 bg-red-50 rounded-none">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Rejected By Agents</span>
                  </div>
                  <div className="space-y-1">
                    {order.assignment.rejectedBy.map((rejection, index) => (
                      <p key={index} className="text-sm text-red-700">
                        Agent {rejection.agentId} - {new Date(rejection.rejectedAt).toLocaleString('en-IN')}
                        {rejection.reason && ` (${rejection.reason})`}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Total</span>
                <span className="font-medium">₹{(order.pricing?.itemsTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">₹{(order.pricing?.deliveryFee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes</span>
                <span className="font-medium">₹{(order.pricing?.taxes || 0).toFixed(2)}</span>
              </div>
              {order.pricing?.tip > 0 && (
                <div className="flex justify-between text-blue-600">
                  <span>Tip</span>
                  <span>₹{(order.pricing?.tip || 0).toFixed(2)}</span>
                </div>
              )}
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{(order.pricing?.discount || 0).toFixed(2)}</span>
                </div>
              )}
              {order.pricing?.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-₹{(order.pricing?.couponDiscount || 0).toFixed(2)}</span>
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
                <span>₹{(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}</span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3 bg-gray-50 rounded-none">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Payment Method</span>
                  </div>
                  <p className="font-medium text-gray-800 capitalize mt-1">
                    {order.payment?.method || order.paymentMethod || 'Not specified'}
                  </p>
                  <p className={`text-sm mt-1 ${(order.payment?.status || order.paymentStatus) === 'paid' ? 'text-green-600' :
                      (order.payment?.status || order.paymentStatus) === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    Status: {order.payment?.status || order.paymentStatus || 'Unknown'}
                  </p>
                </div>

                {order.payment?.transactionId && (
                  <div className="p-3 bg-blue-50 rounded-none">
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
                  <div className="p-3 bg-green-50 rounded-none">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Paid At</span>
                    </div>
                    <p className="font-medium text-green-800 mt-1">
                      {new Date(order.payment.paidAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {order.payment?.gatewayResponse && (
                  <div className="p-3 bg-purple-50 rounded-none">
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
            <div className="bg-white rounded-none shadow-sm border border-gray-200">
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
                  <div className="p-3 bg-blue-50 rounded-none">
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
            <div className="bg-white rounded-none shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Agent Earnings
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Base Delivery Fee</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900">
                      ₹{order.earnings.deliveryFee || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-none">
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
                  <div className="p-3 bg-purple-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Distance Bonus</span>
                    </div>
                    <p className="text-lg font-semibold text-purple-900">
                      ₹{order.earnings.distanceBonus || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-none">
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

                <div className="p-3 bg-gray-50 rounded-none">
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
            <div className="bg-white rounded-none shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <LocationIcon className="w-5 h-5" />
                  Tracking Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {order.tracking.agentLocation && (
                  <div className="p-3 bg-blue-50 rounded-none">
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
                        Last updated: {new Date(order.tracking.agentLocation.lastUpdated).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                )}

                {order.tracking.estimatedArrival && (
                  <div className="p-3 bg-green-50 rounded-none">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Estimated Arrival</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {new Date(order.tracking.estimatedArrival).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                {order.tracking.deliveryOTP && (
                  <div className="p-3 bg-purple-50 rounded-none">
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
            <div className="bg-white rounded-none shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Cancellation Details
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-red-50 rounded-none">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Cancellation Reason</span>
                  </div>
                  <p className="text-sm text-red-700">
                    {order.cancellation.reason || 'No reason provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Cancelled By</span>
                    </div>
                    <p className="text-sm text-gray-700 capitalize">
                      {order.cancellation.cancelledBy || 'Unknown'}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Cancelled At</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {order.cancellation.cancelledAt ? new Date(order.cancellation.cancelledAt).toLocaleString('en-IN') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-yellow-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Refund Amount</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-900">
                      ₹{order.cancellation.refundAmount || 0}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Refund Status</span>
                    </div>
                    <p className={`text-sm font-medium ${order.cancellation.refundStatus === 'processed' ? 'text-green-600' :
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
            <div className="bg-white rounded-none shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Special Requests ({order.specialRequests.filter(req => req.isActive).length})
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {order.specialRequests.filter(req => req.isActive).map((request, index) => (
                    <div key={index} className="p-3 bg-indigo-50 rounded-none">
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
            <div className="bg-white rounded-none shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Customer Feedback
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {order.feedback.deliveryRating && (
                    <div className="p-3 bg-blue-50 rounded-none">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Delivery Rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < order.feedback.deliveryRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                    <div className="p-3 bg-green-50 rounded-none">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Food Rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < order.feedback.foodRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                  <div className="p-3 bg-blue-50 rounded-none">
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
                  <div className="p-3 bg-green-50 rounded-none">
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
                  <div className="p-3 bg-gray-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Feedback Submitted</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {new Date(order.feedback.submittedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Metrics */}
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Order Metrics
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50 rounded-none">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-800">Order Age</span>
                  </div>
                  <p className="text-lg font-semibold text-indigo-900">
                    {formatTimeDuration(order.orderAge)}
                  </p>
                  <p className="text-xs text-indigo-600">
                    Time since order was placed
                  </p>
                </div>

                {order.actualDeliveryDuration && (
                  <div className="p-3 bg-teal-50 rounded-none">
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
          <div className="bg-white rounded-none shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              {getStatusValue(order.status) === 'pending' && (
                <button
                  onClick={() => updateOrderStatus('confirmed')}
                  disabled={updating}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Confirm Order
                </button>
              )}

              {getStatusValue(order.status) === 'confirmed' && (
                <button
                  onClick={() => updateOrderStatus('packing')}
                  disabled={updating}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-none hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  Start Packing
                </button>
              )}

              {getStatusValue(order.status) === 'packing' && (
                <button
                  onClick={() => updateOrderStatus('out_for_delivery')}
                  disabled={updating}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-none hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Out for Delivery
                </button>
              )}

              {getStatusValue(order.status) === 'out_for_delivery' && (
                <button
                  onClick={() => updateOrderStatus('delivered')}
                  disabled={updating}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-none hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Mark as Delivered
                </button>
              )}

              {!['delivered', 'cancelled'].includes(getStatusValue(order.status)) && (
                <button
                  onClick={() => updateOrderStatus('cancelled')}
                  disabled={updating}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}

              <button
                onClick={() => {
                  console.log('Print button clicked');
                  const invoice = document.getElementById('print-invoice');
                  console.log('Invoice element found:', invoice);

                  if (invoice) {
                    // Create a new window with just the invoice content
                    const printWindow = window.open('', '_blank', 'width=800,height=600');
                    if (printWindow) {
                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Order Invoice - ${order?.orderNumber || 'N/A'}</title>
                          <style>
                            body {
                              font-family: 'Courier New', monospace;
                              margin: 0;
                              padding: 20px;
                              background: white;
                              color: black;
                            }
                            .invoice-content {
                              max-width: 800px;
                              margin: 0 auto;
                            }
                            table {
                              width: 100%;
                              border-collapse: collapse;
                              margin: 20px 0;
                            }
                            th, td {
                              border: 1px solid #666;
                              padding: 8px;
                              text-align: left;
                            }
                            th {
                              background: #f0f0f0;
                            }
                            .text-right { text-align: right; }
                            .text-center { text-align: center; }
                            .font-medium { font-weight: bold; }
                            .border-t { border-top: 2px solid #666; padding-top: 10px; margin-top: 10px; }
                            .mb-6 { margin-bottom: 24px; }
                            .mt-8 { margin-top: 32px; }
                            .text-center { text-align: center; }
                          </style>
                        </head>
                        <body>
                          <div class="invoice-content">
                            ${invoice.innerHTML}
                          </div>
                        </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                      // Close the window after printing
                      setTimeout(() => {
                        printWindow.close();
                      }, 1000);
                    } else {
                      alert('Please allow popups for this site to print invoices.');
                    }
                  } else {
                    console.error('Invoice element not found');
                    alert('Invoice content not found. Please try again.');
                  }
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-none hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Print Order
              </button>

              <button
                onClick={() => {
                  console.log('Download PDF button clicked');

                  // Create HTML content for PDF with actual data
                  const invoiceHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>Order Invoice - ${order?.orderNumber || 'N/A'}</title>
                      <style>
                        body {
                          font-family: 'Courier New', monospace;
                          margin: 0;
                          padding: 20px;
                          background: white;
                          color: black;
                        }
                        .invoice-content {
                          max-width: 800px;
                          margin: 0 auto;
                        }
                        table {
                          width: 100%;
                          border-collapse: collapse;
                          margin: 20px 0;
                        }
                        th, td {
                          border: 1px solid #666;
                          padding: 8px;
                          text-align: left;
                        }
                        th {
                          background: #f0f0f0;
                        }
                        .text-right { text-align: right; }
                        .text-center { text-align: center; }
                        .font-medium { font-weight: bold; }
                        .border-t { border-top: 2px solid #666; padding-top: 10px; margin-top: 10px; }
                        .mb-6 { margin-bottom: 24px; }
                        .mt-8 { margin-top: 32px; }
                        .border-b-2 { border-bottom: 2px solid #1f2937; padding-bottom: 24px; margin-bottom: 24px; }
                        .flex { display: flex; }
                        .justify-between { justify-content: space-between; }
                        .items-center { align-items: center; }
                        .flex-shrink-0 { flex-shrink: 0; }
                        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
                        .font-bold { font-weight: bold; }
                        .text-gray-800 { color: #1f2937; }
                        .text-base { font-size: 1rem; line-height: 1.5rem; }
                        .text-gray-600 { color: #4b5563; }
                        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                        .text-gray-500 { color: #6b7280; }
                        .grid { display: grid; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .gap-6 { gap: 1.5rem; }
                        .mb-2 { margin-bottom: 0.5rem; }
                        .space-y-1 > * + * { margin-top: 0.25rem; }
                        .font-medium { font-weight: 500; }
                        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
                        .font-semibold { font-weight: 600; }
                      </style>
                    </head>
                    <body>
                      <div class="invoice-content">
                        <!-- Header -->
                        <div class="border-b-2">
                          <div class="flex justify-between items-center">
                            <div class="flex items-center flex-shrink-0">
                              <svg width="94" height="19" viewBox="0 0 94 19" fill="none" xmlns="http://www.w3.org/2000/svg" style="height: 50px; width: auto;">
                                <path d="M34.045 10.2002C34.9949 9.78811 35.7289 9.1873 36.2458 8.39777C36.7628 7.60823 37.0217 6.66142 37.0217 5.55732C37.0217 4.45323 36.7628 3.52424 36.2458 2.72737C35.7289 1.93049 34.9949 1.32025 34.045 0.893504C33.095 0.467804 31.9626 0.253906 30.6498 0.253906H24.2988V14.9259H27.715V10.8178H30.6498C30.7001 10.8178 30.7484 10.8157 30.7987 10.8146L33.6476 14.9259H37.2944L34.025 10.2075C34.0313 10.2044 34.0387 10.2023 34.046 10.1991L34.045 10.2002ZM32.8087 7.44361C32.2771 7.89133 31.4949 8.11467 30.4611 8.11467H27.715V3.022H30.4611C31.4949 3.022 32.2771 3.24219 32.8087 3.68257C33.3393 4.12295 33.6056 4.74787 33.6056 5.55837C33.6056 6.36888 33.3403 6.99799 32.8087 7.44466V7.44361Z" fill="#189C15"/>
                                <path d="M54.2456 4.54848C53.8472 3.62578 53.2852 2.82262 52.5586 2.13793C51.8319 1.45325 50.9826 0.925843 50.0117 0.555716C49.0407 0.185588 47.9754 0 46.8157 0C45.6561 0 44.5907 0.188733 43.6188 0.566201C42.6478 0.943668 41.7985 1.47422 41.0719 2.1589C40.3452 2.84359 39.7832 3.64361 39.3848 4.55897C38.9863 5.47433 38.7871 6.48405 38.7871 7.5871C38.7871 8.69014 38.9863 9.68309 39.3848 10.6047C39.7832 11.5264 40.3452 12.3306 41.0719 13.0153C41.7985 13.7 42.651 14.2305 43.6292 14.608C44.6075 14.9855 45.676 15.1742 46.8357 15.1742C47.9953 15.1742 49.0397 14.9886 50.0106 14.6185C50.9816 14.2483 51.8309 13.7209 52.5575 13.0363C53.2841 12.3516 53.8462 11.5453 54.2446 10.6152C54.643 9.68624 54.8423 8.67651 54.8423 7.5871C54.8423 6.49768 54.643 5.47013 54.2446 4.54848H54.2456ZM51.0592 9.48387C50.8285 10.0501 50.5034 10.546 50.084 10.9717C49.6646 11.3985 49.1791 11.7267 48.6276 11.9573C48.075 12.188 47.4711 12.3033 46.8147 12.3033C46.1583 12.3033 45.5502 12.188 44.9913 11.9573C44.4324 11.7267 43.9469 11.3985 43.5349 10.9717C43.1228 10.546 42.8009 10.0501 42.5702 9.48387C42.3395 8.91767 42.2242 8.28646 42.2242 7.5871C42.2242 6.88773 42.3395 6.25652 42.5702 5.69032C42.8009 5.12412 43.1217 4.62817 43.5349 4.20247C43.9469 3.77677 44.4324 3.44754 44.9913 3.21686C45.5502 2.98619 46.1583 2.87085 46.8147 2.87085C47.4711 2.87085 48.075 2.98619 48.6276 3.21686C49.1791 3.44754 49.6646 3.77572 50.084 4.20247C50.5034 4.62922 50.8285 5.12517 51.0592 5.69032C51.2898 6.25652 51.4052 6.88878 51.4052 7.5871C51.4052 8.28541 51.2898 8.91767 51.0592 9.48387Z" fill="#189C15"/>
                                <path d="M58.6781 0.123047L58.1538 2.84815H63.2885L61.8845 9.97495C61.7303 10.7582 61.4514 11.3307 61.0456 11.6935C60.6399 12.0573 60.1093 12.2387 59.4529 12.2387C58.8941 12.2387 58.3981 12.1097 57.9651 11.8508C57.532 11.5928 57.1682 11.2112 56.8756 10.7089L54.6328 12.8468C55.0942 13.5598 55.7264 14.104 56.5296 14.4815C57.3328 14.859 58.287 15.0477 59.3911 15.0477C60.4952 15.0477 61.3959 14.8768 62.1791 14.5339C62.9613 14.1921 63.6114 13.6395 64.1283 12.8783C64.6453 12.1171 65.0227 11.0864 65.2597 9.78726L67.188 0.125144H58.6781V0.123047Z" fill="#189C15"/>
                                <path d="M81.8814 0.310526L80.4008 2.98425L80.3945 3.02095H85.0689L82.6992 14.9269H86.1164L88.484 3.02095H93.1583L93.7235 0.253906L81.8814 0.310526Z" fill="#189C15"/>
                                <path d="M78.292 2.98006L79.8669 0.253906H69.4602L66.5254 14.9269H75.2932L76.866 12.2018H70.4448L71.1243 8.80669H76.8188L78.355 6.14554H71.6569L72.2892 2.98006H78.292Z" fill="#189C15"/>
                                <path d="M4.84962 8.04521H7.2927C7.2927 7.70759 7.31892 7.37521 7.37029 7.04492H4.15234L4.84857 8.04521H4.84962Z" fill="#189C15"/>
                                <path d="M2.7763 5.0667H7.55028C7.64046 4.72593 7.74636 4.3925 7.86589 4.06641H2.08008L2.7763 5.0667Z" fill="#189C15"/>
                                <path d="M9.11386 1.08594H0L0.696227 2.08518H8.5854C8.74792 1.73602 8.92512 1.40154 9.11491 1.08594H9.11386Z" fill="#189C15"/>
                                <path d="M11.7837 15.9332C11.5887 15.7769 11.3507 15.6752 11.0896 15.648C11.0424 15.6427 10.9942 15.6406 10.9459 15.6406C10.2025 15.6406 9.59961 16.2435 9.59961 16.9869C9.59961 17.7303 10.2025 18.3332 10.9459 18.3332C11.6893 18.3332 12.2922 17.7303 12.2922 16.9869C12.2922 16.5602 12.0941 16.1806 11.7837 15.9342V15.9332Z" fill="#189C15"/>
                                <path d="M19.8092 18.3332C20.5528 18.3332 21.1555 17.7305 21.1555 16.9869C21.1555 16.2434 20.5528 15.6406 19.8092 15.6406C19.0657 15.6406 18.4629 16.2434 18.4629 16.9869C18.4629 17.7305 19.0657 18.3332 19.8092 18.3332Z" fill="#189C15"/>
                                <path d="M13.0483 4.16997C13.4719 3.75266 13.9762 3.42971 14.5602 3.20009C15.1443 2.97046 15.7828 2.85617 16.478 2.85617C17.2288 2.85617 17.9166 2.99143 18.5426 3.263C19.1675 3.53352 19.7515 3.95502 20.2936 4.52437L22.441 2.52274C21.7322 1.7028 20.8598 1.07683 19.8249 0.645888C18.789 0.214946 17.6251 0 16.3323 0C15.1642 0 14.0947 0.184539 13.1217 0.55257C12.1486 0.920601 11.3003 1.44591 10.5779 2.1264C9.85547 2.80794 9.29555 3.60691 8.89921 4.52437C8.50286 5.44182 8.30469 6.44945 8.30469 7.54725C8.30469 8.64506 8.50286 9.65268 8.89921 10.5701C9.29555 11.4876 9.84813 12.2866 10.5569 12.9681C11.2657 13.6496 12.1067 14.1739 13.0797 14.5419C14.0528 14.91 15.116 15.0945 16.2694 15.0945C17.3116 15.0945 18.3538 14.9383 19.3971 14.6258C20.4394 14.3134 21.3642 13.851 22.1705 13.2397V7.31868H22.0961V7.22955H17.1669V9.93159H19.0847V11.6071C18.8613 11.7256 18.6348 11.8252 18.4073 11.9049C17.775 12.1272 17.125 12.2383 16.4581 12.2383C15.7912 12.2383 15.1275 12.1209 14.5508 11.8839C13.9741 11.648 13.474 11.3209 13.0493 10.9046C12.6257 10.4873 12.2986 9.99031 12.0689 9.41362C11.8393 8.83693 11.725 8.21516 11.725 7.54725C11.725 6.87935 11.8393 6.21983 12.0689 5.65048C12.2986 5.08113 12.6246 4.58728 13.0493 4.16997H13.0483Z" fill="#189C15"/>
                              </svg>
                            </div>
                            <div class="text-right flex-shrink-0">
                              <h2 class="text-3xl font-bold text-gray-800">INVOICE</h2>
                              <p class="text-base text-gray-600">Order #${order?.orderNumber || 'N/A'}</p>
                              <p class="text-sm text-gray-500">Date: ${order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''}</p>
                            </div>
                          </div>
                        </div>

                        <!-- Customer & Delivery Details -->
                        <div class="grid grid-cols-2 gap-6 mb-6">
                          <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
                            <div class="text-sm space-y-1">
                              <p class="font-medium">${order?.customer?.name || 'N/A'}</p>
                              <p>${order?.customer?.phone || 'N/A'}</p>
                              <p>${order?.customer?.email || 'N/A'}</p>
                            </div>
                          </div>
                          <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Ship To:</h3>
                            <div class="text-sm space-y-1">
                              <p class="font-medium">${order?.deliveryAddress?.name || order?.customer?.name || 'N/A'}</p>
                              <p>${order?.deliveryAddress?.phone || order?.customer?.phone || 'N/A'}</p>
                              <p>${order?.deliveryAddress?.street || 'N/A'}</p>
                              <p>${order?.deliveryAddress?.city || 'N/A'}, ${order?.deliveryAddress?.state || 'N/A'} ${order?.deliveryAddress?.zipCode || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <!-- Merchant/Store Details -->
                        <div class="mb-6">
                          <h3 class="text-lg font-semibold text-gray-800 mb-2">Sold By:</h3>
                          <div class="text-sm space-y-1">
                            <p class="font-medium">${order?.merchantLandmark?.name || 'N/A'}</p>
                            <p>${order?.merchantLandmark?.address?.street || 'N/A'}</p>
                            <p>${order?.merchantLandmark?.address?.city || 'N/A'}, ${order?.merchantLandmark?.address?.state || 'N/A'} ${order?.merchantLandmark?.address?.zipCode || 'N/A'}</p>
                            <p>Phone: ${order?.merchantLandmark?.phone || 'N/A'}</p>
                          </div>
                        </div>

                        <!-- Order Items -->
                        <div class="mb-6">
                          <h3 class="text-lg font-semibold text-gray-800 mb-4">Order Items</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th class="text-right">Qty</th>
                                <th class="text-right">Price</th>
                                <th class="text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${(order?.items || []).map(item => `
                                <tr>
                                  <td>${item?.name || 'N/A'}</td>
                                  <td class="text-right">${item?.quantity || 0}</td>
                                  <td class="text-right">₹${(item?.price || 0).toFixed(2)}</td>
                                  <td class="text-right">₹${((item?.quantity || 0) * (item?.price || 0)).toFixed(2)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>

                        <!-- Order Summary -->
                        <div class="border-t">
                          <div class="flex justify-between items-center mb-2">
                            <span class="font-medium">Subtotal:</span>
                            <span>₹${(order?.pricing?.itemsTotal || 0).toFixed(2)}</span>
                          </div>
                          <div class="flex justify-between items-center mb-2">
                            <span class="font-medium">Delivery Fee:</span>
                            <span>₹${(order?.pricing?.deliveryFee || 0).toFixed(2)}</span>
                          </div>
                          <div class="flex justify-between items-center mb-2">
                            <span class="font-medium">Tax:</span>
                            <span>₹${(order?.pricing?.taxes || 0).toFixed(2)}</span>
                          </div>
                          <div class="flex justify-between items-center text-lg font-bold">
                            <span>Total:</span>
                            <span>₹${(order?.pricing?.totalAmount || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        <!-- Payment Method -->
                        <div class="mt-8" style="page-break-inside: avoid;">
                          <div>
                            <h4 class="font-semibold text-gray-800 mb-2">Payment Method</h4>
                            <p class="text-sm break-words">${order?.paymentMethod || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;

                  const opt = {
                    margin: [1, 1, 1, 1], // maximum margins for extensive spacing - top, right, bottom, left in inches
                    filename: `invoice-${order?.orderNumber || 'order'}.pdf`,
                    image: { type: 'jpeg', quality: 1.0 },
                    html2canvas: {
                      scale: 4, // Increased scale for high quality
                      useCORS: true,
                      allowTaint: true,
                      dpi: 300, // High DPI for crisp quality
                      letterRendering: true,
                      width: 794, // A4 width in pixels at 96 DPI (8.27 inches * 96)
                      height: 1123, // A4 height in pixels at 96 DPI (11.69 inches * 96)
                      scrollX: 0,
                      scrollY: 0,
                      windowWidth: 794,
                      windowHeight: 1123
                    },
                    jsPDF: {
                      unit: 'mm',
                      format: 'a4',
                      orientation: 'portrait',
                      compress: true,
                      putOnlyUsedFonts: true
                    }
                  };

                  html2pdf().set(opt).from(invoiceHTML).save();
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-none hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Invoice
              </button>

              <button
                onClick={deleteOrder}
                disabled={updating}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 min-h-screen">
          <div className="bg-white rounded-none shadow-xl max-w-md w-full mx-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
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
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-none hover:bg-gray-300 transition-colors"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteOrder}
                  disabled={updating || deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Deleting...' : 'Delete Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Invoice Layout - Hidden on screen, shown when printing */}
      <div id="print-invoice" className="print-invoice" style={{ display: 'none' }}>
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center flex-shrink-0">
              <svg width="94" height="19" viewBox="0 0 94 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{height: '50px', width: 'auto'}}>
                <path d="M34.045 10.2002C34.9949 9.78811 35.7289 9.1873 36.2458 8.39777C36.7628 7.60823 37.0217 6.66142 37.0217 5.55732C37.0217 4.45323 36.7628 3.52424 36.2458 2.72737C35.7289 1.93049 34.9949 1.32025 34.045 0.893504C33.095 0.467804 31.9626 0.253906 30.6498 0.253906H24.2988V14.9259H27.715V10.8178H30.6498C30.7001 10.8178 30.7484 10.8157 30.7987 10.8146L33.6476 14.9259H37.2944L34.025 10.2075C34.0313 10.2044 34.0387 10.2023 34.046 10.1991L34.045 10.2002ZM32.8087 7.44361C32.2771 7.89133 31.4949 8.11467 30.4611 8.11467H27.715V3.022H30.4611C31.4949 3.022 32.2771 3.24219 32.8087 3.68257C33.3393 4.12295 33.6056 4.74787 33.6056 5.55837C33.6056 6.36888 33.3403 6.99799 32.8087 7.44466V7.44361Z" fill="#189C15"/>
                <path d="M54.2456 4.54848C53.8472 3.62578 53.2852 2.82262 52.5586 2.13793C51.8319 1.45325 50.9826 0.925843 50.0117 0.555716C49.0407 0.185588 47.9754 0 46.8157 0C45.6561 0 44.5907 0.188733 43.6188 0.566201C42.6478 0.943668 41.7985 1.47422 41.0719 2.1589C40.3452 2.84359 39.7832 3.64361 39.3848 4.55897C38.9863 5.47433 38.7871 6.48405 38.7871 7.5871C38.7871 8.69014 38.9863 9.68309 39.3848 10.6047C39.7832 11.5264 40.3452 12.3306 41.0719 13.0153C41.7985 13.7 42.651 14.2305 43.6292 14.608C44.6075 14.9855 45.676 15.1742 46.8357 15.1742C47.9953 15.1742 49.0397 14.9886 50.0106 14.6185C50.9816 14.2483 51.8309 13.7209 52.5575 13.0363C53.2841 12.3516 53.8462 11.5453 54.2446 10.6152C54.643 9.68624 54.8423 8.67651 54.8423 7.5871C54.8423 6.49768 54.643 5.47013 54.2446 4.54848H54.2456ZM51.0592 9.48387C50.8285 10.0501 50.5034 10.546 50.084 10.9717C49.6646 11.3985 49.1791 11.7267 48.6276 11.9573C48.075 12.188 47.4711 12.3033 46.8147 12.3033C46.1583 12.3033 45.5502 12.188 44.9913 11.9573C44.4324 11.7267 43.9469 11.3985 43.5349 10.9717C43.1228 10.546 42.8009 10.0501 42.5702 9.48387C42.3395 8.91767 42.2242 8.28646 42.2242 7.5871C42.2242 6.88773 42.3395 6.25652 42.5702 5.69032C42.8009 5.12412 43.1217 4.62817 43.5349 4.20247C43.9469 3.77677 44.4324 3.44754 44.9913 3.21686C45.5502 2.98619 46.1583 2.87085 46.8147 2.87085C47.4711 2.87085 48.075 2.98619 48.6276 3.21686C49.1791 3.44754 49.6646 3.77572 50.084 4.20247C50.5034 4.62922 50.8285 5.12517 51.0592 5.69032C51.2898 6.25652 51.4052 6.88878 51.4052 7.5871C51.4052 8.28541 51.2898 8.91767 51.0592 9.48387Z" fill="#189C15"/>
                <path d="M58.6781 0.123047L58.1538 2.84815H63.2885L61.8845 9.97495C61.7303 10.7582 61.4514 11.3307 61.0456 11.6935C60.6399 12.0573 60.1093 12.2387 59.4529 12.2387C58.8941 12.2387 58.3981 12.1097 57.9651 11.8508C57.532 11.5928 57.1682 11.2112 56.8756 10.7089L54.6328 12.8468C55.0942 13.5598 55.7264 14.104 56.5296 14.4815C57.3328 14.859 58.287 15.0477 59.3911 15.0477C60.4952 15.0477 61.3959 14.8768 62.1791 14.5339C62.9613 14.1921 63.6114 13.6395 64.1283 12.8783C64.6453 12.1171 65.0227 11.0864 65.2597 9.78726L67.188 0.125144H58.6781V0.123047Z" fill="#189C15"/>
                <path d="M81.8814 0.310526L80.4008 2.98425L80.3945 3.02095H85.0689L82.6992 14.9269H86.1164L88.484 3.02095H93.1583L93.7235 0.253906L81.8814 0.310526Z" fill="#189C15"/>
                <path d="M78.292 2.98006L79.8669 0.253906H69.4602L66.5254 14.9269H75.2932L76.866 12.2018H70.4448L71.1243 8.80669H76.8188L78.355 6.14554H71.6569L72.2892 2.98006H78.292Z" fill="#189C15"/>
                <path d="M4.84962 8.04521H7.2927C7.2927 7.70759 7.31892 7.37521 7.37029 7.04492H4.15234L4.84857 8.04521H4.84962Z" fill="#189C15"/>
                <path d="M2.7763 5.0667H7.55028C7.64046 4.72593 7.74636 4.3925 7.86589 4.06641H2.08008L2.7763 5.0667Z" fill="#189C15"/>
                <path d="M9.11386 1.08594H0L0.696227 2.08518H8.5854C8.74792 1.73602 8.92512 1.40154 9.11491 1.08594H9.11386Z" fill="#189C15"/>
                <path d="M11.7837 15.9332C11.5887 15.7769 11.3507 15.6752 11.0896 15.648C11.0424 15.6427 10.9942 15.6406 10.9459 15.6406C10.2025 15.6406 9.59961 16.2435 9.59961 16.9869C9.59961 17.7303 10.2025 18.3332 10.9459 18.3332C11.6893 18.3332 12.2922 17.7303 12.2922 16.9869C12.2922 16.5602 12.0941 16.1806 11.7837 15.9342V15.9332Z" fill="#189C15"/>
                <path d="M19.8092 18.3332C20.5528 18.3332 21.1555 17.7305 21.1555 16.9869C21.1555 16.2434 20.5528 15.6406 19.8092 15.6406C19.0657 15.6406 18.4629 16.2434 18.4629 16.9869C18.4629 17.7305 19.0657 18.3332 19.8092 18.3332Z" fill="#189C15"/>
                <path d="M13.0483 4.16997C13.4719 3.75266 13.9762 3.42971 14.5602 3.20009C15.1443 2.97046 15.7828 2.85617 16.478 2.85617C17.2288 2.85617 17.9166 2.99143 18.5426 3.263C19.1675 3.53352 19.7515 3.95502 20.2936 4.52437L22.441 2.52274C21.7322 1.7028 20.8598 1.07683 19.8249 0.645888C18.789 0.214946 17.6251 0 16.3323 0C15.1642 0 14.0947 0.184539 13.1217 0.55257C12.1486 0.920601 11.3003 1.44591 10.5779 2.1264C9.85547 2.80794 9.29555 3.60691 8.89921 4.52437C8.50286 5.44182 8.30469 6.44945 8.30469 7.54725C8.30469 8.64506 8.50286 9.65268 8.89921 10.5701C9.29555 11.4876 9.84813 12.2866 10.5569 12.9681C11.2657 13.6496 12.1067 14.1739 13.0797 14.5419C14.0528 14.91 15.116 15.0945 16.2694 15.0945C17.3116 15.0945 18.3538 14.9383 19.3971 14.6258C20.4394 14.3134 21.3642 13.851 22.1705 13.2397V7.31868H22.0961V7.22955H17.1669V9.93159H19.0847V11.6071C18.8613 11.7256 18.6348 11.8252 18.4073 11.9049C17.775 12.1272 17.125 12.2383 16.4581 12.2383C15.7912 12.2383 15.1275 12.1209 14.5508 11.8839C13.9741 11.648 13.474 11.3209 13.0493 10.9046C12.6257 10.4873 12.2986 9.99031 12.0689 9.41362C11.8393 8.83693 11.725 8.21516 11.725 7.54725C11.725 6.87935 11.8393 6.21983 12.0689 5.65048C12.2986 5.08113 12.6246 4.58728 13.0493 4.16997H13.0483Z" fill="#189C15"/>
              </svg>
            </div>
            <div className="text-right flex-shrink-0">
              <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
              <p className="text-base text-gray-600">Order #{order?.orderNumber}</p>
              <p className="text-sm text-gray-500">Date: {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ''}</p>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order?.customer?.name || 'N/A'}</p>
              <p>{order?.customer?.phone || 'N/A'}</p>
              <p>{order?.customer?.email || 'N/A'}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivery Address:</h3>
            <div className="text-sm space-y-1">
              <p>{order?.deliveryAddress?.street || 'N/A'}</p>
              <p>{order?.deliveryAddress?.city || 'N/A'}, {order?.deliveryAddress?.state || 'N/A'}</p>
              <p>{order?.deliveryAddress?.zipCode || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Store Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Store Details:</h3>
          <div className="text-sm space-y-1">
            <p className="font-medium">{order?.merchantLandmark?.name || 'N/A'}</p>
            <p>{order?.merchantLandmark?.address?.street || 'N/A'}</p>
            <p>{order?.merchantLandmark?.address?.city || 'N/A'}, {order?.merchantLandmark?.address?.state || 'N/A'}</p>
            <p>Phone: {order?.merchantLandmark?.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Order Items</h3>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left text-sm font-semibold">Item</th>
                <th className="border border-gray-400 px-3 py-2 text-center text-sm font-semibold">Qty</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-semibold">Price</th>
                <th className="border border-gray-400 px-3 py-2 text-right text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order?.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="border border-gray-400 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{item.productId?.name || item.name || 'N/A'}</p>
                      {item.variant && <p className="text-xs text-gray-600">{item.variant}</p>}
                    </div>
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-sm">{item.quantity}</td>
                  <td className="border border-gray-400 px-3 py-2 text-right text-sm">₹{item.price?.toFixed(2) || '0.00'}</td>
                  <td className="border border-gray-400 px-3 py-2 text-right text-sm">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{order?.pricing?.itemsTotal?.toFixed(2) || '0.00'}</span>
              </div>
              {order?.pricing?.taxes > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>₹{order?.pricing?.taxes?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order?.pricing?.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery Charge:</span>
                  <span>₹{order?.pricing?.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order?.pricing?.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tip:</span>
                  <span>₹{order?.pricing?.tip?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order?.pricing?.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₹{order?.pricing?.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {order?.pricing?.couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon Discount:</span>
                  <span>-₹{order?.pricing?.couponDiscount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              <div className="border-t border-gray-400 pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{order?.pricing?.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Payment Details:</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Method:</span> {order?.payment?.method || 'N/A'}</p>
            <p><span className="font-medium">Status:</span> {order?.payment?.status || 'N/A'}</p>
            {order?.payment?.paidAt && (
              <p><span className="font-medium">Paid At:</span> {new Date(order.payment.paidAt).toLocaleString('en-IN')}</p>
            )}
          </div>
        </div>

        {/* Delivery Agent Info */}
        {order?.deliveryAgent && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delivery Agent:</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{order.deliveryAgent.name}</p>
              <p>Phone: {order.deliveryAgent.phone}</p>
              {order.deliveryAgent.rating && <p>Rating: {order.deliveryAgent.rating} ⭐</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-400 pt-4 mt-8 text-center text-xs text-gray-600">
          <p>Thank you for choosing Grojet!</p>
          <p>For any queries, contact us at support@grojetdelivery.com</p>
          <p className="mt-2">Generated on {new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-invoice {
            display: block !important;
            padding: 2rem !important;
            max-width: 800px !important;
            margin: 0 auto !important;
            background: white !important;
            color: black !important;
            font-family: 'Courier New', monospace !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
          }
          body {
            background: white !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
