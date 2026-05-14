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
  FiBell,
  FiShield,
  FiClock,
  FiUsers,
  FiGlobe,
  FiBriefcase,
  FiTruck,
  FiStar
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout.jsx';

export default function UserData() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [merchantOrdersCount, setMerchantOrdersCount] = useState(0);
  const [xpressOrdersCount, setXpressOrdersCount] = useState(0);
  const [merchantSpend, setMerchantSpend] = useState(0);
  const [xpressSpend, setXpressSpend] = useState(0);
  const [lastMerchantOrderDate, setLastMerchantOrderDate] = useState(null);
  const [lastXpressOrderDate, setLastXpressOrderDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [personalInfoForm, setPersonalInfoForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: ''
  });
  const [updatingPersonalInfo, setUpdatingPersonalInfo] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationScreen, setNotificationScreen] = useState('Homescreen');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [deletingToken, setDeletingToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [updatingBusinessUser, setUpdatingBusinessUser] = useState(false);
  const [showAddGcoinsForm, setShowAddGcoinsForm] = useState(false);
  const [gcoinsAmount, setGcoinsAmount] = useState('');
  const [addingGcoins, setAddingGcoins] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserDetails();
      fetchMerchantOrdersCount();
      fetchXpressOrdersCount();
      fetchMerchantSpend();
      fetchXpressSpend();
      fetchLastMerchantOrderDate();
      fetchLastXpressOrderDate();
      fetchAdminRole();
    }
  }, [currentUser, id]);

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
      setPersonalInfoForm({
        name: data.user.personalInfo?.name || '',
        email: data.user.personalInfo?.email || '',
        phone: data.user.personalInfo?.phone || '',
        dateOfBirth: data.user.personalInfo?.dateOfBirth ? new Date(data.user.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
        gender: data.user.personalInfo?.gender || ''
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOrdersCount(merchantOrdersCount + xpressOrdersCount);
  }, [merchantOrdersCount, xpressOrdersCount]);

  const fetchCurrentUser = async () => {
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
      return;
    } finally {
      setCheckingUser(false);
    }
  };

  const fetchAdminRole = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/auth/profile`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAdminRole(data.admin.role);
      }
    } catch (error) {
      console.error('Error fetching admin role:', error);
    }
  };

  const fetchMerchantOrdersCount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/merchant-orders/count`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMerchantOrdersCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching merchant orders count:', error);
    }
  };

  const fetchXpressOrdersCount = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/xpress-orders/count`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setXpressOrdersCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching xpress orders count:', error);
    }
  };

  const fetchMerchantSpend = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/merchant-orders/spend`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMerchantSpend(data.totalSpent || 0);
      }
    } catch (error) {
      console.error('Error fetching merchant spend:', error);
    }
  };

  const fetchXpressSpend = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/xpress-orders/spend`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setXpressSpend(data.totalSpent || 0);
      }
    } catch (error) {
      console.error('Error fetching xpress spend:', error);
    }
  };

  const fetchLastMerchantOrderDate = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/merchant-orders/last-date`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLastMerchantOrderDate(data.lastOrderDate);
      }
    } catch (error) {
      console.error('Error fetching last merchant order date:', error);
    }
  };

  const fetchLastXpressOrderDate = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/xpress-orders/last-date`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLastXpressOrderDate(data.lastOrderDate);
      }
    } catch (error) {
      console.error('Error fetching last xpress order date:', error);
    }
  };

  const handleToggleBusinessUser = async () => {
    const newValue = !user.isBusinessUser;
    try {
      setUpdatingBusinessUser(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/business-user`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isBusinessUser: newValue }),
        }
      );
      if (response.ok) {
        toast.success(newValue ? 'User marked as business user. Xpress is now free.' : 'Business user status removed.');
        fetchUserDetails();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update business user status');
      }
    } catch (error) {
      console.error('Error updating business user status:', error);
      toast.error('Failed to update business user status');
    } finally {
      setUpdatingBusinessUser(false);
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

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('User deleted successfully');
        navigate('/users'); // Redirect to users list
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdatePersonalInfo = async () => {
    try {
      setUpdatingPersonalInfo(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/personal-info`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: personalInfoForm.name,
            email: personalInfoForm.email,
            phone: personalInfoForm.phone,
            dateOfBirth: personalInfoForm.dateOfBirth ? new Date(personalInfoForm.dateOfBirth).toISOString() : null,
            gender: personalInfoForm.gender
          }),
        }
      );

      if (response.ok) {
        toast.success('Personal information updated successfully');
        setIsEditingPersonalInfo(false);
        fetchUserDetails(); // Refresh user details
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update personal information');
      }
    } catch (error) {
      console.error('Error updating personal information:', error);
      toast.error('Failed to update personal information');
    } finally {
      setUpdatingPersonalInfo(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPersonalInfo(false);
    setPersonalInfoForm({
      name: user.personalInfo?.name || '',
      email: user.personalInfo?.email || '',
      phone: user.personalInfo?.phone || '',
      dateOfBirth: user.personalInfo?.dateOfBirth ? new Date(user.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.personalInfo?.gender || ''
    });
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    try {
      setSendingNotification(true);
      if (notificationTitle && notificationTitle.length > 150) {
        toast.error('Title cannot exceed 150 characters');
        setSendingNotification(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/send-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ title: notificationTitle, message: notificationMessage, screen: notificationScreen }),
        }
      );

      if (response.ok) {
        toast.success('Notification sent successfully');
        setShowNotificationModal(false);
        setNotificationMessage('');
        setNotificationTitle('');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleDeletePushToken = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this push token? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingToken(deviceId);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/users/${id}/push-tokens/${deviceId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        toast.success('Push token deleted successfully');
        fetchUserDetails(); // Refresh user details
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete push token');
      }
    } catch (error) {
      console.error('Error deleting push token:', error);
      toast.error('Failed to delete push token');
    } finally {
      setDeletingToken(null);
    }
  };

  const handleAddGcoins = async () => {
    if (!gcoinsAmount) {
      toast.error('Please enter the amount');
      return;
    }

    const amount = parseInt(gcoinsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      setAddingGcoins(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/${id}/add-gcoins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: amount,
          addedBy: currentUser?.name || currentUser?.email || 'Admin'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setUser(prev => ({
          ...prev,
          orderHistory: {
            ...prev.orderHistory,
            gcoins: (prev.orderHistory?.gcoins || 0) + amount
          }
        }));
        toast.success(`Successfully added ${amount} G-Coins to user`);
        setShowAddGcoinsForm(false);
        setGcoinsAmount('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to add G-Coins');
      }
    } catch (error) {
      console.error('Error adding G-Coins:', error);
      toast.error('Failed to add G-Coins');
    } finally {
      setAddingGcoins(false);
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

  if (checkingUser) {
    return (
      <Layout title="User Details">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="User Details">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="User Details">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                <p className="mt-1 text-sm text-gray-500">View and manage user information</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate('/users')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <FiArrowLeft className="mr-2" />
                  Back to Users
                </button>
              </div>
            </div>
          </div>

          {/* User Profile Header */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-green-600 px-6 py-8">
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
                  {user.isBusinessUser && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                      <FiBriefcase className="w-3 h-3" />
                      Business User
                    </span>
                  )}
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
                  onClick={() => navigate(`/users/${id}/orders`)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updatingStatus}
                >
                  <FiShoppingBag className="mr-2" />
                  User Orders
                </button>

                <button
                  onClick={() => setShowStatusModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updatingStatus}
                >
                  <FiEdit3 className="mr-2" />
                  Update Status
                </button>

                {user.status?.accountStatus !== 'suspended' ? (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={updatingStatus}
                  >
                    <FiUserX className="mr-2" />
                    {updatingStatus ? 'Processing...' : 'Suspend User'}
                  </button>
                ) : (
                  <button
                    onClick={handleActivateUser}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={updatingStatus}
                  >
                    <FiUserCheck className="mr-2" />
                    {updatingStatus ? 'Processing...' : 'Activate User'}
                  </button>
                )}

                <button
                  onClick={handleToggleBusinessUser}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${
                    user.isBusinessUser
                      ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={updatingBusinessUser}
                >
                  <FiBriefcase className="mr-2" />
                  {updatingBusinessUser ? 'Updating...' : user.isBusinessUser ? 'Remove Business User' : 'Mark as Business User'}
                </button>

                {adminRole === 'super_admin' && (
                  <>
                    <button
                      onClick={() => setShowAddGcoinsForm(!showAddGcoinsForm)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-800 hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updatingStatus}
                    >
                      <FiStar className="mr-2" />
                      Add G-Coins
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updatingStatus}
                    >
                      <FiTrash2 className="mr-2" />
                      {updatingStatus ? 'Deleting...' : 'Delete User'}
                    </button>
                  </>
                )}

                {/* Add G-Coins Inline Input */}
                {showAddGcoinsForm && (
                  <div className="mt-4 flex items-center space-x-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <FiStar className="w-4 h-4 text-purple-600" />
                    <input
                      type="number"
                      value={gcoinsAmount}
                      onChange={(e) => setGcoinsAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter G-Coins amount"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-800 focus:border-purple-800"
                      disabled={addingGcoins}
                      min="1"
                      autoFocus
                    />
                    <button
                      onClick={handleAddGcoins}
                      disabled={addingGcoins || !gcoinsAmount}
                      className="px-3 py-2 bg-purple-800 text-white text-sm rounded hover:bg-purple-900 disabled:opacity-50 transition-colors"
                    >
                      {addingGcoins ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddGcoinsForm(false);
                        setGcoinsAmount('');
                      }}
                      className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                      disabled={addingGcoins}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiUser className="w-6 h-6" />
                      Personal Information
                    </h3>
                    {!isEditingPersonalInfo && (
                      <button
                        onClick={() => setIsEditingPersonalInfo(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
                      >
                        <FiEdit3 className="mr-2" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {!isEditingPersonalInfo ? (
                    // Display Mode
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiUser className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Full Name</p>
                          <p className="font-medium">{user.personalInfo?.name || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiMail className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{user.personalInfo?.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiPhone className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{user.personalInfo?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
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
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiUsers className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Gender</p>
                          <p className="font-medium capitalize">{user.personalInfo?.gender || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FiGlobe className="text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">App Version</p>
                          <p className="font-medium">{user.appVersion?.current || 'Not available'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input
                            type="text"
                            value={personalInfoForm.name}
                            onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={updatingPersonalInfo}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={personalInfoForm.email}
                            onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={updatingPersonalInfo}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            value={personalInfoForm.phone}
                            onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={updatingPersonalInfo}
                            maxLength="10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                          <input
                            type="date"
                            value={personalInfoForm.dateOfBirth}
                            onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, dateOfBirth: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={updatingPersonalInfo}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Gender</label>
                          <select
                            value={personalInfoForm.gender}
                            onChange={(e) => setPersonalInfoForm({ ...personalInfoForm, gender: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={updatingPersonalInfo}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          disabled={updatingPersonalInfo}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpdatePersonalInfo}
                          disabled={updatingPersonalInfo}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          {updatingPersonalInfo ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Authentication & Security */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-green-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiShield className="w-6 h-6" />
                    Authentication & Security
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Email Verified</span>
                      <span className={`font-medium ${user.authentication?.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {user.authentication?.isEmailVerified ? '✓ Verified' : '✗ Not Verified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Phone Verified</span>
                      <span className={`font-medium ${user.authentication?.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {user.authentication?.isPhoneVerified ? '✓ Verified' : '✗ Not Verified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Last Login</span>
                      <span className="font-medium">
                        {user.authentication?.lastLogin ? new Date(user.authentication.lastLogin).toLocaleString('en-IN') : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Login Attempts</span>
                      <span className="font-medium">{user.authentication?.loginAttempts || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order History & Statistics */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-green-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiShoppingBag className="w-6 h-6" />
                    Order History & Statistics
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/users/${id}/orders`)}>
                      <FiShoppingBag className="text-2xl text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">
                        {ordersCount}
                      </p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow">
                      <FiBriefcase className="text-2xl text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">
                        {merchantOrdersCount}
                      </p>
                      <p className="text-sm text-gray-600">Merchant Orders</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow">
                      <FiTruck className="text-2xl text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">
                        {xpressOrdersCount}
                      </p>
                      <p className="text-sm text-gray-600">Xpress Orders</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow">
                      <BiRupee className="text-2xl text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">
                        ₹{merchantSpend.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Merchant Spend</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg shadow">
                      <BiRupee className="text-2xl text-teal-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">
                        ₹{xpressSpend.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Xpress Spend</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow">
                      <FiStar className="text-2xl text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-800">
                        {user.orderHistory?.gcoins || 0}
                      </p>
                      <p className="text-sm text-gray-600">G-Coins</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Last Merchant Order Date</span>
                      <span className="font-medium">
                        {lastMerchantOrderDate ? new Date(lastMerchantOrderDate).toLocaleString('en-IN') : 'No orders yet'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Last Xpress Order Date</span>
                      <span className="font-medium">
                        {lastXpressOrderDate ? new Date(lastXpressOrderDate).toLocaleString('en-IN') : 'No orders yet'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Favorite Items Count</span>
                      <span className="font-medium">{user.orderHistory?.favoriteItems?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              {user.addresses && user.addresses.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="bg-green-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiMapPin className="w-6 h-6" />
                      Addresses ({user.addresses.length})
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {user.addresses.map((address, index) => (
                      <div key={index} className="border border-gray-200 p-4 rounded-lg">
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

              {/* Last Known Location */}
              {user.lastLocation && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="bg-green-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiMapPin className="w-6 h-6" />
                      Last Known Location
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Latitude</span>
                        <span className="font-medium">{user.lastLocation.latitude?.toFixed(6) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Longitude</span>
                        <span className="font-medium">{user.lastLocation.longitude?.toFixed(6) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="font-medium">
                          {user.lastLocation.updatedAt ? new Date(user.lastLocation.updatedAt).toLocaleString('en-IN') : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {user.lastLocation.latitude && user.lastLocation.longitude && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${user.lastLocation.latitude},${user.lastLocation.longitude}`;
                            window.open(url, '_blank');
                          }}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <FiMapPin className="mr-2" />
                          View on Google Maps
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preferences & Notifications */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-green-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiSettings className="w-6 h-6" />
                    Preferences & Notifications
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Notification Settings</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 text-sm">Email Notifications</span>
                          <span className={`text-xs px-2 py-1 ${user.notificationPreferences?.emailNotifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.notificationPreferences?.emailNotifications ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-gray-600 text-sm">Order Updates</span>
                          <span className={`text-xs px-2 py-1 ${user.notificationPreferences?.orderUpdates ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.notificationPreferences?.orderUpdates ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
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

              {/* Push Tokens & Device Info */}
              {user.pushTokens && user.pushTokens.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="bg-green-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiBell className="w-6 h-6" />
                      Push Tokens & Devices ({user.pushTokens.length})
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {user.pushTokens.map((tokenData, index) => (
                      <div key={index} className="border border-gray-200 p-4 rounded-lg relative">
                        {!tokenData.isActive && (
                          <button
                            onClick={() => handleDeletePushToken(tokenData.deviceInfo?.deviceId)}
                            disabled={deletingToken === tokenData.deviceInfo?.deviceId}
                            className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete push token"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className="flex items-start gap-3">
                          <FiBell className="text-gray-400 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{tokenData.deviceInfo?.deviceName || 'Unknown Device'}</span>
                              <span className={`px-2 py-1 text-xs ${tokenData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {tokenData.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                              <div>
                                <span className="font-medium">Platform:</span> {tokenData.deviceInfo?.platform || 'Unknown'}
                              </div>
                              <div>
                                <span className="font-medium">OS:</span> {tokenData.deviceInfo?.osName || 'Unknown'} {tokenData.deviceInfo?.osVersion || ''}
                              </div>
                              <div>
                                <span className="font-medium">Model:</span> {tokenData.deviceInfo?.modelName || 'Unknown'}
                              </div>
                              <div>
                                <span className="font-medium">App Version:</span> {tokenData.deviceInfo?.appVersion || 'Unknown'}
                              </div>
                            </div>

                            <div className="text-xs text-gray-500 mb-2">
                              <div>Device ID: {tokenData.deviceInfo?.deviceId || 'N/A'}</div>
                              <div>Registered: {new Date(tokenData.registeredAt).toLocaleString('en-IN')}</div>
                              <div>Last Updated: {new Date(tokenData.lastUpdated).toLocaleString('en-IN')}</div>
                            </div>

                            <div className="bg-gray-50 p-2 text-xs font-mono text-gray-700 break-all">
                              <span className="font-medium">Token:</span> {tokenData.token}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Status */}
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="bg-green-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiShield className="w-6 h-6" />
                    Account Status
                  </h3>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
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
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Active</span>
                    <span className={`font-medium ${user.status?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user.status?.isActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {user.status?.suspensionReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">Suspension Reason:</p>
                      <p className="text-sm text-red-700 mt-1">{user.status.suspensionReason}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Member Since</span>
                    <span className="font-medium text-sm">{new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Last Updated</span>
                    <span className="font-medium text-sm">{new Date(user.updatedAt).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={sendingNotification}
                    >
                      <FiBell className="mr-2" />
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>

              {/* Support Tickets */}
              {user.support && user.support.tickets && user.support.tickets.length > 0 && (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="bg-green-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiClock className="w-6 h-6" />
                      Support Tickets ({user.support.tickets.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-2">
                      {user.support.tickets.slice(0, 3).map((ticket, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
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
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="bg-green-600 px-6 py-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FiBell className="w-6 h-6" />
                      Support Notes ({user.support.notes.length})
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {user.support.notes.slice(0, 2).map((note, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
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

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full rounded-lg shadow-xl">
              <div className="px-6 py-4 border-b bg-green-600 rounded-t-lg">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiBell className="w-5 h-5" />
                  Send Notification
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Send a push notification to <strong>{user?.personalInfo?.name || 'this user'}</strong>
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Title (optional)
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                </label>
                <input
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Short title (appears on the device)"
                  maxLength={150}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={sendingNotification}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Message
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your notification message..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                  disabled={sendingNotification}
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {notificationMessage.length}/500 characters
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Navigate to Screen (on click)
                </label>
                <select
                  value={notificationScreen}
                  onChange={(e) => setNotificationScreen(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={sendingNotification}
                >
                  <option value="Homescreen">Homescreen</option>
                  <option value="Homescreen/Market">Homescreen/Market</option>
                  <option value="Stores">Stores</option>
                  <option value="Xpress">Xpress Screen</option>
                  <option value="Orders">Orders</option>
                  <option value="Profile">Profile</option>
                  <option value="Search">Search</option>
                  <option value="Cart">Cart</option>
                  <option value="Wishlist">Wishlist</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNotificationModal(false);
                    setNotificationMessage('');
                    setNotificationTitle('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  disabled={sendingNotification}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotification || !notificationMessage.trim()}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 rounded-lg"
                >
                  {sendingNotification ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    </Layout >
  );
}
