import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Store, Phone, Mail, MapPin, Star, Package,
  DollarSign, Calendar, User, Edit, Trash2, CheckCircle,
  XCircle, Clock, AlertTriangle, FileText, CreditCard,
  Building, Globe, Users, Award, TrendingUp, Timer,
  Truck, Settings, X, Eye, Download, Image as ImageIcon,
  BarChart3
} from 'lucide-react';
import Layout from '../Components/Layout';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';
import toast from 'react-hot-toast';

const MerchantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch merchant details
  const fetchMerchantDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        if (data.success) {
          setMerchant(data.merchant);
        } else {
          throw new Error(data.message || 'Failed to fetch merchant details');
        }
      } else {
        throw new Error('Failed to fetch merchant details');
      }
    } catch (error) {
      console.error('Error fetching merchant details:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to load merchant details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMerchantDetails();
    }
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'banned':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStoreStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'hold':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'banned':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />);
      } else {
        stars.push(<Star key={i} size={16} color="#d1d5db" />);
      }
    }
    return stars;
  };

  const handleEdit = () => {
    navigate(`/merchants/${id}/edit`);
  };

  const handleClearDeviceLogin = async () => {
    if (!window.confirm('Are you sure you want to clear this merchant\'s device login? This will log them out from their current device and allow them to login on a new device.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/clear-device-login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        if (data.success) {
          toast.success('Device login cleared successfully. Merchant can now login on a new device.');
          // Refresh merchant details to show updated device info
          fetchMerchantDetails();
        } else {
          throw new Error(data.message || 'Failed to clear device login');
        }
      } else {
        throw new Error('Failed to clear device login');
      }
    } catch (error) {
      console.error('Error clearing device login:', error);
      toast.error(error.message || 'Failed to clear device login');
    }
  };

  const handleCloseShop = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeStatus: 'Closed'
        })
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        if (data.success) {
          toast.success('Shop closed successfully');
          fetchMerchantDetails(); // Refresh to show updated status
        } else {
          throw new Error(data.message || 'Failed to close shop');
        }
      } else {
        throw new Error('Failed to close shop');
      }
    } catch (error) {
      console.error('Error closing shop:', error);
      toast.error(error.message || 'Failed to close shop');
    }
  };

  const handleClearStats = async () => {
    if (!confirm('Are you sure you want to clear all performance statistics? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/clear-stats`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        if (data.success) {
          toast.success('Performance statistics cleared successfully');
          fetchMerchantDetails(); // Refresh to show updated stats
        } else {
          throw new Error(data.message || 'Failed to clear statistics');
        }
      } else {
        throw new Error('Failed to clear statistics');
      }
    } catch (error) {
      console.error('Error clearing stats:', error);
      toast.error(error.message || 'Failed to clear statistics');
    }
  };

  const handleViewDocument = (url, title) => {
    if (!url) {
      toast.error('Document URL not available');
      return;
    }
    
    // If it's an image, open in new tab
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      window.open(url, '_blank');
    } else {
      // For other documents, try to download
      handleDownloadDocument(url, title);
    }
  };

  const handleDownloadDocument = async (url, filename) => {
    if (!url) {
      toast.error('Document URL not available');
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Document downloaded successfully');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const DocumentCard = ({ title, isVerified, documentUrl, number, children }) => (
    <div className="p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-gray-900">{title}</p>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          {documentUrl && (
            <div className="flex gap-1">
              <button
                onClick={() => handleViewDocument(documentUrl, title)}
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                title="View Document"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => handleDownloadDocument(documentUrl, title)}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50"
                title="Download Document"
              >
                <Download size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {isVerified ? 'Verified' : 'Not provided'}
      </p>
      {number && (
        <p className="text-sm text-gray-600 mt-2">{number}</p>
      )}
      {children}
    </div>
  );

  if (loading) {
    return (
      <Layout title="Merchant Details">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
          <span className="ml-3 text-gray-600">Loading merchant details...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Merchant Details">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-red-500 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Merchant</h2>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate('/merchants')}
            className="mt-4 px-4 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            Back to Merchants
          </button>
        </div>
      </Layout>
    );
  }

  if (!merchant) {
    return (
      <Layout title="Merchant Details">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-gray-500 text-center">
            <Store className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Merchant Not Found</h2>
            <p>The merchant you're looking for doesn't exist.</p>
          </div>
          <button
            onClick={() => navigate('/merchants')}
            className="mt-4 px-4 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            Back to Merchants
          </button>
        </div>
      </Layout>
    );
  }

  // Extract nested data from the merchant object
  const businessInfo = merchant.businessInfo || {};
  const ownerInfo = merchant.ownerInfo || {};
  const operationalInfo = merchant.operationalInfo || {};
  const brandingInfo = merchant.brandingInfo || {};
  const complianceInfo = merchant.complianceInfo || {};
  const performance = merchant.performance || {};
  const documents = merchant.documents || {};
  const bankingInfo = merchant.bankingInfo || {};

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/merchants')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Merchants
                </button>
                <div className="border-l border-gray-300 pl-4">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {businessInfo.displayName || merchant.displayName || 'N/A'}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Merchant ID: <span className="font-mono text-gray-700">{businessInfo.merchantId || merchant.merchantId || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleClearDeviceLogin}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  Clear Device Login
                </button>
                {merchant?.storeStatus !== 'closed' && (
                  <button
                    onClick={handleCloseShop}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    <X size={16} className="mr-2" />
                    Close Shop
                  </button>
                )}
                <button
                  onClick={() => navigate(`/merchants/${id}/inventory`)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Package size={16} className="mr-2" />
                  View Inventory
                </button>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Merchant
                </button>
                <button
                  onClick={handleClearStats}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                >
                  <BarChart3 size={16} className="mr-2" />
                  Clear Stats
                </button>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className={`bg-white shadow-lg border-l-4 ${getStatusColor(merchant.status)} p-6 rounded-lg`}>
              <div className="flex items-center gap-4">
                {getStatusIcon(merchant.status)}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 capitalize">
                    Account: {merchant.status?.replace('_', ' ') || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {merchant.status === 'active' && 'This merchant is active and can receive orders.'}
                    {merchant.status === 'hold' && 'This merchant account is on hold.'}
                    {merchant.status === 'banned' && 'This merchant account has been banned.'}
                  </p>
                </div>
              </div>
            </div>

            {merchant.storeStatus && (
              <div className={`bg-white shadow-lg border-l-4 ${getStoreStatusColor(merchant.storeStatus)} p-6 rounded-lg`}>
                <div className="flex items-center gap-4">
                  <Store className="w-6 h-6 flex-shrink-0 text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 capitalize">
                      Store: {merchant.storeStatus?.replace('_', ' ') || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {merchant.storeStatus === 'open' && 'Store is currently open'}
                      {merchant.storeStatus === 'closed' && 'Store is currently closed'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Building className="w-6 h-6" />
                Basic Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {brandingInfo.logoUrl && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Store Logo</label>
                    <div className="mt-3">
                      <img
                        src={brandingInfo.logoUrl}
                        alt="Store Logo"
                        className="w-20 h-20 object-cover border-2 border-gray-200 rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <div className={brandingInfo.logoUrl ? "" : "sm:col-span-2"}>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Display Name</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">{businessInfo.displayName || merchant.displayName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Merchant ID</label>
                  <p className="mt-2 text-gray-900 text-base font-mono font-medium">{businessInfo.merchantId || merchant.merchantId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Established Year</label>
                  <p className="mt-2 text-gray-900 text-base font-medium">{businessInfo.establishedYear || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Store Description</label>
                  <p className="mt-2 text-gray-900 text-base leading-relaxed">{merchant.brandingInfo?.storeDescription || 'No store description available'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Registration Date</label>
                  <p className="mt-2 text-gray-900 text-base font-medium">{formatDate(merchant.registrationDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Last Login</label>
                  <p className="mt-2 text-gray-900 text-base font-medium">{formatDate(merchant.lastLogin)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Last Updated</label>
                  <p className="mt-2 text-gray-900 text-base font-medium">{formatDate(merchant.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Device ID</label>
                  <p className="mt-2 text-gray-900 text-base font-mono font-medium break-all">{merchant.deviceId || 'Not logged in'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Device Platform</label>
                  <p className="mt-2 text-gray-900 text-base font-medium">{merchant.deviceInfo?.platform || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Device Name</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">{merchant.deviceInfo?.deviceName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Device Last Login</label>
                  <p className="mt-2 text-gray-900 text-base font-medium">{merchant.deviceInfo?.lastLogin ? formatDate(merchant.deviceInfo.lastLogin) : 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Push Token</label>
                  <p className="mt-2 text-gray-900 text-sm font-mono break-all bg-gray-50 p-3 rounded-lg border">{merchant.deviceInfo?.pushToken || 'Not available'}</p>
                </div>
                {businessInfo.website && (
                  <div className="sm:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Website</label>
                    <a href={businessInfo.website} target="_blank" rel="noopener noreferrer"
                       className="mt-2 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-base font-medium break-all">
                      <Globe className="w-5 h-5 flex-shrink-0" />
                      {businessInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <User className="w-6 h-6" />
                Owner Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Full Name</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">{ownerInfo.fullName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Email</label>
                  <p className="mt-2 text-gray-900 flex items-center gap-2 text-base font-medium">
                    <Mail className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    <span className="break-all">{ownerInfo.email || merchant.email || 'N/A'}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Phone</label>
                  <p className="mt-2 text-gray-900 flex items-center gap-2 text-base font-medium">
                    <Phone className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    {ownerInfo.mobile || merchant.mobile || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Alternate Phone</label>
                  <p className="mt-2 text-gray-900 flex items-center gap-2 text-base font-medium">
                    <Phone className="w-5 h-5 flex-shrink-0 text-gray-400" />
                    {ownerInfo.alternateMobile || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Address */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <MapPin className="w-6 h-6" />
                Store Address
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Address</label>
                  <p className="mt-2 text-gray-900 flex items-start gap-3 text-base font-medium">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="break-words">
                      {operationalInfo.storeAddress ?
                        `${operationalInfo.storeAddress.street || ''}, ${operationalInfo.storeAddress.city || ''}, ${operationalInfo.storeAddress.state || ''} - ${operationalInfo.storeAddress.pincode || ''}`
                        : 'Address not available'
                      }
                    </span>
                  </p>
                </div>
                {operationalInfo.storeAddress?.landmark && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Landmark</label>
                    <p className="mt-2 text-gray-900 text-base font-medium break-words">{operationalInfo.storeAddress.landmark}</p>
                  </div>
                )}
                {operationalInfo.storeAddress?.coordinates && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Coordinates</label>
                    <p className="mt-2 text-gray-900 text-base font-mono font-medium">
                      Latitude: {operationalInfo.storeAddress.coordinates.latitude || 'N/A'},
                      Longitude: {operationalInfo.storeAddress.coordinates.longitude || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              {/* Map View */}
              {operationalInfo.storeAddress?.coordinates?.latitude && operationalInfo.storeAddress?.coordinates?.longitude && (
                <div className="mt-6">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 block">Store Location</label>
                  <div className="w-full h-64 overflow-hidden border-2 border-gray-200 rounded-lg shadow-sm relative">
                    <GoogleMap
                      center={{
                        lat: parseFloat(operationalInfo.storeAddress.coordinates.latitude),
                        lng: parseFloat(operationalInfo.storeAddress.coordinates.longitude)
                      }}
                      zoom={15}
                      style={{
                        height: '100%',
                        width: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      options={{
                        zoomControl: true,
                        mapTypeControl: false,
                        scaleControl: false,
                        streetViewControl: false,
                        rotateControl: false,
                        fullscreenControl: false,
                        gestureHandling: 'cooperative'
                      }}
                    >
                      <Marker
                        position={{
                          lat: parseFloat(operationalInfo.storeAddress.coordinates.latitude),
                          lng: parseFloat(operationalInfo.storeAddress.coordinates.longitude)
                        }}
                        title={`${merchant?.businessInfo?.storeName || 'Store'} Location`}
                        infoContent={`
                          <div style="max-width: 250px;">
                            <strong>${merchant?.businessInfo?.storeName || 'Store'} Location</strong><br/>
                            ${operationalInfo.storeAddress ?
                              `${operationalInfo.storeAddress.street || ''}, ${operationalInfo.storeAddress.city || ''}, ${operationalInfo.storeAddress.state || ''} - ${operationalInfo.storeAddress.pincode || ''}` 
                          : 'Address not available'
                        }<br/>
                        <small>Lat: ${operationalInfo.storeAddress.coordinates.latitude}, Lng: ${operationalInfo.storeAddress.coordinates.longitude}</small>
                      </div>
                    `}
                  />
                </GoogleMap>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Clock className="w-6 h-6" />
                Operating Hours
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Opening Time</p>
                    <p className="text-gray-900 text-lg font-medium">{operationalInfo.openingTime || 'Not set'}</p>
                  </div>
                </div>
                <div className="hidden sm:block text-gray-400 text-2xl">—</div>
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Closing Time</p>
                    <p className="text-gray-900 text-lg font-medium">{operationalInfo.closingTime || 'Not set'}</p>
                  </div>
                </div>
              </div>
              {(operationalInfo.openingTime && operationalInfo.closingTime) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <p className="text-base text-gray-700 font-medium">
                    Store operates daily from {operationalInfo.openingTime} to {operationalInfo.closingTime}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Operational Information */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Settings className="w-6 h-6" />
                Operational Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Store Type</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">
                    {operationalInfo.storeType || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Product Categories</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">
                    {operationalInfo.productCategories?.length > 0
                      ? operationalInfo.productCategories.join(', ')
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Commission Percentage</label>
                  <p className="mt-2 text-gray-900 text-lg font-bold text-green-600">
                    {complianceInfo?.commissionStructure?.percentage ? `${complianceInfo.commissionStructure.percentage}%` : 'N/A'}
                  </p>
                  {complianceInfo?.commissionStructure?.lastUpdated && (
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {new Date(complianceInfo.commissionStructure.lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Opening Time</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">
                    {operationalInfo.openingTime || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Closing Time</label>
                  <p className="mt-2 text-gray-900 text-base font-medium break-words">
                    {operationalInfo.closingTime || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Branding Information */}
          {brandingInfo && Object.keys(brandingInfo).length > 0 && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-pink-600 to-pink-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Award className="w-6 h-6" />
                  Branding Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {brandingInfo.logo && (
                    <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-gray-900 text-lg">Store Logo</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDocument(brandingInfo.logo, 'Store Logo')}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Logo"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(brandingInfo.logo, 'Store Logo')}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Download Logo"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <img
                          src={brandingInfo.logo}
                          alt="Store Logo"
                          className="w-24 h-24 object-cover border-2 border-gray-300 rounded-lg shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {brandingInfo.banner && (
                    <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <p className="font-semibold text-gray-900 text-lg">Store Banner</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDocument(brandingInfo.banner, 'Store Banner')}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                            title="View Banner"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(brandingInfo.banner, 'Store Banner')}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            title="Download Banner"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <img
                          src={brandingInfo.banner}
                          alt="Store Banner"
                          className="w-full h-24 object-cover border-2 border-gray-300 rounded-lg shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {brandingInfo.tagline && (
                    <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tagline</label>
                      <p className="mt-2 text-gray-900 text-base font-medium">{brandingInfo.tagline}</p>
                    </div>
                  )}

                  {brandingInfo.colorScheme && (
                    <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Color Scheme</label>
                      <p className="mt-2 text-gray-900 text-base font-medium">{brandingInfo.colorScheme}</p>
                    </div>
                  )}

                  {brandingInfo.website && (
                    <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Website</label>
                      <a href={brandingInfo.website} target="_blank" rel="noopener noreferrer"
                         className="mt-2 text-blue-600 hover:text-blue-800 flex items-center gap-2 text-base font-medium">
                        <Globe className="w-5 h-5 flex-shrink-0" />
                        {brandingInfo.website}
                      </a>
                    </div>
                  )}

                  {brandingInfo.socialMedia?.googleBusiness && (
                    <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Google Business</label>
                      <a href={brandingInfo.socialMedia.googleBusiness} target="_blank" rel="noopener noreferrer"
                         className="mt-2 text-green-600 hover:text-green-800 flex items-center gap-2 text-base font-medium">
                        <Globe className="w-5 h-5 flex-shrink-0" />
                        Google Business Profile
                      </a>
                    </div>
                  )}

                  {/* Store Images */}
                  {merchant.brandingInfo?.storeImages && merchant.brandingInfo.storeImages.length > 0 && (
                    <div className="sm:col-span-2 p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 block">Store Images</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {merchant.brandingInfo.storeImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.url}
                              alt={image.alt || `Store Image ${index + 1}`}
                              className="w-full h-24 object-cover border-2 border-gray-300 rounded-lg shadow-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-2 rounded-lg">
                              <button
                                onClick={() => handleViewDocument(image.url, `Store Image ${index + 1}`)}
                                className="p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="View Image"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(image.url, `Store Image ${index + 1}`)}
                                className="p-2 bg-green-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download Image"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                Performance Metrics
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">{performance.totalOrders || merchant.totalOrders || 0}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        {performance.completedOrders || 0} completed, {performance.cancelledOrders || 0} cancelled
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600 flex-shrink-0 ml-4" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(performance.totalRevenue || merchant.totalRevenue || 0)}</p>
                      <p className="text-sm text-gray-600 mt-2">
                        Avg: {formatCurrency(performance.averageOrderValue || 0)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600 flex-shrink-0 ml-4" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Average Rating</p>
                      <div className="flex items-center gap-2 mb-2">
                        {getRatingStars(performance.rating)}
                        <span className="text-2xl font-bold text-yellow-600">
                          {performance.rating ? performance.rating.toFixed(1) : merchant.averageRating ? merchant.averageRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{performance.totalRatings || 0} reviews</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600 flex-shrink-0 ml-4" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-lg border border-teal-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Completion Rate</p>
                      <p className="text-2xl font-bold text-teal-600">
                        {performance.totalOrders > 0
                          ? ((performance.completedOrders / performance.totalOrders) * 100).toFixed(1)
                          : 0
                        }%
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-teal-600 flex-shrink-0 ml-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Documents & Verification
              </h2>
            </div>
            <div className="p-6">
              {/* Google Drive Documents Link */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents Link</h3>
                {documents.documentsLink ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <a
                      href={documents.documentsLink.startsWith('http') ? documents.documentsLink : `https://drive.google.com/drive/folders/${documents.documentsLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-base flex items-center gap-2 font-medium break-all"
                    >
                      <Eye className="w-5 h-5 flex-shrink-0" />
                      View Documents Folder
                    </a>
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  </div>
                ) : (
                  <span className="text-base text-red-600 font-medium">No documents link provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Banking Information */}
          {((bankingInfo && Object.keys(bankingInfo).length > 0) || merchant.bankDetails) && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  Banking Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account Holder Name</label>
                    <p className="mt-2 text-gray-900 text-base font-medium break-words">{bankingInfo.accountHolderName || merchant.bankDetails?.accountHolderName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account Number</label>
                    <p className="mt-2 text-gray-900 text-base font-mono font-medium">{bankingInfo.accountNumber || merchant.bankDetails?.accountNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bank Name</label>
                    <p className="mt-2 text-gray-900 text-base font-medium break-words">{bankingInfo.bankName || merchant.bankDetails?.bankName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">IFSC Code</label>
                    <p className="mt-2 text-gray-900 text-base font-mono font-medium">{bankingInfo.ifscCode || merchant.bankDetails?.ifscCode || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Information */}
          {merchant.lastUpdatedBy && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  Last Updated
                </h2>
              </div>
              <div className="p-6">
                <div className="text-base text-gray-600">
                  <p>Last updated by <span className="font-semibold text-gray-900">{merchant.lastUpdatedBy.userName}</span> ({merchant.lastUpdatedBy.userRole})</p>
                  <p>at <span className="font-semibold text-gray-900">{new Date(merchant.lastUpdatedBy.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
    </Layout>
  );
};

export default MerchantDetails;
