import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Store, Phone, Mail, MapPin,
  FileText, CreditCard, Building, Globe, Users,
  Upload, Eye, Download, Image as ImageIcon,
  CheckCircle, XCircle, AlertTriangle, Search, Navigation,
  Trash2
} from 'lucide-react';
import Layout from '../Components/Layout';
import { AddressSearch } from '../Components/GoogleMapComponents';
import toast from 'react-hot-toast';
import { INDIAN_STATES } from '../utils/states';
import { INDIAN_BANKS } from '../utils/banks';

const EditMerchant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, merchantName: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Fetch current user
  const fetchCurrentUser = useCallback(async () => {
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
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Handle location search
  const handlePlaceSelect = (placeData) => {
    if (placeData) {
      setSelectedLocation(placeData);
      setFormData(prev => ({
        ...prev,
        storeAddress: {
          ...prev.storeAddress,
          coordinates: {
            latitude: placeData.lat.toString(),
            longitude: placeData.lng.toString()
          }
        }
      }));
      toast.success('Location selected from Google Maps');
    }
  };

  const handleManualEntryToggle = (checked) => {
    setIsManualEntry(checked);
    if (checked) {
      setSelectedLocation(null);
      setLocationSearchQuery('');
    }
  };

  // Validate if location is properly selected
  const isLocationValid = () => {
    if (isManualEntry) {
      return formData.storeAddress.coordinates.latitude && formData.storeAddress.coordinates.longitude;
    }
    return selectedLocation !== null;
  };

  // Form state
  const [formData, setFormData] = useState({
    // Business Info
    merchantId: '',
    displayName: '',
    website: '',
    establishedYear: '',

    // Owner Info
    fullName: '',
    mobile: '',
    alternateMobile: '',
    email: '',

    // Banking Info
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      ifscCode: ''
    },

    // Operational Info
    storeAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      landmark: '',
      coordinates: { latitude: '', longitude: '' }
    },
    deliveryPreferences: {
      deliveryType: 'platform_delivery'
    },
    homeStore: false,
    productCategories: [],
    storeType: '',    // Documents (Text inputs)
    documents: {
      documentsLink: '',
    },

    // Branding
    brandingInfo: {
      logoUrl: '',
      bannerUrl: '',
      storeImages: [],
      tagline: '',
      storeDescription: '',
      socialMedia: {
        googleBusiness: ''
      }
    },

    // Compliance
    complianceInfo: {
      agreements: {
        merchantAgreement: { accepted: false, version: '' },
        termsAndConditions: { accepted: false, version: '' },
        privacyPolicy: { accepted: false, version: '' }
      },
      commissionStructure: {
        percentage: 10,
        minimumSettlement: 1000
      },
      digitalSignature: {
        signatureUrl: '',
        ipAddress: ''
      }
    },

    // Status
    status: 'pending_verification'
  });

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
        if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
        }
        if (data.success) {
          setMerchant(data.merchant);
          const merchant = data.merchant;

          // Populate form with existing data - mapping nested backend structure to flat form fields
          setFormData({
            // Business Info
            merchantId: merchant.businessInfo?.merchantId || '',
            displayName: merchant.businessInfo?.displayName || '',
            website: merchant.businessInfo?.website || '',
            establishedYear: merchant.businessInfo?.establishedYear || '',

            // Owner Info
            fullName: merchant.ownerInfo?.fullName || '',
            mobile: merchant.ownerInfo?.mobile || '',
            alternateMobile: merchant.ownerInfo?.alternateMobile || '',
            email: merchant.ownerInfo?.email || '',

            // Banking Info
            bankDetails: {
              accountHolderName: merchant.bankingInfo?.accountHolderName || '',
              accountNumber: merchant.bankingInfo?.accountNumber || '',
              bankName: merchant.bankingInfo?.bankName || '',
              branchName: merchant.bankingInfo?.branchName || '',
              ifscCode: merchant.bankingInfo?.ifscCode || ''
            },

            // Operational Info
            storeAddress: {
              street: merchant.operationalInfo?.storeAddress?.street || '',
              city: merchant.operationalInfo?.storeAddress?.city || '',
              state: merchant.operationalInfo?.storeAddress?.state || '',
              pincode: merchant.operationalInfo?.storeAddress?.pincode || '',
              country: merchant.operationalInfo?.storeAddress?.country || 'India',
              landmark: merchant.operationalInfo?.storeAddress?.landmark || '',
              coordinates: {
                latitude: merchant.operationalInfo?.storeAddress?.coordinates?.latitude || '',
                longitude: merchant.operationalInfo?.storeAddress?.coordinates?.longitude || ''
              }
            },
            deliveryPreferences: {
              deliveryType: merchant.operationalInfo?.deliveryPreferences?.deliveryType || 'platform_delivery'
            },
            homeStore: merchant.operationalInfo?.homeStore || false,
            storeType: merchant.operationalInfo?.storeType || '',
            productCategories: merchant.operationalInfo?.productCategories || [],

            // Documents (Text inputs)
            documents: {
              documentsLink: merchant.documents?.documentsLink || ''
            },

            // Branding
            brandingInfo: {
              logoUrl: merchant.brandingInfo?.logoUrl || '',
              bannerUrl: merchant.brandingInfo?.bannerUrl || '',
              storeImages: merchant.brandingInfo?.storeImages || [],
              tagline: merchant.brandingInfo?.tagline || '',
              storeDescription: merchant.brandingInfo?.storeDescription || '',
              socialMedia: {
                googleBusiness: merchant.brandingInfo?.socialMedia?.googleBusiness || ''
              }
            },

            // Compliance
            complianceInfo: {
              agreements: merchant.complianceInfo?.agreements || {
                merchantAgreement: { accepted: false, version: '' },
                termsAndConditions: { accepted: false, version: '' },
                privacyPolicy: { accepted: false, version: '' }
              },
              commissionStructure: {
                percentage: merchant.complianceInfo?.commissionStructure?.percentage || 10,
                minimumSettlement: merchant.complianceInfo?.commissionStructure?.minimumSettlement || 1000
              },
              digitalSignature: {
                signatureUrl: merchant.complianceInfo?.digitalSignature?.signatureUrl || '',
                ipAddress: merchant.complianceInfo?.digitalSignature?.ipAddress || ''
              }
            },

            // Status
            status: merchant.status || 'pending_verification'
          });

          // Set selected location if coordinates exist (for existing merchants)
          if (merchant.operationalInfo?.storeAddress?.coordinates?.latitude && merchant.operationalInfo?.storeAddress?.coordinates?.longitude) {
            setSelectedLocation({
              lat: parseFloat(merchant.operationalInfo.storeAddress.coordinates.latitude),
              lng: parseFloat(merchant.operationalInfo.storeAddress.coordinates.longitude),
              address: `${merchant.operationalInfo?.storeAddress?.street || ''}, ${merchant.operationalInfo?.storeAddress?.city || ''}, ${merchant.operationalInfo?.storeAddress?.state || ''} ${merchant.operationalInfo?.storeAddress?.pincode || ''}`.replace(/^, |, $/, '')
            });
          }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleDeepNestedInputChange = (section, subsection, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  const handleBankDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value
      }
    }));
  };

  const handleProductCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category]
    }));
  };

  const handleFileUpload = async (file, fieldPath) => {
    if (!file) return '';

    try {
      setUploadingFiles(prev => ({ ...prev, [fieldPath]: true }));

      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('File uploaded successfully');
          return data.url;
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Failed to upload file');
      return '';
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldPath]: false }));
    }
  };

  const handleFileChange = async (e, fieldPath) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await handleFileUpload(file, fieldPath);
    if (url) {
      // Update the form data with the new URL
      const pathParts = fieldPath.split('.');
      if (pathParts.length === 1) {
        setFormData(prev => ({
          ...prev,
          [pathParts[0]]: url
        }));
      } else if (pathParts.length === 2) {
        setFormData(prev => ({
          ...prev,
          [pathParts[0]]: {
            ...prev[pathParts[0]],
            [pathParts[1]]: url
          }
        }));
      } else if (pathParts.length === 3) {
        setFormData(prev => ({
          ...prev,
          [pathParts[0]]: {
            ...prev[pathParts[0]],
            [pathParts[1]]: {
              ...prev[pathParts[0]][pathParts[1]],
              [pathParts[2]]: url
            }
          }
        }));
      }
    }
  };

  const handleStoreImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedImages = [];

    for (const file of files) {
      const url = await handleFileUpload(file, 'storeImages');
      if (url) {
        uploadedImages.push({
          url,
          alt: file.name,
          isPrimary: uploadedImages.length === 0 // First image is primary
        });
      }
    }

    if (uploadedImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        brandingInfo: {
          ...prev.brandingInfo,
          storeImages: [...prev.brandingInfo.storeImages, ...uploadedImages]
        }
      }));
    }
  };

  const removeStoreImage = (index) => {
    setFormData(prev => ({
      ...prev,
      brandingInfo: {
        ...prev.brandingInfo,
        storeImages: prev.brandingInfo.storeImages.filter((_, i) => i !== index)
      }
    }));
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      brandingInfo: {
        ...prev.brandingInfo,
        storeImages: prev.brandingInfo.storeImages.map((img, i) => ({
          ...img,
          isPrimary: i === index
        }))
      }
    }));
  };

  const renderCheckbox = (label, fieldName) => (
    <div className="flex items-center space-x-3">
      <input
        type="checkbox"
        checked={formData.documents[fieldName] || false}
        onChange={(e) => {
          setFormData(prev => ({
            ...prev,
            documents: {
              ...prev.documents,
              [fieldName]: e.target.checked
            }
          }));
        }}
        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
      />
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if form is valid
    const form = e.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Validate location selection
    if (!isManualEntry && !selectedLocation) {
      toast.error('Please select a valid business location from the search results or enable manual entry.');
      return;
    }

    if (isManualEntry && (!formData.storeAddress.coordinates.latitude || !formData.storeAddress.coordinates.longitude)) {
      toast.error('Please enter both latitude and longitude for manual location entry.');
      return;
    }

    try {
      setSaving(true);

      // Transform flat form data back to nested structure for backend
      const submitData = {
        businessInfo: {
          merchantId: formData.merchantId,
          displayName: formData.displayName,
          website: formData.website,
          establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null
        },
        ownerInfo: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          alternateMobile: formData.alternateMobile,
          email: formData.email,
          password: formData.password
        },
        bankingInfo: {
          accountHolderName: formData.bankDetails.accountHolderName,
          accountNumber: formData.bankDetails.accountNumber,
          bankName: formData.bankDetails.bankName,
          branchName: formData.bankDetails.branchName,
          ifscCode: formData.bankDetails.ifscCode
        },
        operationalInfo: {
          storeAddress: formData.storeAddress,
          deliveryPreferences: {
            deliveryType: formData.deliveryPreferences.deliveryType
          },
          homeStore: formData.homeStore,
          storeType: formData.storeType,
          productCategories: formData.productCategories
        },
        documents: formData.documents,
        brandingInfo: {
          logoUrl: formData.brandingInfo.logoUrl,
          bannerUrl: formData.brandingInfo.bannerUrl,
          storeImages: formData.brandingInfo.storeImages,
          tagline: formData.brandingInfo.tagline,
          storeDescription: formData.brandingInfo.storeDescription,
          socialMedia: formData.brandingInfo.socialMedia
        },
        complianceInfo: {
          agreements: formData.complianceInfo.agreements,
          commissionStructure: formData.complianceInfo.commissionStructure,
          digitalSignature: {
            signatureUrl: formData.complianceInfo.digitalSignature.signatureUrl,
            ipAddress: formData.complianceInfo.digitalSignature.ipAddress
          }
        },
        status: formData.status
      };

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Merchant updated successfully');
          navigate(`/merchants/${id}`);
        } else {
          throw new Error(data.message || 'Failed to update merchant');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update merchant');
      }
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast.error(error.message || 'Failed to update merchant');
    } finally {
      setSaving(false);
    }
  };

  // Delete merchant functions
  const handleDeleteMerchant = (merchantName) => {
    if (currentUser?.role !== 'super_admin') {
      toast.error('Only super admin can delete merchants');
      return;
    }
    setDeleteModal({ open: true, merchantName });
    setDeleteConfirmation('');
  };

  const confirmDeleteMerchant = async () => {
    if (deleteConfirmation !== deleteModal.merchantName) {
      toast.error('Please type the exact merchant name to confirm');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete merchant');
      }

      toast.success('Merchant deleted successfully');
      setDeleteModal({ open: false, merchantName: '' });
      navigate('/merchants');
    } catch (err) {
      console.error('Error deleting merchant:', err);
      toast.error('Failed to delete merchant');
    }
  };

  if (checkingUser) {
    return (
      <Layout title="Edit Merchant">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
          <span className="mt-4 text-gray-600">Checking permissions...</span>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout title="Edit Merchant">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
          <span className="mt-4 text-gray-600">Loading merchant details...</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Edit Merchant">
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="text-red-500 text-center">
            <X className="w-16 h-16 mx-auto mb-4" />
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

  return (
    <Layout title="Edit Merchant">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/merchants/${id}`)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Details</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Merchant ID: {merchant?.businessInfo.merchantId}</h1>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(`/merchants/${id}`)}
              className="px-4 py-2 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            {currentUser?.role === 'super_admin' && (
              <button
                type="button"
                onClick={() => handleDeleteMerchant(formData.displayName)}
                className="flex items-center justify-center gap-2 px-4 py-2 sm:px-4 sm:py-2 bg-red-600 text-white hover:bg-red-700 w-full sm:w-auto"
              >
                <Trash2 size={16} />
                Delete Merchant
              </button>
            )}
            <button
              type="submit"
              form="merchant-form"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2 sm:px-4 sm:py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-4 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form id="merchant-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-700">
                  {merchant?.businessInfo?.merchantId || 'Not available'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Established Year
                </label>
                <input
                  type="number"
                  maxLength={4}
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2020"
                  onKeyDown={(e) => {
                   if (['e', 'E', '+', '-'].includes(e.key)) {
                   e.preventDefault();
                    }
                   }}
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Owner Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="number"
                  maxLength={10}
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter mobile number"
                  onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                  e.preventDefault();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Mobile
                </label>
                <input
                  type="number"
                  maxLength={10}
                  name="alternateMobile"
                  onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                  e.preventDefault();
                    }
                  }}
                  value={formData.alternateMobile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter alternate mobile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  maxLength={100}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Banking Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  maxLength={100}
                  name="accountHolderName"
                  value={formData.bankDetails.accountHolderName}
                  onChange={handleBankDetailsChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="number"
                  maxLength={20}
                  name="accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleBankDetailsChange}
                  onInput={(e) => {
                    // Remove any non-numeric characters
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter account number"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <select
                  name="bankName"
                  value={formData.bankDetails.bankName}
                  onChange={handleBankDetailsChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Bank</option>
                  {/* Public Sector Banks */}
                  <optgroup label="Public Sector Banks">
                    {INDIAN_BANKS.publicSector.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </optgroup>
                  {/* Private Sector Banks */}
                  <optgroup label="Private Sector Banks">
                    {INDIAN_BANKS.privateSector.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </optgroup>
                  {/* Small Finance Banks */}
                  <optgroup label="Small Finance Banks">
                    {INDIAN_BANKS.smallFinance.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </optgroup>
                  {/* Payments Banks */}
                  <optgroup label="Payments Banks">
                    {INDIAN_BANKS.payments.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </optgroup>
                  {/* Regional Rural Banks */}
                  <optgroup label="Regional Rural Banks">
                    {INDIAN_BANKS.regionalRural.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </optgroup>
                  {/* Other */}
                  <optgroup label="Other">
                    {INDIAN_BANKS.other.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  maxLength={100}
                  name="branchName"
                  value={formData.bankDetails.branchName}
                  onChange={handleBankDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter branch name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  maxLength={20}
                  name="ifscCode"
                  value={formData.bankDetails.ifscCode}
                  onChange={handleBankDetailsChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>
          </div>

          {/* Operational Information */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Store & Operational Information
            </h2>

            {/* Store Address */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Store Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={formData.storeAddress.street}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'street', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.storeAddress.city}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'city', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={formData.storeAddress.state}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'state', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={formData.storeAddress.pincode}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'pincode', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formData.storeAddress.landmark}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'landmark', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter landmark"
                  />
                </div>

                {/* Location Search */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Location Search
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <AddressSearch
                          onPlaceSelect={handlePlaceSelect}
                          placeholder="Search for your business name or address..."
                        />
                      </div>
                    </div>
                    {selectedLocation && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Location Selected:</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">{selectedLocation.address}</p>
                        <p className="text-xs text-green-500 mt-1">
                          Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Manual Entry Option */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isManualEntry}
                      onChange={(e) => handleManualEntryToggle(e.target.checked)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Not on Google Maps - Enter coordinates manually
                    </label>
                  </div>

                  {/* Latitude & Longitude */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isManualEntry ? '' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude {isManualEntry && '*'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.storeAddress.coordinates.latitude}
                        onChange={(e) => handleDeepNestedInputChange('storeAddress', 'coordinates', 'latitude', e.target.value)}
                        placeholder="e.g. 12.9716"
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={!isManualEntry}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude {isManualEntry && '*'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.storeAddress.coordinates.longitude}
                        onChange={(e) => handleDeepNestedInputChange('storeAddress', 'coordinates', 'longitude', e.target.value)}
                        placeholder="e.g. 77.5946"
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={!isManualEntry}
                      />
                    </div>
                  </div>

                  {!isManualEntry && !selectedLocation && (
                    <p className="text-sm text-gray-500">
                      Search for your business above or check "Not on Google Maps" to enter coordinates manually.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Preferences */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Delivery Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Type
                  </label>
                  <select
                    value={formData.deliveryPreferences.deliveryType}
                    onChange={(e) => handleNestedInputChange('deliveryPreferences', 'deliveryType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="platform_delivery">Platform Delivery</option>
                    <option value="self_delivery">Self Delivery</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.homeStore}
                    onChange={(e) => setFormData(prev => ({ ...prev, homeStore: e.target.checked }))}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Home Store
                  </label>
                </div>
              </div>
            </div>

            {/* Store Type */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Store Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Type *
                  </label>
                  <select
                    value={formData.storeType}
                    onChange={(e) => handleInputChange({ target: { name: 'storeType', value: e.target.value } })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Store Type</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                    <option value="Meats">Meats</option>
                    <option value="Pet">Pet</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Categories */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Product Categories Include</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Grocery', 'Pharmacy', 'Stationery', 'Electronics', 'Fashion', 'Food', 'Household', 'Other'].map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.productCategories.includes(category)}
                      onChange={() => handleProductCategoryChange(category)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Status & Compliance */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Status & Compliance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="hold">Hold</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  value={formData.complianceInfo.commissionStructure.percentage}
                  onChange={(e) => handleDeepNestedInputChange('complianceInfo', 'commissionStructure', 'percentage', e.target.value)}
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10"
                  onKeyDown={(e) => {
                  if (['e', 'E', '+', '-'].includes(e.key)) {
                  e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents & Verification
            </h2>

            {/* Google Drive Documents Link */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Documents Link</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Drive Link
                </label>
                <input
                  type="url"
                  value={formData.documents.documentsLink || ''}
                  onChange={(e) => handleNestedInputChange('documents', 'documentsLink', e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide a Google Drive link containing all merchant documents
                </p>
              </div>
            </div>

            {/* Store Images */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Store Images</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'brandingInfo.logoUrl')}
                      className="hidden"
                      id="store-logo"
                      disabled={uploadingFiles['brandingInfo.logoUrl']}
                    />
                    <label
                      htmlFor="store-logo"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles['brandingInfo.logoUrl'] ? (
                        <div className="animate-spin h-4 w-4 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                      ) : (
                        <Upload size={16} />
                      )}
                      Upload Logo
                    </label>
                    {formData.brandingInfo.logoUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={formData.brandingInfo.logoUrl}
                          alt="Store Logo"
                          className="w-10 h-10 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => window.open(formData.brandingInfo.logoUrl, '_blank')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Banner
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'documents.storeBanner')}
                      className="hidden"
                      id="store-banner"
                      disabled={uploadingFiles['documents.storeBanner']}
                    />
                    <label
                      htmlFor="store-banner"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles['documents.storeBanner'] ? (
                        <div className="animate-spin h-4 w-4 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                      ) : (
                        <Upload size={16} />
                      )}
                      Upload Banner
                    </label>
                    {formData.documents.storeBanner && (
                      <div className="flex items-center gap-2">
                        <img
                          src={formData.documents.storeBanner}
                          alt="Store Banner"
                          className="w-16 h-10 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => window.open(formData.documents.storeBanner, '_blank')}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Store Images
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleStoreImageUpload}
                      className="hidden"
                      id="store-images"
                      disabled={uploadingFiles['storeImages']}
                    />
                    <label
                      htmlFor="store-images"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles['storeImages'] ? (
                        <div className="animate-spin h-4 w-4 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                      ) : (
                        <Upload size={16} />
                      )}
                      Upload Images
                    </label>
                  </div>

                  {formData.brandingInfo.storeImages && formData.brandingInfo.storeImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.brandingInfo.storeImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.url}
                            alt={image.alt || `Store image ${index + 1}`}
                            className="w-full h-24 object-cover border"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className={`p-1 rounded text-xs ${image.isPrimary
                                  ? 'bg-green-500 text-white'
                                  : 'bg-white/80 text-gray-600 hover:bg-white'
                                }`}
                              title="Set as primary"
                            >
                              <CheckCircle size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStoreImage(index)}
                              className="p-1 rounded bg-red-500 text-white text-xs hover:bg-red-600"
                              title="Remove image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          {image.isPrimary && (
                            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Branding Information */}
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Branding Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.brandingInfo.tagline}
                  onChange={(e) => handleNestedInputChange('brandingInfo', 'tagline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter store tagline"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Description
                </label>
                <textarea
                  value={formData.brandingInfo.storeDescription}
                  onChange={(e) => handleNestedInputChange('brandingInfo', 'storeDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter store description"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Business
                  </label>
                  <input
                    type="url"
                    value={formData.brandingInfo.socialMedia.googleBusiness}
                    onChange={(e) => handleDeepNestedInputChange('brandingInfo', 'socialMedia', 'googleBusiness', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://g.page/yourbusiness"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Merchant Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Merchant</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to permanently delete the merchant <strong>{deleteModal.merchantName}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently remove all merchant data, store information, and associated records. This action cannot be reversed.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type the merchant name "{deleteModal.merchantName}" to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder={`Type "${deleteModal.merchantName}" here`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, merchantName: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMerchant}
                disabled={deleteConfirmation !== deleteModal.merchantName}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Merchant
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EditMerchant;
