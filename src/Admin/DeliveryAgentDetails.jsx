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
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';

export default function DeliveryAgentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [recentOrders, setRecentOrders] = useState([]);
  const [agentStats, setAgentStats] = useState(null);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];
  const [availableZones, setAvailableZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zoneNames, setZoneNames] = useState({});

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

  // Verification status states
  const [documentsVerified, setDocumentsVerified] = useState(false);
  const [backgroundCheckCompleted, setBackgroundCheckCompleted] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

  // Verification timestamps
  const [documentsVerifiedAt, setDocumentsVerifiedAt] = useState(null);
  const [backgroundCheckCompletedAt, setBackgroundCheckCompletedAt] = useState(null);
  const [trainingCompletedAt, setTrainingCompletedAt] = useState(null);

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
      setAgent(data.agent);

      // Fetch zone name if delivery zone exists
      if (data.agent?.status?.deliveryZone) {
        await fetchZoneName(data.agent.status.deliveryZone);
      }

      // Initialize verification states from agent data
      setDocumentsVerified(data.agent?.verification?.documentsVerified || false);
      setBackgroundCheckCompleted(data.agent?.verification?.backgroundCheckPassed || false);
      setTrainingCompleted(data.agent?.verification?.trainingCompleted || false);

      // Initialize timestamps from backend data
      setDocumentsVerifiedAt(data.agent?.verification?.documentsVerifiedAt || null);
      setBackgroundCheckCompletedAt(data.agent?.verification?.backgroundCheckCompletedAt || null);
      setTrainingCompletedAt(data.agent?.verification?.trainingCompletedAt || null);
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
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }

      const data = await response.json();
      setAgent(data.agent);
      toast.success(`Agent status updated to ${newStatus}`);
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
      setAgent(data.agent);

      // Update local verification states with backend response
      setDocumentsVerified(data.agent?.verification?.documentsVerified || false);
      setBackgroundCheckCompleted(data.agent?.verification?.backgroundCheckPassed || false);
      setTrainingCompleted(data.agent?.verification?.trainingCompleted || false);
      setDocumentsVerifiedAt(data.agent?.verification?.documentsVerifiedAt || null);
      setBackgroundCheckCompletedAt(data.agent?.verification?.backgroundCheckCompletedAt || null);
      setTrainingCompletedAt(data.agent?.verification?.trainingCompletedAt || null);

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
      setAgent(data.agent);
      toast.success('Application rejected successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
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
    } catch (err) {
      toast.error(err.message);
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Verification status toggle functions
  const toggleDocumentsVerified = async () => {
    if (!isAuthorized) return;
    const newStatus = !documentsVerified;
    setDocumentsVerified(newStatus);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ documentsVerified: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update documents verification status');
      }

      const data = await response.json();
      setAgent(data.agent);

      // Update local state with backend response
      setDocumentsVerified(data.agent?.verification?.documentsVerified || false);
      setDocumentsVerifiedAt(data.agent?.verification?.documentsVerifiedAt || null);

      toast.success(`Documents ${newStatus ? 'verified' : 'marked as pending'}`);
    } catch (err) {
      // Revert on error
      setDocumentsVerified(!newStatus);
      toast.error('Failed to update documents verification status');
    }
  };

  const toggleBackgroundCheckCompleted = async () => {
    if (!isAuthorized) return;
    const newStatus = !backgroundCheckCompleted;
    setBackgroundCheckCompleted(newStatus);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ backgroundCheckPassed: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update background check status');
      }

      const data = await response.json();
      setAgent(data.agent);

      // Update local state with backend response
      setBackgroundCheckCompleted(data.agent?.verification?.backgroundCheckPassed || false);
      setBackgroundCheckCompletedAt(data.agent?.verification?.backgroundCheckCompletedAt || null);

      toast.success(`Background check ${newStatus ? 'completed' : 'marked as pending'}`);
    } catch (err) {
      // Revert on error
      setBackgroundCheckCompleted(!newStatus);
      toast.error('Failed to update background check status');
    }
  };

  const toggleTrainingCompleted = async () => {
    if (!isAuthorized) return;
    const newStatus = !trainingCompleted;
    setTrainingCompleted(newStatus);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/verification`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ trainingCompleted: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update training status');
      }

      const data = await response.json();
      setAgent(data.agent);

      // Update local state with backend response
      setTrainingCompleted(data.agent?.verification?.trainingCompleted || false);
      setTrainingCompletedAt(data.agent?.verification?.trainingCompletedAt || null);

      toast.success(`Training ${newStatus ? 'completed' : 'marked as pending'}`);
    } catch (err) {
      // Revert on error
      setTrainingCompleted(!newStatus);
      toast.error('Failed to update training status');
    }
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
    } else if (editingField === 'status.deliveryZone') {
      // Handle delivery zone editing
      updateData.status = { deliveryZone: editValue || null };
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
      case 'suspended':
        return <XCircle className="w-5 h-5 text-red-500" />;
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
      case 'suspended':
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/delivery-agents')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {agent.personalInfo?.firstName} {agent.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600">Delivery Agent ID: {agent.agentId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getWorkingStatusColor(agent.status?.isOnline ? 'online' : 'offline')}`}>
            <div className={`w-2 h-2 rounded-full ${agent.status?.isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`}></div>
            <span className="capitalize">{agent.status?.isOnline ? 'online' : 'offline'}</span>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(agent.status?.applicationStatus)}`}>
            {getStatusIcon(agent.status?.applicationStatus)}
            <span className="font-medium capitalize">{agent.status?.applicationStatus}</span>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => {
              // Toggle edit mode or show edit modal
              toast('Click on individual fields to edit them');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="text-sm text-gray-500">Full Name</label>
                    {editingField === 'personalInfo.firstName' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={fullNameEdit.firstName}
                            onChange={(e) => setFullNameEdit(prev => ({ ...prev, firstName: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="First Name"
                          />
                          <input
                            type="text"
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
                          type="tel"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Phone"
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
                            placeholder="City"
                            value={addressEdit.city}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, city: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={addressEdit.state}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, state: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={addressEdit.zipCode}
                            onChange={(e) => setAddressEdit(prev => ({ ...prev, zipCode: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <input
                            type="text"
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
                          placeholder="Contact Name"
                          value={emergencyContactEdit.name}
                          onChange={(e) => setEmergencyContactEdit(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <input
                          type="tel"
                          placeholder="Contact Phone"
                          value={emergencyContactEdit.phone}
                          onChange={(e) => setEmergencyContactEdit(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                          Lat: {agent.status.currentLocation.latitude.toFixed(6)}, Lng: {agent.status.currentLocation.longitude.toFixed(6)}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {agent.status.currentLocation.lastUpdated && (
                            <p className="text-xs text-gray-500">
                              Last updated: {formatISTTime(agent.status.currentLocation.lastUpdated)}
                            </p>
                          )}
                          {agent.status.currentLocation.lastUpdated && (
                            (() => {
                              const now = new Date();
                              const lastUpdate = new Date(agent.status.currentLocation.lastUpdated);
                              const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);

                              if (hoursDiff < 1) {
                                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Live</span>;
                              } else if (hoursDiff < 24) {
                                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Recent</span>;
                              } else {
                                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Old</span>;
                              }
                            })()
                          )}
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
                  <div className="h-64 border border-gray-200 rounded-lg overflow-hidden">
                    <GoogleMap
                      center={{
                        lat: agent.status.currentLocation.latitude,
                        lng: agent.status.currentLocation.longitude
                      }}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <Marker
                        position={{
                          lat: agent.status.currentLocation.latitude,
                          lng: agent.status.currentLocation.longitude
                        }}
                        title={`${agent.name || 'Delivery Agent'} - ${agent.agentId || ''}`}
                        infoContent={`
                          <div style="max-width: 200px;">
                            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${agent.name || 'Delivery Agent'}</h4>
                            <p style="margin: 0 0 4px 0;">ID: ${agent.agentId || 'N/A'}</p>
                            <p style="margin: 0 0 4px 0;">Lat: ${agent.status.currentLocation.latitude.toFixed(6)}</p>
                            <p style="margin: 0 0 4px 0;">Lng: ${agent.status.currentLocation.longitude.toFixed(6)}</p>
                            <p style="margin: 0; font-size: 12px; color: #666;">
                              Updated: ${formatISTTime(agent.status.currentLocation.lastUpdated)}
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
                  <p className="text-sm text-gray-500 mb-2">No location data available</p>
                  <p className="text-xs text-gray-400">
                    Location will be updated when the delivery agent logs in and grants location permissions
                  </p>
                  {/* Empty map placeholder */}
                  <div className="h-32 border border-gray-200 rounded-lg mt-4 flex items-center justify-center bg-gray-50">
                    <p className="text-xs text-gray-400">Map will show location when available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vehicle Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="space-y-4">
                <h3 className="font-medium text-gray-800">Vehicle Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agent.vehicleInfo?.rcBook || false}
                      readOnly
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      RC Book {agent.vehicleInfo?.rcBook && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={agent.vehicleInfo?.insurance || false}
                      readOnly
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Insurance {agent.vehicleInfo?.insurance && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                    </label>
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
                {/* Document Verification Status */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">Document Verification Status</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={agent.documents?.aadharFront || false}
                        readOnly
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Aadhar Front {agent.documents?.aadharFront && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={agent.documents?.aadharBack || false}
                        readOnly
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Aadhar Back {agent.documents?.aadharBack && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={agent.documents?.panCard || false}
                        readOnly
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        PAN Card {agent.documents?.panCard && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={agent.documents?.drivingLicense || false}
                        readOnly
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Driving License {agent.documents?.drivingLicense && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={agent.personalInfo?.profilePhoto || false}
                        readOnly
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Profile Photo {agent.personalInfo?.profilePhoto && <CircleCheck className="w-4 h-4 text-green-500 inline ml-1" />}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Documents Link */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">Documents Link</h3>
                  {agent.documents?.documentsLink ? (
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
                    {agent.documents?.bankAccount?.accountNumber ? (
                      <CircleCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  {agent.documents?.bankAccount?.accountNumber ? (
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
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Expected Salary</label>
                  <p className="font-medium text-gray-800">
                    {agent.workInfo?.expectedSalary
                      ? `₹${agent.workInfo.expectedSalary.toLocaleString()}/month`
                      : 'Not specified'
                    }
                  </p>
                </div>
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

          {/* Online Tracking Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Online Tracking
                </h2>
                <button
                  onClick={fetchAgentStats}
                  disabled={refreshingStats}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Status</span>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${agentStats?.onlineStats?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-medium ${agentStats?.onlineStats?.isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                    {agentStats?.onlineStats?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {agentStats?.onlineStats?.isOnline && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Session</span>
                  <span className="font-medium text-blue-600">
                    {formatTime(agentStats.onlineStats.currentSessionDuration)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Today</span>
                <span className="font-medium">{formatTime(agentStats?.onlineStats?.todayHours || 0)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-medium">{formatTime(agentStats?.onlineStats?.weekHours || 0)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium">{formatTime(agentStats?.onlineStats?.monthHours || 0)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Hours</span>
                <span className="font-medium">{formatTime(agentStats?.onlineStats?.totalHours || 0)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sessions Today</span>
                <span className="font-medium">{agentStats?.onlineStats?.sessionCount || 0}</span>
              </div>

              {agentStats?.onlineStats?.lastUpdate && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Last updated: {formatISTTime(agentStats.onlineStats.lastUpdate)}
                  </p>
                </div>
              )}
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

              <div>
                <label className="text-sm text-gray-500">Documents Verified</label>
                <div className="flex items-center gap-2 mt-1">
                  {agent.verification?.documentsVerified ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Pending</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Background Check</label>
                <div className="flex items-center gap-2 mt-1">
                  {agent.verification?.backgroundCheckPassed ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Pending</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Training Completed</label>
                <div className="flex items-center gap-2 mt-1">
                  {agent.verification?.trainingCompleted ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Completed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Pending</span>
                    </>
                  )}
                </div>
              </div>

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

          {/* Verification Checklist */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Verification Checklist
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Documents Verified */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={documentsVerified}
                    onChange={toggleDocumentsVerified}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-800">Documents Verified</label>
                    {documentsVerifiedAt && (
                      <p className="text-xs text-gray-500">
                        Completed: {formatISTTime(documentsVerifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {documentsVerified ? (
                  <CircleCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              {/* Background Check Completed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={backgroundCheckCompleted}
                    onChange={toggleBackgroundCheckCompleted}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-800">Background Check Completed</label>
                    {backgroundCheckCompletedAt && (
                      <p className="text-xs text-gray-500">
                        Completed: {formatISTTime(backgroundCheckCompletedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {backgroundCheckCompleted ? (
                  <CircleCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              {/* Training Completed */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={trainingCompleted}
                    onChange={toggleTrainingCompleted}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-800">Training Completed</label>
                    {trainingCompletedAt && (
                      <p className="text-xs text-gray-500">
                        Completed: {formatISTTime(trainingCompletedAt)}
                      </p>
                    )}
                  </div>
                </div>
                {trainingCompleted ? (
                  <CircleCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
