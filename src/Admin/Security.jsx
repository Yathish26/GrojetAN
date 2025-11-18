import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, AlertTriangle, XCircle, CheckCircle, Trash2, Clock, User, MessageSquare } from 'lucide-react';
import Layout from '../Components/Layout.jsx';

export default function Security() {
    const [deleteRequests, setDeleteRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(null);

    // Fetch delete requests
    const fetchDeleteRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delete-requests`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.tokenValid === false) {
                    // Handle invalid token
                    return;
                }
                if (data.success) {
                    setDeleteRequests(data.requests);
                }
            } else {
                setError('Failed to fetch delete requests');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delete-requests/stats`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStats(data.stats);
                }
            }
        } catch (err) {
            console.error('Failed to fetch stats');
        }
    };

    // Approve delete request
    const handleApprove = async (userId) => {
        if (!confirm('Are you sure you want to permanently delete this user account? This action cannot be undone.')) {
            return;
        }

        setProcessing(userId);
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delete-requests/approve/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Refresh the list
                    fetchDeleteRequests();
                    fetchStats();
                }
            } else {
                alert('Failed to approve delete request');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setProcessing(null);
        }
    };

    // Reject delete request
    const handleReject = async (userId) => {
        const reason = prompt('Enter rejection reason (optional):');
        if (reason === null) return; // Cancelled

        setProcessing(userId);
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delete-requests/reject/${userId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'rejected',
                    reason: reason || null
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Refresh the list
                    fetchDeleteRequests();
                    fetchStats();
                }
            } else {
                alert('Failed to reject delete request');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            setProcessing(null);
        }
    };

    useEffect(() => {
        fetchDeleteRequests();
        fetchStats();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Layout title="Security">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-green-600" />
                        <h2 className="text-2xl font-bold text-neutral-900">Security Dashboard</h2>
                    </div>
                    <p className="text-neutral-600">
                        Monitor and manage security settings for the Grojet platform.
                    </p>
                </div>

                {/* Security Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Active Sessions</p>
                                <p className="text-2xl font-bold text-neutral-900">1,234</p>
                            </div>
                            <Lock className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Failed Logins</p>
                                <p className="text-2xl font-bold text-neutral-900">23</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Security Alerts</p>
                                <p className="text-2xl font-bold text-neutral-900">5</p>
                            </div>
                            <Eye className="w-8 h-8 text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-600">Compliance Score</p>
                                <p className="text-2xl font-bold text-neutral-900">98%</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Account Deletion Requests Section */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Trash2 className="w-6 h-6 text-red-600" />
                        <h3 className="text-lg font-semibold text-neutral-900">Account Deletion Requests</h3>
                    </div>
                    <p className="text-neutral-600 mb-4">
                        Manage user account deletion requests. Review and process pending requests.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Pending Requests</p>
                                    <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-600" />
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-800">Approved Deletions</p>
                                    <p className="text-2xl font-bold text-red-900">{stats.approved}</p>
                                </div>
                                <CheckCircle className="w-8 h-8 text-red-600" />
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-800">Rejected Requests</p>
                                    <p className="text-2xl font-bold text-green-900">{stats.rejected}</p>
                                </div>
                                <XCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* Delete Requests List */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-neutral-600">Loading requests...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-600">{error}</p>
                        </div>
                    ) : deleteRequests.length === 0 ? (
                        <div className="text-center py-8">
                            <Trash2 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600">No pending deletion requests</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {deleteRequests.map((request) => (
                                <div key={request._id} className="border border-neutral-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-neutral-600" />
                                                <span className="font-medium text-neutral-900">
                                                    {request.userId?.personalInfo?.name || 'Unknown User'}
                                                </span>
                                                <span className="text-sm text-neutral-500">
                                                    ({request.userId?.personalInfo?.email || 'No email'})
                                                </span>
                                                {request.userId?.personalInfo?.phone && (
                                                    <span className="text-sm text-neutral-500">
                                                        - {request.userId.personalInfo.phone}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mb-2">
                                                <span className="text-sm font-medium text-neutral-700">Reason:</span>
                                                <span className="text-sm text-neutral-600 ml-2">{request.reason}</span>
                                            </div>

                                            {request.feedback && (
                                                <div className="mb-2">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="w-4 h-4 text-neutral-600 mt-0.5" />
                                                        <div>
                                                            <span className="text-sm font-medium text-neutral-700">Feedback:</span>
                                                            <p className="text-sm text-neutral-600 mt-1">{request.feedback}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs text-neutral-500">
                                                Requested on {formatDate(request.requestedAt)}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleApprove(request.userId._id)}
                                                disabled={processing === request.userId._id}
                                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processing === request.userId._id ? 'Processing...' : 'Delete Account'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(request.userId._id)}
                                                disabled={processing === request.userId._id}
                                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}