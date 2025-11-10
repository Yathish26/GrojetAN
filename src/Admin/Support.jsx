import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { MessageSquare, User, Store, Clock, Eye, CheckCircle, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Support = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [merchantRequests, setMerchantRequests] = useState([]);
  const [customerRequests, setCustomerRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch both customer and merchant requests on initial load
    fetchCustomerRequests();
    fetchMerchantRequests();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Additional fetching when switching tabs (for refresh functionality)
    if (activeTab === 'merchant') {
      fetchMerchantRequests();
    } else if (activeTab === 'customer') {
      fetchCustomerRequests();
    }
  }, [activeTab]);

  const currentRequests = activeTab === 'customer' ? customerRequests : merchantRequests;

  const fetchMerchantRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/merchant`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Transform the data to match our component structure
        const transformedRequests = data.requests.map(request => ({
          id: request._id,
          subject: request.subject,
          message: request.message,
          sender: {
            name: request.storeInfo.storeName,
            email: request.ownerInfo.email,
            phone: request.ownerInfo.mobile,
            type: 'merchant',
            storeName: request.storeInfo.storeName,
            storeId: request.storeInfo.storeId,
            merchantId: request.merchantId?.businessInfo?.merchantId || request.merchantId
          },
          status: request.status,
          submittedAt: request.submittedAt,
          adminResponse: request.adminResponse
        }));
        setMerchantRequests(transformedRequests);
      } else {
        setError(data.message || 'Failed to fetch merchant support requests');
      }
    } catch (err) {
      console.error('Error fetching merchant support requests:', err);
      setError('Failed to load merchant support requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/customer`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (data.success) {
        setCustomerRequests(data.tickets);
      } else {
        setError(data.message || 'Failed to fetch customer support requests');
      }
    } catch (err) {
      console.error('Error fetching customer support requests:', err);
      setError('Failed to load customer support requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const local = localStorage.getItem('adminUser');
      if (local) {
        setCurrentUser(JSON.parse(local));
      } else {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
        const data = await response.json();
        if (response.ok && data.admin) {
          setCurrentUser(data.admin);
          localStorage.setItem('adminUser', JSON.stringify(data.admin));
        }
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest) return;

    const loadingToast = toast.loading('Updating ticket status...');

    try {
      const endpoint = selectedRequest.sender.type === 'customer'
        ? `/admin/support/customer/${selectedRequest.id}/status`
        : `/admin/support/merchant/${selectedRequest.id}/status`;

      const newStatus = selectedRequest.sender.type === 'customer' ? 'closed' : 'resolved';

      const response = await fetch(`${import.meta.env.VITE_SERVER}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          adminResponse: 'Request has been resolved.'
        })
      });

      if (response.ok) {
        // Update the local state
        const updateRequests = (requests) =>
          requests.map(req =>
            req.id === selectedRequest.id
              ? { ...req, status: newStatus }
              : req
          );

        if (selectedRequest.sender.type === 'customer') {
          setCustomerRequests(updateRequests);
        } else {
          setMerchantRequests(updateRequests);
        }

        // Update selected request
        setSelectedRequest({ ...selectedRequest, status: newStatus });

        toast.success(`Ticket status updated to ${newStatus}`, {
          id: loadingToast,
          duration: 3000,
        });
      } else {
        toast.error('Failed to update ticket status', {
          id: loadingToast,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Error updating ticket status', {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;

    // Only allow deletion for closed tickets
    if (selectedRequest.status !== 'closed' && selectedRequest.status !== 'resolved') {
      toast.error('Only closed or resolved tickets can be deleted.');
      return;
    }

    if (!confirm('Are you sure you want to permanently delete this support ticket? This action cannot be undone.')) {
      return;
    }

    const loadingToast = toast.loading('Deleting support ticket...');

    try {
      const endpoint = selectedRequest.sender.type === 'customer'
        ? `/admin/support/customer/${selectedRequest.id}`
        : `/admin/support/merchant/${selectedRequest.id}`;

      const response = await fetch(`${import.meta.env.VITE_SERVER}${endpoint}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove from local state
        const filterRequests = (requests) =>
          requests.filter(req => req.id !== selectedRequest.id);

        if (selectedRequest.sender.type === 'customer') {
          setCustomerRequests(filterRequests);
        } else {
          setMerchantRequests(filterRequests);
        }

        // Clear selected request
        setSelectedRequest(null);

        toast.success('Support ticket deleted successfully', {
          id: loadingToast,
          duration: 3000,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete the support ticket', {
          id: loadingToast,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Error deleting the support ticket', {
        id: loadingToast,
        duration: 4000,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusText = (status) => {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout title="Support Requests">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Support Requests</h1>
          <p className="text-gray-600">Manage customer and merchant support tickets</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'customer'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Customer Support ({customerRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('merchant')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'merchant'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Merchant Support ({merchantRequests.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Support Requests List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTab === 'customer' ? 'Customer' : 'Merchant'} Support Requests
                  </h2>
                  <button
                    onClick={activeTab === 'customer' ? fetchCustomerRequests : fetchMerchantRequests}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
                {error && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <RefreshCw size={24} className="animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading {activeTab} support requests...</p>
                  </div>
                ) : currentRequests.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {activeTab === 'customer' ? 'No customer support requests' : 'No merchant support requests'}
                    </p>
                  </div>
                ) : (
                  currentRequests.map((request) => (
                    <div
                      key={request.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedRequest?.id === request.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{request.subject}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                              {formatStatusText(request.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{request.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              {request.sender.type === 'customer' ? <User size={12} /> : <Store size={12} />}
                              <span>{request.sender.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>{formatDate(request.submittedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Eye size={16} className="text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Request Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              {selectedRequest ? (
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {formatStatusText(selectedRequest.status)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.subject}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded min-h-20">{selectedRequest.message}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sender Information</label>
                      <div className="bg-gray-50 p-3 rounded space-y-2">
                        <div className="flex items-center gap-2">
                          {selectedRequest.sender.type === 'customer' ? <User size={14} /> : <Store size={14} />}
                          <span className="text-sm font-medium">{selectedRequest.sender.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">Owner Email: {selectedRequest.sender.email}</p>
                        <p className="text-sm text-gray-600">Owner Phone: {selectedRequest.sender.phone}</p>
                        {selectedRequest.sender.merchantId && (
                          <p className="text-sm text-gray-600">Merchant ID: {selectedRequest.sender.merchantId}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Submitted</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.submittedAt)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleResolve}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        Resolve
                      </button>
                      {currentUser?.role === 'super_admin' && (selectedRequest.status === 'closed' || selectedRequest.status === 'resolved') && (
                        <button
                          onClick={handleDelete}
                          className="bg-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={14} className="inline mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a support request to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Support;