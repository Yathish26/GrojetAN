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
  IndianRupee,
  Star,
  Eye,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { GoogleMap, Marker, DirectionsRenderer } from '../Components/GoogleMapComponents';
import { Store, Home } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { useWebSocket } from '../context/WebSocketContext';

// Pre-render lucide icons into small SVG marker images (data URIs will be created later when window.google is available)
const PIN_PATH = 'M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z';
let STORE_MARKER_SVG = null;
let HOME_MARKER_SVG = null;
try {
  // render lucide icons to static markup
  const storeInner = ReactDOMServer.renderToStaticMarkup(<Store width="16" height="16" stroke="#ffffff" fill="none" />);
  const homeInner = ReactDOMServer.renderToStaticMarkup(<Home width="16" height="16" stroke="#ffffff" fill="none" />);

  STORE_MARKER_SVG = `<svg width="24" height="32" viewBox="0 0 80 106" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_636_493" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="106">
      <path d="M0 0H79.1389V105.332H0V0Z" fill="white"/>
    </mask>
    <g mask="url(#mask0_636_493)">
      <path d="M79.1372 39.549C79.1372 57.5493 55.023 89.5961 44.4491 102.818C41.9142 105.969 37.2151 105.969 34.6803 102.818C24.1073 89.5961 -0.0078125 57.5493 -0.0078125 39.549C-0.0078125 17.7175 17.717 0.00585938 39.5647 0.00585938C61.4123 0.00585938 79.1372 17.7175 79.1372 39.549Z" fill="#CF0000"/>
    </g>
    <path d="M39.5666 12.8262C54.0305 12.8262 65.769 24.5556 65.769 39.0093C65.769 53.462 54.0305 65.1915 39.5666 65.1915C25.1038 65.1915 13.3652 53.462 13.3652 39.0093C13.3652 24.5556 25.1038 12.8262 39.5666 12.8262Z" fill="white"/>
    <path d="M57.0198 28.7823L53.1674 22.6887C52.824 22.1438 52.2123 21.8086 51.5601 21.8086H27.5685C26.9163 21.8086 26.3046 22.1438 25.9613 22.6887L22.1028 28.7823C20.1118 31.9278 21.8739 36.3018 25.5917 36.8051C25.8611 36.8396 26.1365 36.8588 26.4049 36.8588C28.161 36.8588 29.7206 36.0932 30.789 34.9103C31.8585 36.0932 33.4181 36.8588 35.1742 36.8588C36.9292 36.8588 38.4888 36.0932 39.5583 34.9103C40.6267 36.0932 42.1873 36.8588 43.9414 36.8588C45.7035 36.8588 47.2571 36.0932 48.3255 34.9103C49.401 36.0932 50.9545 36.8588 52.7096 36.8588C52.9851 36.8588 53.2544 36.8396 53.5238 36.8051C57.2558 36.3089 59.024 31.9339 57.0269 28.7823H57.0198ZM53.7993 38.9359H53.7922C53.4357 38.9825 53.0732 39.0098 52.7035 39.0098C51.869 39.0098 51.069 38.8812 50.3226 38.6534V47.61H28.8061V38.6463C28.0526 38.8812 27.2465 39.0098 26.412 39.0098C26.0424 39.0098 25.6727 38.9825 25.3162 38.9359H25.3091C25.0337 38.8954 24.7643 38.8478 24.503 38.781V51.91C24.503 54.2818 26.4323 56.2101 28.8061 56.2101H50.3226C52.6964 56.2101 54.6267 54.2818 54.6267 51.91V38.781C54.3573 38.8478 54.0879 38.9015 53.7993 38.9359Z" fill="#CF0000"/>
  </svg>`;
  HOME_MARKER_SVG = `<svg width="24" height="32" viewBox="0 0 83 108" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="41" cy="42" r="33" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M41.5349 25.8856L57.0218 40.8293H46.7861V40.8299H57.0218V59.524C57.0218 60.6132 56.1369 61.4964 55.0471 61.4964H48.436C47.3502 61.4964 46.4653 60.6132 46.4653 59.524V59.4861C46.4653 57.016 46.4653 54.5458 46.4653 52.0757C46.4653 49.3418 44.2473 47.1261 41.5151 47.1261C38.7795 47.1261 36.5614 49.3418 36.5614 52.0757V59.531C36.5614 60.6167 35.6847 61.4964 34.599 61.4964H28.0105C26.9248 61.4964 26.044 60.6167 26.044 59.531V40.8299H36.5696V40.8293H26.044L41.5349 25.8856ZM41.4924 18.5869C42.0874 18.573 42.6859 18.7855 43.1499 19.2285L63.5054 38.6276C64.4328 39.513 64.4678 40.9842 63.5829 41.9139C62.698 42.8431 61.2257 42.878 60.2948 41.9919L41.5 24.0768L22.7052 41.9919C21.7737 42.878 20.3014 42.8425 19.4165 41.9139C18.5322 40.9842 18.5666 39.513 19.494 38.6276L39.6993 19.3723C39.8152 19.2611 39.9386 19.165 40.0702 19.083L40.2018 19.0166L40.221 19.0003C40.6035 18.736 41.0442 18.5974 41.4924 18.5869ZM41.5 9.80666C23.6326 9.80666 9.14997 24.2881 9.14997 42.1526C9.14997 60.0165 23.6326 74.498 41.5 74.498C59.3674 74.498 73.85 60.0165 73.85 42.1526C73.85 24.2881 59.3674 9.80666 41.5 9.80666ZM41.4301 0L41.5 0.00349302L41.5693 0V0.00698604L45.4372 0.202595C66.5351 2.34498 83 20.1588 83 41.8184C83 47.5936 81.8293 53.0962 79.7113 58.1006C79.3603 58.9535 79.0663 59.8651 78.6564 60.6604C77.548 63.0607 76.6089 64.7105 75.844 65.7253C69.7655 74.902 56.7936 89.026 45.9746 101.759L41.5693 107.023V107.029L41.5035 107.112L41.5 107.107L41.4959 107.112L41.4301 107.029V107.023L37.0254 101.759C26.2058 89.026 13.2345 74.902 7.15604 65.7253C6.39106 64.7105 5.45202 63.0607 4.34299 60.6604C3.93372 59.8651 3.63973 58.9535 3.2881 58.1006C1.17074 53.0962 0 47.5936 0 41.8184C0 20.1588 16.4649 2.34498 37.5622 0.202595L41.4301 0.00698604V0Z" fill="#2B00D8"/>
  </svg>`;
} catch (e) {
  // ignore — fallback to emoji-based SVGs already present in file
  console.warn('Could not pre-render lucide marker SVGs:', e);
}

export default function OrderDetails() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();

  // Use WebSocket for real-time agent tracking
  const { agentLocations, isConnected } = useWebSocket();

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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRefundOptions, setShowRefundOptions] = useState(false);
  const [refundType, setRefundType] = useState(''); // 'full' or 'partial'
  const [refundAmount, setRefundAmount] = useState('');
  const [refundError, setRefundError] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  // User authentication states
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Delivery agent assignment states
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [assigningAgentId, setAssigningAgentId] = useState(null);
  const [showAgentAssignment, setShowAgentAssignment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentEarnings, setAgentEarnings] = useState('');
  const [directions, setDirections] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentVerificationMeta, setPaymentVerificationMeta] = useState(null);

  const checkUser = async () => {
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

  useEffect(() => {
    checkUser();
  }, []);

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

      // Log coordinates used for distance calculation
      console.log('=== DISTANCE CALCULATION COORDINATES ===');
      console.log('Merchant Store Coordinates:', data.order?.merchantLandmark?.address?.coordinates);
      console.log('Customer Address Coordinates:', data.order?.deliveryAddress?.coordinates);

      // Fetch and log driving distance using the same coordinates
      if (data.order?.merchantLandmark?.address?.coordinates && data.order?.deliveryAddress?.coordinates) {
        try {
          const storeCoords = data.order.merchantLandmark.address.coordinates;
          const customerCoords = data.order.deliveryAddress.coordinates;
          const distanceUrl = `${import.meta.env.VITE_SERVER}/orders/distance-test?lat1=${storeCoords.latitude}&lon1=${storeCoords.longitude}&lat2=${customerCoords.latitude}&lon2=${customerCoords.longitude}`;
          console.log('Fetching driving distance from:', distanceUrl);

          const distanceResponse = await fetch(distanceUrl);
          if (distanceResponse.ok) {
            const distanceData = await distanceResponse.json();
            console.log('=== DRIVING DISTANCE CALCULATION RESULT ===');
            console.log('Driving distance (Google API):', distanceData.distanceKm, 'km');
            console.log('Duration:', distanceData.durationMinutes, 'minutes');
            console.log('Raw Google response:', distanceData.raw);
          } else {
            console.error('Failed to fetch driving distance:', distanceResponse.status, distanceResponse.statusText);
          }
        } catch (distanceErr) {
          console.error('Error fetching driving distance:', distanceErr);
        }
      }

      setOrder(data.order);

      // Calculate directions after order is loaded
      if (data.order?.merchantLandmark?.address?.coordinates && data.order?.deliveryAddress?.coordinates) {
        calculateDirections(data.order.merchantLandmark.address.coordinates, data.order.deliveryAddress.coordinates);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrderDetails();
    setIsRefreshing(false);
  };

  const verifyPaymentStatus = async () => {
    try {
      setVerifyingPayment(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/verify-payment-status`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (data.order) {
        await fetchOrderDetails();
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
        if (data.notifications?.merchantPushSent) notificationSummary.push('merchant notified');
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
    if (!agentEarnings || agentEarnings.trim() === '') {
      toast.error('Please enter earnings amount for the delivery agent');
      return;
    }

    const earningsAmount = parseFloat(agentEarnings);
    if (isNaN(earningsAmount) || earningsAmount <= 0) {
      toast.error('Please enter a valid earnings amount');
      return;
    }

    setAssigningAgentId(agentId);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/assign-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          deliveryAgentId: agentId,
          agentEarnings: earningsAmount
        })
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
      setShowAgentAssignment(false);
      setAgentEarnings('');
      toast.success('Delivery agent assigned successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAssigningAgentId(null);
    }
  };

  const reassignDeliveryAgent = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/unassign-agent`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to unassign delivery agent');
      }

      setOrder(data.order);
      toast.success('Delivery agent unassigned successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    setLoadingAgents(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        applicationStatus: 'approved',
        isActive: 'true',
        online: 'true',
        limit: '1000'
      });

      // Add merchant coordinates if available
      if (order?.merchantLandmark?.address?.coordinates) {
        params.append('merchantLat', order.merchantLandmark.address.coordinates.latitude);
        params.append('merchantLng', order.merchantLandmark.address.coordinates.longitude);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents?${params.toString()}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch delivery agents');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      setDeliveryAgents(data.agents || []);
    } catch (err) {
      toast.error('Failed to load delivery agents');
      console.error('Error fetching delivery agents:', err);
    } finally {
      setLoadingAgents(false);
    }
  };

  const exportToExcel = () => {
    if (!order) {
      toast.error('No order data available to export');
      return;
    }

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Order Summary Sheet
      const orderSummary = [
        ['Order Details Export'],
        [''],
        ['Order Information'],
        ['Order Number', order.orderNumber || 'N/A'],
        ['Order Date', order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'N/A'],
        ['Status', getStatusValue(order.status).replace('_', ' ').toUpperCase()],
        ['Source', order.source === 'website' ? 'Website' : 'Mobile App'],
        [''],
        ['Customer Information'],
        ['Name', order.customer?.name || 'N/A'],
        ['Email', order.customer?.email || 'N/A'],
        ['Phone', order.customer?.phone || 'N/A'],
        [''],
        ['Delivery Address'],
        ['Street', order.deliveryAddress?.street || 'N/A'],
        ['City', order.deliveryAddress?.city || 'N/A'],
        ['State', order.deliveryAddress?.state || 'N/A'],
        ['ZIP Code', order.deliveryAddress?.zipCode || 'N/A'],
        [''],
        ['Merchant Information'],
        ['Store Name', order.merchantLandmark?.name || 'N/A'],
        ['Store Phone', order.merchantLandmark?.phone || 'N/A'],
        ['Store Address', `${order.merchantLandmark?.address?.street || ''}, ${order.merchantLandmark?.address?.city || ''}`],
        [''],
        ['Delivery Information'],
        ['Estimated Time', `${order.deliveryInfo?.estimatedTime || 'N/A'} min`],
        ['Distance', `${order.deliveryInfo?.distance || 'N/A'} km`],
        ['Priority', order.deliveryInfo?.priority || 'N/A'],
        ['Instructions', order.deliveryInfo?.deliveryInstructions || 'N/A'],
        [''],
        ['Payment Information'],
        ['Method', order.payment?.method || order.paymentMethod || 'N/A'],
        ['Status', (order.payment?.status || order.paymentStatus || 'Unknown').toUpperCase()],
        ['Transaction ID', order.payment?.transactionId || 'N/A'],
        ['Paid At', order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleString('en-IN') : 'N/A'],
        [''],
        ['Pricing Summary'],
        ['Items Total', `₹${(order.pricing?.itemsTotal || 0).toFixed(2)}`],
        ['Delivery Fee', `₹${(order.pricing?.deliveryFee || 0).toFixed(2)}`],
        ['Taxes', `₹${(order.pricing?.taxes || 0).toFixed(2)}`],
        ['Tip', `₹${(order.pricing?.tip || 0).toFixed(2)}`],
        ['Discount', `₹${(order.pricing?.discount || 0).toFixed(2)}`],
        ['Coupon Discount', `₹${(order.pricing?.couponDiscount || 0).toFixed(2)}`],
        ['Total Amount', `₹${(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}`],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(orderSummary);
      XLSX.utils.book_append_sheet(wb, ws1, 'Order Summary');

      // Order Items Sheet
      const itemsHeaders = [['Item Name', 'Weight', 'Quantity', 'Unit Price', 'Total Price']];
      const itemsData = order.items?.map(item => [
        item.productId?.name || item.name || 'N/A',
        item.weightDimension ? `${item.weightDimension.value || ''} ${item.weightDimension.unit || ''}`.trim() || 'N/A' : 'N/A',
        item.quantity,
        `₹${item.price.toFixed(2)}`,
        `₹${(item.quantity * item.price).toFixed(2)}`
      ]) || [];

      const ws2 = XLSX.utils.aoa_to_sheet([...itemsHeaders, ...itemsData]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Order Items');

      // Order Timeline Sheet
      const timelineHeaders = [['Date & Time', 'Event', 'Description']];
      const timelineData = [];

      // Add order creation
      if (order.createdAt) {
        timelineData.push([
          new Date(order.createdAt).toLocaleString('en-IN'),
          'Order Placed',
          'Order has been placed successfully'
        ]);
      }

      // Add status history
      order.statusHistory?.forEach(status => {
        timelineData.push([
          new Date(status.timestamp).toLocaleString('en-IN'),
          status.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          status.note || `Order status changed to ${status.status.replace('_', ' ')}`
        ]);
      });

      // Add assignment events
      if (order.assignment?.assignedAt) {
        timelineData.push([
          new Date(order.assignment.assignedAt).toLocaleString('en-IN'),
          'Agent Assigned',
          assignedAgentInfo.name ? `Assigned to ${assignedAgentInfo.name}` : 'Delivery agent assigned'
        ]);
      }

      if (order.assignment?.acceptedAt) {
        timelineData.push([
          new Date(order.assignment.acceptedAt).toLocaleString('en-IN'),
          'Assignment Accepted',
          `${assignedAgentInfo.name || 'Delivery agent'} accepted the order`
        ]);
      }

      if (order.assignment?.pickedUpAt) {
        timelineData.push([
          new Date(order.assignment.pickedUpAt).toLocaleString('en-IN'),
          'Order Picked Up',
          'Order has been picked up by the delivery agent'
        ]);
      }

      if (order.assignment?.deliveredAt) {
        timelineData.push([
          new Date(order.assignment.deliveredAt).toLocaleString('en-IN'),
          'Order Delivered',
          'Order has been successfully delivered'
        ]);
      }

      const ws3 = XLSX.utils.aoa_to_sheet([...timelineHeaders, ...timelineData]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Order Timeline');

      // Generate filename with order number and date
      const fileName = `Order_${order.orderNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
      toast.success('Order details exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export order details to Excel');
    }
  };

  const getAgentDisplayInfo = (agent) => {
    if (!agent) {
      return { id: null, name: null, phone: null, agentId: null };
    }

    if (typeof agent === 'string') {
      return { id: agent, name: agent, phone: null, agentId: null };
    }

    const firstName = agent.personalInfo?.firstName || '';
    const lastName = agent.personalInfo?.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || agent.personalInfo?.phone || agent._id || 'Delivery Agent';

    return {
      id: agent._id || agent.id || null,
      agentId: agent.agentId || null, // For WebSocket lookup
      name,
      phone: agent.personalInfo?.phone || null
    };
  };

  const deleteOrder = () => {
    // Check if order is delivered and user is not super_admin
    if (order?.status?.current === 'delivered' && currentUser?.role !== 'super_admin') {
      toast.error('Product Delivered cannot be Deleted');
      return;
    }

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

  const confirmCancelOrder = async (cancelType = 'cancel_only', refundData = null) => {
    setUpdating(true);
    setShowCancelConfirm(false);
    setShowRefundOptions(false);
    
    try {
      const payload = { 
        status: 'cancelled',
        cancelType,
        notes: cancelReason || 'Cancelled by admin'
      };
      
      if (cancelType === 'cancel_and_refund' && refundData) {
        payload.refund = refundData;
      }
      
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      setOrder(data.order);
      toast.success(`Order cancelled successfully${cancelType === 'cancel_and_refund' ? ' with refund initiated' : ''}`);
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
      case 'payment_pending':
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
      case 'payment_pending':
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

  const assignedAgentInfo = getAgentDisplayInfo(order?.assignment?.deliveryAgent);
  const assignmentStatus = order?.assignment?.status || null;
  const isAssignmentAccepted = assignmentStatus === 'accepted';

  // Debug logging for agent locations
  useEffect(() => {
    if (assignedAgentInfo.agentId) {
      console.log('OrderDetails - Agent ID:', assignedAgentInfo.agentId);
      console.log('OrderDetails - Agent locations:', agentLocations);
      console.log('OrderDetails - Has live location:', !!agentLocations[assignedAgentInfo.agentId]);
    }
  }, [agentLocations, assignedAgentInfo.agentId]);

  // Authentication checks
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
        <p className="text-gray-600">You don't have permission to access this page.</p>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Key Metrics */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/orders')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')} • {new Date(order.createdAt).toLocaleTimeString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border text-sm ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="font-medium capitalize">{getStatusValue(order.status).replace('_', ' ')}</span>
              </div>

              {['super_admin', 'admin'].includes(currentUser?.role) && (
                <select
                  value={getStatusValue(order.status)}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  disabled={updating}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-sm w-full sm:w-auto"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packing">Packing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">₹{order.pricing?.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
                <IndianRupee className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Items</p>
                  <p className="text-2xl font-bold">{order.items?.length || 0}</p>
                </div>
                <Package className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Distance</p>
                  <p className="text-2xl font-bold">{order.deliveryInfo?.distance || 'N/A'} km</p>
                </div>
                <MapPin className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          {item.weightDimension && (
                            <p className="text-sm text-gray-600">
                              Weight: {item.weightDimension.value} {item.weightDimension.unit}
                            </p>
                          )}
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

            {/* Customer Feedback */}
            {(order.feedback?.deliveryRating || order.feedback?.foodRating) && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Customer Feedback
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Delivery Rating */}
                    {order.feedback.deliveryRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Delivery Rating:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= order.feedback.deliveryRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({order.feedback.deliveryRating}/5)</span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Comment */}
                    {order.feedback.deliveryComment && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Delivery Feedback:</span>
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">
                          {order.feedback.deliveryComment}
                        </p>
                      </div>
                    )}

                    {/* Food Rating */}
                    {order.feedback.foodRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Food Rating:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= order.feedback.foodRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({order.feedback.foodRating}/5)</span>
                        </div>
                      </div>
                    )}

                    {/* Food Comment */}
                    {order.feedback.foodComment && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Food Feedback:</span>
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-3 rounded-lg">
                          {order.feedback.foodComment}
                        </p>
                      </div>
                    )}

                    {/* Feedback Submitted Date */}
                    {order.feedback.submittedAt && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          Feedback submitted on {new Date(order.feedback.submittedAt).toLocaleDateString('en-IN')} at {new Date(order.feedback.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Timeline
                </h2>
              </div>
              <div className="p-6">
                <>
                  {(() => {
                    // Build status timeline events
                  const statusEvents = order.statusHistory?.map((status, index) => ({
                    timestamp: new Date(status.timestamp),
                    title: status.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    description: status.note || `Order status changed to ${status.status.replace('_', ' ')}`,
                    icon: getStatusIcon(status.status),
                    color: index === 0 ? 'green' : 'gray'
                  })) || [];

                  // Add order creation as "Order Confirmed" event at the beginning
                  if (order.createdAt) {
                    const orderConfirmedEvent = {
                      timestamp: new Date(order.createdAt),
                      title: 'Order Confirmed',
                      description: 'Order has been placed successfully',
                      icon: getStatusIcon('confirmed'),
                      color: 'green'
                    };
                    statusEvents.unshift(orderConfirmedEvent);
                  }

                  // Sort events by timestamp (most recent first for status history)
                  statusEvents.sort((a, b) => b.timestamp - a.timestamp);

                  if (statusEvents.length === 0) {
                    return (
                      <p className="text-gray-500 text-center py-8">No timeline data available</p>
                    );
                  }

                  return (
                    <div className="relative mb-6">
                      {/* Timeline line */}
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"></div>

                      <div className="space-y-6">
                        {statusEvents.map((event, index) => {
                          const colorClasses = {
                            green: 'bg-green-100 text-green-600 border-green-200',
                            gray: 'bg-gray-100 text-gray-600 border-gray-200'
                          };

                          return (
                            <div key={index} className="flex items-start space-x-4 relative">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${colorClasses[event.color]} relative z-10 bg-white`}>
                                {event.icon}
                              </div>
                              <div className="flex-1 min-w-0 pb-6">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                                  <span className="text-xs text-gray-500">
                                    {event.timestamp.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-6">
                  {/* Live Tracking Section */}
                  {(() => {
                    const hasTracking = !!order?.tracking;
                    const status = order?.status;
                    const statusValue = status ? getStatusValue(status) : null;
                    const assignmentStatus = order?.assignment?.status || null;
                    const isAssignmentAccepted = assignmentStatus === 'accepted';
                    const isDelivered = statusValue === 'delivered';
                    // Show live tracking from when agent accepts the order until delivery
                    const shouldShow = hasTracking && isAssignmentAccepted && !isDelivered;

                    console.log('Tracking Debug:', {
                      orderId: order?.id,
                      hasTracking,
                      status,
                      statusValue,
                      assignmentStatus,
                      isAssignmentAccepted,
                      isDelivered,
                      shouldShow,
                      trackingData: order?.tracking
                    });

                    return shouldShow;
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
                            {/* Live tracking indicator */}
                            <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-xs text-gray-600">
                                  {isConnected ? 'Live Tracking' : 'Offline'}
                                </span>
                              </div>
                              {assignedAgentInfo.agentId && (
                                <span className="text-xs text-gray-500">
                                  Agent: {assignedAgentInfo.name || assignedAgentInfo.agentId}
                                </span>
                              )}
                            </div>

                            <GoogleMap
                              center={
                                // Priority: Live agent location > static agent location > delivery address > store location > default
                                (assignedAgentInfo.agentId && agentLocations[assignedAgentInfo.agentId])
                                  ? {
                                    lat: agentLocations[assignedAgentInfo.agentId].latitude,
                                    lng: agentLocations[assignedAgentInfo.agentId].longitude
                                  }
                                  : order?.tracking?.agentLocation
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

                              {/* Agent Location Marker - Live Tracking */}
                              {assignedAgentInfo.agentId && agentLocations[assignedAgentInfo.agentId] && (
                                <Marker
                                  position={{
                                    lat: agentLocations[assignedAgentInfo.agentId].latitude,
                                    lng: agentLocations[assignedAgentInfo.agentId].longitude
                                  }}
                                  title={`${assignedAgentInfo.name || 'Delivery Agent'} - Live`}
                                  icon={{
                                    url: '/assets/bikerider.png',
                                    scaledSize: window.google && window.google.maps ? new window.google.maps.Size(40, 40) : undefined,
                                    anchor: window.google && window.google.maps ? new window.google.maps.Point(20, 40) : undefined
                                  }}
                                  rotation={agentLocations[assignedAgentInfo.agentId].heading}
                                  infoContent={`
                                <div style="max-width: 200px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px;">
                                  <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">${assignedAgentInfo.name || 'Delivery Agent'}</div>
                                  <div style="line-height: 1.4; color: #374151;">
                                    <div><strong>📍 Live Location</strong></div>
                                    <div>Lat: ${agentLocations[assignedAgentInfo.agentId].latitude?.toFixed(6) ?? 'N/A'}</div>
                                    <div>Lng: ${agentLocations[assignedAgentInfo.agentId].longitude?.toFixed(6) ?? 'N/A'}</div>
                                    <div>Accuracy: ${agentLocations[assignedAgentInfo.agentId].accuracy ? `${agentLocations[assignedAgentInfo.agentId].accuracy.toFixed(1)}m` : 'N/A'}</div>
                                    <div>Heading: ${typeof agentLocations[assignedAgentInfo.agentId].heading === 'number' ? `${agentLocations[assignedAgentInfo.agentId].heading.toFixed(1)}°` : 'N/A'}</div>
                                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
                                      Updated: ${agentLocations[assignedAgentInfo.agentId].timestamp ? new Date(agentLocations[assignedAgentInfo.agentId].timestamp).toLocaleString() : 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              `}
                                />
                              )}

                              {/* Static Agent Location Marker (fallback) */}
                              {(!assignedAgentInfo.id || !agentLocations[assignedAgentInfo.id]) && order?.tracking?.agentLocation && (
                                <Marker
                                  position={{
                                    lat: order.tracking.agentLocation.latitude,
                                    lng: order.tracking.agentLocation.longitude
                                  }}
                                  title="Delivery Agent (Last Known)"
                                  icon={{
                                    url: '/assets/bikerider.png',
                                    scaledSize: window.google && window.google.maps ? new window.google.maps.Size(32, 32) : undefined,
                                    anchor: window.google && window.google.maps ? new window.google.maps.Point(16, 32) : undefined
                                  }}
                                  infoContent={`
                                <div style="max-width: 200px;">
                                  <strong>Delivery Agent (Last Known)</strong><br/>
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
                              {directions && <DirectionsRenderer directions={directions} />}
                            </GoogleMap>
                          </div>

                          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span>Store Location</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-3 h-3 rounded-full ${assignedAgentInfo.agentId && agentLocations[assignedAgentInfo.agentId] ? 'bg-blue-500 animate-pulse' : 'bg-blue-400'}`}></div>
                              <span>Delivery Agent {assignedAgentInfo.agentId && agentLocations[assignedAgentInfo.agentId] ? '(Live)' : '(Last Known)'}</span>
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
                </>
              </div>
            </div>

            {/* Delivery Agent Assignment */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Agent Assignment
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer disabled:opacity-50"
                      title="Refresh assignment status"
                    >
                      <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    {!isAssignmentAccepted && (
                      <button
                        onClick={() => {
                          setShowAgentAssignment(!showAgentAssignment);
                          if (!showAgentAssignment && deliveryAgents.length === 0) {
                            fetchDeliveryAgents();
                          }
                          if (!showAgentAssignment) {
                            setAgentEarnings('');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-none hover:bg-blue-700 transition-colors"
                      >
                        {showAgentAssignment ? 'Hide Agents' : 'Assign Agent'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {order.assignment?.deliveryAgent ? (
                  <div className="p-3 bg-green-50 rounded-none">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Delivery Agent Assigned</span>
                      </div>
                      {order.status?.current !== 'delivered' && (
                        <button
                          onClick={() => {
                            setOrder(prev => ({ ...prev, assignment: null }));
                          }}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Reassign
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-green-700">
                      {assignedAgentInfo.name && (
                        <p className="text-xs uppercase tracking-wide text-green-600">Assigned Driver</p>
                      )}
                      {assignedAgentInfo.name && (
                        <p className="font-medium">{assignedAgentInfo.name}</p>
                      )}
                      {assignedAgentInfo.phone && (
                        <p className="text-green-600">Phone: {assignedAgentInfo.phone}</p>
                      )}
                      {isAssignmentAccepted ? (
                        <p className="text-green-700 font-medium">
                          {assignedAgentInfo.name || 'Delivery agent'} accepted this order
                          {order.assignment?.acceptedAt ? ` on ${new Date(order.assignment.acceptedAt).toLocaleString('en-IN')}` : ''}.
                        </p>
                      ) : (
                        <p className="text-yellow-700">
                          Awaiting confirmation from the assigned driver.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-none">
                    <p className="text-yellow-800 font-medium">No delivery agent assigned</p>
                    <p className="text-yellow-600 text-sm">Use “Assign Agent” to choose a driver.</p>
                  </div>
                )}
              </div>

              {!isAssignmentAccepted && showAgentAssignment && (
                <div className="px-6 pb-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Agent Earnings (₹)
                    </label>
                    <input
                      type="number"
                      value={agentEarnings}
                      onChange={(e) => setAgentEarnings(e.target.value)}
                      placeholder="Enter earnings amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {loadingAgents ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading delivery agents...</p>
                    </div>
                  ) : deliveryAgents.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">Available Delivery Agents:</h3>
                        {order?.merchantLandmark?.address?.coordinates && (
                          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                            Sorted by distance from store
                          </span>
                        )}
                      </div>
                      {deliveryAgents.map((agent) => (
                        <div key={agent._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-none hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-none flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {agent.personalInfo.firstName} {agent.personalInfo.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{agent.personalInfo.phone}</p>
                              <p className="text-xs text-gray-500">
                                Rating: {agent.status.rating?.toFixed(1) || 'N/A'} •
                                Deliveries: {agent.status.completedDeliveries || 0}
                                {agent.distance !== null && agent.distance !== undefined && (
                                  <> • Distance: {agent.distance.toFixed(1)} km</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${agent.status.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {agent.status.isOnline ? 'Online' : 'Offline'}
                            </span>
                            <button
                              onClick={() => assignDeliveryAgent(agent._id)}
                              disabled={assigningAgentId !== null}
                              className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-none hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {assigningAgentId === agent._id ? 'Assigning...' : 'Assign'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No delivery agents available in this zone</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Ratings */}
            {order.status?.current === 'delivered' && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Delivery Ratings
                  </h2>
                </div>
                <div className="p-6">
                  {assignedAgentInfo.name && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">{assignedAgentInfo.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-800">
                            {assignedAgentInfo.rating || '5.0'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Current average rating from all deliveries
                      </p>
                    </div>
                  )}

                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Customer ratings will appear here once submitted
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Ratings help improve delivery service quality
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Information */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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

                <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                  <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                    {order.source === 'website' ? '🌐' : '📱'}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Source</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                      order.source === 'website'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {order.source === 'website' ? '🌐 Website' : '📱 Mobile App'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Merchant/Store Information */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-3 bg-green-50 rounded-none">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    {order.deliveryInfo?.distance || 'N/A'} km
                  </p>
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
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Assignment Timeline
                </h2>
              </div>
              <div className="p-6">
                {(() => {
                  // Build timeline events
                  const events = [];

                  // Order Placed
                  if (order.createdAt) {
                    events.push({
                      timestamp: new Date(order.createdAt),
                      title: 'Order Placed',
                      description: `Order #${order.orderNumber} was created`,
                      icon: Package,
                      color: 'blue'
                    });
                  }

                  // Agent Assigned
                  if (order.assignment?.assignedAt) {
                    events.push({
                      timestamp: new Date(order.assignment.assignedAt),
                      title: 'Agent Assigned',
                      description: assignedAgentInfo.name ? `Assigned to ${assignedAgentInfo.name}` : 'Delivery agent assigned',
                      icon: User,
                      color: 'yellow'
                    });
                  }

                  // Rejections
                  if (order.assignment?.rejectedBy && order.assignment.rejectedBy.length > 0) {
                    order.assignment.rejectedBy.forEach((rejection, index) => {
                      events.push({
                        timestamp: new Date(rejection.rejectedAt),
                        title: 'Assignment Rejected',
                        description: `${rejection.agentName || 'Agent'} rejected the assignment${rejection.reason ? ` (${rejection.reason})` : ''}`,
                        icon: XCircle,
                        color: 'red'
                      });
                    });
                  }

                  // Agent Accepted
                  if (order.assignment?.acceptedAt) {
                    events.push({
                      timestamp: new Date(order.assignment.acceptedAt),
                      title: 'Assignment Accepted',
                      description: `${assignedAgentInfo.name || 'Delivery agent'} accepted the order`,
                      icon: CircleCheck,
                      color: 'green'
                    });
                  }

                  // Picked Up
                  if (order.assignment?.pickedUpAt) {
                    events.push({
                      timestamp: new Date(order.assignment.pickedUpAt),
                      title: 'Order Picked Up',
                      description: 'Order has been picked up by the delivery agent',
                      icon: Package,
                      color: 'purple'
                    });
                  }

                  // Delivered
                  if (order.assignment?.deliveredAt) {
                    events.push({
                      timestamp: new Date(order.assignment.deliveredAt),
                      title: 'Order Delivered',
                      description: 'Order has been successfully delivered',
                      icon: CircleCheck,
                      color: 'green'
                    });
                  }

                  // Sort events by timestamp
                  events.sort((a, b) => a.timestamp - b.timestamp);

                  if (events.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No assignment events yet</p>
                      </div>
                    );
                  }

                  return (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-6">
                        {events.map((event, index) => {
                          const IconComponent = event.icon;
                          const colorClasses = {
                            blue: 'bg-blue-100 text-blue-600 border-blue-200',
                            yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
                            red: 'bg-red-100 text-red-600 border-red-200',
                            green: 'bg-green-100 text-green-600 border-green-200',
                            purple: 'bg-purple-100 text-purple-600 border-purple-200'
                          };

                          return (
                            <div key={index} className="flex items-start space-x-4 relative">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${colorClasses[event.color]} relative z-10 bg-white`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 pb-6">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                                  <span className="text-xs text-gray-500">
                                    {event.timestamp.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Delivery Time Details */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.assignment?.estimatedDeliveryTime && (
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-800">Estimated Delivery Time</span>
                        </div>
                        <p className="text-sm text-indigo-700">
                          {new Date(order.assignment.estimatedDeliveryTime).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}

                    {order.assignment?.actualDeliveryTime && (
                      <div className="p-3 bg-teal-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="w-4 h-4 text-teal-600" />
                          <span className="text-sm font-medium text-teal-800">Actual Delivery Time</span>
                        </div>
                        <p className="text-sm text-teal-700">
                          {new Date(order.assignment.actualDeliveryTime).toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
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
                {(order.pricing?.smallCartFee || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Small Cart Fee</span>
                    <span className="font-medium">₹{(order.pricing?.smallCartFee || 0).toFixed(2)}</span>
                  </div>
                )}
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
                  {order.payment?.method !== 'cash' && (
                    <button
                      onClick={verifyPaymentStatus}
                      disabled={verifyingPayment}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${verifyingPayment ? 'animate-spin' : ''}`} />
                      {verifyingPayment ? 'Verifying...' : 'Verify Payment'}
                    </button>
                  )}

                  <div className="p-3 bg-gray-50 rounded-none">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Payment Method</span>
                    </div>
                    <p className="font-medium text-gray-800 capitalize mt-1">
                      {order.payment?.method || order.paymentMethod || 'Not specified'}
                    </p>
                    <p className={`text-sm mt-1 ${(order.payment?.status || order.paymentStatus) === 'paid' ? 'text-green-600' :
                      ['pending', 'payment_pending'].includes(order.payment?.status || order.paymentStatus) ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      Status: {order.payment?.status || order.paymentStatus || 'Unknown'}
                    </p>
                  </div>

                  {paymentVerificationMeta?.gateway?.status && (
                    <div className="p-3 bg-blue-50 rounded-none">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-600">Gateway Status</span>
                      </div>
                      <p className="font-medium text-blue-800 mt-1 capitalize">
                        {paymentVerificationMeta.gateway.status.replace('_', ' ')}
                      </p>
                      {paymentVerificationMeta.checkedAt && (
                        <p className="text-xs text-blue-700 mt-1">
                          Last verified: {new Date(paymentVerificationMeta.checkedAt).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  )}

                  {paymentVerificationMeta?.message && (
                    <div className="p-3 bg-sky-50 rounded-none text-sm text-sky-800 border border-sky-100">
                      {paymentVerificationMeta.message}
                    </div>
                  )}

                  {paymentVerificationMeta?.notifications && (
                    <div className="p-3 bg-green-50 rounded-none text-sm text-green-800 border border-green-100 space-y-1">
                      <div>Telegram: {paymentVerificationMeta.notifications.telegramSent ? 'Sent' : 'Not sent'}</div>
                      <div>Merchant push: {paymentVerificationMeta.notifications.merchantPushSent ? 'Sent' : 'Not sent'}</div>
                      <div>Customer push: {paymentVerificationMeta.notifications.customerPushSent ? 'Sent' : 'Not sent'}</div>
                    </div>
                  )}

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
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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

                  {/* Star Rating Display */}
                  {order.deliveryAgent.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.floor(order.deliveryAgent.rating)
                              ? 'text-yellow-400 fill-current'
                              : star === Math.ceil(order.deliveryAgent.rating) && order.deliveryAgent.rating % 1 !== 0
                              ? 'text-yellow-400 fill-current opacity-50'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {order.deliveryAgent.rating}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Agent Earnings */}
            {order.earnings && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" />
                    Agent Earnings
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-green-50 rounded-none">
                      <div className="flex items-center gap-2 mb-1">
                        <IndianRupee className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Base Delivery Fee</span>
                      </div>
                      <p className="text-lg font-semibold text-green-900">
                        ₹{order.earnings.deliveryFee || 0}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-none">
                    <div className="flex items-center gap-2 mb-1">
                      <IndianRupee className="w-4 h-4 text-gray-600" />
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
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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

                  {order.tracking.pickupOTP && (
                    <div className="p-3 bg-orange-50 rounded-none">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Merchant Pickup OTP</span>
                      </div>
                      <p className="text-lg font-mono font-bold text-orange-900">
                        {order.tracking.pickupOTP}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Share this OTP with the delivery agent for pickup verification
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
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-none">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Cancelled By</span>
                      </div>
                      <p className="text-sm text-gray-700 capitalize">
                        {order.cancellation.cancelledByName || order.cancellation.cancelledBy || 'Unknown'}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-yellow-50 rounded-none">
                      <div className="flex items-center gap-2 mb-1">
                        <IndianRupee className="w-4 h-4 text-yellow-600" />
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
                        order.cancellation.refundStatus === 'pending' ? 'text-yellow-600' : 
                        order.cancellation.refundStatus === 'not_applicable' ? 'text-gray-600' : 'text-red-600'
                        }`}>
                        {order.cancellation.refundStatus === 'not_applicable' ? 'Not Applicable' : 
                         order.cancellation.refundStatus || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Special Requests */}
            {order.specialRequests && order.specialRequests.length > 0 && (
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Customer Feedback
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Order Status & Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-600" />
                    Order Status
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusValue(order.status).replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-700">Order Age</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')} at {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {order.actualDeliveryDuration !== null && order.actualDeliveryDuration !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-700">Order to Delivery Time</span>
                        <span className="text-sm font-semibold text-green-900">
                          {formatTimeDuration(order.actualDeliveryDuration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-3">
                    {getStatusValue(order.status) === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus('confirmed')}
                        disabled={updating}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
                      >
                        <CircleCheck className="w-5 h-5" />
                        Confirm Order
                      </button>
                    )}

                    {!['delivered', 'cancelled'].includes(getStatusValue(order.status)) && (
                      <button
                        onClick={() => {
                          setShowCancelConfirm(true);
                          setCancelType('');
                          setRefundType('');
                          setRefundAmount('');
                          setRefundAmountError('');
                          setCancelReason('');
                        }}
                        disabled={updating}
                        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
                      >
                        <XCircle className="w-5 h-5" />
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
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 font-medium"
                    >
                      <Eye className="w-5 h-5" />
                      Print Order
                    </button>

                    <button
                      onClick={exportToExcel}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Export to Excel
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
                          </style>
                        </head>
                        <body>
                          <div class="invoice-content">
                            ${invoice.innerHTML}
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
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>

              {/* Show delete button only for super_admin or non-delivered orders */}
              {(currentUser?.role === 'super_admin' || order?.status?.current !== 'delivered') && (
                <div className="mt-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Danger Zone
                      </h3>

                      <div className="space-y-4">
                        <button
                          onClick={deleteOrder}
                          disabled={updating}
                          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-3 font-medium"
                        >
                          <Trash2 className="w-5 h-5" />
                          Delete Order
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50 min-h-screen">
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

        {/* Cancel Order Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50 min-h-screen">
            <div className="bg-white rounded-none shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Cancel Order</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to cancel order <strong>#{order.orderNumber}</strong>? Choose how you want to handle this cancellation.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reason for cancellation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      placeholder="Please provide a reason for cancelling this order..."
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      if (!cancelReason.trim()) {
                        alert('Please provide a reason for cancellation');
                        return;
                      }
                      setShowCancelConfirm(false);
                      setShowRefundOptions(true);
                    }}
                    disabled={updating}
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded-none hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium"
                  >
                    <IndianRupee className="w-5 h-5" />
                    Cancel and Refund
                  </button>
                  <button
                    onClick={() => {
                      if (!cancelReason.trim()) {
                        alert('Please provide a reason for cancellation');
                        return;
                      }
                      confirmCancelOrder('cancel_only');
                    }}
                    disabled={updating}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-none hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    {updating ? 'Cancelling...' : 'Cancel Only'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-none hover:bg-gray-300 transition-colors"
                    disabled={updating}
                  >
                    Keep Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Options Modal */}
        {showRefundOptions && (
          <div className="fixed inset-0 bg-gray-700 bg-opacity-50 flex items-center justify-center z-50 min-h-screen">
            <div className="bg-white rounded-none shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Refund Options</h3>
                    <p className="text-sm text-gray-600">Choose refund type for order #{order.orderNumber}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-4">Order Total: <strong>₹{order.pricing?.totalAmount?.toFixed(2) || '0.00'}</strong></p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setRefundType('full');
                        setRefundAmount(order.pricing?.totalAmount?.toString() || '0');
                        confirmCancelOrder('cancel_and_refund', { type: 'full', amount: order.pricing?.totalAmount || 0 });
                      }}
                      disabled={updating}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-none hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium"
                    >
                      <CircleCheck className="w-5 h-5" />
                      Full Refund (₹{order.pricing?.totalAmount?.toFixed(2) || '0.00'})
                    </button>
                    
                    <button
                      onClick={() => setRefundType('partial')}
                      disabled={updating}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium"
                    >
                      <IndianRupee className="w-5 h-5" />
                      Partial Refund
                    </button>
                  </div>

                  {refundType === 'partial' && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Refund Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => {
                          setRefundAmount(e.target.value);
                          setRefundError('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter refund amount"
                        min="0"
                        max={order.pricing?.totalAmount || 0}
                        step="0.01"
                      />
                      {refundError && (
                        <p className="text-sm text-red-600">{refundError}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            const amount = parseFloat(refundAmount);
                            const maxAmount = order.pricing?.totalAmount || 0;
                            
                            if (!refundAmount || amount <= 0) {
                              setRefundError('Please enter a valid refund amount');
                              return;
                            }
                            
                            if (amount > maxAmount) {
                              setRefundError(`Refund amount cannot exceed ₹${maxAmount.toFixed(2)}`);
                              return;
                            }
                            
                            confirmCancelOrder('cancel_and_refund', { type: 'partial', amount: amount });
                          }}
                          disabled={updating}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-none hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Processing...' : 'Confirm Partial Refund'}
                        </button>
                        <button
                          onClick={() => {
                            setRefundType('');
                            setRefundAmount('');
                            setRefundError('');
                          }}
                          className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-none hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowRefundOptions(false);
                    setRefundType('');
                    setRefundAmount('');
                    setRefundError('');
                  }}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-none hover:bg-gray-300 transition-colors"
                  disabled={updating}
                >
                  Back to Cancel Options
                </button>
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
                <svg width="94" height="19" viewBox="0 0 94 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: '50px', width: 'auto' }}>
                  <path d="M34.045 10.2002C34.9949 9.78811 35.7289 9.1873 36.2458 8.39777C36.7628 7.60823 37.0217 6.66142 37.0217 5.55732C37.0217 4.45323 36.7628 3.52424 36.2458 2.72737C35.7289 1.93049 34.9949 1.32025 34.045 0.893504C33.095 0.467804 31.9626 0.253906 30.6498 0.253906H24.2988V14.9259H27.715V10.8178H30.6498C30.7001 10.8178 30.7484 10.8157 30.7987 10.8146L33.6476 14.9259H37.2944L34.025 10.2075C34.0313 10.2044 34.0387 10.2023 34.046 10.1991L34.045 10.2002ZM32.8087 7.44361C32.2771 7.89133 31.4949 8.11467 30.4611 8.11467H27.715V3.022H30.4611C31.4949 3.022 32.2771 3.24219 32.8087 3.68257C33.3393 4.12295 33.6056 4.74787 33.6056 5.55837C33.6056 6.36888 33.3403 6.99799 32.8087 7.44466V7.44361Z" fill="#189C15" />
                  <path d="M54.2456 4.54848C53.8472 3.62578 53.2852 2.82262 52.5586 2.13793C51.8319 1.45325 50.9826 0.925843 50.0117 0.555716C49.0407 0.185588 47.9754 0 46.8157 0C45.6561 0 44.5907 0.188733 43.6188 0.566201C42.6478 0.943668 41.7985 1.47422 41.0719 2.1589C40.3452 2.84359 39.7832 3.64361 39.3848 4.55897C38.9863 5.47433 38.7871 6.48405 38.7871 7.5871C38.7871 8.69014 38.9863 9.68309 39.3848 10.6047C39.7832 11.5264 40.3452 12.3306 41.0719 13.0153C41.7985 13.7 42.651 14.2305 43.6292 14.608C44.6075 14.9855 45.676 15.1742 46.8357 15.1742C47.9953 15.1742 49.0397 14.9886 50.0106 14.6185C50.9816 14.2483 51.8309 13.7209 52.5575 13.0363C53.2841 12.3516 53.8462 11.5453 54.2446 10.6152C54.643 9.68624 54.8423 8.67651 54.8423 7.5871C54.8423 6.49768 54.643 5.47013 54.2446 4.54848H54.2456ZM51.0592 9.48387C50.8285 10.0501 50.5034 10.546 50.084 10.9717C49.6646 11.3985 49.1791 11.7267 48.6276 11.9573C48.075 12.188 47.4711 12.3033 46.8147 12.3033C46.1583 12.3033 45.5502 12.188 44.9913 11.9573C44.4324 11.7267 43.9469 11.3985 43.5349 10.9717C43.1228 10.546 42.8009 10.0501 42.5702 9.48387C42.3395 8.91767 42.2242 8.28646 42.2242 7.5871C42.2242 6.88773 42.3395 6.25652 42.5702 5.69032C42.8009 5.12412 43.1217 4.62817 43.5349 4.20247C43.9469 3.77677 44.4324 3.44754 44.9913 3.21686C45.5502 2.98619 46.1583 2.87085 46.8147 2.87085C47.4711 2.87085 48.075 2.98619 48.6276 3.21686C49.1791 3.44754 49.6646 3.77572 50.084 4.20247C50.5034 4.62922 50.8285 5.12517 51.0592 5.69032C51.2898 6.25652 51.4052 6.88878 51.4052 7.5871C51.4052 8.28541 51.2898 8.91767 51.0592 9.48387Z" fill="#189C15" />
                  <path d="M58.6781 0.123047L58.1538 2.84815H63.2885L61.8845 9.97495C61.7303 10.7582 61.4514 11.3307 61.0456 11.6935C60.6399 12.0573 60.1093 12.2387 59.4529 12.2387C58.8941 12.2387 58.3981 12.1097 57.9651 11.8508C57.532 11.5928 57.1682 11.2112 56.8756 10.7089L54.6328 12.8468C55.0942 13.5598 55.7264 14.104 56.5296 14.4815C57.3328 14.859 58.287 15.0477 59.3911 15.0477C60.4952 15.0477 61.3959 14.8768 62.1791 14.5339C62.9613 14.1921 63.6114 13.6395 64.1283 12.8783C64.6453 12.1171 65.0227 11.0864 65.2597 9.78726L67.188 0.125144H58.6781V0.123047Z" fill="#189C15" />
                  <path d="M81.8814 0.310526L80.4008 2.98425L80.3945 3.02095H85.0689L82.6992 14.9269H86.1164L88.484 3.02095H93.1583L93.7235 0.253906L81.8814 0.310526Z" fill="#189C15" />
                  <path d="M78.292 2.98006L79.8669 0.253906H69.4602L66.5254 14.9269H75.2932L76.866 12.2018H70.4448L71.1243 8.80669H76.8188L78.355 6.14554H71.6569L72.2892 2.98006H78.292Z" fill="#189C15" />
                  <path d="M4.84962 8.04521H7.2927C7.2927 7.70759 7.31892 7.37521 7.37029 7.04492H4.15234L4.84857 8.04521H4.84962Z" fill="#189C15" />
                  <path d="M2.7763 5.0667H7.55028C7.64046 4.72593 7.74636 4.3925 7.86589 4.06641H2.08008L2.7763 5.0667Z" fill="#189C15" />
                  <path d="M9.11386 1.08594H0L0.696227 2.08518H8.5854C8.74792 1.73602 8.92512 1.40154 9.11491 1.08594H9.11386Z" fill="#189C15" />
                  <path d="M11.7837 15.9332C11.5887 15.7769 11.3507 15.6752 11.0896 15.648C11.0424 15.6427 10.9942 15.6406 10.9459 15.6406C10.2025 15.6406 9.59961 16.2435 9.59961 16.9869C9.59961 17.7303 10.2025 18.3332 10.9459 18.3332C11.6893 18.3332 12.2922 17.7303 12.2922 16.9869C12.2922 16.5602 12.0941 16.1806 11.7837 15.9342V15.9332Z" fill="#189C15" />
                  <path d="M19.8092 18.3332C20.5528 18.3332 21.1555 17.7305 21.1555 16.9869C21.1555 16.2434 20.5528 15.6406 19.8092 15.6406C19.0657 15.6406 18.4629 16.2434 18.4629 16.9869C18.4629 17.7305 19.0657 18.3332 19.8092 18.3332Z" fill="#189C15" />
                  <path d="M13.0483 4.16997C13.4719 3.75266 13.9762 3.42971 14.5602 3.20009C15.1443 2.97046 15.7828 2.85617 16.478 2.85617C17.2288 2.85617 17.9166 2.99143 18.5426 3.263C19.1675 3.53352 19.7515 3.95502 20.2936 4.52437L22.441 2.52274C21.7322 1.7028 20.8598 1.07683 19.8249 0.645888C18.789 0.214946 17.6251 0 16.3323 0C15.1642 0 14.0947 0.184539 13.1217 0.55257C12.1486 0.920601 11.3003 1.44591 10.5779 2.1264C9.85547 2.80794 9.29555 3.60691 8.89921 4.52437C8.50286 5.44182 8.30469 6.44945 8.30469 7.54725C8.30469 8.64506 8.50286 9.65268 8.89921 10.5701C9.29555 11.4876 9.84813 12.2866 10.5569 12.9681C11.2657 13.6496 12.1067 14.1739 13.0797 14.5419C14.0528 14.91 15.116 15.0945 16.2694 15.0945C17.3116 15.0945 18.3538 14.9383 19.3971 14.6258C20.4394 14.3134 21.3642 13.851 22.1705 13.2397V7.31868H22.0961V7.22955H17.1669V9.93159H19.0847V11.6071C18.8613 11.7256 18.6348 11.8252 18.4073 11.9049C17.775 12.1272 17.125 12.2383 16.4581 12.2383C15.7912 12.2383 15.1275 12.1209 14.5508 11.8839C13.9741 11.648 13.474 11.3209 13.0493 10.9046C12.6257 10.4873 12.2986 9.99031 12.0689 9.41362C11.8393 8.83693 11.725 8.21516 11.725 7.54725C11.725 6.87935 11.8393 6.21983 12.0689 5.65048C12.2986 5.08113 12.6246 4.58728 13.0493 4.16997H13.0483Z" fill="#189C15" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Bill To:</h3>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order?.customer?.name || 'N/A'}</p>
                <p>{order?.customer?.phone || 'N/A'}</p>
                <p>{order?.customer?.email || 'N/A'}</p>
                <p className="pt-2 mt-2 border-t border-gray-300">
                  <strong>Source:</strong> {order?.source === 'website' ? 'Website' : 'Mobile App'}
                </p>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-3 py-2 text-left text-sm font-semibold">Item</th>
                    <th className="border border-gray-400 px-3 py-2 text-center text-sm font-semibold">Weight</th>
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
                      <td className="border border-gray-400 px-3 py-2 text-center text-sm">
                        {item.weightDimension ? 
                          `${item.weightDimension.value || ''} ${item.weightDimension.unit || ''}`.trim() || 'N/A'
                          : 'N/A'
                        }
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-center text-sm">{item.quantity}</td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-sm">₹{item.price?.toFixed(2) || '0.00'}</td>
                      <td className="border border-gray-400 px-3 py-2 text-right text-sm">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
