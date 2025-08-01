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
  FiStar,
  FiAlertTriangle,
  FiEdit3,
  FiTrash2,
  FiUserX,
  FiUserCheck
} from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 rounded-full border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/users')}
            className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <FiArrowLeft className="text-xl" />
            <span>Back to Users</span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="bg-white shadow mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                {user.personalInfo?.avatar ? (
                  <img
                    src={user.personalInfo.avatar}
                    alt={user.personalInfo?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <FiUser className="text-3xl text-gray-400" />
                )}
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{user.personalInfo?.name || user.name}</h1>
                <p className="text-green-100">{user.personalInfo?.email || user.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`px-3 py-1 text-xs font-semibold ${
                    user.status?.isActive || user.status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status?.isActive || user.status ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-green-100 text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex gap-2">
              <button
                onClick={() => setShowWarnModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 transition disabled:opacity-50"
                disabled={updatingStatus}
              >
                <FiAlertTriangle className="text-sm" />
                Issue Warning
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
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <FiUser className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-medium">{user.personalInfo?.name || user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiMail className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{user.personalInfo?.email || user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPhone className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{user.personalInfo?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCalendar className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium">
                        {user.personalInfo?.dateOfBirth 
                          ? new Date(user.personalInfo.dateOfBirth).toLocaleDateString()
                          : 'Not provided'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="bg-white shadow">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">Addresses</h3>
                </div>
                <div className="p-6 space-y-4">
                  {user.addresses.map((address, index) => (
                    <div key={index} className="border p-4">
                      <div className="flex items-start gap-3">
                        <FiMapPin className="text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{address.type}</span>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs">Default</span>
                            )}
                          </div>
                          <p className="text-gray-600">
                            {address.street}
                            {address.landmark && `, ${address.landmark}`}
                          </p>
                          <p className="text-gray-600">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order History */}
            <div className="bg-white shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Order Statistics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50">
                    <FiShoppingBag className="text-2xl text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      {user.orderHistory?.totalOrders || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <FiCreditCard className="text-2xl text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{user.orderHistory?.totalSpent || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Spent</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <FiStar className="text-2xl text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      {user.loyalty?.points || 0}
                    </p>
                    <p className="text-sm text-gray-600">Loyalty Points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Account Status</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Status</span>
                  <span className={`font-medium ${
                    user.status?.accountStatus === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.status?.accountStatus || 'active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Verified</span>
                  <span className={`font-medium ${
                    user.authentication?.isEmailVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.authentication?.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Verified</span>
                  <span className={`font-medium ${
                    user.authentication?.isPhoneVerified ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {user.authentication?.isPhoneVerified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            <div className="bg-white shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  Warnings ({warnings.length})
                </h3>
              </div>
              <div className="p-6">
                {warnings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No warnings issued</p>
                ) : (
                  <div className="space-y-3">
                    {warnings.slice(0, 5).map((warning) => (
                      <div key={warning.id} className="border-l-4 border-yellow-400 pl-4 py-2">
                        <p className="text-sm text-gray-800">{warning.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(warning.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {warnings.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{warnings.length - 5} more warnings
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
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
    </div>
  );
}
