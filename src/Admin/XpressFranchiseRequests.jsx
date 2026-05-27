import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Mail, Phone, MapPin, User, Clock,
  ChevronDown, ChevronUp, RefreshCw, Briefcase,
  IndianRupee, MessageSquare, Building2, Zap,
} from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  reviewed: { label: 'Reviewed', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
};

const formatDateTime = (date) => {
  const d = new Date(date);
  return {
    dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeStr: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  };
};

export default function XpressFranchiseRequests() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const allowedRoles = ['super_admin', 'admin'];

  // Auth check
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setCheckingUser(true);
        const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
        if (res.status === 401) { navigate('/login', { replace: true }); return; }
        const data = await res.json();
        if (data.tokenValid === false) { navigate('/login', { replace: true }); return; }
        if (res.ok && data.admin) { setCurrentUser(data.admin); }
        else { navigate('/login', { replace: true }); }
      } catch { navigate('/login', { replace: true }); }
      finally { setCheckingUser(false); }
    };
    fetchCurrentUser();
  }, [navigate]);

  // Fetch requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/franchise-requests`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch { toast.error('Failed to load franchise requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (currentUser && allowedRoles.includes(currentUser.role)) fetchRequests();
  }, [currentUser]);

  // Update status
  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/franchise-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status } : r));
        toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch { toast.error('Server error'); }
    finally { setUpdatingId(null); }
  };

  const filtered = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter);

  // Loading / auth states
  if (checkingUser) {
    return (
      <Layout title="Franchise Requests">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      </Layout>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Franchise Requests">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Franchise Requests">
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-500" />
                Xpress Franchise Requests
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {requests.length} total &nbsp;·&nbsp; {requests.filter((r) => r.status === 'pending').length} pending
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={fetchRequests}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-red-500' : 'text-gray-500'}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto" />
              <p className="mt-4 text-gray-500 text-sm">Loading requests...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Zap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No franchise requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((req) => {
                const isExpanded = expandedId === req._id;
                const { dateStr, timeStr } = formatDateTime(req.createdAt);
                const statusCfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;

                return (
                  <div
                    key={req._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Row header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req._id)}
                      className="w-full p-4 flex items-start sm:items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-gray-900">{req.fullName}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />{req.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-green-500" />{req.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-blue-500" />{req.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{dateStr} at {timeStr}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded
                          ? <ChevronUp className="h-5 w-5 text-gray-400" />
                          : <ChevronDown className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <Detail icon={<IndianRupee className="h-4 w-4 text-green-500" />} label="Investment Capacity" value={req.investmentCapacity} />
                          <Detail icon={<Briefcase className="h-4 w-4 text-blue-500" />} label="Business Experience" value={req.businessExperience} />
                          {req.currentOccupation && (
                            <Detail icon={<Building2 className="h-4 w-4 text-purple-500" />} label="Current Occupation" value={req.currentOccupation} />
                          )}
                        </div>

                        {/* Reason */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" /> Why they want a franchise
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">{req.reason}</p>
                        </div>

                        {/* Optional message */}
                        {req.message && (
                          <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Additional Information</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{req.message}</p>
                          </div>
                        )}

                        {/* Status update */}
                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update Status:</span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => updateStatus(req._id, key)}
                                disabled={req.status === key || updatingId === req._id}
                                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
                                  ${req.status === key
                                    ? `${cfg.color} cursor-default`
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                                  }
                                  disabled:opacity-60`}
                              >
                                {updatingId === req._id && req.status !== key ? '...' : cfg.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Detail({ icon, label, value }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
        {icon}{label}
      </p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}
