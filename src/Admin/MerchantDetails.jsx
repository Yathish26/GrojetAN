import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Store, Phone, Mail, MapPin, Star, Package,
  DollarSign, Calendar, User, Edit, Trash2, CheckCircle,
  XCircle, Clock, AlertTriangle, FileText, CreditCard,
  Building, Globe, Users, Award, TrendingUp, Timer,
  Truck, Settings, Eye, Download, Image as ImageIcon
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
      day: 'numeric'
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
    <Layout title="Merchant Details">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/merchants')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Merchants</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{businessInfo.displayName || merchant.displayName || 'N/A'}</h1>
              <p className="text-sm sm:text-base text-gray-600">Merchant ID: {businessInfo.merchantId || merchant.merchantId || 'N/A'}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleClearDeviceLogin}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors text-sm sm:text-base"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Clear Device Login</span>
              <span className="sm:hidden">Clear Login</span>
            </button>
            <button
              onClick={() => navigate(`/merchants/${id}/inventory`)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors text-sm sm:text-base"
            >
              <Package size={16} />
              Inventory
            </button>
            <button
              onClick={handleEdit}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors text-sm sm:text-base"
            >
              <Edit size={16} />
              Edit Merchant
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-3 sm:p-4 border ${getStatusColor(merchant.status)} rounded-lg`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(merchant.status)}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base capitalize truncate">
                  Account: {merchant.status?.replace('_', ' ') || 'Unknown'}
                </h3>
                <p className="text-xs sm:text-sm mt-1">
                  {merchant.status === 'active' && 'This merchant is active and can receive orders.'}
                  {merchant.status === 'hold' && 'This merchant account is on hold.'}
                  {merchant.status === 'banned' && 'This merchant account has been banned.'}
                </p>
              </div>
            </div>
          </div>

          {merchant.storeStatus && (
            <div className={`p-3 sm:p-4 border ${getStoreStatusColor(merchant.storeStatus)} rounded-lg`}>
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base capitalize truncate">
                    Store: {merchant.storeStatus?.replace('_', ' ') || 'Unknown'}
                  </h3>
                  <p className="text-xs sm:text-sm mt-1">
                    {merchant.storeStatus === 'open' && 'Store is currently open'}
                    {merchant.storeStatus === 'closed' && 'Store is currently closed'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {brandingInfo.logoUrl && (
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium text-gray-500">Store Logo</label>
                <div className="mt-2">
                  <img
                    src={brandingInfo.logoUrl}
                    alt="Store Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover border border-gray-200 rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            <div className={brandingInfo.logoUrl ? "" : "sm:col-span-2"}>
              <label className="text-sm font-medium text-gray-500">Display Name</label>
              <p className="text-gray-900 text-sm sm:text-base break-words">{businessInfo.displayName || merchant.displayName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Merchant ID</label>
              <p className="text-gray-900 text-sm sm:text-base font-mono">{businessInfo.merchantId || merchant.merchantId || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Established Year</label>
              <p className="text-gray-900 text-sm sm:text-base">{businessInfo.establishedYear || 'N/A'}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <label className="text-sm font-medium text-gray-500">Store Description</label>
              <p className="text-gray-900 text-sm sm:text-base">{merchant.brandingInfo?.storeDescription || 'No store description available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Registration Date</label>
              <p className="text-gray-900 text-sm sm:text-base">{formatDate(merchant.registrationDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Login</label>
              <p className="text-gray-900 text-sm sm:text-base">{formatDate(merchant.lastLogin)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900 text-sm sm:text-base">{formatDate(merchant.updatedAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Device ID</label>
              <p className="text-gray-900 text-sm sm:text-base font-mono break-all">{merchant.deviceId || 'Not logged in'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Device Platform</label>
              <p className="text-gray-900 text-sm sm:text-base">{merchant.deviceInfo?.platform || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Device Name</label>
              <p className="text-gray-900 text-sm sm:text-base break-words">{merchant.deviceInfo?.deviceName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Device Last Login</label>
              <p className="text-gray-900 text-sm sm:text-base">{merchant.deviceInfo?.lastLogin ? formatDate(merchant.deviceInfo.lastLogin) : 'N/A'}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-500">Push Token</label>
              <p className="text-gray-900 text-xs sm:text-sm font-mono break-all bg-gray-50 p-2 rounded">{merchant.deviceInfo?.pushToken || 'Not available'}</p>
            </div>
            {businessInfo.website && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-500">Website</label>
                <a href={businessInfo.website} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm sm:text-base break-all">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  {businessInfo.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Owner Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-gray-900 text-sm sm:text-base break-words">{ownerInfo.fullName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="break-all">{ownerInfo.email || merchant.email || 'N/A'}</span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {ownerInfo.mobile || merchant.mobile || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Alternate Phone</label>
              <p className="text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {ownerInfo.alternateMobile || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Store Address */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Store Address
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900 flex items-start gap-2 text-sm sm:text-base mt-1">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {operationalInfo.storeAddress ? 
                    `${operationalInfo.storeAddress.street || ''}, ${operationalInfo.storeAddress.area || ''}, ${operationalInfo.storeAddress.city || ''}, ${operationalInfo.storeAddress.state || ''} - ${operationalInfo.storeAddress.pincode || ''}` 
                    : merchant.address || 'Address not available'
                  }
                </span>
              </p>
            </div>
            {operationalInfo.storeAddress?.landmark && (
              <div>
                <label className="text-sm font-medium text-gray-500">Landmark</label>
                <p className="text-gray-900 text-sm sm:text-base break-words">{operationalInfo.storeAddress.landmark}</p>
              </div>
            )}
            {operationalInfo.storeAddress?.coordinates && (
              <div>
                <label className="text-sm font-medium text-gray-500">Coordinates</label>
                <p className="text-gray-900 text-sm sm:text-base font-mono">
                  Latitude: {operationalInfo.storeAddress.coordinates.latitude || 'N/A'}, 
                  Longitude: {operationalInfo.storeAddress.coordinates.longitude || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Map View */}
          {operationalInfo.storeAddress?.coordinates?.latitude && operationalInfo.storeAddress?.coordinates?.longitude && (
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-500 mb-2 block">Store Location</label>
              <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden border border-gray-200 rounded-lg relative">
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
                        ${operationalInfo.storeAddress.fullAddress || 'Address not available'}<br/>
                        <small>Lat: ${operationalInfo.storeAddress.coordinates.latitude}, Lng: ${operationalInfo.storeAddress.coordinates.longitude}</small>
                      </div>
                    `}
                  />
                </GoogleMap>
              </div>
            </div>
          )}
        </div>

        {/* Operating Hours */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Operating Hours
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Opening Time</p>
                <p className="text-gray-900 text-sm sm:text-base">{operationalInfo.openingTime || 'Not set'}</p>
              </div>
            </div>
            <div className="hidden sm:block text-gray-400">—</div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-500">Closing Time</p>
                <p className="text-gray-900 text-sm sm:text-base">{operationalInfo.closingTime || 'Not set'}</p>
              </div>
            </div>
          </div>
          {(operationalInfo.openingTime && operationalInfo.closingTime) && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Store operates daily from {operationalInfo.openingTime} to {operationalInfo.closingTime}
              </p>
            </div>
          )}
        </div>

        {/* Operational Information */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Operational Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Store Type</label>
              <p className="text-gray-900 text-sm sm:text-base break-words">
                {operationalInfo.storeType || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Product Categories</label>
              <p className="text-gray-900 text-sm sm:text-base break-words">
                {operationalInfo.productCategories?.length > 0
                  ? operationalInfo.productCategories.join(', ')
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Branding Information */}
        {brandingInfo && Object.keys(brandingInfo).length > 0 && (
          <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Branding Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brandingInfo.logo && (
                <div className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Store Logo</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewDocument(brandingInfo.logo, 'Store Logo')}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        title="View Logo"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(brandingInfo.logo, 'Store Logo')}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50"
                        title="Download Logo"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <img
                      src={brandingInfo.logo}
                      alt="Store Logo"
                      className="w-16 h-16 object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {brandingInfo.banner && (
                <div className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Store Banner</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewDocument(brandingInfo.banner, 'Store Banner')}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        title="View Banner"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(brandingInfo.banner, 'Store Banner')}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50"
                        title="Download Banner"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <img
                      src={brandingInfo.banner}
                      alt="Store Banner"
                      className="w-full h-20 object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {brandingInfo.tagline && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tagline</label>
                  <p className="text-gray-900">{brandingInfo.tagline}</p>
                </div>
              )}

              {brandingInfo.colorScheme && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Color Scheme</label>
                  <p className="text-gray-900">{brandingInfo.colorScheme}</p>
                </div>
              )}

              {brandingInfo.website && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <a href={brandingInfo.website} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {brandingInfo.website}
                  </a>
                </div>
              )}

              {brandingInfo.socialMedia?.googleBusiness && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Google Business</label>
                  <a href={brandingInfo.socialMedia.googleBusiness} target="_blank" rel="noopener noreferrer"
                     className="text-green-600 hover:text-green-800 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Google Business Profile
                  </a>
                </div>
              )}

              {/* Store Images */}
              {merchant.brandingInfo?.storeImages && merchant.brandingInfo.storeImages.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Store Images</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {merchant.brandingInfo.storeImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.alt || `Store Image ${index + 1}`}
                          className="w-full h-20 object-cover border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewDocument(imageUrl, `Store Image ${index + 1}`)}
                            className="p-1 bg-blue-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="View Image"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(imageUrl, `Store Image ${index + 1}`)}
                            className="p-1 bg-green-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download Image"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{performance.totalOrders || merchant.totalOrders || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {performance.completedOrders || 0} completed, {performance.cancelledOrders || 0} cancelled
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(performance.totalRevenue || merchant.totalRevenue || 0)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(performance.averageOrderValue || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 sm:p-6 rounded-lg sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Average Rating</p>
                  <div className="flex items-center gap-1 mb-1">
                    {getRatingStars(performance.rating)}
                    <span className="text-xl sm:text-2xl font-bold text-yellow-600 ml-1">
                      {performance.rating ? performance.rating.toFixed(1) : merchant.averageRating ? merchant.averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{performance.totalRatings || 0} reviews</p>
                </div>
                <Star className="w-8 h-8 text-yellow-600 flex-shrink-0 ml-2" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Avg Delivery Time</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">{performance.averageDeliveryTime?.toFixed(0) || 0} min</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Response: {performance.responseTime?.toFixed(0) || 0} min
                  </p>
                </div>
                <Timer className="w-8 h-8 text-purple-600 flex-shrink-0 ml-2" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Customer Satisfaction</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600">{performance.customerSatisfaction || 0}%</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600 flex-shrink-0 ml-2" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 sm:p-6 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-teal-600">
                    {performance.totalOrders > 0 
                      ? ((performance.completedOrders / performance.totalOrders) * 100).toFixed(1) 
                      : 0
                    }%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-teal-600 flex-shrink-0 ml-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & Verification
          </h2>

          {/* Google Drive Documents Link */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Documents Link</h3>
            {documents.documentsLink ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <a
                  href={documents.documentsLink.startsWith('http') ? documents.documentsLink : `https://drive.google.com/drive/folders/${documents.documentsLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm sm:text-base flex items-center gap-1 break-all"
                >
                  <Eye className="w-4 h-4 flex-shrink-0" />
                  View Documents Folder
                </a>
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>
            ) : (
              <span className="text-sm text-red-600">No documents link provided</span>
            )}
          </div>
        </div>

        {/* Banking Information */}
        {((bankingInfo && Object.keys(bankingInfo).length > 0) || merchant.bankDetails) && (
          <div className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Banking Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Holder Name</label>
                <p className="text-gray-900 text-sm sm:text-base break-words">{bankingInfo.accountHolderName || merchant.bankDetails?.accountHolderName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Number</label>
                <p className="text-gray-900 text-sm sm:text-base font-mono">{bankingInfo.accountNumber || merchant.bankDetails?.accountNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bank Name</label>
                <p className="text-gray-900 text-sm sm:text-base break-words">{bankingInfo.bankName || merchant.bankDetails?.bankName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                <p className="text-gray-900 text-sm sm:text-base font-mono">{bankingInfo.ifscCode || merchant.bankDetails?.ifscCode || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MerchantDetails;
