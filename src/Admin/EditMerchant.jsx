import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Store, Phone, Mail, MapPin,
  FileText, CreditCard, Building, Globe, Users,
  Upload, Eye, Download, Image as ImageIcon,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

const EditMerchant = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    // Business Info
    merchantId: '',
    legalName: '',
    displayName: '',
    businessType: '',
    website: '',
    establishedYear: '',

    // Owner Info
    fullName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    governmentIdType: '',
    governmentId: '',
    ownerAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },

    // Banking Info
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      branchName: '',
      ifscCode: '',
      accountType: 'business',
      cancelledChequeUrl: '',
      bankPassbookUrl: ''
    },

    // Operational Info
    storeAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      landmark: ''
    },
    deliveryPreferences: {
      deliveryType: 'platform_delivery',
    deliveryRadius: 10,
    minimumOrderValue: 0,
    deliveryCharges: 0,
    freeDeliveryAbove: 500
    },
    openingTime: '09:00 AM',
    closingTime: '09:00 PM',
    catalogInfo: {
      totalProducts: 0,
      catalogUrl: ''
    },
    productCategories: [],
    storeType: '',    // Documents (Text inputs)
    documents: {
      gstin: {
        number: '',
        isRegistered: false
      },
      shopEstablishmentLicense: '',
      fssaiLicense: '',
      panCard: '',
      aadhaarNumber: '',
      bankAccountNumber: '',
    },

    // Branding
    brandingInfo: {
      logoUrl: '',
      bannerUrl: '',
      storeImages: [],
      tagline: '',
      storeDescription: '',
      socialMedia: {
        facebook: '',
        instagram: '',
        twitter: '',
        whatsapp: '',
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
        settlementCycle: 'weekly',
        minimumSettlement: 1000
      },
      digitalSignature: {
        signatureUrl: '',
        ipAddress: ''
      },
      kycStatus: 'pending',
      kycRemarks: ''
    },

    // Status
    status: 'pending_verification',
    storeStatus: 'closed'
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
        if (data.success) {
          setMerchant(data.merchant);
          const merchant = data.merchant;

          // Populate form with existing data - mapping nested backend structure to flat form fields
          setFormData({
            // Business Info
            merchantId: merchant.businessInfo?.merchantId || '',
            legalName: merchant.businessInfo?.legalName || '',
            displayName: merchant.businessInfo?.displayName || '',
            businessType: merchant.businessInfo?.businessType || '',
            website: merchant.businessInfo?.website || '',
            establishedYear: merchant.businessInfo?.establishedYear || '',

            // Owner Info
            fullName: merchant.ownerInfo?.fullName || '',
            mobile: merchant.ownerInfo?.mobile || '',
            alternateMobile: merchant.ownerInfo?.alternateMobile || '',
            email: merchant.ownerInfo?.email || '',
            governmentIdType: merchant.ownerInfo?.governmentIdType || '',
            governmentId: merchant.ownerInfo?.governmentId || '',
            ownerAddress: {
              street: merchant.ownerInfo?.address?.street || '',
              city: merchant.ownerInfo?.address?.city || '',
              state: merchant.ownerInfo?.address?.state || '',
              pincode: merchant.ownerInfo?.address?.pincode || '',
              country: merchant.ownerInfo?.address?.country || 'India'
            },

            // Banking Info
            bankDetails: {
              accountHolderName: merchant.bankingInfo?.accountHolderName || '',
              accountNumber: merchant.bankingInfo?.accountNumber || '',
              bankName: merchant.bankingInfo?.bankName || '',
              branchName: merchant.bankingInfo?.branchName || '',
              ifscCode: merchant.bankingInfo?.ifscCode || '',
              accountType: merchant.bankingInfo?.accountType || 'business',
              cancelledChequeNumber: merchant.bankingInfo?.cancelledChequeNumber || '',
              bankPassbookNumber: merchant.bankingInfo?.bankPassbookNumber || ''
            },

            // Operational Info
            storeAddress: {
              street: merchant.operationalInfo?.storeAddress?.street || '',
              city: merchant.operationalInfo?.storeAddress?.city || '',
              state: merchant.operationalInfo?.storeAddress?.state || '',
              pincode: merchant.operationalInfo?.storeAddress?.pincode || '',
              country: merchant.operationalInfo?.storeAddress?.country || 'India',
              landmark: merchant.operationalInfo?.storeAddress?.landmark || ''
            },
            deliveryPreferences: {
              deliveryType: merchant.operationalInfo?.deliveryPreferences?.deliveryType || 'platform_delivery',
              deliveryRadius: merchant.operationalInfo?.deliveryPreferences?.deliveryRadius || 10,
              minimumOrderValue: merchant.operationalInfo?.deliveryPreferences?.minimumOrderValue || 0,
              deliveryCharges: merchant.operationalInfo?.deliveryPreferences?.deliveryCharges || 0,
              freeDeliveryAbove: merchant.operationalInfo?.deliveryPreferences?.freeDeliveryAbove || 500
            },
            openingTime: merchant.operationalInfo?.openingTime || '09:00 AM',
            closingTime: merchant.operationalInfo?.closingTime || '09:00 PM',
            catalogInfo: {
              totalProducts: merchant.operationalInfo?.catalogInfo?.totalProducts || 0,
              catalogUrl: merchant.operationalInfo?.catalogInfo?.catalogUrl || ''
            },
            storeType: merchant.operationalInfo?.storeType || '',
            productCategories: merchant.operationalInfo?.productCategories || [],

            // Documents (Text inputs)
            documents: {
              gstin: {
                number: merchant.documents?.gstin?.number || '',
                isRegistered: merchant.documents?.gstin?.isRegistered || false,
                certificateNumber: merchant.documents?.gstin?.certificateNumber || ''
              },
              shopEstablishmentLicense: merchant.documents?.shopEstablishmentLicense || '',
              fssaiLicense: merchant.documents?.fssaiLicense || '',
              panCard: merchant.documents?.panCard || '',
              aadhaarNumber: merchant.documents?.aadhaarNumber || '',
              bankAccountNumber: merchant.documents?.bankAccountNumber || '',
              cancelledChequeNumber: merchant.documents?.cancelledChequeNumber || '',
              bankPassbookNumber: merchant.documents?.bankPassbookNumber || ''
            },

            // Branding
            brandingInfo: {
              logoUrl: merchant.brandingInfo?.logoUrl || '',
              bannerUrl: merchant.brandingInfo?.bannerUrl || '',
              storeImages: merchant.brandingInfo?.storeImages || [],
              tagline: merchant.brandingInfo?.tagline || '',
              storeDescription: merchant.brandingInfo?.storeDescription || '',
              socialMedia: {
                facebook: merchant.brandingInfo?.socialMedia?.facebook || '',
                instagram: merchant.brandingInfo?.socialMedia?.instagram || '',
                twitter: merchant.brandingInfo?.socialMedia?.twitter || '',
                whatsapp: merchant.brandingInfo?.socialMedia?.whatsapp || '',
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
                settlementCycle: merchant.complianceInfo?.commissionStructure?.settlementCycle || 'weekly',
                minimumSettlement: merchant.complianceInfo?.commissionStructure?.minimumSettlement || 1000
              },
              digitalSignature: {
                signatureUrl: merchant.complianceInfo?.digitalSignature?.signatureUrl || '',
                ipAddress: merchant.complianceInfo?.digitalSignature?.ipAddress || ''
              },
              kycStatus: merchant.complianceInfo?.kycStatus || 'pending',
              kycRemarks: merchant.complianceInfo?.kycRemarks || ''
            },

            // Status
            status: merchant.status || 'pending_verification',
            storeStatus: merchant.storeStatus || 'closed'
          });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      // Transform flat form data back to nested structure for backend
      const submitData = {
        businessInfo: {
          merchantId: formData.merchantId,
          legalName: formData.legalName,
          displayName: formData.displayName,
          businessType: formData.businessType,
          website: formData.website,
          establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null
        },
        ownerInfo: {
          fullName: formData.fullName,
          mobile: formData.mobile,
          alternateMobile: formData.alternateMobile,
          email: formData.email,
          password: formData.password,
          governmentIdType: formData.governmentIdType,
          governmentId: formData.governmentId,
          address: formData.ownerAddress
        },
        bankingInfo: {
          accountHolderName: formData.bankDetails.accountHolderName,
          accountNumber: formData.bankDetails.accountNumber,
          bankName: formData.bankDetails.bankName,
          branchName: formData.bankDetails.branchName,
          ifscCode: formData.bankDetails.ifscCode,
          accountType: formData.bankDetails.accountType,
          cancelledChequeUrl: formData.bankDetails.cancelledChequeUrl,
          bankPassbookUrl: formData.bankDetails.bankPassbookUrl
        },
        operationalInfo: {
          storeAddress: formData.storeAddress,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
          deliveryPreferences: {
            deliveryType: formData.deliveryPreferences.deliveryType,
            deliveryRadius: parseInt(formData.deliveryPreferences.deliveryRadius) || 10,
            minimumOrderValue: parseFloat(formData.deliveryPreferences.minimumOrderValue) || 0,
            deliveryCharges: parseFloat(formData.deliveryPreferences.deliveryCharges) || 0,
            freeDeliveryAbove: parseFloat(formData.deliveryPreferences.freeDeliveryAbove) || 500
          },
          catalogInfo: {
            totalProducts: parseInt(formData.catalogInfo.totalProducts) || 0,
            catalogUrl: formData.catalogInfo.catalogUrl
          },
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
          },
          kycStatus: formData.complianceInfo.kycStatus,
          kycRemarks: formData.complianceInfo.kycRemarks
        },
        status: formData.status,
        storeStatus: formData.storeStatus
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

  if (loading) {
    return (
      <Layout title="Edit Merchant">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading merchant details...</span>
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
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={16} />
              Back to Details
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Merchant</h1>
              <p className="text-gray-600">Merchant ID: {merchant?.businessInfo.merchantId}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/merchants/${id}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="merchant-form"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form id="merchant-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant ID *
                </label>
                <input
                  type="text"
                  name="merchantId"
                  value={formData.merchantId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter merchant ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legal Name *
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter legal name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select business type</option>
                  <option value="Sole Proprietor">Sole Proprietor</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Private Limited">Private Limited</option>
                  <option value="LLP">LLP</option>
                  <option value="Trust">Trust</option>
                  <option value="Society">Society</option>
                  <option value="Other">Other</option>
                </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Established Year
                </label>
                <input
                  type="number"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2020"
                />
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Mobile
                </label>
                <input
                  type="tel"
                  name="alternateMobile"
                  value={formData.alternateMobile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter alternate mobile"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Type *
                </label>
                <select
                  name="governmentIdType"
                  value={formData.governmentIdType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select ID type</option>
                  <option value="pan">PAN Card</option>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Number *
                </label>
                <input
                  type="text"
                  name="governmentId"
                  value={formData.governmentId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            {/* Owner Address */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Owner Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.ownerAddress.street}
                    onChange={(e) => handleNestedInputChange('ownerAddress', 'street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.ownerAddress.city}
                    onChange={(e) => handleNestedInputChange('ownerAddress', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.ownerAddress.state}
                    onChange={(e) => handleNestedInputChange('ownerAddress', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.ownerAddress.pincode}
                    onChange={(e) => handleNestedInputChange('ownerAddress', 'pincode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.ownerAddress.country}
                    onChange={(e) => handleNestedInputChange('ownerAddress', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  name="accountHolderName"
                  value={formData.bankDetails.accountHolderName}
                  onChange={handleBankDetailsChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleBankDetailsChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter account number"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Bank</option>
                  {/* Public Sector Banks */}
                  <optgroup label="Public Sector Banks">
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="Bank of India">Bank of India</option>
                    <option value="Bank of Maharashtra">Bank of Maharashtra</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Central Bank of India">Central Bank of India</option>
                    <option value="Indian Bank">Indian Bank</option>
                    <option value="Indian Overseas Bank">Indian Overseas Bank</option>
                    <option value="Punjab & Sind Bank">Punjab & Sind Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="UCO Bank">UCO Bank</option>
                    <option value="Union Bank of India">Union Bank of India</option>
                  </optgroup>
                  {/* Private Sector Banks */}
                  <optgroup label="Private Sector Banks">
                    <option value="Axis Bank Ltd.">Axis Bank Ltd.</option>
                    <option value="Bandhan Bank Ltd.">Bandhan Bank Ltd.</option>
                    <option value="CSB Bank Ltd.">CSB Bank Ltd.</option>
                    <option value="City Union Bank Ltd.">City Union Bank Ltd.</option>
                    <option value="DCB Bank Ltd.">DCB Bank Ltd.</option>
                    <option value="Dhanlaxmi Bank Ltd.">Dhanlaxmi Bank Ltd.</option>
                    <option value="Federal Bank Ltd.">Federal Bank Ltd.</option>
                    <option value="HDFC Bank Ltd.">HDFC Bank Ltd.</option>
                    <option value="ICICI Bank Ltd.">ICICI Bank Ltd.</option>
                    <option value="Induslnd Bank Ltd.">Induslnd Bank Ltd.</option>
                    <option value="IDFC First Bank Ltd.">IDFC First Bank Ltd.</option>
                    <option value="Jammu & Kashmir Bank Ltd.">Jammu & Kashmir Bank Ltd.</option>
                    <option value="Karnataka Bank Ltd.">Karnataka Bank Ltd.</option>
                    <option value="Karur Vysya Bank Ltd.">Karur Vysya Bank Ltd.</option>
                    <option value="Kotak Mahindra Bank Ltd.">Kotak Mahindra Bank Ltd.</option>
                    <option value="Nainital Bank Ltd.">Nainital Bank Ltd.</option>
                    <option value="RBL Bank Ltd.">RBL Bank Ltd.</option>
                    <option value="South Indian Bank Ltd.">South Indian Bank Ltd.</option>
                    <option value="Tamilnad Mercantile Bank Ltd.">Tamilnad Mercantile Bank Ltd.</option>
                    <option value="YES Bank Ltd.">YES Bank Ltd.</option>
                    <option value="IDBI Bank Ltd.">IDBI Bank Ltd.</option>
                  </optgroup>
                  {/* Small Finance Banks */}
                  <optgroup label="Small Finance Banks">
                    <option value="Au Small Finance Bank Limited">Au Small Finance Bank Limited</option>
                    <option value="Capital Small Finance Bank Limited">Capital Small Finance Bank Limited</option>
                    <option value="Equitas Small Finance Bank Limited">Equitas Small Finance Bank Limited</option>
                    <option value="Suryoday Small Finance Bank Limited">Suryoday Small Finance Bank Limited</option>
                    <option value="Ujjivan Small Finance Bank Limited">Ujjivan Small Finance Bank Limited</option>
                    <option value="Utkarsh Small Finance Bank Limited">Utkarsh Small Finance Bank Limited</option>
                    <option value="ESAF Small Finance Bank Limited">ESAF Small Finance Bank Limited</option>
                    <option value="Fincare Small Finance Bank Limited">Fincare Small Finance Bank Limited</option>
                    <option value="Jana Small Finance Bank Limited">Jana Small Finance Bank Limited</option>
                    <option value="North East Small Finance Bank Limited">North East Small Finance Bank Limited</option>
                    <option value="Shivalik Small Finance Bank Limited">Shivalik Small Finance Bank Limited</option>
                    <option value="Unity Small Finance Bank Limited">Unity Small Finance Bank Limited</option>
                  </optgroup>
                  {/* Payments Banks */}
                  <optgroup label="Payments Banks">
                    <option value="India Post Payments Bank Limited">India Post Payments Bank Limited</option>
                    <option value="Fino Payments Bank Limited">Fino Payments Bank Limited</option>
                    <option value="Paytm Payments Bank Limited">Paytm Payments Bank Limited</option>
                    <option value="Airtel Payments Bank Limited">Airtel Payments Bank Limited</option>
                  </optgroup>
                  {/* Regional Rural Banks */}
                  <optgroup label="Regional Rural Banks">
                    <option value="Andhra Pragathi Grameena Bank">Andhra Pragathi Grameena Bank</option>
                    <option value="Andhra Pradesh Grameena Vikas Bank">Andhra Pradesh Grameena Vikas Bank</option>
                    <option value="Arunachal Pradesh Rural Bank">Arunachal Pradesh Rural Bank</option>
                    <option value="Aryavart Bank">Aryavart Bank</option>
                    <option value="Assam Gramin Vikash Bank">Assam Gramin Vikash Bank</option>
                    <option value="Bangiya Gramin Vikas Bank">Bangiya Gramin Vikas Bank</option>
                    <option value="Baroda Gujarat Gramin Bank">Baroda Gujarat Gramin Bank</option>
                    <option value="Baroda Rajasthan Kshetriya Gramin Bank">Baroda Rajasthan Kshetriya Gramin Bank</option>
                    <option value="Baroda UP Bank">Baroda UP Bank</option>
                    <option value="Chaitanya Godavari Grameena Bank">Chaitanya Godavari Grameena Bank</option>
                    <option value="Chhattisgarh Rajya Gramin Bank">Chhattisgarh Rajya Gramin Bank</option>
                    <option value="Dakshin Bihar Gramin Bank">Dakshin Bihar Gramin Bank</option>
                    <option value="Ellaquai Dehati Bank">Ellaquai Dehati Bank</option>
                    <option value="Himachal Pradesh Gramin Bank">Himachal Pradesh Gramin Bank</option>
                    <option value="J&K Grameen Bank">J&K Grameen Bank</option>
                    <option value="Jharkhand Rajya Gramin Bank">Jharkhand Rajya Gramin Bank</option>
                    <option value="Karnataka Gramin Bank">Karnataka Gramin Bank</option>
                    <option value="Karnataka Vikas Grameena Bank">Karnataka Vikas Grameena Bank</option>
                    <option value="Kerala Gramin Bank">Kerala Gramin Bank</option>
                    <option value="Madhya Pradesh Gramin Bank">Madhya Pradesh Gramin Bank</option>
                    <option value="Madhyanchal Gramin Bank">Madhyanchal Gramin Bank</option>
                    <option value="Maharashtra Gramin Bank">Maharashtra Gramin Bank</option>
                    <option value="Manipur Rural Bank">Manipur Rural Bank</option>
                    <option value="Meghalaya Rural Bank">Meghalaya Rural Bank</option>
                    <option value="Mizoram Rural Bank">Mizoram Rural Bank</option>
                    <option value="Nagaland Rural Bank">Nagaland Rural Bank</option>
                    <option value="Odisha Gramya Bank">Odisha Gramya Bank</option>
                    <option value="Paschim Banga Gramin Bank">Paschim Banga Gramin Bank</option>
                    <option value="Prathama UP Gramin Bank">Prathama UP Gramin Bank</option>
                    <option value="Puduvai Bharathiar Grama Bank">Puduvai Bharathiar Grama Bank</option>
                    <option value="Punjab Gramin Bank">Punjab Gramin Bank</option>
                    <option value="Rajasthan Marudhara Gramin Bank">Rajasthan Marudhara Gramin Bank</option>
                    <option value="Saptagiri Grameena Bank">Saptagiri Grameena Bank</option>
                    <option value="Sarva Haryana Gramin Bank">Sarva Haryana Gramin Bank</option>
                    <option value="Saurashtra Gramin Bank">Saurashtra Gramin Bank</option>
                    <option value="Tamil Nadu Grama Bank">Tamil Nadu Grama Bank</option>
                    <option value="Telangana Grameena Bank">Telangana Grameena Bank</option>
                    <option value="Tripura Gramin Bank">Tripura Gramin Bank</option>
                    <option value="Utkal Grameen Bank">Utkal Grameen Bank</option>
                    <option value="Uttar Bihar Gramin Bank">Uttar Bihar Gramin Bank</option>
                    <option value="Uttarakhand Gramin Bank">Uttarakhand Gramin Bank</option>
                    <option value="Uttarbanga Kshetriya Gramin Bank">Uttarbanga Kshetriya Gramin Bank</option>
                    <option value="Vidharbha Konkan Gramin Bank">Vidharbha Konkan Gramin Bank</option>
                  </optgroup>
                  {/* Other */}
                  <optgroup label="Other">
                    <option value="Other">Other Bank</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.bankDetails.branchName}
                  onChange={handleBankDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter branch name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.bankDetails.ifscCode}
                  onChange={handleBankDetailsChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  name="accountType"
                  value={formData.bankDetails.accountType}
                  onChange={handleBankDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            {/* Banking Documents */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Banking Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancelled Cheque Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.cancelledChequeNumber || ''}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'cancelledChequeNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter cancelled cheque number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Passbook Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.bankPassbookNumber || ''}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'bankPassbookNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter bank passbook number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operational Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                    value={formData.storeAddress.street}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'street', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.storeAddress.city}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'city', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.storeAddress.state}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'state', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.storeAddress.pincode}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'pincode', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={formData.storeAddress.landmark}
                    onChange={(e) => handleNestedInputChange('storeAddress', 'landmark', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter landmark"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="platform_delivery">Platform Delivery</option>
                    <option value="self_delivery">Self Delivery</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryPreferences.deliveryRadius}
                    onChange={(e) => handleNestedInputChange('deliveryPreferences', 'deliveryRadius', e.target.value)}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryPreferences.minimumOrderValue}
                    onChange={(e) => handleNestedInputChange('deliveryPreferences', 'minimumOrderValue', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryPreferences.deliveryCharges}
                    onChange={(e) => handleNestedInputChange('deliveryPreferences', 'deliveryCharges', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.deliveryPreferences.freeDeliveryAbove}
                    onChange={(e) => handleNestedInputChange('deliveryPreferences', 'freeDeliveryAbove', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Operating Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Time *
                  </label>
                  <input
                    type="text"
                    value={formData.openingTime}
                    onChange={(e) => handleInputChange({ target: { name: 'openingTime', value: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="09:00 AM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Time *
                  </label>
                  <input
                    type="text"
                    value={formData.closingTime}
                    onChange={(e) => handleInputChange({ target: { name: 'closingTime', value: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="09:00 PM"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Store operates daily from {formData.openingTime} to {formData.closingTime}
              </p>
            </div>

            {/* Catalog Information */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Catalog Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Products
                  </label>
                  <input
                    type="number"
                    value={formData.catalogInfo.totalProducts}
                    onChange={(e) => handleNestedInputChange('catalogInfo', 'totalProducts', e.target.value)}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catalog URL
                  </label>
                  <input
                    type="url"
                    value={formData.catalogInfo.catalogUrl}
                    onChange={(e) => handleNestedInputChange('catalogInfo', 'catalogUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://example.com/catalog"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select Store Type</option>
                    <option value="Grocery Store">Grocery Store</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Butcher Shop">Butcher Shop</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Convenience Store">Convenience Store</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Status & Compliance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="pending_verification">Pending Verification</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Status
                </label>
                <select
                  name="storeStatus"
                  value={formData.storeStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KYC Status
                </label>
                <select
                  value={formData.complianceInfo.kycStatus}
                  onChange={(e) => handleNestedInputChange('complianceInfo', 'kycStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KYC Remarks
              </label>
              <textarea
                value={formData.complianceInfo.kycRemarks}
                onChange={(e) => handleNestedInputChange('complianceInfo', 'kycRemarks', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter KYC remarks"
              />
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents & Verification
            </h2>

            {/* GST Information */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">GST Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.gstin.number}
                    onChange={(e) => handleDeepNestedInputChange('documents', 'gstin', 'number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter GST number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Certificate Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.gstin.certificateNumber || ''}
                    onChange={(e) => handleDeepNestedInputChange('documents', 'gstin', 'certificateNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter GST certificate number"
                  />
                </div>
              </div>
            </div>

            {/* Business Documents */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Business Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.fssaiLicense}
                    onChange={(e) => handleNestedInputChange('documents', 'fssaiLicense', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter FSSAI number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Card Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.panCard}
                    onChange={(e) => handleNestedInputChange('documents', 'panCard', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter PAN number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shop Establishment License
                  </label>
                  <input
                    type="text"
                    value={formData.documents.shopEstablishmentLicense}
                    onChange={(e) => handleNestedInputChange('documents', 'shopEstablishmentLicense', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter license number"
                  />
                </div>
              </div>
            </div>

            {/* Aadhaar Card */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Aadhaar Card</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.aadhaarNumber}
                    onChange={(e) => handleNestedInputChange('documents', 'aadhaarNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter 12-digit Aadhaar number"
                  />
                </div>
              </div>
            </div>

            {/* Banking Documents */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Banking Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancelled Cheque Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.cancelledChequeNumber || ''}
                    onChange={(e) => handleNestedInputChange('documents', 'cancelledChequeNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter cancelled cheque number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Passbook Number
                  </label>
                  <input
                    type="text"
                    value={formData.documents.bankPassbookNumber || ''}
                    onChange={(e) => handleNestedInputChange('documents', 'bankPassbookNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter bank passbook number"
                  />
                </div>
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
                      onChange={(e) => handleFileChange(e, 'documents.storeLogo')}
                      className="hidden"
                      id="store-logo"
                      disabled={uploadingFiles['documents.storeLogo']}
                    />
                    <label
                      htmlFor="store-logo"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles['documents.storeLogo'] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Upload size={16} />
                      )}
                      Upload Logo
                    </label>
                    {formData.documents.storeLogo && (
                      <div className="flex items-center gap-2">
                        <img
                          src={formData.documents.storeLogo}
                          alt="Store Logo"
                          className="w-10 h-10 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => window.open(formData.documents.storeLogo, '_blank')}
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles['documents.storeBanner'] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingFiles['storeImages'] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className={`p-1 rounded text-xs ${
                                image.isPrimary
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter store description"
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.brandingInfo.socialMedia.facebook}
                    onChange={(e) => handleDeepNestedInputChange('brandingInfo', 'socialMedia', 'facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.brandingInfo.socialMedia.instagram}
                    onChange={(e) => handleDeepNestedInputChange('brandingInfo', 'socialMedia', 'instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.brandingInfo.socialMedia.twitter}
                    onChange={(e) => handleDeepNestedInputChange('brandingInfo', 'socialMedia', 'twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="url"
                    value={formData.brandingInfo.socialMedia.whatsapp}
                    onChange={(e) => handleDeepNestedInputChange('brandingInfo', 'socialMedia', 'whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://wa.me/yournumber"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Business
                  </label>
                  <input
                    type="url"
                    value={formData.brandingInfo.socialMedia.googleBusiness}
                    onChange={(e) => handleDeepNestedInputChange('brandingInfo', 'socialMedia', 'googleBusiness', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://g.page/yourbusiness"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditMerchant;
