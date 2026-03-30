import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  Truck, Search, Filter, Eye, MapPin, Star,
  CircleCheck, XCircle, Clock, User, Phone,
  Mail, AlertCircle, Plus, RefreshCw,
  Ban, Bell, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const DeliveryAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    zone: '',
    applicationStatus: '',
    online: ''
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
  const [zones, setZones] = useState([]);
  const allowedRoles = ['super_admin', 'admin', 'delivery_manager'];
  const navigate = useNavigate();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents?${queryParams}`,
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
        setAgents(data.agents);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch delivery agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents/stats/overview`,
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

  const fetchZones = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-zones`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const sendAlert = async (agentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/send-alert/${agentId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Alert sent to the agent');
      } else {
        toast.error(data.message || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    }
  };

  const exportAgentsToExcel = async () => {
    if (!isAuthorized || isExporting) return;

    try {
      setIsExporting(true);

      const queryParams = new URLSearchParams({
        page: 1,
        limit: String(Math.max(pagination.total || 0, agents.length || 0, pagination.limit, 1)),
        search: searchTerm,
        ...filters
      });

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents?${queryParams}`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      const exportAgents = data.success ? (data.agents || []) : [];

      if (exportAgents.length === 0) {
        toast.error('No delivery agents available to export');
        return;
      }

      const excelRows = exportAgents.map((agent, index) => ({
        'S. No.': index + 1,
        'Agent ID': agent.agentId || 'N/A',
        'First Name': agent.personalInfo?.firstName || 'N/A',
        'Last Name': agent.personalInfo?.lastName || 'N/A',
        Email: agent.personalInfo?.email || 'N/A',
        Phone: agent.personalInfo?.phone || 'N/A',
        'Application Status': agent.status?.applicationStatus || 'N/A',
        'Account Status': agent.status?.isActive ? 'Active' : 'Inactive',
        'Online Status': agent.status?.isOnline ? 'Online' : 'Offline',
        'Delivery Zone': agent.status?.deliveryZone?.name || 'Not assigned',
        'Vehicle Type': agent.vehicleInfo?.vehicleType || 'N/A',
        'Vehicle Number': agent.vehicleInfo?.vehicleNumber || 'N/A',
        Rating: agent.status?.rating ? agent.status.rating.toFixed(1) : 'No ratings',
        'Total Ratings': agent.status?.totalRatings || 0,
        'Total Deliveries': agent.status?.totalDeliveries || 0,
        'App Version': agent.authentication?.deviceInfo?.appVersion || 'Unknown',
        'Last App Update': agent.authentication?.deviceInfo?.lastAppUpdate
          ? new Date(agent.authentication.deviceInfo.lastAppUpdate).toLocaleString('en-GB')
          : 'Not updated',
        'Last Location Update': agent.status?.currentLocation?.lastUpdated
          ? new Date(agent.status.currentLocation.lastUpdated).toLocaleString('en-GB')
          : 'Never'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 28 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
        { wch: 16 },
        { wch: 16 },
        { wch: 10 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 22 },
        { wch: 22 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Agents');

      const dateLabel = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `delivery_agents_${dateLabel}.xlsx`);
      toast.success('Delivery agents exported successfully');
    } catch (error) {
      console.error('Error exporting delivery agents:', error);
      toast.error('Failed to export delivery agents');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSearch = (e) => {
    if (!isAuthorized) return;
    if (e) e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAgents();
  };

  const handleFilterChange = (key, value) => {
    if (!isAuthorized) return;
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleForceOfflineAll = async () => {
    if (!isAuthorized) return;

    const confirmed = window.confirm(
      'Are you sure you want to force all delivery agents offline? This will immediately disconnect all online agents.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents/force-offline-all`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (data.success) {
        toast.success(`Successfully forced ${data.updatedCount} agents offline`);
        fetchAgents(); // Refresh the list
        fetchStats(); // Refresh stats
      } else {
        toast.error(data.message || 'Failed to force agents offline');
      }
    } catch (error) {
      console.error('Error forcing agents offline:', error);
      toast.error('Failed to force agents offline');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={16} />,
      approved: <CircleCheck size={16} />,
      rejected: <XCircle size={16} />
    };
    return icons[status] || <AlertCircle size={16} />;
  };

  const formatDateTimeWithAmPm = (dateValue) => {
    if (!dateValue) return 'Never';

    return new Date(dateValue).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
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
    } catch (err) {
      console.error('Failed to fetch current user', err);
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  console.log('DeliveryAgents - currentUser:', currentUser, 'role:', currentUser?.role, 'isAuthorized:', isAuthorized);

  useEffect(() => {
    if (isAuthorized) {
      fetchAgents();
      fetchStats();
      fetchZones();
    }
  }, [pagination.page, filters, isAuthorized]);

  // Guard states
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Ban className='w-16 h-16 text-red-500 mb-2' />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Delivery Managers, Admins, and Super Admins can view delivery agents.</p>
      </div>
    );
  }

  return (
    <Layout title="Delivery Agents">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Delivery Agents</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage and monitor all delivery agent accounts</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportAgentsToExcel}
                  disabled={isExporting}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? (
                    <div className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-emerald-100 rounded-full mr-2"></div>
                  ) : (
                    <Download size={16} className="mr-2" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export to Excel'}
                </button>
                <button
                  onClick={() => navigate('/riders-zone')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <MapPin size={16} className="mr-2" />
                  Riders Zone
                </button>
                <button
                  onClick={handleForceOfflineAll}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-red-300 border-t-red-100 rounded-full mr-2"></div>
                  ) : (
                    <Ban size={16} className="mr-2" />
                  )}
                  {loading ? 'Processing...' : 'Force Offline All'}
                </button>
                <button
                  onClick={() => navigate('/delivery-signup')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Plus size={16} className="mr-2" />
                  Add New Agent
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Agents</p>
                    <p className="text-3xl font-bold text-white">{stats.total || 0}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                    <Truck className="w-5 h-5 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Active Agents</p>
                    <p className="text-3xl font-bold text-white">{stats.active || 0}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                    <CircleCheck className="w-5 h-5 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Online Now</p>
                    <p className="text-3xl font-bold text-white">{stats.online || 0}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Deliveries</p>
                    <p className="text-3xl font-bold text-white">{stats.totalDeliveries || 0}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                    <Star className="w-5 h-5 text-blue-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Search className="w-6 h-6" />
                Search & Filters
              </h2>
            </div>
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 max-w-lg">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search agents by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Search size={16} className="mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                {/* Application Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Application Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {[
                      { key: '', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                      { key: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleFilterChange('applicationStatus', key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${filters.applicationStatus === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${key !== '' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Account Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {[
                      { key: '', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'active', label: 'Active', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleFilterChange('status', key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${filters.status === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${key !== '' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Online Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Online Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {[
                      { key: '', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'true', label: 'Online', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'false', label: 'Offline', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleFilterChange('online', key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${filters.online === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                          } ${key !== '' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zone Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Zone:</span>
                  <select
                    value={filters.zone}
                    onChange={(e) => handleFilterChange('zone', e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Zones</option>
                    {zones.map((zone) => (
                      <option key={zone._id} value={zone._id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={fetchAgents}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Agents List */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Truck className="w-6 h-6" />
                Delivery Agents ({agents.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                <span className="ml-3 text-gray-600 font-medium">Loading delivery agents...</span>
              </div>
            ) : agents.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-gray-500">
                <Truck size={40} className="mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No delivery agents found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Agent Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          App Version
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {agents.map((agent) => (
                        <tr key={agent._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/delivery-agents/${agent._id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {agent.personalInfo.firstName} {agent.personalInfo.lastName}
                                  </div>
                                  {agent.workInfo?.fullTime && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      FT
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Zone: {agent.status.deliveryZone?.name || 'Not assigned'}
                                </div>
                                <div className="flex items-center mt-1 gap-2">
                                  {agent.status.isOnline && (
                                    <>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        Online
                                      </span>
                                      <Bell
                                        size={14}
                                        className="text-green-500 cursor-pointer hover:text-green-600"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          sendAlert(agent.agentId);
                                        }}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                {agent.personalInfo.phone}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Mail size={14} />
                                {agent.personalInfo.email}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Star size={14} className="text-yellow-500" />
                                <span className="text-sm text-gray-900">{agent.status?.rating ? `${agent.status.rating.toFixed(1)} (${agent.status.totalRatings || 0})` : 'No ratings'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status.applicationStatus)}`}>
                              {getStatusIcon(agent.status.applicationStatus)}
                              {agent.status.applicationStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="capitalize">{agent.vehicleInfo.vehicleType}</div>
                              <div className="text-xs text-gray-500">{agent.vehicleInfo.vehicleNumber}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">
                                {agent.authentication.deviceInfo?.appVersion || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {agent.authentication.deviceInfo?.lastAppUpdate ?
                                  `Updated: ${new Date(agent.authentication.deviceInfo.lastAppUpdate).toLocaleDateString('en-GB')}` :
                                  'Not updated'
                                }
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {agent.status.currentLocation?.lastUpdated ?
                                formatDateTimeWithAmPm(agent.status.currentLocation.lastUpdated) :
                                'Never'
                              }
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
                    {agents.map((agent) => (
                      <div key={agent._id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/delivery-agents/${agent._id}`)}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12">
                            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-medium text-gray-900 truncate">
                                    {agent.personalInfo.firstName} {agent.personalInfo.lastName}
                                  </h3>
                                  {agent.workInfo?.fullTime && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                                      FT
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Zone: {agent.status.deliveryZone?.name || 'Not assigned'}
                                </p>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(agent.status.applicationStatus)}`}>
                                {getStatusIcon(agent.status.applicationStatus)}
                                {agent.status.applicationStatus.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone size={12} />
                                {agent.personalInfo.phone}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Star size={12} className="text-yellow-500" />
                                {agent.status?.rating ? `${agent.status.rating.toFixed(1)} (${agent.status.totalRatings || 0})` : 'No ratings'}
                              </div>
                              {agent.status.isOnline && (
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Online
                                  </span>
                                  <Bell
                                    size={12}
                                    className="text-green-500 cursor-pointer hover:text-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendAlert(agent.agentId);
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="text-xs">
                                <span className="text-gray-500">Vehicle:</span>
                                <div className="font-medium text-gray-900 capitalize">{agent.vehicleInfo.vehicleType}</div>
                                <div className="text-gray-600">{agent.vehicleInfo.vehicleNumber}</div>
                              </div>
                              <div className="text-xs">
                                <span className="text-gray-500">App Version:</span>
                                <div className="font-medium text-gray-900">
                                  {agent.authentication?.appVersion || 'Unknown'}
                                </div>
                                <div className="text-gray-600 text-xs">
                                  {agent.authentication?.lastAppUpdate ?
                                    `Updated: ${new Date(agent.authentication.lastAppUpdate).toLocaleString('en-GB')}` :
                                    'Not updated'
                                  }
                                </div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="text-xs">
                                <span className="text-gray-500">Last Updated:</span>
                                <div className="font-medium text-gray-900">
                                  {agent.status.currentLocation?.lastUpdated ?
                                    formatDateTimeWithAmPm(agent.status.currentLocation.lastUpdated) :
                                    'Never'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default DeliveryAgents;
