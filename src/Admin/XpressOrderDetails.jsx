import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../Components/Layout';
import { GoogleMap, Marker, DirectionsRenderer } from '../Components/GoogleMapComponents';
import {
  ArrowLeft, MapPin, Phone, Package, Clock,
  User, Calendar, Truck, CheckCircle, XCircle,
  AlertCircle, AlertTriangle, Navigation, IndianRupee, RefreshCw, Trash2, X,
  Download, FileText,
  TriangleAlert, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import bikeriderImg from '/assets/bikerider.png';
import { VERSION } from '../../version.js';

const BIKERIDER_ICON = bikeriderImg;

const XpressOrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [assigningAgent, setAssigningAgent] = useState({});
  const [showAgentsList, setShowAgentsList] = useState(false);
  const [directions, setDirections] = useState(null);
  const [agentToPickupDirections, setAgentToPickupDirections] = useState(null);
  const [agentToDropDirections, setAgentToDropDirections] = useState(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [refreshingOrder, setRefreshingOrder] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerificationMeta, setPaymentVerificationMeta] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null); // 'pickup' or 'drop'
  const [tempCoordinates, setTempCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmationText, setCancelConfirmationText] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [appControls, setAppControls] = useState(null);
  const [calculatedEarnings, setCalculatedEarnings] = useState(0);
  const [distance, setDistance] = useState(5); // default 5km
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const socketRef = useRef(null);
  const joinedOrderIdRef = useRef(null);
  const lastAgentLocationRef = useRef(null);
  const [agentLocation, setAgentLocation] = useState(null);
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

  const calculateTimeTaken = (createdAt, deliveredAt) => {
    if (!createdAt || !deliveredAt) return null;

    const created = new Date(createdAt);
    const delivered = new Date(deliveredAt);
    const diffMs = delivered - created;

    if (diffMs < 0) return null; // Invalid dates

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${remainingMinutes}m`;
    } else {
      return `${diffMinutes}m`;
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
        navigate('/xpress');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
      navigate('/xpress');
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

      const data = await response.json();

      if (response.ok) {
        const adminName = currentUser?.name || currentUser?.email || 'Admin';
        const orderNumber = data.order?.orderNumber || order?.orderNumber || id;
        await createLog(`${adminName} changed xpress order status to ${newStatus}-${orderNumber}`);
        toast.success('Order status updated successfully');
        setOrder(data.order || { ...order, status: newStatus });
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (response.ok) {
        await createLog(`${currentUser?.name || currentUser?.email || 'Admin'} deleted the order - ${order?.orderNumber || id}`);
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

  const handleCancelOrder = async () => {
    try {
      setUpdating(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: 'cancelled',
            reason: cancelReason.trim()
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        const adminName = currentUser?.name || currentUser?.email || 'Admin';
        const orderNumber = data.order?.orderNumber || order?.orderNumber || id;
        await createLog(`${adminName} Cancelled the xpress order- ${orderNumber}`);
        toast.success('Order cancelled successfully');
        // Refresh the order details
        await fetchOrderDetails();
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setUpdating(false);
    }
  };

  const fetchAgents = async () => {
    try {
      // Get pickup coordinates for distance calculation
      const pickupLat = order?.pickup?.coordinates?.latitude;
      const pickupLng = order?.pickup?.coordinates?.longitude;

      let url = `${import.meta.env.VITE_SERVER}/admin/delivery-agents?online=true&applicationStatus=approved&isActive=true&limit=1000`;

      // Add pickup coordinates for distance sorting if available
      if (pickupLat && pickupLng) {
        url += `&merchantLat=${pickupLat}&merchantLng=${pickupLng}`;
      }

      const response = await fetch(url, { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        console.log('📍 Fetched agents with distances:', data.agents?.map(agent => ({
          name: `${agent.personalInfo.firstName} ${agent.personalInfo.lastName || ''}`,
          distance: agent.distance,
          isOnline: agent.status?.isOnline
        })));
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

  const verifyPaymentStatus = async () => {
    try {
      setVerifyingPayment(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}/verify-payment-status`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (data.order) {
        setOrder(data.order);
      }

      setPaymentVerificationMeta({
        checkedAt: new Date().toISOString(),
        gateway: data.gateway || null,
        message: data.message || null,
        notifications: data.notifications || null,
      });

      if (data.confirmed) {
        const notificationSummary = [];
        if (data.notifications?.telegramSent) notificationSummary.push('Telegram sent');
        if (data.notifications?.customerPushSent) notificationSummary.push('customer notified');

        toast.success(
          notificationSummary.length
            ? `${data.message || 'Payment verified successfully'} • ${notificationSummary.join(' • ')}`
            : (data.message || 'Payment verified successfully')
        );
      } else if (data.pending) {
        toast(data.message || 'Payment is still pending on Razorpay');
      } else {
        toast.error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment status:', error);
      toast.error('Failed to verify payment status');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const assignAgent = async (agentId) => {
    if (calculatedEarnings <= 0) {
      toast.error('Earnings amount could not be calculated. Please check app controls.');
      return;
    }

    const earningsAmount = calculatedEarnings;

    try {
      // mark this specific agent as assigning
      setAssigningAgent(prev => ({ ...prev, [agentId]: true }));
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
        toast.success('Agent assigned successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to assign agent');
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('Failed to assign agent');
    } finally {
      // clear only this agent's assigning flag
      setAssigningAgent(prev => {
        const copy = { ...prev };
        delete copy[agentId];
        return copy;
      });
    }
  };

  const createLog = async (message) => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER}/admin/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          level: 'INFO',
          message,
          user: currentUser?.name || currentUser?.email || 'admin',
          platform: 'Admin',
          version: VERSION
        })
      });
    } catch (err) {
      console.error('Failed to create log:', err);
    }
  };

  const fetchAppControls = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/gig-controls`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Calculate earnings based on distance
        const gigBasePrice = data.data?.gigBasePrice || 60;
        const gigPerKmRate = data.data?.gigPerKmRate || 6;
        const calculated = gigBasePrice + (gigPerKmRate * distance);
        setCalculatedEarnings(calculated);
        // Store the values for display
        setAppControls({
          gigBasePrice: { value: gigBasePrice },
          gigPerKmRate: { value: gigPerKmRate }
        });
      }
    } catch (error) {
      console.error('Error fetching app controls:', error);
      // Fallback to default values
      const gigBasePrice = 60;
      const gigPerKmRate = 6;
      const calculated = gigBasePrice + (gigPerKmRate * distance);
      setCalculatedEarnings(calculated);
      setAppControls({
        gigBasePrice: { value: gigBasePrice },
        gigPerKmRate: { value: gigPerKmRate }
      });
    }
  };

  const saveLocation = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/xpress/${id}/locations`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            [editingLocation]: {
              ...order[editingLocation],
              coordinates: tempCoordinates
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        const locLabel = editingLocation === 'pickup' ? 'Pickup' : 'Drop';
        const adminName = currentUser?.name || currentUser?.email || 'Admin';
        await createLog(`${adminName} changed the ${locLabel} location-${data.order?.orderNumber || order.orderNumber}`);
        setEditingLocation(null);
        toast.success('Location updated successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    if (currentUser && id) {
      fetchOrderDetails();
      fetchAppControls();
    }
  }, [currentUser, id]);

  useEffect(() => {
    if (order?.pricing?.distance) {
      setDistance(order.pricing.distance);
    }
  }, [order?.pricing?.distance]);

  useEffect(() => {
    if (distance > 0) {
      fetchAppControls();
    }
  }, [distance]);

  // Seed agent location once on load (REST) so marker appears even before socket events arrive
  const seedAgentLocation = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/xpress/${id}/agent-location`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok && data.success && data.data?.location) {
        const loc = data.data.location;
        if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
          const locationUpdate = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: typeof loc.heading === 'number' ? ((loc.heading % 360) + 360) % 360 : null,
            accuracy: typeof loc.accuracy === 'number' ? loc.accuracy : null,
            lastUpdated: loc.lastUpdated ? new Date(loc.lastUpdated) : new Date()
          };
          lastAgentLocationRef.current = locationUpdate;
          setAgentLocation(locationUpdate);
        }
      }
    } catch (err) {
      console.warn('Seed agent location failed', err?.message || err);
    }
  }, [id]);

  // WebSocket connection for live agent tracking
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        if (joinedOrderIdRef.current) {
          socketRef.current.emit('leave-xpress-order', { orderId: joinedOrderIdRef.current });
        }
        socketRef.current.disconnect();
        socketRef.current = null;
        joinedOrderIdRef.current = null;
      }
    };
  }, []);

  // WebSocket connection logic when agent is assigned
  useEffect(() => {
    if (!id) {
      return;
    }

    const normalizedOrderId = String(id);
    const shouldTrackLocation = Boolean(
      order?.assignment?.agent &&
      !['delivered', 'cancelled'].includes(order?.status || '')
    );

    if (!shouldTrackLocation) {
      if (socketRef.current && joinedOrderIdRef.current === normalizedOrderId) {
        socketRef.current.emit('leave-xpress-order', { orderId: normalizedOrderId });
        joinedOrderIdRef.current = null;
      }
      return;
    }

    // Seed current location via REST once when tracking becomes active
    seedAgentLocation();

    const socket = socketRef.current || io(import.meta.env.VITE_SERVER, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: false,
      withCredentials: false,
      query: { orderId: normalizedOrderId }
    });

    if (!socketRef.current) {
      socketRef.current = socket;
    }

    const handleLocationUpdate = (payload = {}) => {
      console.log('Xpress Admin socket location update', payload);
      if (payload.orderId && payload.orderId !== id) {
        return;
      }

      const latitude = typeof payload.latitude === 'number' ? payload.latitude : null;
      const longitude = typeof payload.longitude === 'number' ? payload.longitude : null;

      if (latitude === null || longitude === null) {
        return;
      }

      const normalizedHeading = typeof payload.heading === 'number'
        ? ((payload.heading % 360) + 360) % 360
        : null;

      const locationUpdate = {
        latitude,
        longitude,
        heading: normalizedHeading,
        accuracy: typeof payload.accuracy === 'number' ? payload.accuracy : null,
        lastUpdated: payload.timestamp ? new Date(payload.timestamp) : new Date()
      };

      const last = lastAgentLocationRef.current;
      if (
        last &&
        Math.abs(last.latitude - locationUpdate.latitude) < 1e-6 &&
        Math.abs(last.longitude - locationUpdate.longitude) < 1e-6 &&
        (last.heading ?? null) === (locationUpdate.heading ?? null)
      ) {
        return;
      }

      lastAgentLocationRef.current = locationUpdate;
      setAgentLocation(locationUpdate);
    };

    const handleConnect = () => {
      console.log('Xpress Admin socket connected', socket.id);
      if (joinedOrderIdRef.current === normalizedOrderId) {
        return;
      }
      socket.emit('join-xpress-order', { orderId: normalizedOrderId });
      console.log('Xpress Admin socket join room', normalizedOrderId);
      joinedOrderIdRef.current = normalizedOrderId;
    };

    const handleDisconnect = (reason) => {
      console.log('Xpress Admin socket disconnected', reason);
    };

    const handleConnectError = (error) => {
      console.log('Xpress Admin socket connect_error', error?.message || error);
    };

    const handleReconnectAttempt = (attempt) => {
      console.log('Xpress Admin socket reconnect attempt', attempt);
    };

    socket.on('xpress-agent-location', handleLocationUpdate);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('error', handleConnectError);
    socket.on('connect_error', handleConnectError);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off('xpress-agent-location', handleLocationUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('error', handleConnectError);
      socket.off('connect_error', handleConnectError);
      if (joinedOrderIdRef.current === normalizedOrderId) {
        socket.emit('leave-xpress-order', { orderId: normalizedOrderId });
        joinedOrderIdRef.current = null;
      }
    };
  }, [id, order?.assignment?.agent, order?.status]);

  // Request roadway route from agent to pickup (pre-pickup)
  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) return;

    const pickupLat = parseFloat(order?.pickup?.coordinates?.latitude);
    const pickupLng = parseFloat(order?.pickup?.coordinates?.longitude);
    const agentLat = parseFloat(agentLocation?.latitude);
    const agentLng = parseFloat(agentLocation?.longitude);

    const canRoute =
      agentLocation && order?.assignment?.agent &&
      order?.status !== 'in_transit' &&
      !['delivered', 'cancelled'].includes(order?.status || '') &&
      !isNaN(pickupLat) && !isNaN(pickupLng) &&
      !isNaN(agentLat) && !isNaN(agentLng);

    if (!canRoute) {
      setAgentToPickupDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: agentLat, lng: agentLng },
        destination: { lat: pickupLat, lng: pickupLng },
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setAgentToPickupDirections(result);
        } else {
          console.warn('Agent→Pickup directions failed:', status);
          setAgentToPickupDirections(null);
        }
      }
    );
  }, [agentLocation, order?.assignment?.agent, order?.status, order?.pickup?.coordinates?.latitude, order?.pickup?.coordinates?.longitude]);

  // Request roadway route from agent to drop (after pickup, i.e., in transit)
  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.DirectionsService) return;

    const dropLat = parseFloat(order?.drop?.coordinates?.latitude);
    const dropLng = parseFloat(order?.drop?.coordinates?.longitude);
    const agentLat = parseFloat(agentLocation?.latitude);
    const agentLng = parseFloat(agentLocation?.longitude);

    const canRoute =
      agentLocation && order?.assignment?.agent &&
      order?.status === 'in_transit' &&
      !['delivered', 'cancelled'].includes(order?.status || '') &&
      !isNaN(dropLat) && !isNaN(dropLng) &&
      !isNaN(agentLat) && !isNaN(agentLng);

    if (!canRoute) {
      setAgentToDropDirections(null);
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: agentLat, lng: agentLng },
        destination: { lat: dropLat, lng: dropLng },
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setAgentToDropDirections(result);
        } else {
          console.warn('Agent→Drop directions failed:', status);
          setAgentToDropDirections(null);
        }
      }
    );
  }, [agentLocation, order?.assignment?.agent, order?.status, order?.drop?.coordinates?.latitude, order?.drop?.coordinates?.longitude]);

  // Initialize Google Places Autocomplete when modal opens
  useEffect(() => {
    if (editingLocation && searchInputRef.current && window.google && window.google.maps && window.google.maps.places) {
      // Initialize Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        // Remove types restriction to allow businesses, addresses, etc.
        componentRestrictions: { country: 'in' } // Restrict to India
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          setTempCoordinates({
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          });
          setSearchQuery(place.formatted_address || '');
        }
      });
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [editingLocation]);

  const handleDownloadInvoice = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const primary = [16, 185, 129];
      const dark = [31, 41, 55];
      const muted = [107, 114, 128];
      const light = [243, 244, 246];

      const fetchLogoAsDataUrl = async (url) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      // Header band
      doc.setFillColor(...primary);
      doc.rect(0, 0, 210, 42, 'F');

      // Logo (best-effort) — preserve aspect ratio to avoid squeezing
      try {
        const logoDataUrl = await fetchLogoAsDataUrl('/grojet.png');
        // Load image to get intrinsic dimensions so we can scale preserving aspect
        const imgEl = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = logoDataUrl;
        });

        const natW = imgEl.naturalWidth || imgEl.width || 1;
        const natH = imgEl.naturalHeight || imgEl.height || 1;

        // Max box in mm (keeps roughly same space as before)
        const maxW = 26;
        const maxH = 26;

        let drawW = maxW;
        let drawH = maxH;
        const ratio = natW / natH;
        if (ratio > 1) {
          // wide image
          drawW = maxW;
          drawH = maxW / ratio;
        } else {
          // tall or square image
          drawH = maxH;
          drawW = maxH * ratio;
        }

        // Center vertically in the header area used previously (y start 8, box height maxH)
        const drawX = 14;
        const drawY = 8 + (maxH - drawH) / 2;

        doc.addImage(logoDataUrl, 'PNG', drawX, drawY, drawW, drawH);
      } catch (e) {
        // Fallback text when logo is unavailable
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('GROJET', 16, 23);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('XPRESS ORDER INVOICE', 50, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Fast • Reliable • On-time Delivery', 50, 26);

      doc.setFontSize(9);
      doc.text(`Invoice Date: ${formatDate(new Date())}`, 145, 16);
      doc.text(`Invoice #: INV-${order.orderNumber}`, 145, 22);
      doc.text(`Order #: ${order.orderNumber}`, 145, 28);

      // Utility to draw section
      const drawSection = (title, y, h = 26) => {
        doc.setFillColor(...light);
        doc.roundedRect(12, y, 186, h, 2, 2, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(12, y, 186, h, 2, 2);
        doc.setTextColor(...dark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, 16, y + 7);
      };

      let y = 50;

      drawSection('Customer Information', y, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(`Name: ${order.userId?.personalInfo?.name || 'N/A'}`, 16, y + 15);
      doc.text(`Phone: ${order.userId?.personalInfo?.phone || 'N/A'}`, 110, y + 15);
      y += 30;

      drawSection('Pickup & Drop Details', y, 44);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Pickup', 16, y + 15);
      doc.text('Drop', 110, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const pickupAddress = doc.splitTextToSize(order.pickup?.address || 'N/A', 84);
      const dropAddress = doc.splitTextToSize(order.drop?.address || 'N/A', 84);

      doc.text(order.pickup?.name || 'N/A', 16, y + 21);
      doc.text(pickupAddress, 16, y + 26);
      doc.text(`Phone: ${order.pickup?.phone || 'N/A'}`, 16, y + 40);

      doc.text(order.drop?.name || 'N/A', 110, y + 21);
      doc.text(dropAddress, 110, y + 26);
      doc.text(`Phone: ${order.drop?.phone || 'N/A'}`, 110, y + 40);
      y += 50;

      drawSection('Package & Pricing', y, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Category: ${order.packageDetails?.category || 'N/A'}`, 16, y + 15);
      doc.text(`Size: ${order.packageDetails?.size || 'N/A'}`, 16, y + 22);
      doc.text(`Distance: ${order.pricing?.distance?.toFixed(1) || 0} km`, 16, y + 29);

      const basePrice = Math.round((order.pricing?.finalCost || 0) / 1.18);
      const gstAmount = Math.round((order.pricing?.finalCost || 0) - basePrice);

      doc.text(`Base Price: ₹${basePrice}`, 110, y + 15);
      doc.text(`GST (18%): ₹${gstAmount}`, 110, y + 22);
      doc.setFont('helvetica', 'bold');
      doc.text(`Final: ₹${order.pricing?.finalCost || 0}`, 110, y + 29);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment: ${order.pricing?.paymentMethod || 'N/A'}`, 110, y + 36);
      y += 46;

      drawSection('Order Timeline', y, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Placed: ${formatDateTime(order.createdAt)}`, 16, y + 15);
      if (order.status === 'delivered') {
        const deliveryTime = order.deliveredAt || order.dropOtp?.verifiedAt;
        doc.text(`Delivered: ${deliveryTime ? formatDateTime(deliveryTime) : 'N/A'}`, 110, y + 15);
      } else {
        doc.text(`Current Status: ${order.status.replace('_', ' ').toUpperCase()}`, 110, y + 15);
      }

      // Footer band
      doc.setFillColor(...dark);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Thank you for choosing Grojet.', 105, 288, { align: 'center' });
      doc.text('support@grojetdelivery.com', 105, 293, { align: 'center' });

      doc.save(`grojet-invoice-${order.orderNumber}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refund_pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getReadablePaymentStatus = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'failed':
        return 'Failed';
      case 'refund_pending':
        return 'Refund Pending';
      case 'pending':
      default:
        return 'Pending';
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

  if (!currentUser) {
    return (
      <Layout title="Xpress Order Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout title="Xpress Order Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <XCircle className='w-16 h-16 text-red-500 mb-2' />
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
          <AlertCircle className='w-16 h-16 text-red-500 mb-2' />
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <button
              onClick={() => navigate('/xpress')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Xpress Orders
            </button>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={async () => {
                  setRefreshingOrder(true);
                  try {
                    await fetchOrderDetails();
                    toast.success('Order details refreshed');
                  } catch (error) {
                    toast.error('Failed to refresh order details');
                  } finally {
                    setRefreshingOrder(false);
                  }
                }}
                disabled={refreshingOrder}
                className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
              >
                <RefreshCw size={16} className={`mr-2 ${refreshingOrder ? 'animate-spin' : ''}`} />
                {refreshingOrder ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `${import.meta.env.VITE_SERVER}/admin/xpress/${id}/export/excel`,
                      { credentials: 'include' }
                    );

                    if (response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `xpress-order-${order.orderNumber}.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast.success('Order exported successfully');
                    } else {
                      toast.error('Failed to export order');
                    }
                  } catch (error) {
                    console.error('Error exporting order:', error);
                    toast.error('Failed to export order');
                  }
                }}
                className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                <Download size={16} className="mr-2" />
                Export to Excel
              </button>
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                <FileText size={16} className="mr-2" />
                Download Invoice
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className='flex gap-2 items-center'>
                <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber} </h1>
                {order.isFirstOrder && (
                  <div className='bg-blue-600 text-white rounded-full w-fit py-1 px-3 flex gap-2 items-center'>
                    <Star size={20} className="text-white" />
                    <h1 className='font-semibold'>First Order</h1>
                  </div>
                )}
                {order.packageDetails?.fragile &&
                  (<div className='bg-red-700 text-white rounded-full w-fit py-1 px-3 flex gap-2 items-center'>
                    <TriangleAlert size={20} className="text-white" />
                    <h1 className=' font-semibold'>Fragile</h1>
                  </div>)}
              </div>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)} at {formatTime12Hour(order.createdAt)}
              </p>
              {order.status === 'delivered' && (order.deliveredAt || order.dropOtp?.verifiedAt) && (
                <div className="mt-1">
                  <p className="text-green-600">
                    Delivered on {formatDate(order.deliveredAt || order.dropOtp?.verifiedAt)} at {formatTime12Hour(order.deliveredAt || order.dropOtp?.verifiedAt)}
                  </p>
                  <p className="text-blue-600 text-sm">
                    Time taken: {calculateTimeTaken(order.createdAt, order.deliveredAt || order.dropOtp?.verifiedAt)}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-2 capitalize">{order.status.replace('_', ' ')}</span>
              </span>
              {order.pricing?.paymentMethod !== 'cod' && (
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getPaymentStatusColor(order.pricing?.paymentStatus)}`}>
                  <IndianRupee size={16} />
                  <span className="ml-2">Razorpay {getReadablePaymentStatus(order.pricing?.paymentStatus)}</span>
                </span>
              )}
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
                </select>
              )}
              {currentUser?.role === 'super_admin' && (
                <button
                  onClick={() => setShowDeleteModal(true)}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <User size={20} className="mr-2" />
                Customer Information
              </h2>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-2 -m-2"
                onClick={() => order.userId?._id && navigate(`/users/${order.userId._id}`)}
                title="Click to view customer details"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900 hover:text-blue-600 transition-colors">
                    {order.userId?.personalInfo?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900 hover:text-blue-600 transition-colors">
                    {order.userId?.personalInfo?.phone || 'N/A'}
                  </p>
                </div>
              </div>
              {order.userId?._id && (
                <div className="mt-3 text-xs text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => navigate(`/users/${order.userId._id}`)}>
                  Click to view full customer profile →
                </div>
              )}
            </div>



            {/* Map Preview */}
            {order.pickup?.coordinates?.latitude && order.drop?.coordinates?.latitude &&
              !isNaN(parseFloat(order.pickup.coordinates.latitude)) && !isNaN(parseFloat(order.drop.coordinates.latitude)) &&
              parseFloat(order.pickup.coordinates.latitude) !== 0 && parseFloat(order.drop.coordinates.latitude) !== 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Navigation size={20} className="mr-2" />
                    {agentLocation && order?.assignment?.agent && !['delivered', 'cancelled'].includes(order?.status || '')
                      ? 'Live Tracking'
                      : 'Route Preview'}
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
                      {/* {agentToPickupDirections && (
                        <DirectionsRenderer
                          directions={agentToPickupDirections}
                          options={{
                            suppressMarkers: true,
                            polylineOptions: {
                              strokeColor: '#22c55e',
                              strokeOpacity: 0.9,
                              strokeWeight: 5
                            }
                          }}
                        />
                      )} */}
                      {/* {agentToDropDirections && (
                        <DirectionsRenderer
                          directions={agentToDropDirections}
                          options={{
                            suppressMarkers: true,
                            polylineOptions: {
                              strokeColor: '#ec4899',
                              strokeOpacity: 0.9,
                              strokeWeight: 5
                            }
                          }}
                        />
                      )} */}
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

                      {/* Delivery Agent Marker - Only show when agent is assigned and tracking */}
                      {agentLocation && order?.assignment?.agent && !['delivered', 'cancelled'].includes(order?.status || '') && (
                        <Marker
                          position={{
                            lat: parseFloat(agentLocation.latitude),
                            lng: parseFloat(agentLocation.longitude)
                          }}
                          title="Delivery Agent (Live)"
                          rotation={typeof agentLocation.heading === 'number' ? agentLocation.heading : 0}
                          infoContent={`
                          <div style="max-width: 250px;">
                            <strong>Delivery Agent</strong><br/>
                            ${order.assignment.agent.personalInfo?.firstName || ''} ${order.assignment.agent.personalInfo?.lastName || ''}<br/>
                            ${order.assignment.agent.personalInfo?.phone || ''}<br/>
                            <small>Last updated: ${agentLocation.lastUpdated ? new Date(agentLocation.lastUpdated).toLocaleTimeString() : 'Just now'}</small>
                          </div>
                        `}
                          icon={window.google && window.google.maps ? {
                            url: BIKERIDER_ICON,
                            scaledSize: new window.google.maps.Size(46, 46),
                            anchor: new window.google.maps.Point(23, 23)
                          } : null}
                        />
                      )}

                      {directions && <DirectionsRenderer directions={directions} />}
                    </GoogleMap>
                  </div>
                </div>
              )}

            {/* Delivery Agent Assignment */}
            {['super_admin', 'admin'].includes(currentUser?.role) && (
              <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User size={20} className="mr-2" />
                  Delivery Agent Assignment
                </h2>

                {order.assignment?.agent ? (
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 ${order.assignment.status === 'accepted' ? 'bg-green-50 border-green-200' :
                      order.assignment.status === 'rejected' ? 'bg-red-50 border-red-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${order.assignment.status === 'accepted' ? 'bg-green-100' :
                            order.assignment.status === 'rejected' ? 'bg-red-100' :
                              'bg-yellow-100'
                            }`}>
                            <User size={20} className={`${order.assignment.status === 'accepted' ? 'text-green-600' :
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
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${order.assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                order.assignment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                {order.assignment.status === 'accepted' ? 'Accepted' :
                                  order.assignment.status === 'rejected' ? 'Rejected' :
                                    'Pending Confirmation'}
                              </span>
                              {order.status !== 'delivered' && (
                                <button
                                  onClick={refreshAssignmentStatus}
                                  disabled={refreshingStatus}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                  title="Refresh assignment status"
                                >
                                  <RefreshCw size={14} className={refreshingStatus ? 'animate-spin' : ''} />
                                </button>
                              )}
                            </div>
                            {/* Live Tracking Indicator */}
                            {agentLocation && order?.assignment?.agent && !['delivered', 'cancelled'].includes(order?.status || '') && (
                              <div className="flex items-center mt-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                <span className="text-sm text-green-600 font-medium">Live tracking active</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  Updated {agentLocation.lastUpdated ? new Date(agentLocation.lastUpdated).toLocaleTimeString() : 'just now'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {order.status !== 'delivered' && (
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
                        )}
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
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Online Agents ({agents.length})</h3>
                            <p className="text-sm text-gray-500">
                              {order?.pickup?.coordinates?.latitude && order?.pickup?.coordinates?.longitude
                                ? 'Sorted by distance to pickup location'
                                : 'Showing all online agents (pickup location not available for distance sorting)'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={fetchAgents}
                              disabled={Object.values(assigningAgent).some(Boolean)}
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

                        {/* Delivery Agent Earnings Display */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Delivery Agent Earnings (₹)
                          </label>
                          <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                            <span className="text-lg font-semibold text-green-600">
                              ₹{calculatedEarnings.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              (Auto-calculated: Base ₹{appControls?.gigBasePrice?.value || 60} + ₹{appControls?.gigPerKmRate?.value || 6} × {(order?.pricing?.distance || 5).toFixed(1)}km)
                            </span>
                          </div>
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
                                    {agent.distance !== null && agent.distance !== undefined && (
                                      <p className="text-xs text-blue-600 font-medium">
                                        📍 {agent.distance.toFixed(1)} km away
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => assignAgent(agent._id)}
                                  disabled={Boolean(assigningAgent[agent._id])}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {assigningAgent[agent._id] ? 'Assigning...' : 'Assign'}
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
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin size={20} className="mr-2" />
                Delivery Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    <button
                      onClick={() => {
                        setEditingLocation('pickup');
                        setTempCoordinates(order.pickup.coordinates);
                        setSearchQuery('');
                      }}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Change Pickup Location
                    </button>
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
                    <button
                      onClick={() => {
                        setEditingLocation('drop');
                        setTempCoordinates(order.drop.coordinates);
                        setSearchQuery('');
                      }}
                      className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Change Drop Location
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.source === 'website'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                    {order.source === 'website' ? '🌐 Website' : '📱 Mobile App'}
                  </span>
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
              {order.packageDetails?.fragile && (
                <div className="mt-4 w-fit bg-red-700 border border-red-800 text-white px-3 py-2 rounded-full flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  <span className="text-sm font-medium">Fragile Item</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Pricing Details */}
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <IndianRupee size={20} className="mr-2" />
                  Pricing Details
                </h2>
                {order.pricing?.paymentMethod !== 'cod' && (
                  <button
                    onClick={verifyPaymentStatus}
                    disabled={verifyingPayment}
                    className="inline-flex items-center justify-center px-2 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={14} className={`mr-2 ${verifyingPayment ? 'animate-spin' : ''}`} />
                    {verifyingPayment ? 'Verifying...' : 'Verify Payment'}
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distance</span>
                  <span className="text-sm text-gray-900">{order.pricing?.distance?.toFixed(1) || 0} km</span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ETA</span>
                  <span className="text-sm text-gray-900">{order.pricing?.eta || 0} minutes</span>
                </div> */}
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
                <div className="flex justify-between items-center text-sm gap-3">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.pricing?.paymentStatus)}`}>
                    {order.pricing?.paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : `Razorpay ${getReadablePaymentStatus(order.pricing?.paymentStatus)}`}
                  </span>
                </div>
                {paymentVerificationMeta?.gateway?.status && (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-gray-600">Gateway Status</span>
                    <span className="text-gray-900 capitalize">{paymentVerificationMeta.gateway.status.replace('_', ' ')}</span>
                  </div>
                )}
                {paymentVerificationMeta?.checkedAt && (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-gray-600">Last Verified</span>
                    <span className="text-gray-900">{formatDateTime(paymentVerificationMeta.checkedAt)}</span>
                  </div>
                )}
                {paymentVerificationMeta?.message && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                    {paymentVerificationMeta.message}
                  </div>
                )}
                {paymentVerificationMeta?.notifications && (
                  <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800 space-y-1">
                    <div>Telegram: {paymentVerificationMeta.notifications.telegramSent ? 'Sent' : 'Not sent'}</div>
                    <div>Customer push: {paymentVerificationMeta.notifications.customerPushSent ? 'Sent' : 'Not sent'}</div>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time Taken</span>
                    <span className="text-gray-900">
                      {calculateTimeTaken(order.createdAt, order.deliveredAt || order.dropOtp?.verifiedAt) || 'N/A'}
                    </span>
                  </div>
                )}
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
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Clock size={20} className="mr-2" />
                Order Timeline
              </h2>
              <div className="space-y-4">
                {/* Order Placed */}
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${order.status === 'pending' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                  </div>
                </div>

                {/* Assignment History */}
                {order.assignmentHistory && order.assignmentHistory.length > 0 && (
                  <>
                    {order.assignmentHistory
                      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                      .map((event, index) => (
                        <div key={index} className="flex items-start">
                          <div className={`w-3 h-3 rounded-full mr-3 mt-1 ${
                            event.status === 'assigned' ? 'bg-blue-500' :
                            event.status === 'accepted' ? 'bg-green-500' :
                            event.status === 'rejected' ? 'bg-red-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {event.status === 'assigned' && `Agent Assigned: ${event.agent?.personalInfo?.firstName || event.agentName || 'Unknown Agent'} ${event.agent?.personalInfo?.lastName || ''}`.trim()}
                              {event.status === 'accepted' && `Assignment Accepted by ${event.agent?.personalInfo?.firstName || event.agentName || 'Unknown Agent'} ${event.agent?.personalInfo?.lastName || ''}`.trim()}
                              {event.status === 'rejected' && `Assignment Rejected by ${event.agent?.personalInfo?.firstName || event.agentName || 'Unknown Agent'} ${event.agent?.personalInfo?.lastName || ''}`.trim()}
                              {event.status === 'cancelled' && `Assignment Cancelled for ${event.agent?.personalInfo?.firstName || event.agentName || 'Unknown Agent'} ${event.agent?.personalInfo?.lastName || ''}`.trim()}
                              {event.status === 'expired' && `Assignment Expired for ${event.agent?.personalInfo?.firstName || event.agentName || 'Unknown Agent'} ${event.agent?.personalInfo?.lastName || ''}`.trim()}
                            </p>
                            <p className="text-xs text-gray-500 mb-1">{formatDateTime(event.timestamp)}</p>
                            {event.assignedBy?.name && event.status === 'assigned' && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Assigned by:</span> {event.assignedBy.name}
                              </p>
                            )}
                            {event.rejectionReason && event.status === 'rejected' && (
                              <p className="text-xs text-red-600">
                                <span className="font-medium">Reason:</span> {event.rejectionReason}
                              </p>
                            )}
                            {event.notes && (
                              <p className="text-xs text-gray-600 italic">{event.notes}</p>
                            )}
                          </div>
                        </div>  
                      ))}
                  </>
                )}

                {/* Current Assignment Status */}
                {order.assignment?.agent && !order.assignmentHistory?.some(h => h.status === 'accepted') && (
                  <div className="flex items-start">
                    <div className={`w-3 h-3 rounded-full mr-3 mt-1 ${
                      order.assignment.status === 'pending' ? 'bg-yellow-500' :
                      order.assignment.status === 'accepted' ? 'bg-green-500' :
                      order.assignment.status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Agent Assigned: {order.assignment.agent.personalInfo?.firstName} {order.assignment.agent.personalInfo?.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500 mb-1">
                        {order.assignment.assignedAt ? formatDateTime(order.assignment.assignedAt) : 'Recently assigned'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Status: {order.assignment.status === 'pending' ? 'Waiting for acceptance' :
                                order.assignment.status === 'accepted' ? 'Accepted' :
                                order.assignment.status === 'rejected' ? 'Rejected' : order.assignment.status}
                      </p>
                      {order.assignment.status === 'rejected' && order.assignment.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          <span className="font-medium">Reason:</span> {order.assignment.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Status-based Timeline Events */}
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
                      <p className="text-xs text-gray-500">
                        {order.deliveredAt ? formatDateTime(order.deliveredAt) :
                          order.dropOtp?.verifiedAt ? formatDateTime(order.dropOtp.verifiedAt) :
                            'Package delivered successfully'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Time taken: {calculateTimeTaken(order.createdAt, order.deliveredAt || order.dropOtp?.verifiedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex items-start">
                    <div className="w-3 h-3 rounded-full mr-3 bg-red-500 mt-1"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Order Cancelled</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {order.cancellation?.cancelledAt ? formatDateTime(order.cancellation.cancelledAt) : 'Cancelled'}
                      </p>
                      {order.cancellation?.cancelledByName && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-medium">Cancelled by:</span> {order.cancellation.cancelledByName}
                        </p>
                      )}
                      {order.cancellation?.reason && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Reason:</span> {order.cancellation.reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Order Button */}
            {order && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors duration-200"
                  >
                    <X size={18} className="mr-2" />
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle size={24} className="text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Cancel Order
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this order? This action cannot be undone and will notify the customer.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={3}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">CANCEL</span> to confirm:
                </label>
                <input
                  type="text"
                  value={cancelConfirmationText}
                  onChange={(e) => setCancelConfirmationText(e.target.value)}
                  placeholder="Type CANCEL here"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelConfirmationText('');
                  setCancelReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Keep Order
              </button>
              <button
                onClick={async () => {
                  if (cancelConfirmationText === 'CANCEL' && cancelReason.trim()) {
                    await handleCancelOrder();
                    setShowCancelModal(false);
                    setCancelConfirmationText('');
                    setCancelReason('');
                  }
                }}
                disabled={cancelConfirmationText !== 'CANCEL' || !cancelReason.trim() || updating}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${cancelConfirmationText === 'CANCEL' && cancelReason.trim() && !updating
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {updating ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Trash2 size={24} className="text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Order
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this order? This action cannot be undone and will permanently remove all order data.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Keep Order
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirmationText === 'DELETE') {
                    await deleteOrder();
                    setShowDeleteModal(false);
                    setDeleteConfirmationText('');
                  }
                }}
                disabled={deleteConfirmationText !== 'DELETE'}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${deleteConfirmationText === 'DELETE'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Edit Modal */}
      {editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Change {editingLocation === 'pickup' ? 'Pickup' : 'Drop'} Location
            </h3>
            <div className="flex mb-4">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for location"
                className="flex-1 p-2 border rounded"
              />
            </div>
            <div className="h-96 mb-4">
              <GoogleMap
                center={{
                  lat: parseFloat(tempCoordinates.latitude),
                  lng: parseFloat(tempCoordinates.longitude)
                }}
                zoom={15}
                onMapClick={(e) => {
                  if (e && e.latLng) {
                    setTempCoordinates({
                      latitude: e.latLng.lat(),
                      longitude: e.latLng.lng()
                    });
                  }
                }}
                style={{ height: '100%', width: '100%' }}
              >
                <Marker
                  position={{
                    lat: parseFloat(tempCoordinates.latitude),
                    lng: parseFloat(tempCoordinates.longitude)
                  }}
                />
              </GoogleMap>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingLocation(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveLocation}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default XpressOrderDetails;