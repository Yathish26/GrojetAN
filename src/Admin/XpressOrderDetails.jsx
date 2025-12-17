import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../Components/Layout';
import { GoogleMap, Marker, DirectionsRenderer } from '../Components/GoogleMapComponents';
import {
  ArrowLeft, MapPin, Phone, Package, Clock,
  User, Calendar, Truck, CheckCircle, XCircle,
  AlertCircle, Navigation, IndianRupee, RefreshCw, Trash2,X
} from 'lucide-react';
import toast from 'react-hot-toast';

const XpressOrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [agents, setAgents] = useState([]);
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [showAgentsList, setShowAgentsList] = useState(false);
  const [directions, setDirections] = useState(null);
  const [agentEarnings, setAgentEarnings] = useState('');
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const allowedRoles = ['super_admin', 'admin'];
  const navigate = useNavigate();
  const { id } = useParams();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatTime12Hour = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const checkUser = useCallback(async () => {
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
    } catch (error) {
      console.error('Error checking user:', error);
      navigate('/login');
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        // Calculate directions after order is loaded
        if (data.order.pickup?.coordinates && data.order.drop?.coordinates) {
          calculateDirections(data.order.pickup.coordinates, data.order.drop.coordinates);
        }
      } else {
        toast.error('Failed to fetch order details');
        navigate('/admin/xpress');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
      navigate('/admin/xpress');
    } finally {
      setLoading(false);
    }
  };

  const calculateDirections = (pickupCoords, dropCoords) => {
    if (!window.google || !window.google.maps) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: {
          lat: parseFloat(pickupCoords.latitude),
          lng: parseFloat(pickupCoords.longitude)
        },
        destination: {
          lat: parseFloat(dropCoords.latitude),
          lng: parseFloat(dropCoords.longitude)
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  };

  const updateOrderStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}/status`,
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
        setOrder(prev => ({ ...prev, status: newStatus }));
      } else {
        toast.error('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        toast.success('Order deleted successfully');
        navigate('/xpress');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents?online=true&applicationStatus=approved&isActive=true&limit=1000`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const refreshAssignmentStatus = async () => {
    if (!order?.assignment?.agent) return;

    setRefreshingStatus(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        toast.success('Assignment status updated');
      } else {
        toast.error('Failed to refresh assignment status');
      }
    } catch (error) {
      console.error('Error refreshing assignment status:', error);
      toast.error('Failed to refresh assignment status');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const assignAgent = async (agentId) => {
    if (!agentEarnings || agentEarnings.trim() === '') {
      toast.error('Please enter earnings amount for the delivery agent');
      return;
    }

    const earningsAmount = parseFloat(agentEarnings);
    if (isNaN(earningsAmount) || earningsAmount <= 0) {
      toast.error('Please enter a valid earnings amount');
      return;
    }

    try {
      setAssigningAgent(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}/assign-agent`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ 
            agentId,
            agentEarnings: earningsAmount
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setShowAgentsList(false);
        setAgentEarnings('');
        toast.success('Agent assigned successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to assign agent');
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    } finally {
      setAssigningAgent(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (currentUser && id) {
      fetchOrderDetails();
    }
  }, [currentUser, id]);

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
        return <AlertCircle size={20} />;
      case 'picked_up':
        return <Package size={20} />;
      case 'in_transit':
        return <Navigation size={20} />;
      case 'delivered':
        return <CheckCircle size={20} />;
      case 'cancelled':
        return <XCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const isAuthorized = allowedRoles.includes(currentUser?.role);

  if (checkingUser) {
    return (
      <Layout title="Xpress Order Details">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout title="Xpress Order Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <XCircle className='w-16 h-16 text-red-500 mb-2'/>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only Admins and Super Admins can view order details.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Xpress Order Details">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout title="Xpress Order Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className='w-16 h-16 text-red-500 mb-2'/>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600">The requested order could not be found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Xpress Order #${order.orderNumber}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/xpress')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Xpress Orders
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)} at {formatTime12Hour(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2 capitalize">{order.status.replace('_', ' ')}</span>
              </span>
              {['super_admin', 'admin'].includes(currentUser?.role) && (
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
              {currentUser?.role === 'super_admin' && (
                <button
                  onClick={deleteOrder}
                  disabled={updating}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Order
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{order.userId?.personalInfo?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{order.userId?.personalInfo?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            

            {/* Map Preview */}
            {order.pickup?.coordinates?.latitude && order.drop?.coordinates?.latitude &&
             !isNaN(parseFloat(order.pickup.coordinates.latitude)) && !isNaN(parseFloat(order.drop.coordinates.latitude)) &&
             parseFloat(order.pickup.coordinates.latitude) !== 0 && parseFloat(order.drop.coordinates.latitude) !== 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Navigation size={20} className="mr-2" />
                  Route Preview
                </h2>
                <div className="h-96 w-full rounded-lg overflow-hidden">
                  <GoogleMap
                    center={{
                      lat: (parseFloat(order.pickup.coordinates.latitude) + parseFloat(order.drop.coordinates.latitude)) / 2,
                      lng: (parseFloat(order.pickup.coordinates.longitude) + parseFloat(order.drop.coordinates.longitude)) / 2
                    }}
                    zoom={12}
                    style={{ height: '400px', width: '100%', border: 'none' }}
                  >
                    <Marker
                      position={{
                        lat: parseFloat(order.pickup.coordinates.latitude),
                        lng: parseFloat(order.pickup.coordinates.longitude)
                      }}
                      title="Pickup Location"
                      infoContent={`
                        <div style="max-width: 250px;">
                          <strong>Pickup Location</strong><br/>
                          ${order.pickup.name || 'N/A'}<br/>
                          ${order.pickup.address || 'N/A'}<br/>
                          ${order.pickup.phone ? `Phone: ${order.pickup.phone}` : ''}
                        </div>
                      `}
                      icon={window.google && window.google.maps ? {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="3"/>
                            <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">P</text>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(40, 40),
                        anchor: new window.google.maps.Point(20, 40)
                      } : null}
                    />
                    <Marker
                      position={{
                        lat: parseFloat(order.drop.coordinates.latitude),
                        lng: parseFloat(order.drop.coordinates.longitude)
                      }}
                      title="Drop Location"
                      infoContent={`
                        <div style="max-width: 250px;">
                          <strong>Drop Location</strong><br/>
                          ${order.drop.name || 'N/A'}<br/>
                          ${order.drop.address || 'N/A'}<br/>
                          ${order.drop.phone ? `Phone: ${order.drop.phone}` : ''}
                        </div>
                      `}
                      icon={window.google && window.google.maps ? {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#EF4444" stroke="white" stroke-width="3"/>
                            <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">D</text>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(40, 40),
                        anchor: new window.google.maps.Point(20, 40)
                      } : null}
                    />
                    {directions && <DirectionsRenderer directions={directions} />}
                  </GoogleMap>
                </div>
              </div>
            )}

            {/* Delivery Agent Assignment */}
            {['super_admin', 'admin'].includes(currentUser?.role) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User size={20} className="mr-2" />
                  Delivery Agent Assignment
                </h2>

                {order.assignment?.agent ? (
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 ${
                      order.assignment.status === 'accepted' ? 'bg-green-50 border-green-200' :
                      order.assignment.status === 'rejected' ? 'bg-red-50 border-red-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                            order.assignment.status === 'accepted' ? 'bg-green-100' :
                            order.assignment.status === 'rejected' ? 'bg-red-100' :
                            'bg-yellow-100'
                          }`}>
                            <User size={20} className={`${
                              order.assignment.status === 'accepted' ? 'text-green-600' :
                              order.assignment.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {order.assignment.agent.personalInfo.firstName} {order.assignment.agent.personalInfo.lastName || ''}
                            </h3>
                            <p className="text-sm text-gray-600">{order.assignment.agent.personalInfo.phone}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                order.assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                order.assignment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.assignment.status === 'accepted' ? 'Accepted' :
                                 order.assignment.status === 'rejected' ? 'Rejected' :
                                 'Pending Confirmation'}
                              </span>
                              <button
                                onClick={refreshAssignmentStatus}
                                disabled={refreshingStatus}
                                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                title="Refresh assignment status"
                              >
                                <RefreshCw size={14} className={refreshingStatus ? 'animate-spin' : ''} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={refreshAssignmentStatus}
                            disabled={refreshingStatus}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                          >
                            {refreshingStatus ? 'Refreshing...' : 'Refresh Status'}
                          </button>
                          <button
                            onClick={() => {
                              setOrder(prev => ({ ...prev, assignment: null }));
                            }}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            Reassign
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Assigned on {formatDate(order.assignment.assignedAt)} at {formatTime12Hour(order.assignment.assignedAt)} by {order.assignment.assignedBy?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!showAgentsList ? (
                      <div className="text-center py-8">
                        <User size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">Click to view available online delivery agents</p>
                        <button
                          onClick={() => {
                            setShowAgentsList(true);
                            fetchAgents();
                          }}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center mx-auto"
                        >
                          <User size={20} className="mr-2" />
                          Show Online Agents
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">Online Agents ({agents.length})</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={fetchAgents}
                              disabled={assigningAgent}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                            >
                              Refresh
                            </button>
                            <button
                              onClick={() => setShowAgentsList(false)}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              Hide
                            </button>
                          </div>
                        </div>

                        {/* Delivery Agent Earnings Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Agent Earnings (₹)
                          </label>
                          <input
                            type="number"
                            value={agentEarnings}
                            onChange={(e) => setAgentEarnings(e.target.value)}
                            placeholder="Enter earnings amount"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {agents.length === 0 ? (
                          <div className="text-center py-8">
                            <User size={48} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No online agents available</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {agents.map((agent) => (
                              <div key={agent._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {agent.personalInfo.firstName} {agent.personalInfo.lastName || ''}
                                    </h4>
                                    <p className="text-sm text-gray-600">{agent.personalInfo.phone}</p>
                                    <p className="text-xs text-gray-500">{agent.vehicleInfo?.vehicleType || 'N/A'} • {agent.vehicleInfo?.vehicleNumber || 'N/A'}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => assignAgent(agent._id)}
                                  disabled={assigningAgent}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {assigningAgent ? 'Assigning...' : 'Assign'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pickup & Drop Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Delivery Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <MapPin size={16} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Pickup Location</h3>
                  </div>
                  <div className="ml-11 space-y-2">
                    <p className="text-sm text-gray-900 font-medium">{order.pickup?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{order.pickup?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone size={14} className="mr-1" />
                      {order.pickup?.phone || 'N/A'}
                    </p>
                    {order.pickup?.landmark && (
                      <p className="text-sm text-gray-500">Landmark: {order.pickup.landmark}</p>
                    )}
                    {order.pickupOtp && (
                      <p className="text-sm text-gray-900 font-semibold">Pickup OTP: <span className="text-blue-600">{order.pickupOtp.code}</span></p>
                    )}
                    {order.packageDetails?.pickupNotes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>Pickup Notes:</strong> {order.packageDetails.pickupNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drop */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <MapPin size={16} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Drop Location</h3>
                  </div>
                  <div className="ml-11 space-y-2">
                    <p className="text-sm text-gray-900 font-medium">{order.drop?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{order.drop?.address || 'N/A'}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone size={14} className="mr-1" />
                      {order.drop?.phone || 'N/A'}
                    </p>
                    {order.drop?.landmark && (
                      <p className="text-sm text-gray-500">Landmark: {order.drop.landmark}</p>
                    )}
                    {order.dropOtp && (
                      <p className="text-sm text-gray-900 font-semibold">Drop OTP: <span className="text-red-600">{order.dropOtp.code}</span></p>
                    )}
                    {order.packageDetails?.dropNotes && (
                      <div className="mt-2 p-2 bg-orange-50 rounded-md border-l-4 border-orange-400">
                        <p className="text-sm text-orange-800">
                          <strong>Drop Notes:</strong> {order.packageDetails.dropNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package size={20} className="mr-2" />
                Package Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900 capitalize">{order.packageDetails?.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Size</label>
                  <p className="text-sm text-gray-900">{order.packageDetails?.size || 'N/A'}</p>
                </div>
              </div>
              {order.schedule && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Schedule</label>
                  <p className="text-sm text-gray-900">
                    {order.schedule.type === 'now' ? 'Deliver Now' : `Scheduled for ${formatDate(order.schedule.dateTime)} at ${formatTime12Hour(order.schedule.dateTime)}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Pricing Details */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <IndianRupee size={20} className="mr-2" />
                Pricing Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distance</span>
                  <span className="text-sm text-gray-900">{order.pricing?.distance?.toFixed(1) || 0} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ETA</span>
                  <span className="text-sm text-gray-900">{order.pricing?.eta || 0} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Cost</span>
                  <span className="text-sm text-gray-900">₹{order.pricing?.estimatedCost || 0}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-900">Final Cost</span>
                    <span className="text-gray-900">₹{order.pricing?.finalCost || 0}</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="text-gray-900 capitalize">{order.pricing?.paymentMethod || 'N/A'}</span>
                </div>
                {order.razorpayOrderId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Razorpay Order ID</span>
                    <span className="text-gray-900 font-mono text-xs">{order.razorpayOrderId}</span>
                  </div>
                )}
                {order.razorpayPaymentId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment ID</span>
                    <span className="text-gray-900 font-mono text-xs">{order.razorpayPaymentId}</span>
                  </div>
                )}
                {order.razorpaySignature && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Signature</span>
                    <span className="text-gray-900 font-mono text-xs break-all">{order.razorpaySignature}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock size={20} className="mr-2" />
                Order Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${order.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>

                {['picked_up', 'in_transit', 'delivered'].includes(order.status) && (
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${order.status === 'picked_up' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Package Picked Up</p>
                      <p className="text-xs text-gray-500">Status updated</p>
                    </div>
                  </div>
                )}

                {['in_transit', 'delivered'].includes(order.status) && (
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${order.status === 'in_transit' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">In Transit</p>
                      <p className="text-xs text-gray-500">Package is on the way</p>
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Delivered</p>
                      <p className="text-xs text-gray-500">Package delivered successfully</p>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3 bg-red-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Cancelled</p>
                      <p className="text-xs text-gray-500">Order was cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default XpressOrderDetails;