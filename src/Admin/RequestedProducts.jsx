import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Loader2, Trash2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from '../Components/Layout';

function RequestedProducts() {
  const [requestedProducts, setRequestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [deleteStep, setDeleteStep] = useState(1); // 1 for first confirmation, 2 for second
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navigate = useNavigate();

  // Fetch requested products
  const fetchRequestedProducts = async (pageNum = 1) => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_SERVER}/admin/products/requests?page=${pageNum}&limit=20`;

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch requested products');
      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login');
        return;
      }
      setRequestedProducts(data.requests || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching requested products:', error);
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please check if the server is running.');
      } else {
        toast.error('Failed to load requested products');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update request status
  const updateRequestStatus = async (requestId, status, rejectionReason = null) => {
    try {
      setUpdating(requestId);
      const body = {
        status,
        actionBy: currentAdmin?.name || 'Unknown Admin'
      };
      if (status === 'rejected' && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to update request status');
      const data = await response.json();
      toast.success(data.message);
      // Refresh the requested products list
      fetchRequestedProducts(page);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(null);
    }
  };

  // Handle reject button click
  const handleRejectClick = (requestId) => {
    setRejectingRequest(requestId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // Handle reject confirmation
  const handleRejectConfirm = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    updateRequestStatus(rejectingRequest, 'rejected', rejectionReason.trim());
    setShowRejectModal(false);
    setRejectingRequest(null);
    setRejectionReason('');
  };

  // Handle reject modal close
  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setRejectingRequest(null);
    setRejectionReason('');
  };

  // Handle delete button click
  const handleDeleteClick = (requestId) => {
    setDeletingRequest(requestId);
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else {
      deleteRequest(deletingRequest);
      setShowDeleteModal(false);
      setDeletingRequest(null);
      setDeleteStep(1);
    }
  };

  // Handle delete modal close
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingRequest(null);
    setDeleteStep(1);
  };

  // Delete request function
  const deleteRequest = async (requestId) => {
    try {
      setUpdating(requestId);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.status === 401) {
        navigate('/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to delete request');
      const data = await response.json();
      toast.success(data.message);
      // Refresh the requested products list
      fetchRequestedProducts(page);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  useEffect(() => {
    fetchRequestedProducts(1);
  }, []);

  // Load current admin
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        setCurrentAdmin(admin);
      } catch (e) {
        console.error('Failed to parse adminUser:', e);
      }
    }
  }, []);

  return (
    <Layout title="Requested Products">
      <div className="min-h-screen bg-gray-50 p-2 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate('/products')}
              className="p-2 hover:bg-gray-100 rounded-none transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-green-700">Requested Products</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Manage product requests from merchants</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin" size={32} />
            <span className="ml-2 text-gray-600">Loading requested products...</span>
          </div>
        ) : requestedProducts.length === 0 ? (
          <div className="bg-white rounded-none shadow-sm p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No product requests</h3>
            <p className="text-gray-500">There are no product requests from merchants at the moment.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-white rounded-none shadow-sm p-3 md:p-4">
                <div className="flex items-center">
                  <Clock className="text-yellow-500 flex-shrink-0" size={20} />
                  <div className="ml-2 md:ml-3">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {requestedProducts.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-none shadow-sm p-3 md:p-4">
                <div className="flex items-center">
                  <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                  <div className="ml-2 md:ml-3">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {requestedProducts.filter(r => r.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-none shadow-sm p-3 md:p-4">
                <div className="flex items-center">
                  <XCircle className="text-red-500 flex-shrink-0" size={20} />
                  <div className="ml-2 md:ml-3">
                    <p className="text-xs md:text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {requestedProducts.filter(r => r.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-none shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
                <h2 className="text-base md:text-lg font-medium text-gray-900">Product Requests</h2>
              </div>

              <div className="divide-y divide-gray-200">
                {requestedProducts.map((request) => (
                  <div key={request.id} className="p-4 md:p-6 hover:bg-gray-50">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base md:text-lg font-medium text-gray-900 break-words">{request.productName}</h3>
                          <div className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-none border self-start ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-2 break-words">
                          <span className="font-medium">Requested by:</span> {request.merchantBusinessName}
                          {request.merchantName && (
                            <span className="text-gray-500"> ({request.merchantName})</span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-none text-sm text-red-800 break-words">
                            <span className="font-medium">Rejection Reason:</span> {request.rejectionReason}
                          </div>
                        )}

                        {(request.status === 'approved' || request.status === 'rejected') && request.actionBy && (
                          <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-none text-sm text-gray-700 break-words">
                            <span className="font-medium">{request.status === 'approved' ? 'Approved' : 'Rejected'} by:</span> {request.actionBy}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 md:ml-4">
                        {request.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => updateRequestStatus(request.id, 'approved')}
                              disabled={updating === request.id}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-none flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              {updating === request.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(request.id)}
                              disabled={updating === request.id}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-none flex items-center justify-center gap-1 disabled:opacity-50"
                            >
                              {updating === request.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <XCircle size={14} />
                              )}
                              Reject
                            </button>
                          </div>
                        )}

                        {currentAdmin?.role === 'super_admin' && (
                          <div className="flex justify-center md:justify-start">
                            <button
                              onClick={() => handleDeleteClick(request.id)}
                              disabled={updating === request.id}
                              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-none flex items-center justify-center gap-1 disabled:opacity-50 w-full sm:w-auto"
                            >
                              {updating === request.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center mt-4 md:mt-6 gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchRequestedProducts(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 border border-gray-300 rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1 text-sm"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600 flex items-center">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchRequestedProducts(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1 text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none p-4 md:p-6 w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Product Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this product request:
            </p>

            {/* Quick Reason Buttons */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick reasons:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Already Available',
                  'Out of Stock',
                  'Not in Our Category',
                  'Invalid Request',
                  'Duplicate Request'
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setRejectionReason(reason)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-none transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-none resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1 mb-4">
              {rejectionReason.length}/500 characters
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleRejectCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-none transition-colors order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || updating === rejectingRequest}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                {updating === rejectingRequest && <Loader2 className="animate-spin" size={14} />}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none p-4 md:p-6 w-full max-w-md mx-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-none bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {deleteStep === 1 ? 'Delete Product Request?' : 'Confirm Deletion'}
              </h3>
              <p className="text-sm text-gray-600 mb-6 break-words">
                {deleteStep === 1
                  ? 'This action cannot be undone. Are you sure you want to delete this product request?'
                  : 'This will permanently remove the product request from the system. Type "DELETE" to confirm.'
                }
              </p>
              {deleteStep === 2 && (
                <input
                  type="text"
                  placeholder="Type DELETE to confirm"
                  className="w-full p-3 border border-gray-300 rounded-none mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  onChange={(e) => {
                    if (e.target.value === 'DELETE') {
                      handleDeleteConfirm();
                    }
                  }}
                />
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-none transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                {deleteStep === 1 && (
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none order-1 sm:order-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </Layout>
  );
}

export default RequestedProducts;