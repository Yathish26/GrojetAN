import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
  Truck, Search, Filter, Eye, MapPin, Star,
  CircleCheck, XCircle, Clock, User, Phone,
  Mail, AlertCircle, Plus, RefreshCw,
  Ban, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

const DeliveryAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const allowedRoles = ['super_admin', 'admin'];
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
        toast.error('Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    }
  };

  const handleSearch = (e) => {
    if (!isAuthorized) return;
    e.preventDefault();
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
      fetchAgents();
      fetchStats();
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
        <p className="text-gray-600">Only Admins and Super Admins can view delivery agents.</p>
      </div>
    );
  }

  return (
    <Layout title="Delivery Agents">
      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Truck className="mr-2 sm:mr-3 text-green-600" size={24} />
                <span className="hidden sm:inline">Delivery Agents Management</span>
                <span className="sm:hidden">Delivery Agents</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and monitor delivery agents across your network</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate('/riders-zone')}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <MapPin size={16} className="sm:w-4 sm:h-4" />
                Riders Zone
              </button>
              <button
                onClick={handleForceOfflineAll}
                className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 hover:bg-red-700 flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Ban size={16} className="sm:w-4 sm:h-4" />
                Force Offline All
              </button>
              <button
                onClick={() => navigate('/delivery-signup')}
                className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 hover:bg-green-700 flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Plus size={16} className="sm:w-4 sm:h-4" />
                Add New Agent
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Agents"
              value={stats.total || 0}
              icon={Truck}
              color="text-blue-600"
            />
            <StatCard
              title="Active Agents"
              value={stats.active || 0}
              icon={CircleCheck}
              color="text-yellow-600"
            />
            <StatCard
              title="Online Now"
              value={stats.online || 0}
              icon={MapPin}
              color="text-green-600"
            />
            <StatCard
              title="Total Deliveries"
              value={stats.totalDeliveries || 0}
              icon={Star}
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
                    placeholder="Search by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </form>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <select
                  value={filters.applicationStatus}
                  onChange={(e) => handleFilterChange('applicationStatus', e.target.value)}
                  className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">All Applications</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={filters.online}
                  onChange={(e) => handleFilterChange('online', e.target.value)}
                  className="flex-1 px-3 py-2 sm:py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                >
                  <option value="">All Online Status</option>
                  <option value="true">Online</option>
                  <option value="false">Offline</option>
                </select>

                <button
                  onClick={fetchAgents}
                  className="px-4 py-2 sm:py-3 bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2 transition-colors duration-200 whitespace-nowrap"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-green-500"></div>
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
                        Performance
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
                              <div className="text-sm font-medium text-gray-900">
                                {agent.personalInfo.firstName} {agent.personalInfo.lastName}
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
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-400" />
                              {agent.status.rating.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {agent.status.completedDeliveries} deliveries
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {agent.status.currentLocation?.lastUpdated || 'Never'}
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
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {agent.personalInfo.firstName} {agent.personalInfo.lastName}
                              </h3>
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
                              <span className="text-gray-500">Performance:</span>
                              <div className="flex items-center gap-1 font-medium text-gray-900">
                                <Star size={12} className="text-yellow-400" />
                                {agent.status.rating.toFixed(1)}
                              </div>
                              <div className="text-gray-600">{agent.status.completedDeliveries} deliveries</div>
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="text-xs">
                              <span className="text-gray-500">Last Updated:</span>
                              <div className="font-medium text-gray-900">
                                {agent.status.currentLocation?.lastUpdated || 'Never'}
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
    </Layout>
  );
};

export default DeliveryAgents;
