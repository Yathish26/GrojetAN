import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Star, 
  Clock, 
  DollarSign, 
  FileText, 
  Camera, 
  AlertCircle, 
  CircleCheck, 
  XCircle,
  Edit3,
  Save,
  X,
  Calendar,
  Award,
  TrendingUp,
  Package,
  Navigation,
  Shield,
  Eye,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryAgentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [agentStats, setAgentStats] = useState(null);

  useEffect(() => {
    fetchAgentDetails();
    fetchAgentOrders();
    fetchAgentStats();
  }, [id]);

  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch agent details');
      }
      
      const data = await response.json();
      setAgent(data.agent);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentOrders = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/orders`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch agent orders:', err);
    }
  };

  const fetchAgentStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/stats`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAgentStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch agent stats:', err);
    }
  };

  const updateAgentStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }

      const data = await response.json();
      setAgent(data.agent);
      toast.success(`Agent status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const approveApplication = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to approve application');
      }

      const data = await response.json();
      setAgent(data.agent);
      toast.success('Application approved successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const rejectApplication = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/${id}/reject`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      const data = await response.json();
      setAgent(data.agent);
      toast.success('Application rejected');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CircleCheck className="w-5 h-5 text-green-500" />;
      case 'active':
        return <CircleCheck className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'suspended':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended':
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkingStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Agent Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'The requested delivery agent could not be found.'}</p>
        <button
          onClick={() => navigate('/delivery-agents')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Agents
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/delivery-agents')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {agent.personalInfo?.firstName} {agent.personalInfo?.lastName}
            </h1>
            <p className="text-gray-600">Delivery Agent ID: {agent._id}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getWorkingStatusColor(agent.status?.isOnline ? 'online' : 'offline')}`}>
            <div className={`w-2 h-2 rounded-full ${
              agent.status?.isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <span className="capitalize">{agent.status?.isOnline ? 'online' : 'offline'}</span>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(agent.status?.applicationStatus)}`}>
            {getStatusIcon(agent.status?.applicationStatus)}
            <span className="font-medium capitalize">{agent.status?.applicationStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="font-medium text-gray-800">
                    {agent.personalInfo?.firstName} {agent.personalInfo?.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-gray-800">{agent.personalInfo?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium text-gray-800">{agent.personalInfo?.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Date of Birth</label>
                  <p className="font-medium text-gray-800">
                    {agent.personalInfo?.dateOfBirth ? new Date(agent.personalInfo.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Gender</label>
                  <p className="font-medium text-gray-800 capitalize">
                    {agent.personalInfo?.gender || 'Not specified'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Address</label>
                  <p className="font-medium text-gray-800">
                    {agent.address ? 
                      `${agent.address.street}, ${agent.address.city}, ${agent.address.state} - ${agent.address.zipCode}` 
                      : 'Not provided'
                    }
                  </p>
                  {agent.address?.landmark && (
                    <p className="text-sm text-gray-600">Landmark: {agent.address.landmark}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Emergency Contact</label>
                  <p className="font-medium text-gray-800">{agent.emergencyContact?.name || 'Not provided'}</p>
                  {agent.emergencyContact?.phone && (
                    <p className="text-sm text-gray-600">{agent.emergencyContact.phone}</p>
                  )}
                  {agent.emergencyContact?.relationship && (
                    <p className="text-sm text-gray-600 capitalize">Relationship: {agent.emergencyContact.relationship}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500">Joining Date</label>
                  <p className="font-medium text-gray-800">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Vehicle Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Vehicle Type</label>
                  <p className="font-medium text-gray-800 capitalize">{agent.vehicleInfo?.vehicleType || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Vehicle Number</label>
                  <p className="font-medium text-gray-800">{agent.vehicleInfo?.vehicleNumber || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">RC Book</label>
                  <div className="flex items-center gap-2">
                    {agent.vehicleInfo?.rcBook ? (
                      <>
                        <CircleCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">Not uploaded</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Insurance</label>
                  <div className="flex items-center gap-2">
                    {agent.vehicleInfo?.insurance ? (
                      <>
                        <CircleCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">Not uploaded</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">PUC Certificate</label>
                  <div className="flex items-center gap-2">
                    {agent.vehicleInfo?.puc ? (
                      <>
                        <CircleCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Uploaded</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600">Optional - Not uploaded</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'aadharFront', label: 'Aadhar Card (Front)' },
                  { key: 'aadharBack', label: 'Aadhar Card (Back)' },
                  { key: 'panCard', label: 'PAN Card' },
                  { key: 'drivingLicense', label: 'Driving License' }
                ].map(doc => (
                  <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">{doc.label}</span>
                      {agent.documents?.[doc.key] ? (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {agent.documents?.[doc.key] ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.open(agent.documents[doc.key], '_blank')}
                          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button 
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = agent.documents[doc.key];
                            link.download = `${doc.label}_${agent.personalInfo?.firstName}_${agent.personalInfo?.lastName}`;
                            link.click();
                          }}
                          className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-red-600">Not uploaded</span>
                    )}
                  </div>
                ))}
                
                {/* Profile Photo */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">Profile Photo</span>
                    {agent.personalInfo?.profilePhoto ? (
                      <CircleCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  {agent.personalInfo?.profilePhoto ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => window.open(agent.personalInfo.profilePhoto, '_blank')}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-red-600">Not uploaded</span>
                  )}
                </div>

                {/* Bank Account Details */}
                <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-800">Bank Account Details</span>
                    {agent.documents?.bankAccount?.accountNumber ? (
                      <CircleCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  {agent.documents?.bankAccount?.accountNumber ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Account Holder</label>
                        <p className="font-medium">{agent.documents.bankAccount.accountHolderName}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Bank Name</label>
                        <p className="font-medium">{agent.documents.bankAccount.bankName}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Account Number</label>
                        <p className="font-medium">****{agent.documents.bankAccount.accountNumber.slice(-4)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">IFSC Code</label>
                        <p className="font-medium">{agent.documents.bankAccount.ifscCode}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-red-600">Not provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Work Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Preferred Areas</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {agent.workInfo?.preferredAreas?.length > 0 ? (
                      agent.workInfo.preferredAreas.map((area, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No preferences set</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Working Days</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {agent.workInfo?.workingDays?.length > 0 ? (
                      agent.workInfo.workingDays.map((day, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full capitalize">
                          {day}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Availability Hours</label>
                  <p className="font-medium text-gray-800">
                    {agent.workInfo?.availabilityHours?.start && agent.workInfo?.availabilityHours?.end
                      ? `${agent.workInfo.availabilityHours.start} - ${agent.workInfo.availabilityHours.end}`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Expected Salary</label>
                  <p className="font-medium text-gray-800">
                    {agent.workInfo?.expectedSalary 
                      ? `₹${agent.workInfo.expectedSalary.toLocaleString()}/month`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Experience</label>
                  <p className="font-medium text-gray-800">
                    {agent.workInfo?.experience 
                      ? `${agent.workInfo.experience} years`
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Recent Orders
              </h2>
            </div>
            <div className="p-6">
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">₹{order.totalAmount}</p>
                        <p className={`text-sm capitalize ${
                          order.status === 'delivered' ? 'text-green-600' : 
                          order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent orders</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{agent.status?.rating || 5.0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Deliveries</span>
                <span className="font-medium">{agent.status?.totalDeliveries || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Completed Deliveries</span>
                <span className="font-medium">{agent.status?.completedDeliveries || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium">
                  {agent.status?.totalDeliveries > 0 
                    ? Math.round((agent.status.completedDeliveries / agent.status.totalDeliveries) * 100)
                    : 0
                  }%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Earnings</span>
                <span className="font-medium">₹{agent.status?.earnings?.total || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-medium">₹{agent.status?.earnings?.thisMonth || 0}</span>
              </div>
            </div>
          </div>

          {/* Application Status & Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Application Status
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500">Application Status</label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mt-1 ${getStatusColor(agent.status?.applicationStatus)}`}>
                  {getStatusIcon(agent.status?.applicationStatus)}
                  <span className="font-medium capitalize">{agent.status?.applicationStatus}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Documents Verified</label>
                <div className="flex items-center gap-2 mt-1">
                  {agent.verification?.documentsVerified ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Verified</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Pending</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Background Check</label>
                <div className="flex items-center gap-2 mt-1">
                  {agent.verification?.backgroundCheckPassed ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Passed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Pending</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Training Completed</label>
                <div className="flex items-center gap-2 mt-1">
                  {agent.verification?.trainingCompleted ? (
                    <>
                      <CircleCheck className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Completed</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600">Pending</span>
                    </>
                  )}
                </div>
              </div>

              {agent.status?.applicationStatus === 'pending' && (
                <div className="pt-4 space-y-2">
                  <button
                    onClick={approveApplication}
                    disabled={updating}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button
                    onClick={rejectApplication}
                    disabled={updating}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Current Location */}
          {agent.status?.currentLocation?.latitude && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Current Location
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Lat: {agent.status.currentLocation.latitude}, Lng: {agent.status.currentLocation.longitude}
                    </span>
                  </div>
                  {agent.status.currentLocation.lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(agent.status.currentLocation.lastUpdated).toLocaleString()}
                    </p>
                  )}
                  {agent.status.deliveryZone && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">Zone: {agent.status.deliveryZone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
