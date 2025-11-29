import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Trash2,
  User,
  Shield,
  Eye,
  EyeOff,
  Search,
  Crown,
  UserPlus,
  Settings,
  Filter,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout.jsx';

const MODULES = [
  'users', 'orders', 'products', 'delivery', 'merchants', 'analytics', 'categories', 'admins', 'system'
];
const ACTIONS = ['read', 'create', 'update', 'delete'];

const roleHierarchy = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  operations: 'Operations',
  delivery_manager: 'Delivery Manager',
  inventory_manager: 'Inventory Manager'
};

// Helper function to format date as DD/MM/YYYY
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function AdminManagement() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSearch, setCurrentSearch] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    department: ''
  });

  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchAdmins();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const local = localStorage.getItem('adminUser');

      if (local) {
        const data = JSON.parse(local);
        setCurrentUser(data);
      } else {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
          credentials: 'include'
        });

        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (response.ok) {
          setCurrentUser(data.admin);
          localStorage.setItem('adminUser', JSON.stringify(data.admin));
        }
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };


  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/admin-management`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      setAdmins(data.admins || []);
    } catch (err) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/admin-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...createForm }),
      });
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Failed to create admin');
      setAdmins([...admins, data.admin]);
      setShowCreateModal(false);
      setCreateForm({
        name: '', email: '', password: '', role: 'admin', phone: '', department: ''
      });
      toast.success('Admin created successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setEditForm({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      phone: admin.phone || '',
      department: admin.department || '',
      status: admin.isActive ? 'active' : 'suspended'
    });
  };

  const handleUpdateAdmin = async (adminId, updates) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/admin-management/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...updates }),
      });
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (!response.ok) throw new Error('Failed to update admin');
      setAdmins(admins.map(admin => admin._id === adminId ? data.admin : admin));
      setEditingAdmin(null);
      toast.success('Admin updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/admin-management/${adminId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to delete admin');
      }
      setAdmins(admins.filter(admin => admin._id !== adminId));
      toast.success('Admin deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleAdminStatus = async (adminId, currentStatus) => {
    const newIsActive = currentStatus !== 'active';
    await handleUpdateAdmin(adminId, { isActive: newIsActive });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-blue-600" />;
      case 'operations':
        return <Settings className="w-5 h-5 text-green-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = currentSearch === '' || admin.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
      admin.email.toLowerCase().includes(currentSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (admin.isActive ? 'active' : 'suspended') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <Layout title="Admin Management">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">Only Super Admins can access admin management.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Admin Management">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading admins...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Management">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage and monitor all admin accounts</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/admin-register')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register New Admin
                </button>
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
                      placeholder="Search admins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && setCurrentSearch(searchTerm)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setCurrentSearch(searchTerm)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
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

              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Role:</span>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'all', label: 'All Roles', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    ...Object.entries(roleHierarchy).map(([key, value]) => ({
                      key,
                      label: value,
                      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }))
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setRoleFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${roleFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {[
                    { key: 'all', label: 'All Status', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'active', label: 'Active', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(roleFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setSearchTerm('');
                    setCurrentSearch('');
                  }}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Admins</p>
                  <p className="text-3xl font-bold text-white">{admins.length}</p>
                </div>
                <User className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Active Admins</p>
                  <p className="text-3xl font-bold text-white">{admins.filter(admin => admin.isActive).length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                  <span className="text-blue-700 font-bold text-sm">A</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Suspended</p>
                  <p className="text-3xl font-bold text-white">{admins.filter(admin => !admin.isActive).length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                  <span className="text-blue-700 font-bold text-sm">S</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Super Admins</p>
                  <p className="text-3xl font-bold text-white">{admins.filter(admin => admin.role === 'super_admin').length}</p>
                </div>
                <Crown className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Shield className="w-6 h-6" />
              System Administrators ({filteredAdmins.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                            {admin._id === currentUser?._id && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{admin.email}</div>
                          {admin.phone && (
                            <div className="text-xs text-gray-400">{admin.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(admin.role)}
                        <span className="text-sm font-medium capitalize">
                          {roleHierarchy[admin.role] || admin.role}
                        </span>
                      </div>
                      {admin.department && (
                        <div className="text-xs text-gray-500">{admin.department}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(admin.isActive ? 'active' : 'suspended')}`}>
                          {admin.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {admin.lastLogin ? (
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium text-gray-800">
                            {admin.lastLogin.split(',')[0]} {/* Date */}
                          </span>
                          <span className="text-xs text-gray-500">
                            {admin.lastLogin.split(',')[1]?.trim()} {/* Time */}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {admin._id !== currentUser?._id && (
                          <>
                            <button
                              onClick={() => openEditModal(admin)}
                              className="p-1 text-blue-600 hover:bg-gray-100 rounded"
                              title="Edit Admin"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin._id)}
                              className="p-1 text-red-600 hover:bg-gray-100 rounded"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAdmins.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Admins Found</h3>
                <p className="text-gray-600">No admins match your current filters.</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-6">
            {filteredAdmins.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500">No admins found</p>
                <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAdmins.map((admin) => (
                  <div key={admin._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 rounded-lg">
                        <User className="w-7 h-7 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {admin.name}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono">ID: {admin._id.slice(-8)}</p>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${getStatusColor(admin.isActive ? 'active' : 'suspended')}`}>
                            {admin.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="truncate">{admin.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {getRoleIcon(admin.role)}
                            <span className="capitalize">{roleHierarchy[admin.role] || admin.role}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{admin.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Last login: {admin.lastLogin ? admin.lastLogin.split(',')[0] : 'Never'}
                          </div>
                          <div className="flex items-center gap-2">
                            {admin._id !== currentUser?._id && (
                              <>
                                <button
                                  onClick={() => openEditModal(admin)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                  <Edit3 size={14} className="mr-1.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(admin._id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                >
                                  <Trash2 size={14} className="mr-1.5" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Admin Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto rounded-lg">
              <div className="bg-green-600 px-6 py-4 rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Create New Admin</h2>
              </div>
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      maxLength={100}
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="number"
                      maxLength={10}
                      value={createForm.phone}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      required
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {Object.entries(roleHierarchy).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={createForm.department}
                      onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300  hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white  hover:bg-green-700 transition-colors"
                  >
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Edit Admin Modal */}
        {editingAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto rounded-lg">
              <div className="bg-green-600 px-6 py-4 rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">Edit Admin</h2>
              </div>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const updates = { ...editForm, isActive: editForm.status === 'active' };
                  delete updates.status;
                  handleUpdateAdmin(editingAdmin._id, updates);
                }}
                className="p-6 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      maxLength={100}
                      required
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="number"
                      maxLength={10}
                      onKeyDown={(e) => {
                        if (['e', 'E', '+', '-'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      required
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {Object.entries(roleHierarchy).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={editForm.department}
                      onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      required
                      value={editForm.status}
                      onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingAdmin(null)}
                    className="px-4 py-2 text-gray-700 border border-gray-300  hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white  hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout >
  );
}