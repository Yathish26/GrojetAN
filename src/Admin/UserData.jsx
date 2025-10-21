import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiCreditCard,
  FiShoppingBag,
  FiAlertTriangle,
  FiEdit3,
  FiTrash2,
  FiUserX,
  FiUserCheck,
  FiSettings,
  FiHeart,
  FiBell,
  FiShield,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiGlobe,
  FiDollarSign
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout.jsx';

export default function UserData() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warningText, setWarningText] = useState('');
  const [submittingWarning, setSubmittingWarning] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    fetchUserDetails();
    fetchUserWarnings();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}`,
        {
          credentials: 'include',
        }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login');
        return;
      }
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserWarnings = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/warnings`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWarnings(data.warnings || []);
      }
    } catch (error) {
      console.error('Error fetching user warnings:', error);
    }
  };

  const handleWarnUser = async () => {
    if (!warningText.trim()) {
      toast.error('Please enter a warning message');
      return;
    }

    try {
      setSubmittingWarning(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/warn`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ warning: warningText }),
        }
      );

      if (response.ok) {
        toast.success('Warning issued successfully');
        setShowWarnModal(false);
        setWarningText('');
        fetchUserWarnings(); // Refresh warnings
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to issue warning');
      }
    } catch (error) {
      console.error('Error issuing warning:', error);
      toast.error('Failed to issue warning');
    } finally {
      setSubmittingWarning(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspensionReason.trim()) {
      toast.error('Please enter a suspension reason');
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: 'suspended',
            reason: suspensionReason
          }),
        }
      );

      if (response.ok) {
        toast.success('User suspended successfully');
        setShowSuspendModal(false);
        setSuspensionReason('');
        fetchUserDetails(); // Refresh user details
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleActivateUser = async () => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ status: 'active' }),
        }
      );

      if (response.ok) {
        toast.success('User activated successfully');
        fetchUserDetails(); // Refresh user details
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to activate user');
      }
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Failed to activate user');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateUserStatus = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status');
      return;
    }

    if ((selectedStatus === 'suspended' || selectedStatus === 'banned') && !statusReason.trim()) {
      toast.error('Please provide a reason for suspension/ban');
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: selectedStatus,
            reason: statusReason
          }),
        }
      );

      if (response.ok) {
        toast.success(`User status updated to ${selectedStatus}`);
        setShowStatusModal(false);
        setSelectedStatus('');
        setStatusReason('');
        fetchUserDetails(); // Refresh user details
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <Layout title="User Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-12 w-12 border-t-2 border-b-2 rounded-full border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="User Details">
        <div className="flex flex-col items-center justify-center py-12">
          <FiUser className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/users')}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition"
          >
            Back to Users
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Details">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <FiArrowLeft className="text-xl" />
            <span>Back to Users</span>
          </button>
        </div>

        {/* User Profile Header */}
        <div className="bg-white shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-8">
            <div className="text-white">
              <h1 className="text-2xl font-bold">{user.personalInfo?.name || 'N/A'}</h1>
              <p className="text-green-100">{user.personalInfo?.email || user.personalInfo?.phone || 'N/A'}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold ${user.status?.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
                    user.status?.accountStatus === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      user.status?.accountStatus === 'suspended' ? 'bg-red-100 text-red-800' :
                        user.status?.accountStatus === 'banned' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                  }`}>
                  {user.status?.accountStatus ? user.status.accountStatus.charAt(0).toUpperCase() + user.status.accountStatus.slice(1) : 'Unknown'}
                </span>
                <span className="text-green-100 text-sm">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowWarnModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 transition disabled:opacity-50"
                disabled={updatingStatus}
              >
                <FiAlertTriangle className="text-sm" />
                Issue Warning
              </button>

              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                disabled={updatingStatus}
              >
                <FiEdit3 className="text-sm" />
                Update Status
              </button>

              {user.status?.accountStatus !== 'suspended' ? (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                  disabled={updatingStatus}
                >
                  <FiUserX className="text-sm" />
                  {updatingStatus ? 'Processing...' : 'Suspend User'}
                </button>
              ) : (
                <button
                  onClick={handleActivateUser}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                  disabled={updatingStatus}
                >
                  <FiUserCheck className="text-sm" />
                  {updatingStatus ? 'Processing...' : 'Activate User'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white shadow-lg">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  Personal Information
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50">
                    <FiUser className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{user.personalInfo?.name || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50">
                    <FiMail className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.personalInfo?.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50">
                    <FiPhone className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{user.personalInfo?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50">
                    <FiCalendar className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">
                        {user.personalInfo?.dateOfBirth
                          ? new Date(user.personalInfo.dateOfBirth).toLocaleDateString('en-IN')
                          : 'Not provided'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50">
                    <FiUsers className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Gender</p>
                      <p className="font-medium capitalize">{user.personalInfo?.gender || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50">
                    <FiGlobe className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Language</p>
                      <p className="font-medium uppercase">{user.preferences?.language || 'EN'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Authentication & Security */}
            <div className="bg-white shadow-lg">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiShield className="text-green-600" />
                  Authentication & Security
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <span className="text-gray-600">Email Verified</span>
                    <span className={`font-medium ${user.authentication?.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {user.authentication?.isEmailVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <span className="text-gray-600">Phone Verified</span>
                    <span className={`font-medium ${user.authentication?.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {user.authentication?.isPhoneVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <span className="text-gray-600">Last Login</span>
                    <span className="font-medium">
                      {user.authentication?.lastLogin ? new Date(user.authentication.lastLogin).toLocaleString('en-IN') : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50">
                    <span className="text-gray-600">Login Attempts</span>
                    <span className="font-medium">{user.authentication?.loginAttempts || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order History & Statistics */}
            <div className="bg-white shadow-lg">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiShoppingBag className="text-purple-600" />
                  Order History & Statistics
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                    <FiShoppingBag className="text-2xl text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      {user.orderHistory?.totalOrders || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100">
                    <FiDollarSign className="text-2xl text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{user.orderHistory?.totalSpent?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
                    <FiTrendingUp className="text-2xl text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{user.orderHistory?.averageOrderValue?.toLocaleString() || 0}
                    </p>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50">
                    <span className="text-gray-600">Last Order Date</span>
                    <span className="font-medium">
                      {user.orderHistory?.lastOrderDate ? new Date(user.orderHistory.lastOrderDate).toLocaleDateString('en-IN') : 'No orders yet'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50">
                    <span className="text-gray-600">Favorite Items Count</span>
                    <span className="font-medium">{user.orderHistory?.favoriteItems?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50">
                    <span className="text-gray-600">Preferred Merchants</span>
                    <span className="font-medium">{user.orderHistory?.preferredMerchants?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="bg-white shadow-lg">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-red-50 to-pink-50">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiMapPin className="text-red-600" />
                    Addresses ({user.addresses.length})
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {user.addresses.map((address, index) => (
                    <div key={index} className="border border-gray-200 p-4">
                      <div className="flex items-start gap-3">
                        <FiMapPin className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium capitalize">{address.type}</span>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs">Default</span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-1">
                            {address.street}
                            {address.landmark && `, ${address.landmark}`}
                          </p>
                          <p className="text-gray-600 mb-1">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          {address.alternateNumber && (
                            <p className="text-gray-600 text-sm">
                              Alt: {address.alternateNumber}
                            </p>
                          )}
                          {address.coordinates && (
                            <p className="text-gray-500 text-xs mt-1">
                              📍 {address.coordinates.latitude?.toFixed(6)}, {address.coordinates.longitude?.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences & Notifications */}
            <div className="bg-white shadow-lg">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiSettings className="text-teal-600" />
                  Preferences & Notifications
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800">Notification Settings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50">
                        <span className="text-gray-600 text-sm">Email Notifications</span>
                        <span className={`text-xs px-2 py-1 ${user.notificationPreferences?.emailNotifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.notificationPreferences?.emailNotifications ? 'On' : 'Off'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50">
                        <span className="text-gray-600 text-sm">Order Updates</span>
                        <span className={`text-xs px-2 py-1 ${user.notificationPreferences?.orderUpdates ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.notificationPreferences?.orderUpdates ? 'On' : 'Off'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50">
                        <span className="text-gray-600 text-sm">Promotions</span>
                        <span className={`text-xs px-2 py-1 ${user.notificationPreferences?.promotionsOffers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.notificationPreferences?.promotionsOffers ? 'On' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wishlist */}
            {user.wishlist && user.wishlist.length > 0 && (
              <div className="bg-white shadow-lg">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-pink-50 to-rose-50">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiHeart className="text-pink-600" />
                    Wishlist ({user.wishlist.length} items)
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.wishlist.slice(0, 6).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50">
                        <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                          {item.images && item.images[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiHeart className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-gray-600 text-sm">₹{item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {user.wishlist.length > 6 && (
                    <p className="text-center text-gray-500 text-sm mt-4">
                      +{user.wishlist.length - 6} more items in wishlist
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white shadow-lg">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-slate-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiShield className="text-gray-600" />
                  Account Status
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-gray-600 text-sm">Account Status</span>
                  <span className={`font-medium text-sm px-2 py-1 ${user.status?.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
                      user.status?.accountStatus === 'active' ? 'bg-green-100 text-green-800' :
                        user.status?.accountStatus === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          user.status?.accountStatus === 'suspended' ? 'bg-red-100 text-red-800' :
                            user.status?.accountStatus === 'banned' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                    }`}>
                    {user.status?.accountStatus || 'active'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-gray-600 text-sm">Active</span>
                  <span className={`font-medium ${user.status?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {user.status?.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
                {user.status?.suspensionReason && (
                  <div className="p-3 bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800 font-medium">Suspension Reason:</p>
                    <p className="text-sm text-red-700 mt-1">{user.status.suspensionReason}</p>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-gray-600 text-sm">Member Since</span>
                  <span className="font-medium text-sm">{new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50">
                  <span className="text-gray-600 text-sm">Last Updated</span>
                  <span className="font-medium text-sm">{new Date(user.updatedAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            <div className="bg-white shadow-lg">
              <div className="px-6 py-4 border-b bg-gradient-to-r from-yellow-50 to-amber-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiAlertTriangle className="text-yellow-600" />
                  Warnings ({user.warnings?.length || 0})
                </h3>
              </div>
              <div className="p-6">
                {user.warnings && user.warnings.length > 0 ? (
                  <div className="space-y-3">
                    {user.warnings.slice(0, 3).map((warning, index) => (
                      <div key={index} className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50">
                        <p className="text-sm text-gray-800">{warning.reason}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            By: {warning.addedBy?.name || 'Admin'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(warning.addedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {user.warnings.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{user.warnings.length - 3} more warnings
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FiAlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No warnings issued</p>
                  </div>
                )}
              </div>
            </div>

            {/* Support Tickets */}
            {user.support && user.support.tickets && user.support.tickets.length > 0 && (
              <div className="bg-white shadow-lg">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiClock className="text-blue-600" />
                    Support Tickets ({user.support.tickets.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {user.support.tickets.slice(0, 3).map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50">
                        <span className="text-sm font-medium">#{ticket.ticketNumber || ticket._id}</span>
                        <span className={`text-xs px-2 py-1 ${ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                            ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                              ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                'bg-yellow-100 text-yellow-800'
                          }`}>
                          {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Support Notes */}
            {user.support && user.support.notes && user.support.notes.length > 0 && (
              <div className="bg-white shadow-lg">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-violet-50">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FiBell className="text-purple-600" />
                    Support Notes ({user.support.notes.length})
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {user.support.notes.slice(0, 2).map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50">
                        <p className="text-sm text-gray-800">{note.note}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            By: {note.addedBy?.name || 'Admin'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.addedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Issue Warning</h3>
            </div>
            <div className="p-6">
              <textarea
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                placeholder="Enter warning message..."
                className="w-full h-24 p-3 border focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                disabled={submittingWarning}
              />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowWarnModal(false);
                  setWarningText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={submittingWarning}
              >
                Cancel
              </button>
              <button
                onClick={handleWarnUser}
                disabled={submittingWarning}
                className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {submittingWarning ? 'Issuing...' : 'Issue Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Suspend User</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for suspending this user:
              </p>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter suspension reason..."
                className="w-full h-24 p-3 border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={updatingStatus}
              />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={updatingStatus}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {updatingStatus ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Update User Status</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Select the new status for this user:
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={updatingStatus}
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              {(selectedStatus === 'suspended' || selectedStatus === 'banned') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Required)
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full h-24 p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingStatus}
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus('');
                  setStatusReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUserStatus}
                disabled={updatingStatus || !selectedStatus}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Issue Warning</h3>
            </div>
            <div className="p-6">
              <textarea
                value={warningText}
                onChange={(e) => setWarningText(e.target.value)}
                placeholder="Enter warning message..."
                className="w-full h-24 p-3 border focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                disabled={submittingWarning}
              />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowWarnModal(false);
                  setWarningText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={submittingWarning}
              >
                Cancel
              </button>
              <button
                onClick={handleWarnUser}
                disabled={submittingWarning}
                className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {submittingWarning ? 'Issuing...' : 'Issue Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Suspend User</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for suspending this user:
              </p>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder="Enter suspension reason..."
                className="w-full h-24 p-3 border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={updatingStatus}
              />
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                disabled={updatingStatus}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {updatingStatus ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Update User Status</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Select the new status for this user:
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={updatingStatus}
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              {(selectedStatus === 'suspended' || selectedStatus === 'banned') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Required)
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full h-24 p-3 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={updatingStatus}
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStatus('');
                  setStatusReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUserStatus}
                disabled={updatingStatus || !selectedStatus}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
