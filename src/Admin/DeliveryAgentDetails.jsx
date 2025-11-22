import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Truck,
  Star,
  Clock,
  DollarSign,
  FileText,
  Camera,
  AlertCircle,
  CircleCheck,
  XCircle,
  Edit3,
  Save,
  X,
  Calendar,
  Award,
  TrendingUp,
  Package,
  Navigation,
  Shield,
  Eye,
  RefreshCw,
  CheckSquare,
  LogOut,
  Download,
  Smartphone,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';
import { useWebSocket } from '../context/WebSocketContext';
import * as XLSX from 'xlsx';

export default function DeliveryAgentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { agentLocations, isConnected } = useWebSocket();

  // Debug: Log when agentLocations changes
  useEffect(() => {
    console.log('🔄 DeliveryAgentDetails - agentLocations updated:', agentLocations);
  }, [agentLocations]);

  // Live location updates state
  const [liveLocationLog, setLiveLocationLog] = useState([]);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null);

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [agentStats, setAgentStats] = useState(null);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];
  const [availableZones, setAvailableZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zoneNames, setZoneNames] = useState({});

  // Handle live location updates for this agent
  useEffect(() => {
    if (agentLocations[id] && agent) {
      const liveLocation = agentLocations[id];
      const now = new Date();

      // Update map center to follow live location
      setMapCenter({
        lat: liveLocation.latitude,
        lng: liveLocation.longitude
      });

      // Update last live update timestamp
      setLastLiveUpdate(now);

      // Add to location log (keep last 10 entries)
      const newLogEntry = {
        timestamp: now,
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        accuracy: liveLocation.accuracy,
        heading: liveLocation.heading,
        speed: liveLocation.speed
      };

      setLiveLocationLog(prev => {
        const updated = [newLogEntry, ...prev].slice(0, 10);
        return updated;
      });

      console.log('📍 Live location update for agent', id, ':', liveLocation);
    }
  }, [agentLocations[id], agent, id]);

  // Emergency contact editing state
  const [emergencyContactEdit, setEmergencyContactEdit] = useState({
    name: '',
    phone: '',
    relationship: ''
  });

  // Address editing state
  const [addressEdit, setAddressEdit] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: ''
  });

  // Full name editing state
  const [fullNameEdit, setFullNameEdit] = useState({
    firstName: '',
    lastName: ''
  });

  // Bank account editing state
  const [bankAccountEdit, setBankAccountEdit] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: ''
  });

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Status change dropdown state
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Handle keyboard events for editing
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (editingField) {
        if (e.key === 'Enter') {
          saveEditing();
        } else if (e.key === 'Escape') {
          cancelEditing();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [editingField, editValue]);

  // Handle clicking outside status dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown && !event.target.closest('.status-dropdown')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  // Fetch agent details on component mount
  useEffect(() => {
    fetchAgentDetails();
    fetchAgentOrders();
    fetchAgentStats();
    fetchDeliveryZones();
  }, []);

  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agent details');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setAgent(data.agent);

      // Set initial map center
      if (data.agent?.status?.currentLocation) {
        setMapCenter({
          lat: data.agent.status.currentLocation.latitude,
          lng: data.agent.status.currentLocation.longitude
        });
      }

      // Fetch zone name if delivery zone exists
      if (data.agent?.status?.deliveryZone) {
        await fetchZoneName(data.agent.status.deliveryZone);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/orders`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setRecentOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch agent orders:', err);
    }
  };

  const fetchAgentStats = async () => {
    setRefreshingStats(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/stats`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setAgentStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch agent stats:', err);
    } finally {
      setRefreshingStats(false);
    }
  };

  const fetchDeliveryZones = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setAvailableZones(data.zones || []);
      } else {
        console.error('Failed to fetch delivery zones');
        setAvailableZones([]);
      }
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      setAvailableZones([]);
    } finally {
      setZonesLoading(false);
    }
  };

  const fetchZoneName = async (zoneId) => {
    if (!zoneId || zoneNames[zoneId]) return zoneNames[zoneId];

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones/${zoneId}/name`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return null;
        }
        setZoneNames(prev => ({ ...prev, [zoneId]: data.name }));
        return data.name;
      }
    } catch (error) {
      console.error('Error fetching zone name:', error);
    }
    return null;
  };

  const updateAgentStatus = async (newStatus) => {
    if (!isAuthorized) return;
    const loadingToast = toast.loading('Updating agent status...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ applicationStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setAgent(data.agent);
      toast.success(`Application ${newStatus} successfully`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const approveApplication = async () => {
    if (!isAuthorized) return;
    const loadingToast = toast.loading('Approving application...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to approve application');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setAgent(data.agent);
      toast.success('Application approved successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const rejectApplication = async () => {
    const loadingToast = toast.loading('Rejecting application...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          rejectionReason: 'Application rejected by admin'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setAgent(data.agent);
      toast.success('Application rejected successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const clearLoginInfo = async () => {
    if (!isAuthorized) return;

    const confirmClear = window.confirm(
      'Are you sure you want to clear the login session for this delivery agent? This will force them to log out from their mobile app.'
    );

    if (!confirmClear) return;

    const loadingToast = toast.loading('Clearing login session...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/clear-login`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to clear login session');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      // Refresh agent data to get updated status
      await fetchAgentDetails();

      toast.success('Login session cleared successfully. Agent has been logged out.');
    } catch (err) {
      toast.error(err.message || 'Failed to clear login session');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const forceAgentOffline = async () => {
    if (currentUser?.role !== 'super_admin') {
      toast.error('Only super admin can force agents offline');
      return;
    }
    const loadingToast = toast.loading('Forcing agent offline...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/force-offline`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to force agent offline');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      // Update agent data with the response
      setAgent(prevAgent => ({
        ...prevAgent,
        status: data.agent.status,
        authentication: data.agent.authentication
      }));

      toast.success('Agent forced offline successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to force agent offline');
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Copied to clipboard!');
    }
  };

  const updateAgentDetails = async (updateData) => {
    if (!isAuthorized) return;
    const loadingToast = toast.loading('Updating agent details...');
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update agent details');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setAgent(data.agent);
      toast.success('Agent details updated successfully');
      setEditingField(null);
      setEditValue('');
      setEmergencyContactEdit({
        name: '',
        phone: '',
        relationship: ''
      });
      setAddressEdit({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: ''
      });
      setFullNameEdit({
        firstName: '',
        lastName: ''
      });
      setBankAccountEdit({
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: ''
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const deleteDeliveryAgent = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteDeliveryAgent = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      toast.error('Please type "DELETE" exactly as shown to confirm');
      return;
    }

    try {
      setLoading(true);
      setShowDeleteModal(false);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete delivery agent');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      toast.success('Delivery agent deleted successfully');
      navigate('/delivery-agents'); // Redirect back to agents list
    } catch (err) {
      toast.error(err.message || 'Failed to delete delivery agent');
    } finally {
      setLoading(false);
      setDeleteConfirmationText('');
    }
  };

  const cancelDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmationText('');
  };

  const startEditing = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');

    // Initialize emergency contact editing state
    if (field === 'emergencyContact.edit') {
      setEmergencyContactEdit({
        name: agent.emergencyContact?.name || '',
        phone: agent.emergencyContact?.phone || '',
        relationship: agent.emergencyContact?.relationship || ''
      });
    }

    // Initialize address editing state
    if (field === 'address.edit') {
      setAddressEdit({
        street: agent.address?.street || '',
        city: agent.address?.city || '',
        state: agent.address?.state || '',
        zipCode: agent.address?.zipCode || '',
        landmark: agent.address?.landmark || ''
      });
    }

    // Initialize full name editing state
    if (field === 'personalInfo.firstName') {
      setFullNameEdit({
        firstName: agent.personalInfo?.firstName || '',
        lastName: agent.personalInfo?.lastName || ''
      });
    }

    // Initialize bank account editing state
    if (field === 'bankAccount.edit') {
      setBankAccountEdit({
        accountNumber: agent.documents?.bankAccount?.accountNumber || '',
        ifscCode: agent.documents?.bankAccount?.ifscCode || '',
        bankName: agent.documents?.bankAccount?.bankName || '',
        accountHolderName: agent.documents?.bankAccount?.accountHolderName || ''
      });
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
    setEmergencyContactEdit({
      name: '',
      phone: '',
      relationship: ''
    });
    setAddressEdit({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: ''
    });
    setFullNameEdit({
      firstName: '',
      lastName: ''
    });
    setBankAccountEdit({
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      accountHolderName: ''
    });
  };

  const saveEditing = () => {
    if (!editingField) {
      toast.error('Please select a field to edit');
      return;
    }

    // Special validation for address editing
    if (editingField === 'address.edit') {
      if (!addressEdit.street.trim() || !addressEdit.city.trim() || !addressEdit.state.trim()) {
        toast.error('Please fill in street, city, and state');
        return;
      }
    } else if (editingField === 'emergencyContact.edit') {
      if (!emergencyContactEdit.name.trim() || !emergencyContactEdit.phone.trim()) {
        toast.error('Please fill in emergency contact name and phone');
        return;
      }
    } else if (editingField === 'personalInfo.firstName') {
      if (!fullNameEdit.firstName.trim()) {
        toast.error('Please enter a first name');
        return;
      }
    } else if (editingField === 'bankAccount.edit') {
      if (!bankAccountEdit.accountNumber.trim() || !bankAccountEdit.ifscCode.trim() || !bankAccountEdit.bankName.trim() || !bankAccountEdit.accountHolderName.trim()) {
        toast.error('Please fill in all bank account details');
        return;
      }
    } else if (editingField === 'documents.documentsLink') {
      if (!editValue.trim()) {
        toast.error('Please enter a documents link');
        return;
      }
      // Basic URL validation
      try {
        new URL(editValue.trim());
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }
    } else if (!editValue.trim()) {
      toast.error('Please enter a value');
      return;
    }

    const updateData = {};

    if (editingField === 'personalInfo.firstName') {
      // Handle full name editing
      updateData.personalInfo = {
        firstName: fullNameEdit.firstName.trim(),
        lastName: fullNameEdit.lastName.trim()
      };
    } else if (editingField.startsWith('personalInfo.')) {
      const field = editingField.split('.')[1];
      updateData.personalInfo = { [field]: editValue.trim() };
    } else if (editingField.startsWith('address.')) {
      const field = editingField.split('.')[1];
      updateData.address = { [field]: editValue.trim() };
    } else if (editingField.startsWith('vehicleInfo.')) {
      const field = editingField.split('.')[1];
      updateData.vehicleInfo = { [field]: editValue.trim() };
    } else if (editingField.startsWith('emergencyContact.')) {
      const field = editingField.split('.')[1];
      updateData.emergencyContact = { [field]: editValue.trim() };
    } else if (editingField === 'address.edit') {
      // Handle address editing
      updateData.address = {
        street: addressEdit.street.trim(),
        city: addressEdit.city.trim(),
        state: addressEdit.state.trim(),
        zipCode: addressEdit.zipCode.trim(),
        landmark: addressEdit.landmark.trim()
      };
    } else if (editingField === 'emergencyContact.edit') {
      // Handle emergency contact editing
      updateData.emergencyContact = {
        name: emergencyContactEdit.name.trim(),
        phone: emergencyContactEdit.phone.trim(),
        relationship: emergencyContactEdit.relationship.trim()
      };
    } else if (editingField === 'bankAccount.edit') {
      // Handle bank account editing
      updateData.documents = {
        bankAccount: {
          accountNumber: bankAccountEdit.accountNumber.trim(),
          ifscCode: bankAccountEdit.ifscCode.trim(),
          bankName: bankAccountEdit.bankName.trim(),
          accountHolderName: bankAccountEdit.accountHolderName.trim()
        }
      };
    } else if (editingField === 'status.deliveryZone') {
      // Handle delivery zone editing
      updateData.status = { deliveryZone: editValue || null };
    } else if (editingField === 'documents.documentsLink') {
      // Handle documents link editing
      updateData.documents = { documentsLink: editValue.trim() };
    }

    updateAgentDetails(updateData);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CircleCheck className="w-5 h-5 text-green-500" />;
      case 'active':
        return <CircleCheck className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkingStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (hours) => {
    if (!hours || hours === 0) return '00:00:00';

    const absHours = Math.abs(hours);
    const totalSeconds = Math.floor(absHours * 3600);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatISTTime = (dateString) => {
    if (!dateString) return 'Not available';

    try {
      // Parse the UTC timestamp as-is (don't convert to IST)
      let utcString = dateString;
      if (dateString.includes('+00:00')) {
        utcString = dateString.replace('+00:00', 'Z');
      }

      const date = new Date(utcString);

      // Format in UTC timezone (no conversion to IST)
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      return formatter.format(date);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  const getDirectionFromHeading = (heading) => {
    if (heading === null || heading === undefined) return '';
    
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(heading / 22.5) % 16;
    return directions[index];
  };

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
    if (isAuthorized && id) {
      fetchAgentDetails();
      fetchAgentOrders();
      fetchAgentStats();
    }
  }, [id, isAuthorized]);

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
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-.293-1.035l-6-10a2 2 0 00-3.414 0l-6 10A2 2 0 004 13v6a2 2 0 002 2z" /></svg>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins and Super Admins can view delivery agent details.</p>
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

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Agent Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'The requested delivery agent could not be found.'}</p>
        <button
          onClick={() => navigate('/delivery-agents')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Agents
        </button>
      </div>
    );
  }

  // Export to Excel function
  const exportToExcel = () => {
    if (!agent) return;

    const data = [
      { Field: 'Agent ID', Value: agent.agentId || 'N/A' },
      { Field: 'Application Status', Value: agent.status?.applicationStatus || 'N/A' },
      { Field: 'Online Status', Value: agent.status?.isOnline ? 'Online' : 'Offline' },
      { Field: 'First Name', Value: agent.personalInfo?.firstName || 'N/A' },
      { Field: 'Last Name', Value: agent.personalInfo?.lastName || 'N/A' },
      { Field: 'Email', Value: agent.personalInfo?.email || 'N/A' },
      { Field: 'Phone', Value: agent.personalInfo?.phone || 'N/A' },
      { Field: 'Date of Birth', Value: agent.personalInfo?.dateOfBirth ? formatISTTime(agent.personalInfo.dateOfBirth).split(',')[0] : 'N/A' },
      { Field: 'Gender', Value: agent.personalInfo?.gender || 'N/A' },
      { Field: 'Street Address', Value: agent.personalInfo?.address?.street || 'N/A' },
      { Field: 'City', Value: agent.personalInfo?.address?.city || 'N/A' },
      { Field: 'State', Value: agent.personalInfo?.address?.state || 'N/A' },
      { Field: 'ZIP Code', Value: agent.personalInfo?.address?.zipCode || 'N/A' },
      { Field: 'Landmark', Value: agent.personalInfo?.address?.landmark || 'N/A' },
      { Field: 'Emergency Contact Name', Value: agent.emergencyContact?.name || 'N/A' },
      { Field: 'Emergency Contact Phone', Value: agent.emergencyContact?.phone || 'N/A' },
      { Field: 'Emergency Contact Relationship', Value: agent.emergencyContact?.relationship || 'N/A' },
      { Field: 'Vehicle Type', Value: agent.vehicleInfo?.vehicleType || 'N/A' },
      { Field: 'Vehicle Number', Value: agent.vehicleInfo?.vehicleNumber || 'N/A' },
      { Field: 'Vehicle Model', Value: agent.vehicleInfo?.vehicleModel || 'N/A' },
      { Field: 'Vehicle Color', Value: agent.vehicleInfo?.vehicleColor || 'N/A' },
      { Field: 'License Number', Value: agent.documents?.license?.number || 'N/A' },
      { Field: 'License Expiry', Value: agent.documents?.license?.expiryDate ? formatISTTime(agent.documents.license.expiryDate).split(',')[0] : 'N/A' },
      { Field: 'Bank Account Holder', Value: agent.documents?.bankAccount?.accountHolderName || 'N/A' },
      { Field: 'Bank Name', Value: agent.documents?.bankAccount?.bankName || 'N/A' },
      { Field: 'Account Number', Value: agent.documents?.bankAccount?.accountNumber || 'N/A' },
      { Field: 'IFSC Code', Value: agent.documents?.bankAccount?.ifscCode || 'N/A' },
      { Field: 'Experience (Years)', Value: agent.workInfo?.experience || 'N/A' },
      { Field: 'Delivery Zone', Value: agent.status?.deliveryZone || 'N/A' },
      { Field: 'Rating', Value: agentStats?.averageRating || 'N/A' },
      { Field: 'Total Deliveries', Value: agentStats?.totalDeliveries || 'N/A' },
      { Field: 'Completed Deliveries', Value: agentStats?.completedDeliveries || 'N/A' },
      { Field: 'Cancelled Deliveries', Value: agentStats?.cancelledDeliveries || 'N/A' },
      { Field: 'Total Earnings', Value: agentStats?.totalEarnings || 'N/A' },
      { Field: 'Device Platform', Value: agent.authentication?.deviceInfo?.platform || 'N/A' },
      { Field: 'Device Name', Value: agent.authentication?.deviceInfo?.deviceName || 'N/A' },
      { Field: 'Device ID', Value: agent.authentication?.deviceInfo?.deviceId || 'N/A' },
      { Field: 'Push Token', Value: agent.authentication?.deviceInfo?.pushToken || 'N/A' },
      { Field: 'Device Last Activity', Value: agent.authentication?.deviceInfo?.lastActivity ? formatISTTime(agent.authentication.deviceInfo.lastActivity) : 'N/A' },
      { Field: 'Last Login', Value: agent.authentication?.lastLogin ? formatISTTime(agent.authentication.lastLogin) : 'N/A' },
      { Field: 'Created At', Value: agent.createdAt ? formatISTTime(agent.createdAt) : 'N/A' },
      { Field: 'Last Updated', Value: agent.updatedAt ? formatISTTime(agent.updatedAt) : 'N/A' },
      { Field: 'Current Latitude', Value: agentLocations[id]?.latitude || agent.status?.currentLocation?.latitude || 'N/A' },
      { Field: 'Current Longitude', Value: agentLocations[id]?.longitude || agent.status?.currentLocation?.longitude || 'N/A' },
      { Field: 'Live Location Available', Value: agentLocations[id] ? 'Yes' : 'No' },
      { Field: 'Live Location Accuracy', Value: agentLocations[id]?.accuracy ? `±${agentLocations[id].accuracy.toFixed(1)}m` : 'N/A' },
      { Field: 'Live Location Heading', Value: agentLocations[id]?.heading ? `${agentLocations[id].heading.toFixed(1)}°` : 'N/A' },
      { Field: 'Live Location Speed', Value: agentLocations[id]?.speed ? `${agentLocations[id].speed.toFixed(1)} km/h` : 'N/A' },
      { Field: 'Live Location Last Update', Value: agentLocations[id]?.timestamp ? formatISTTime(agentLocations[id].timestamp) : 'N/A' },
      { Field: 'Location Last Updated', Value: agent.status?.currentLocation?.lastUpdated ? formatISTTime(agent.status.currentLocation.lastUpdated) : 'N/A' }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // Field column
      { wch: 40 }  // Value column
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Agent Details');

    // Generate filename
    const fileName = `${agent.personalInfo?.firstName || 'Agent'}_${agent.personalInfo?.lastName || ''}_${agent.agentId || 'Details'}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);

    toast.success('Excel file downloaded successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/delivery-agents')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {agent.personalInfo?.firstName} {agent.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Delivery Agent ID: {agent.agentId}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getWorkingStatusColor(agent.status?.isOnline ? 'online' : 'offline')}`}>
            <div className={`w-2 h-2 rounded-full ${agent.status?.isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
            <span className="capitalize">{agent.status?.isOnline ? 'online' : 'offline'}</span>
          </div>

          <div className="relative">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer hover:opacity-80 transition-opacity status-dropdown ${getStatusColor(agent.status?.applicationStatus)}`}
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              {getStatusIcon(agent.status?.applicationStatus)}
              <span className="font-medium capitalize">{agent.status?.applicationStatus}</span>
              <Edit3 className="w-4 h-4 ml-1" />
            </div>

            {showStatusDropdown && (
              <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 status-dropdown">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Change Application Status</div>
                  {['pending', 'approved', 'rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateAgentStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2 ${
                        agent.status?.applicationStatus === status ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                      disabled={agent.status?.applicationStatus === status}
                    >
                      {getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <button
            onClick={() => {
              // Toggle edit mode or show edit modal
              toast('Click on individual fields to edit them');
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Details</span>
            <span className="sm:hidden">Edit</span>
          </button>

          {/* Clear Login Info Button */}
          <button
            onClick={clearLoginInfo}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            title="Clear login session and force logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Clear Login Info</span>
            <span className="sm:hidden">Clear</span>
          </button>

          {/* Export to Excel Button */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            title="Download agent details as Excel file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export to Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Full Name</label>
                    {editingField === 'personalInfo.firstName' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            maxLength={100}
                            value={fullNameEdit.firstName}
                            onChange={(e) => setFullNameEdit(prev => ({ ...prev, firstName: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="First Name"
                          />
                          <input
                            type="text"
                            maxLength={100}
                            value={fullNameEdit.lastName}
                            onChange={(e) => setFullNameEdit(prev => ({ ...prev, lastName: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Last Name"
                          />
                        </div>
                        <button
                          onClick={saveEditing}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">
                          {agent.personalInfo?.firstName} {agent.personalInfo?.lastName}
                        </p>
                        <button
                          onClick={() => startEditing('personalInfo.firstName', agent.personalInfo?.firstName)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Email</label>
                    {editingField === 'personalInfo.email' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="email"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Email"
                        />
                        <button
                          onClick={saveEditing}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{agent.personalInfo?.email}</p>
                        <button
                          onClick={() => startEditing('personalInfo.email', agent.personalInfo?.email)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Phone</label>
                    {editingField === 'personalInfo.phone' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          maxLength={10}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Phone"
                           onKeyDown={(e) => {
                           if (['e', 'E', '+', '-'].includes(e.key)) {
                           e.preventDefault();
                                 }
                              }}
                        />
                        <button
                          onClick={saveEditing}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{agent.personalInfo?.phone}</p>
                        <button
                          onClick={() => startEditing('personalInfo.phone', agent.personalInfo?.phone)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date of Birth</label>
                  <p className="font-medium text-gray-800">
                    {agent.personalInfo?.dateOfBirth ? formatISTTime(agent.personalInfo.dateOfBirth).split(',')[0] : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Gender</label>
                  <p className="font-medium text-gray-800 capitalize">
                    {agent.personalInfo?.gender || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Address</label>
                    {editingField === 'address.edit' ? (
                      <div className="space-y-3 mt-2">
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={addressEdit.street}
                          onChange={(e) => setAddressEdit(prev => ({ ...prev, street: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            maxLength={100}
                            placeholder="City"
                            value={addressEdit.city}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, city: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            maxLength={100}
                            placeholder="State"
                            value={addressEdit.state}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, state: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            maxLength={20}
                            placeholder="ZIP Code"
                            value={addressEdit.zipCode}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, zipCode: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            maxLength={100}
                            placeholder="Landmark (optional)"
                            value={addressEdit.landmark}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, landmark: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updateData = {
                                address: {
                                  street: addressEdit.street.trim(),
                                  city: addressEdit.city.trim(),
                                  state: addressEdit.state.trim(),
                                  zipCode: addressEdit.zipCode.trim(),
                                  landmark: addressEdit.landmark.trim()
                                }
                              };
                              updateAgentDetails(updateData);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 inline mr-1" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {agent.address ?
                              `${agent.address.street}, ${agent.address.city}, ${agent.address.state} - ${agent.address.zipCode}`
                              : 'Not provided'
                            }
                          </p>
                          {agent.address?.landmark && (
                            <p className="text-sm text-gray-600">Landmark: {agent.address.landmark}</p>
                          )}
                        </div>
                        <button
                          onClick={() => startEditing('address.edit', agent.address ? `${agent.address.street},${agent.address.city},${agent.address.state}` : '')}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded ml-2"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Emergency Contact</label>
                    {editingField === 'emergencyContact.edit' ? (
                      <div className="space-y-3 mt-2">
                        <input
                          type="text"
                          maxLength={100}
                          placeholder="Contact Name"
                          value={emergencyContactEdit.name}
                          onChange={(e) => setEmergencyContactEdit(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="number"
                          maxLength={10}
                          placeholder="Contact Phone"
                          value={emergencyContactEdit.phone}
                          onChange={(e) => setEmergencyContactEdit(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                           onKeyDown={(e) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) {
                           e.preventDefault();
                           }
                           }}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Relationship
                          </label>
                          <select
                            value={emergencyContactEdit.relationship}
                            onChange={(e) => setEmergencyContactEdit(prev => ({ ...prev, relationship: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="">Select</option>
                            <option value="parent">Parent</option>
                            <option value="spouse">Spouse</option>
                            <option value="sibling">Sibling</option>
                            <option value="friend">Friend</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const updateData = {
                                emergencyContact: {
                                  name: emergencyContactEdit.name.trim(),
                                  phone: emergencyContactEdit.phone.trim(),
                                  relationship: emergencyContactEdit.relationship.trim()
                                }
                              };
                              updateAgentDetails(updateData);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 inline mr-1" />
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{agent.emergencyContact?.name || 'Not provided'}</p>
                          {agent.emergencyContact?.phone && (
                            <p className="text-sm text-gray-600">{agent.emergencyContact.phone}</p>
                          )}
                          {agent.emergencyContact?.relationship && (
                            <p className="text-sm text-gray-600 capitalize">Relationship: {agent.emergencyContact.relationship}</p>
                          )}
                        </div>
                        <button
                          onClick={() => startEditing('emergencyContact.edit', '')}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded ml-2"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Joining Date</label>
                  <p className="font-medium text-gray-800">
                    {formatISTTime(agent.createdAt).split(',')[0]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device Information
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Platform</label>
                  <p className="font-medium text-gray-800 capitalize">
                    {agent.authentication?.deviceInfo?.platform || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Device Name</label>
                  <p className="font-medium text-gray-800">
                    {agent.authentication?.deviceInfo?.deviceName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Device ID</label>
                  <p className="font-medium text-gray-800 text-xs">
                    {agent.authentication?.deviceInfo?.deviceId || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Push Token</label>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 text-xs break-all flex-1">
                      {agent.authentication?.deviceInfo?.pushToken || 'N/A'}
                    </p>
                    {agent.authentication?.deviceInfo?.pushToken && (
                      <button
                        onClick={() => copyToClipboard(agent.authentication.deviceInfo.pushToken)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        title="Copy push token"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Activity</label>
                  <p className="font-medium text-gray-800">
                    {agent.authentication?.deviceInfo?.lastActivity ? 
                      formatISTTime(agent.authentication.deviceInfo.lastActivity) : 
                      'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Login</label>
                  <p className="font-medium text-gray-800">
                    {agent.authentication?.lastLogin ? 
                      formatISTTime(agent.authentication.lastLogin) : 
                      'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Location - Always visible for monitoring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Current Location
                </h2>
                <button
                  onClick={fetchAgentDetails}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Refresh location data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {agent.status?.currentLocation?.latitude ? (
                <div className="space-y-4">
                  {/* Location Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-800">
                          Lat: {(agentLocations[id]?.latitude || agent.status.currentLocation.latitude).toFixed(6)}, 
                          Lng: {(agentLocations[id]?.longitude || agent.status.currentLocation.longitude).toFixed(6)}
                          {
                            (() => {
                              const liveHeading = agentLocations[id]?.heading;
                              if (typeof liveHeading === 'number' && !isNaN(liveHeading)) {
                                return ` • Heading: ${liveHeading.toFixed(1)}° ${getDirectionFromHeading(liveHeading)}`;
                              }
                              return ' • Heading: N/A';
                            })()
                          }
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {(() => {
                              const agentLoc = agentLocations[id];
                              const isLive = agentLoc && agentLoc.timestamp && (new Date() - new Date(agentLoc.timestamp)) < 300000; // 5 minutes
                              if (isLive) {
                                return `Live: ${formatISTTime(agentLoc.timestamp)}`;
                              } else if (agent.status.currentLocation.lastUpdated) {
                                return `Last updated: ${formatISTTime(agent.status.currentLocation.lastUpdated)}`;
                              }
                              return 'Location data unavailable';
                            })()}
                          </p>
                          {(() => {
                            const agentLoc = agentLocations[id];
                            const isLive = agentLoc && agentLoc.timestamp && (new Date() - new Date(agentLoc.timestamp)) < 300000;
                            if (isLive) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                  LIVE
                                </span>
                              );
                            } else if (agent.status?.isOnline) {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Online
                                </span>
                              );
                            } else {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Offline
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                    {agent.status.deliveryZone && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-600">Zone: {zoneNames[agent.status.deliveryZone] || 'Loading...'}</span>
                      </div>
                    )}
                  </div>

                  {/* Map View */}
                  <div className="h-48 sm:h-64 border border-gray-200 rounded-lg overflow-hidden relative">
                    {isConnected && agentLocations[id] && (
                      <>
                        <div className={`absolute top-2 right-2 z-10 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          'bg-green-500'
                        }`}>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          Live
                        </div>
                        <button
                          onClick={() => {
                            if (agentLocations[id]) {
                              setMapCenter({
                                lat: agentLocations[id].latitude,
                                lng: agentLocations[id].longitude
                              });
                            }
                          }}
                          className="absolute top-2 left-2 z-10 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
                        >
                          <Navigation size={12} />
                          Track
                        </button>
                      </>
                    )}
                    <GoogleMap
                      center={mapCenter || {
                        lat: agent.status.currentLocation.latitude,
                        lng: agent.status.currentLocation.longitude
                      }}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <Marker
                        position={{
                          lat: agentLocations[id]?.latitude || agent.status.currentLocation.latitude,
                          lng: agentLocations[id]?.longitude || agent.status.currentLocation.longitude
                        }}
                        rotation={(() => {
                          const heading = agentLocations[id]?.heading;
                          const validHeading = (typeof heading === 'number' && heading >= 0 && heading <= 360) ? heading : 0;
                          console.log(`🧭 Agent ${id} heading:`, heading, '-> valid:', validHeading);
                          return validHeading;
                        })()}
                        title={`${agent.name || 'Delivery Agent'} - ${agent.agentId || ''} ${(() => {
                          const agentLoc = agentLocations[id];
                          const isLive = agentLoc && agentLoc.timestamp && (new Date() - new Date(agentLoc.timestamp)) < 300000; // 5 minutes
                          return isLive ? '(LIVE)' : '(Last Known)';
                        })()}`}
                        icon={{
                          url: '/assets/bikerider.png',
                          scaledSize: new window.google.maps.Size(40, 40),
                          anchor: new window.google.maps.Point(20, 40)
                        }}
                        infoContent={`
                          <div style="max-width: 200px;">
                            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${agent.name || 'Delivery Agent'}</h4>
                            <p style="margin: 0 0 4px 0;">ID: ${agent.agentId || 'N/A'}</p>
                            <p style="margin: 0 0 4px 0;">Status: ${(() => {
                              const agentLoc = agentLocations[id];
                              const isLive = agentLoc && agentLoc.timestamp && (new Date() - new Date(agentLoc.timestamp)) < 300000;
                              return isLive ? '<span style="color: #10B981; font-weight: bold;">● LIVE</span>' : '<span style="color: #6B7280;">● Last Known</span>';
                            })()}</p>
                            <p style="margin: 0 0 4px 0;">Lat: ${(agentLocations[id]?.latitude || agent.status.currentLocation.latitude).toFixed(6)}</p>
                            <p style="margin: 0 0 4px 0;">Lng: ${(agentLocations[id]?.longitude || agent.status.currentLocation.longitude).toFixed(6)}</p>
                            ${agentLocations[id]?.accuracy ? `<p style="margin: 0 0 4px 0;">Accuracy: ±${agentLocations[id].accuracy.toFixed(1)}m</p>` : ''}
                            ${agentLocations[id]?.heading ? `<p style="margin: 0 0 4px 0;">Heading: ${agentLocations[id].heading.toFixed(1)}° ${getDirectionFromHeading(agentLocations[id].heading)}</p>` : ''}
                            <p style="margin: 0; font-size: 12px; color: #666;">
                              Updated: ${(() => {
                                const agentLoc = agentLocations[id];
                                const isLive = agentLoc && agentLoc.timestamp && (new Date() - new Date(agentLoc.timestamp)) < 300000;
                                return isLive ? 'Just now' : formatISTTime(agent.status.currentLocation.lastUpdated);
                              })()}
                            </p>
                          </div>
                        `}
                      />
                    </GoogleMap>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">
                    {isConnected ? 'Agent currently offline' : 'No location data available'}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    {isConnected 
                      ? 'Live location tracking is active. Location will appear when agent comes online.'
                      : 'Location will be updated when the delivery agent logs in and grants location permissions'
                    }
                  </p>
                  {isConnected && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600">Live tracking active</span>
                    </div>
                  )}
                  {/* Empty map placeholder */}
                  <div className="h-32 border border-gray-200 rounded-lg mt-4 flex items-center justify-center bg-gray-50">
                    <p className="text-xs text-gray-400">Map will show location when available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Location Activity Log */}
          {liveLocationLog.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Live Location Activity
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600">Live Updates</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {liveLocationLog.map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Navigation className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-800">
                            Location Update
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatISTTime(entry.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>📍 Lat: {entry.latitude.toFixed(6)}, Lng: {entry.longitude.toFixed(6)}</p>
                          {entry.accuracy && <p>🎯 Accuracy: ±{entry.accuracy.toFixed(1)}m</p>}
                          {entry.heading && <p>🧭 Heading: {entry.heading.toFixed(1)}° {getDirectionFromHeading(entry.heading)}</p>}
                          {entry.speed && <p>💨 Speed: {entry.speed.toFixed(1)} km/h</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {liveLocationLog.length === 0 && (
                  <div className="text-center py-8">
                    <Navigation className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No live location updates yet</p>
                    <p className="text-xs text-gray-400 mt-1">Location activity will appear here when the agent is online</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vehicle Information
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Vehicle Type</label>
                    {editingField === 'vehicleInfo.vehicleType' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select Type</option>
                          <option value="bike">Bike</option>
                          <option value="scooter">Scooter</option>
                          <option value="car">Car</option>
                          <option value="van">Van</option>
                        </select>
                        <button
                          onClick={saveEditing}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800 capitalize">{agent.vehicleInfo?.vehicleType || 'Not specified'}</p>
                        <button
                          onClick={() => startEditing('vehicleInfo.vehicleType', agent.vehicleInfo?.vehicleType)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Vehicle Number</label>
                    {editingField === 'vehicleInfo.vehicleNumber' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          maxLength={10}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Vehicle Number"
                        />
                        <button
                          onClick={saveEditing}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-800">{agent.vehicleInfo?.vehicleNumber || 'Not provided'}</p>
                        <button
                          onClick={() => startEditing('vehicleInfo.vehicleNumber', agent.vehicleInfo?.vehicleNumber)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Documents Link */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800">Documents Link</h3>
                    {agent.documents?.documentsLink && (
                      <button
                        onClick={() => startEditing('documents.documentsLink', agent.documents.documentsLink)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {editingField === 'documents.documentsLink' ? (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEditing}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : agent.documents?.documentsLink ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={agent.documents.documentsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Documents Folder
                      </a>
                      <CircleCheck className="w-5 h-5 text-green-500" />
                    </div>
                  ) : (
                    <span className="text-sm text-red-600">No documents link provided</span>
                  )}
                </div>

                {/* Bank Account Details */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">Bank Account Details</span>
                    {editingField === 'bankAccount.edit' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const updateData = {
                              documents: {
                                bankAccount: {
                                  accountNumber: bankAccountEdit.accountNumber.trim(),
                                  ifscCode: bankAccountEdit.ifscCode.trim(),
                                  bankName: bankAccountEdit.bankName.trim(),
                                  accountHolderName: bankAccountEdit.accountHolderName.trim()
                                }
                              }
                            };
                            updateAgentDetails(updateData);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {agent.documents?.bankAccount?.accountNumber ? (
                          <CircleCheck className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <button
                          onClick={() => startEditing('bankAccount.edit', '')}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {editingField === 'bankAccount.edit' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          maxLength={100}
                          value={bankAccountEdit.accountHolderName}
                          onChange={(e) => setBankAccountEdit(prev => ({ ...prev, accountHolderName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter account holder name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Name
                        </label>
                        <select
                          value={bankAccountEdit.bankName}
                          onChange={(e) => setBankAccountEdit(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select Bank</option>
                          {/* Public Sector Banks */}
                          <optgroup label="Public Sector Banks">
                            <option value="Bank of Baroda">Bank of Baroda</option>
                            <option value="Bank of India">Bank of India</option>
                            <option value="Bank of Maharashtra">Bank of Maharashtra</option>
                            <option value="Canara Bank">Canara Bank</option>
                            <option value="Central Bank of India">Central Bank of India</option>
                            <option value="Indian Bank">Indian Bank</option>
                            <option value="Indian Overseas Bank">Indian Overseas Bank</option>
                            <option value="Punjab & Sind Bank">Punjab & Sind Bank</option>
                            <option value="Punjab National Bank">Punjab National Bank</option>
                            <option value="State Bank of India">State Bank of India</option>
                            <option value="UCO Bank">UCO Bank</option>
                            <option value="Union Bank of India">Union Bank of India</option>
                          </optgroup>
                          {/* Private Sector Banks */}
                          <optgroup label="Private Sector Banks">
                            <option value="Axis Bank Ltd.">Axis Bank Ltd.</option>
                            <option value="Bandhan Bank Ltd.">Bandhan Bank Ltd.</option>
                            <option value="CSB Bank Ltd.">CSB Bank Ltd.</option>
                            <option value="City Union Bank Ltd.">City Union Bank Ltd.</option>
                            <option value="DCB Bank Ltd.">DCB Bank Ltd.</option>
                            <option value="Dhanlaxmi Bank Ltd.">Dhanlaxmi Bank Ltd.</option>
                            <option value="Federal Bank Ltd.">Federal Bank Ltd.</option>
                            <option value="HDFC Bank Ltd.">HDFC Bank Ltd.</option>
                            <option value="ICICI Bank Ltd.">ICICI Bank Ltd.</option>
                            <option value="Induslnd Bank Ltd.">Induslnd Bank Ltd.</option>
                            <option value="IDFC First Bank Ltd.">IDFC First Bank Ltd.</option>
                            <option value="Jammu & Kashmir Bank Ltd.">Jammu & Kashmir Bank Ltd.</option>
                            <option value="Karnataka Bank Ltd.">Karnataka Bank Ltd.</option>
                            <option value="Karur Vysya Bank Ltd.">Karur Vysya Bank Ltd.</option>
                            <option value="Kotak Mahindra Bank Ltd.">Kotak Mahindra Bank Ltd.</option>
                            <option value="Nainital Bank Ltd.">Nainital Bank Ltd.</option>
                            <option value="RBL Bank Ltd.">RBL Bank Ltd.</option>
                            <option value="South Indian Bank Ltd.">South Indian Bank Ltd.</option>
                            <option value="Tamilnad Mercantile Bank Ltd.">Tamilnad Mercantile Bank Ltd.</option>
                            <option value="YES Bank Ltd.">YES Bank Ltd.</option>
                            <option value="IDBI Bank Ltd.">IDBI Bank Ltd.</option>
                          </optgroup>
                          {/* Small Finance Banks */}
                          <optgroup label="Small Finance Banks">
                            <option value="Au Small Finance Bank Limited">Au Small Finance Bank Limited</option>
                            <option value="Capital Small Finance Bank Limited">Capital Small Finance Bank Limited</option>
                            <option value="Equitas Small Finance Bank Limited">Equitas Small Finance Bank Limited</option>
                            <option value="Suryoday Small Finance Bank Limited">Suryoday Small Finance Bank Limited</option>
                            <option value="Ujjivan Small Finance Bank Limited">Ujjivan Small Finance Bank Limited</option>
                          </optgroup>
                          {/* Other */}
                          <optgroup label="Other">
                            <option value="Other">Other Bank</option>
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Number
                        </label>
                        <input
                          type="number"
                          maxLength={20}
                          value={bankAccountEdit.accountNumber}
                          onChange={(e) => setBankAccountEdit(prev => ({ ...prev, accountNumber: e.target.value }))}
                          onInput={(e) => {
                            // Remove any non-numeric characters
                            e.target.value = e.target.value.replace(/[^0-9]/g, '');
                          }}
                          
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter account number"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          maxLength={20}
                          value={bankAccountEdit.ifscCode}
                          onChange={(e) => setBankAccountEdit(prev => ({ ...prev, ifscCode: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="e.g., SBIN0001234"
                        />
                      </div>
                    </div>
                  ) : agent.documents?.bankAccount?.accountNumber ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Account Holder</label>
                        <p className="font-medium">{agent.documents.bankAccount.accountHolderName}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Bank Name</label>
                        <p className="font-medium">{agent.documents.bankAccount.bankName}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Account Number</label>
                        <p className="font-medium">****{agent.documents.bankAccount.accountNumber.slice(-4)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">IFSC Code</label>
                        <p className="font-medium">{agent.documents.bankAccount.ifscCode}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-red-600">Not provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Work Information
              </h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Experience</label>
                  <p className="font-medium text-gray-800">
                    {agent.workInfo?.experience
                      ? `${agent.workInfo.experience} years`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Assigned Zone</label>
                  {editingField === 'status.deliveryZone' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={zonesLoading}
                      >
                        <option value="">
                          {zonesLoading ? 'Loading zones...' : 'Select a zone'}
                        </option>
                        {availableZones.map((zone) => (
                          <option key={zone._id} value={zone._id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={saveEditing}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">
                        {agent.status?.deliveryZone
                          ? availableZones.find(z => z._id === agent.status.deliveryZone)?.name || 'Zone assigned'
                          : 'Not assigned'
                        }
                      </p>
                      <button
                        onClick={() => startEditing('status.deliveryZone', agent.status?.deliveryZone || '')}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Recent Orders
              </h2>
            </div>
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">₹{order.totalAmount}</p>
                        <p className={`text-sm capitalize ${order.status === 'delivered' ? 'text-green-600' :
                          order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent orders</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{agent.status?.rating || 5.0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Deliveries</span>
                <span className="font-medium">{agent.status?.totalDeliveries || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completed Deliveries</span>
                <span className="font-medium">{agent.status?.completedDeliveries || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium">
                  {agent.status?.totalDeliveries > 0
                    ? Math.round((agent.status.completedDeliveries / agent.status.totalDeliveries) * 100)
                    : 0
                  }%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Earnings</span>
                <span className="font-medium">₹{agent.status?.earnings?.total || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium">₹{agent.status?.earnings?.thisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* Application Status & Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Application Status
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center ">
                <label className="text-md text-black">Application Status</label>
                <div className={`inline-flex items-center gap-2 px-2 py-2 rounded-full text-sm mt-1 ${getStatusColor(agent.status?.applicationStatus)}`}>
                  {getStatusIcon(agent.status?.applicationStatus)}
                  <span className="font-medium capitalize">{agent.status?.applicationStatus}</span>
                </div>
              </div>

              {/* Force Offline Button */}
              {agent.status?.isOnline && currentUser?.role === 'super_admin' && (
                <div className="pt-4">
                  <button
                    onClick={forceAgentOffline}
                    className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Force Offline
                  </button>
                </div>
              )}

              {agent.status?.applicationStatus === 'pending' && (
                <div className="pt-4 space-y-2">
                  <button
                    onClick={approveApplication}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={rejectApplication}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Delete Agent Section - Only for Super Admin */}
          {currentUser?.role === 'super_admin' && (
            <div className="bg-red-50 border border-red-200 rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <h3 className="text-sm font-semibold text-red-800">Danger Zone</h3>
                      <p className="text-xs text-red-600">Permanently delete this agent</p>
                    </div>
                  </div>
                  <button
                    onClick={deleteDeliveryAgent}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
                <h3 className="text-xl font-semibold text-red-800">Delete Delivery Agent</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    You are about to permanently delete:
                  </p>
                  <p className="text-lg font-semibold text-red-900">
                    {agent?.personalInfo?.firstName} {agent?.personalInfo?.lastName}
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    This action cannot be undone and will permanently remove all agent data, including:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                    <li>Personal information</li>
                    <li>Address details</li>
                    <li>Bank account information</li>
                    <li>Vehicle details</li>
                    <li>Order history</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono font-bold text-red-600">"DELETE"</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={cancelDeleteModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDeliveryAgent}
                  disabled={loading || deleteConfirmationText !== 'DELETE'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
