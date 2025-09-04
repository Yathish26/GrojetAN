import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Store, Phone, Mail, MapPin, Star, Package,
  DollarSign, Calendar, User, Edit, Trash2, CheckCircle,
  XCircle, Clock, AlertTriangle, FileText, CreditCard,
  Building, Globe, Users, Award, TrendingUp, Timer,
  Instagram, Facebook, Twitter, Truck, Settings, Eye,
  Download, Image as ImageIcon
} from 'lucide-react';
import Layout from '../Components/Layout';
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

      if (response.ok) {
        const data = await response.json();
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
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      case 'temporarily_closed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending_verification':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'suspended':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-600" />;
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
    <div className="p-4 border border-gray-200 rounded-lg">
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
                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                title="View Document"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => handleDownloadDocument(documentUrl, title)}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/merchants')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={16} />
              Back to Merchants
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{businessInfo.displayName || merchant.displayName || 'N/A'}</h1>
              <p className="text-gray-600">Merchant ID: {businessInfo.merchantId || merchant.merchantId || 'N/A'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit size={16} />
              Edit Merchant
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${getStatusColor(merchant.status)}`}>
            <div className="flex items-center gap-3">
              {getStatusIcon(merchant.status)}
              <div>
                <h3 className="font-semibold capitalize">
                  Account: {merchant.status?.replace('_', ' ') || 'Unknown'}
                </h3>
                <p className="text-sm">
                  {merchant.status === 'active' && 'This merchant is active and can receive orders.'}
                  {merchant.status === 'inactive' && 'This merchant is inactive and cannot receive orders.'}
                  {merchant.status === 'pending_verification' && 'This merchant is pending verification.'}
                  {merchant.status === 'suspended' && 'This merchant has been suspended.'}
                  {merchant.status === 'closed' && 'This merchant account has been closed.'}
                </p>
              </div>
            </div>
          </div>

          {merchant.storeStatus && (
            <div className={`p-4 rounded-lg border ${getStoreStatusColor(merchant.storeStatus)}`}>
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5" />
                <div>
                  <h3 className="font-semibold capitalize">
                    Store: {merchant.storeStatus?.replace('_', ' ') || 'Unknown'}
                  </h3>
                  <p className="text-sm">
                    {merchant.storeStatus === 'open' && 'Store is currently open'}
                    {merchant.storeStatus === 'closed' && 'Store is currently closed'}
                    {merchant.storeStatus === 'busy' && 'Store is open but busy'}
                    {merchant.storeStatus === 'temporarily_closed' && 'Store is temporarily closed'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Display Name</label>
              <p className="text-gray-900">{businessInfo.displayName || merchant.displayName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Merchant ID</label>
              <p className="text-gray-900">{businessInfo.merchantId || merchant.merchantId || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Business Type</label>
              <p className="text-gray-900 capitalize">{businessInfo.businessType || merchant.businessType || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900">{businessInfo.description || 'No description available'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Registration Date</label>
              <p className="text-gray-900">{formatDate(merchant.registrationDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Login</label>
              <p className="text-gray-900">{formatDate(merchant.lastLogin)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">{formatDate(merchant.updatedAt)}</p>
            </div>
            {businessInfo.website && (
              <div>
                <label className="text-sm font-medium text-gray-500">Website</label>
                <a href={businessInfo.website} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {businessInfo.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Owner Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-gray-900">{ownerInfo.fullName || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {ownerInfo.email || merchant.email || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {ownerInfo.phone || merchant.mobile || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Alternate Phone</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {ownerInfo.alternatePhone || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-gray-900">{formatDate(ownerInfo.dateOfBirth)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Gender</label>
              <p className="text-gray-900 capitalize">{ownerInfo.gender || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contact & Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {ownerInfo.email || merchant.email || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {ownerInfo.phone || merchant.mobile || 'N/A'}
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900 flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                {operationalInfo.storeAddress ? 
                  `${operationalInfo.storeAddress.street || ''}, ${operationalInfo.storeAddress.area || ''}, ${operationalInfo.storeAddress.city || ''}, ${operationalInfo.storeAddress.state || ''} - ${operationalInfo.storeAddress.pincode || ''}` 
                  : merchant.address || 'Address not available'
                }
              </p>
            </div>
            {operationalInfo.storeAddress?.landmark && (
              <div>
                <label className="text-sm font-medium text-gray-500">Landmark</label>
                <p className="text-gray-900">{operationalInfo.storeAddress.landmark}</p>
              </div>
            )}
          </div>
        </div>

        {/* Store Timings */}
        {operationalInfo.storeTimings && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Store Timings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(operationalInfo.storeTimings).map(([day, timing]) => (
                <div key={day} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize">{day}</span>
                    {timing.isOpen ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {timing.isOpen ? 
                      `${formatTime(timing.openTime)} - ${formatTime(timing.closeTime)}` 
                      : 'Closed'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operational Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Operational Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Product Categories</label>
              <p className="text-gray-900">
                {operationalInfo.productCategories?.length > 0 
                  ? operationalInfo.productCategories.join(', ') 
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Radius</label>
              <p className="text-gray-900 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                {operationalInfo.deliveryPreferences?.radius || 0} km
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Delivery Charges</label>
              <p className="text-gray-900">{formatCurrency(operationalInfo.deliveryPreferences?.charges || 0)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Minimum Order</label>
              <p className="text-gray-900">{formatCurrency(operationalInfo.deliveryPreferences?.minimumOrder || 0)}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Payment Methods</label>
              <p className="text-gray-900">
                {operationalInfo.paymentMethods?.length > 0 
                  ? operationalInfo.paymentMethods.join(', ') 
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Branding Information */}
        {brandingInfo && Object.keys(brandingInfo).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Branding Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandingInfo.logo && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Store Logo</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewDocument(brandingInfo.logo, 'Store Logo')}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="View Logo"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(brandingInfo.logo, 'Store Logo')}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
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
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {brandingInfo.banner && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">Store Banner</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleViewDocument(brandingInfo.banner, 'Store Banner')}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="View Banner"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(brandingInfo.banner, 'Store Banner')}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
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
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
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

              {brandingInfo.socialMedia && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Social Media</label>
                  <div className="flex gap-4 mt-2">
                    {brandingInfo.socialMedia.instagram && (
                      <a href={brandingInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 text-pink-600 hover:text-pink-800">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </a>
                    )}
                    {brandingInfo.socialMedia.facebook && (
                      <a href={brandingInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </a>
                    )}
                    {brandingInfo.socialMedia.twitter && (
                      <a href={brandingInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-2 text-blue-400 hover:text-blue-600">
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Store Images */}
              {documents.storeImages && documents.storeImages.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Store Images</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {documents.storeImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Store Image ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center gap-1">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{performance.totalOrders || merchant.totalOrders || 0}</p>
                  <p className="text-xs text-gray-500">
                    {performance.completedOrders || 0} completed, {performance.cancelledOrders || 0} cancelled
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(performance.totalRevenue || merchant.totalRevenue || 0)}</p>
                  <p className="text-xs text-gray-500">
                    Avg: {formatCurrency(performance.averageOrderValue || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <div className="flex items-center gap-1">
                    {getRatingStars(performance.rating)}
                    <span className="text-2xl font-bold text-yellow-600 ml-1">
                      {performance.rating ? performance.rating.toFixed(1) : merchant.averageRating ? merchant.averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{performance.totalRatings || 0} reviews</p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Delivery Time</p>
                  <p className="text-2xl font-bold text-purple-600">{performance.averageDeliveryTime?.toFixed(0) || 0} min</p>
                  <p className="text-xs text-gray-500">
                    Response: {performance.responseTime?.toFixed(0) || 0} min
                  </p>
                </div>
                <Timer className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                  <p className="text-2xl font-bold text-indigo-600">{performance.customerSatisfaction || 0}%</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {performance.totalOrders > 0 
                      ? ((performance.completedOrders / performance.totalOrders) * 100).toFixed(1) 
                      : 0
                    }%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & Verification
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentCard
              title="GST Certificate"
              isVerified={documents.gst?.isVerified || merchant.gstNumber}
              documentUrl={documents.gst?.certificateUrl}
              number={documents.gst?.number || merchant.gstNumber}
            />

            <DocumentCard
              title="FSSAI License"
              isVerified={documents.fssai?.isVerified || merchant.fssaiNumber}
              documentUrl={documents.fssai?.certificateUrl}
              number={documents.fssai?.number || merchant.fssaiNumber}
            />

            <DocumentCard
              title="PAN Card"
              isVerified={documents.pan?.isVerified || merchant.panNumber}
              documentUrl={documents.pan?.certificateUrl}
              number={documents.pan?.number || merchant.panNumber}
            />

            <DocumentCard
              title="Address Proof"
              isVerified={documents.addressProof?.isVerified}
              documentUrl={documents.addressProof?.certificateUrl}
            />

            <DocumentCard
              title="Aadhaar Card (Front)"
              isVerified={documents.aadhaarCard?.isVerified}
              documentUrl={documents.aadhaarCard?.frontUrl}
            />

            <DocumentCard
              title="Aadhaar Card (Back)"
              isVerified={documents.aadhaarCard?.isVerified}
              documentUrl={documents.aadhaarCard?.backUrl}
            />

            <DocumentCard
              title="Cancelled Cheque"
              isVerified={bankingInfo.cancelledChequeUrl || merchant.bankDetails?.cancelledCheque}
              documentUrl={bankingInfo.cancelledChequeUrl || merchant.bankDetails?.cancelledCheque}
            />

            <DocumentCard
              title="Bank Passbook"
              isVerified={bankingInfo.bankPassbookUrl || merchant.bankDetails?.bankPassbook}
              documentUrl={bankingInfo.bankPassbookUrl || merchant.bankDetails?.bankPassbook}
            />

            <DocumentCard
              title="Shop Establishment License"
              isVerified={documents.shopEstablishmentLicense}
              documentUrl={documents.shopEstablishmentLicense}
            />

            <DocumentCard
              title="Incorporation Certificate"
              isVerified={documents.incorporationCertificate}
              documentUrl={documents.incorporationCertificate}
            />
          </div>
        </div>

        {/* Banking Information */}
        {((bankingInfo && Object.keys(bankingInfo).length > 0) || merchant.bankDetails) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Banking Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account Holder Name</label>
                <p className="text-gray-900">{bankingInfo.accountHolder || merchant.bankDetails?.accountHolderName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Number</label>
                <p className="text-gray-900">{bankingInfo.accountNumber || merchant.bankDetails?.accountNumber || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Bank Name</label>
                <p className="text-gray-900">{bankingInfo.bankName || merchant.bankDetails?.bankName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                <p className="text-gray-900">{bankingInfo.ifscCode || merchant.bankDetails?.ifscCode || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Type</label>
                <p className="text-gray-900">{bankingInfo.accountType || 'Not provided'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Additional Documents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentCard
              title="Store Logo"
              isVerified={documents.storeLogo || brandingInfo?.logo}
              documentUrl={documents.storeLogo || brandingInfo?.logo}
            />

            <DocumentCard
              title="Store Banner"
              isVerified={documents.storeBanner || brandingInfo?.banner}
              documentUrl={documents.storeBanner || brandingInfo?.banner}
            />

            <DocumentCard
              title="Shop Establishment License"
              isVerified={documents.shopEstablishmentLicense}
              documentUrl={documents.shopEstablishmentLicense}
            />

            <DocumentCard
              title="Incorporation Certificate"
              isVerified={documents.incorporationCertificate}
              documentUrl={documents.incorporationCertificate}
            />

            <DocumentCard
              title="Aadhaar Card (Front)"
              isVerified={documents.aadhaarCard?.frontUrl}
              documentUrl={documents.aadhaarCard?.frontUrl}
            />

            <DocumentCard
              title="Aadhaar Card (Back)"
              isVerified={documents.aadhaarCard?.backUrl}
              documentUrl={documents.aadhaarCard?.backUrl}
            />

            <DocumentCard
              title="Cancelled Cheque"
              isVerified={documents.cancelledCheque || bankingInfo?.cancelledChequeUrl}
              documentUrl={documents.cancelledCheque || bankingInfo?.cancelledChequeUrl}
            />

            <DocumentCard
              title="Bank Passbook"
              isVerified={documents.bankPassbook || bankingInfo?.bankPassbookUrl}
              documentUrl={documents.bankPassbook || bankingInfo?.bankPassbookUrl}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MerchantDetails;
