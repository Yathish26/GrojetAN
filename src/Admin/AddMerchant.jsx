import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Eye, EyeOff, Save, User,
  Building, Phone, Mail, MapPin, CreditCard, FileText,
  Camera, Store, DollarSign, Calendar, Shield, Search, Navigation, CheckCircle,
  CircleCheck
} from 'lucide-react';
import Layout from '../Components/Layout';
import { AddressSearch } from '../Components/GoogleMapComponents';
import { INDIAN_STATES } from '../utils/states';
import { INDIAN_BANKS } from '../utils/banks';
import toast from 'react-hot-toast';
import { VERSION } from '../../version.js';

const AddMerchant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [formData, setFormData] = useState({
    // Business Info
    displayName: '',
    description: '',
    website: '',
    establishedYear: '',

    // Owner Info
    fullName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    password: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },

    // Banking Info
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountHolderName: '',

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
    storeTimings: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      sunday: { isOpen: false, openTime: '09:00', closeTime: '21:00' }
    },
    productCategories: [],
    storeType: '',
    deliveryType: 'platform_delivery',

    // Branding Info
    tagline: '',
    storeDescription: '',
    brandingInfo: {
      logoUrl: '',
      bannerUrl: '',
      socialMedia: {
        googleBusiness: ''
      }
    },

    // Commission
    commissionPercentage: 10,

    // Store Status
    storeStatus: 'closed',

    // Documents
    documents: {
      documentsLink: ''
    }
  });

  // Location search state
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Image upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Validate if location is properly selected
  const isLocationValid = () => {
    if (isManualEntry) {
      return formData.storeAddress.coordinates.latitude && formData.storeAddress.coordinates.longitude;
    }
    return selectedLocation !== null;
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const hasRequiredFields = formData.displayName &&
                             formData.fullName && formData.mobile && formData.email && formData.password;
    return hasRequiredFields && isLocationValid();
  };

  const fetchCurrentUser = async () => {
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
      return;
    } finally {
      setCheckingUser(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const updateNested = (obj, keys, value) => {
          if (keys.length === 1) {
            return { ...obj, [keys[0]]: value };
          }
          const [current, ...rest] = keys;
          return {
            ...obj,
            [current]: updateNested(obj[current] || {}, rest, value)
          };
        };
        return updateNested(prev, keys, value);
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProductCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category]
    }));
  };

  // Image upload handlers
  const handleImageUpload = async (file, type) => {
    if (!file) return;

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBanner;
    const fieldName = type === 'logo' ? 'logoUrl' : 'bannerUrl';

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'merchantlogo');

      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload/s3`, {
        method: 'POST',
        credentials: 'include',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData(prev => ({
            ...prev,
            brandingInfo: {
              ...prev.brandingInfo,
              [fieldName]: data.url
            }
          }));
          toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully!`);
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const handleStoreTimingChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      storeTimings: {
        ...prev.storeTimings,
        [day]: {
          ...prev.storeTimings[day],
          [field]: value
        }
      }
    }));
  };

  

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

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        toast.success('Merchant created successfully!');
        navigate('/merchants');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create merchant');
      }
    } catch (error) {
      console.error('Error creating merchant:', error);
      toast.error(error.message || 'Failed to create merchant');
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <Layout title="Add New Merchant">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Add New Merchant">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Add New Merchant">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/merchants')}
              className="p-2 hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Merchant</h1>
              <p className="text-gray-600">Create a new merchant account with complete details</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="bg-white shadow-sm border border-gray-200">
          <div className="p-6 space-y-8">
            {/* Business & Owner Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Business & Owner Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display/Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Owner Information */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Owner/Authorized Person Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        maxLength={100}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          setFormData(prev => ({
                            ...prev,
                            mobile: value
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="10-digit number"
                        
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        maxLength={200}
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Login Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Minimum 6 characters"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Banking & Document Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Banking & Document Information</h3>

                {/* Banking Details */}
                <div className="border-b pb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Banking Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        maxLength={50}
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        onInput={(e) => {
                          // Remove any non-numeric characters
                          e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                        min="0"
                        step="1"
                      />
                    </div>

                    {/* IFSC Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={50}
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., SBIN0001234"
                        required
                      />
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
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

                    {/* Account Holder Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Documents Link */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Documents</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documents Google Drive Link
                    </label>
                    <input
                      type="url"
                      value={formData.documents.documentsLink || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          documents: {
                            ...prev.documents,
                            documentsLink: e.target.value
                          }
                        }));
                      }}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Provide a Google Drive link containing all merchant documents
                    </p>
                  </div>
                </div>
              </div>

            {/* Store & Operational Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Store & Operational Information</h3>

                {/* Store Address */}
                <div className="border-b pb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Store Address</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Street */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={200}
                        name="storeAddress.street"
                        value={formData.storeAddress.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        name="storeAddress.city"
                        value={formData.storeAddress.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="storeAddress.state"
                        value={formData.storeAddress.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        maxLength={20}
                        name="storeAddress.pincode"
                        value={formData.storeAddress.pincode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="6-digit pincode"
                        required
                        onKeyDown={(e) => {
                        if (['e', 'E', '+', '-'].includes(e.key)) {
                       e.preventDefault();
         }
  }}
                      />
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Landmark
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        name="storeAddress.landmark"
                        value={formData.storeAddress.landmark}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                              <CircleCheck size={16} />
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
                            Latitude {isManualEntry && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="number"
                            step="any"
                            name="storeAddress.coordinates.latitude"
                            value={formData.storeAddress.coordinates.latitude}
                            onChange={handleInputChange}
                            placeholder="e.g. 12.9716"
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={!isManualEntry}
                            required={isManualEntry}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Longitude {isManualEntry && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="number"
                            step="any"
                            name="storeAddress.coordinates.longitude"
                            value={formData.storeAddress.coordinates.longitude}
                            onChange={handleInputChange}
                            placeholder="e.g. 77.5946"
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={!isManualEntry}
                            required={isManualEntry}
                          />
                        </div>
                      </div>

                      {isManualEntry && (!formData.storeAddress.coordinates.latitude || !formData.storeAddress.coordinates.longitude) && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <Navigation size={16} />
                            <span className="text-sm font-medium">Coordinates Required</span>
                          </div>
                          <p className="text-sm text-yellow-600 mt-1">
                            Please enter both latitude and longitude coordinates for the business location.
                          </p>
                        </div>
                      )}

                      {!isManualEntry && !selectedLocation && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <MapPin size={16} />
                            <span className="text-sm font-medium">Location Required</span>
                          </div>
                          <p className="text-sm text-yellow-600 mt-1">
                            Please search and select a valid business location from the dropdown above, or enable manual entry to enter coordinates directly.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Store Type */}
                <div className="border-b pb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Store Type</h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Type *
                    </label>
                    <select
                      name="storeType"
                      value={formData.storeType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Store Type</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Fresh Fruits & Vegetables">Fresh Fruits & Vegetables</option>
                      <option value="Eateries">Eateries</option>
                      <option value="Meats">Meats</option>
                      <option value="Pet">Pet</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Product Categories */}
                <div className="border-b pb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Product Categories Include</h4>

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

                {/* Delivery Settings */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Delivery Settings</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Delivery Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Type
                      </label>
                      <select
                        name="deliveryType"
                        value={formData.deliveryType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="platform_delivery">Platform Delivery</option>
                        <option value="self_delivery">Self Delivery</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>

            {/* Branding & Final Review */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Branding & Final Review</h3>

                {/* Branding */}
                <div className="border-b pb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Branding Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tagline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Tagline
                      </label>
                      <input
                        type="text"
                        name="tagline"
                        value={formData.tagline}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Fresh & Fast Delivery"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Description
                      </label>
                      <textarea
                        name="storeDescription"
                        maxLength={200}
                        value={formData.storeDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Brief description about your store"
                      />
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Google Business Link</h5>
                    <div className="grid grid-cols-1 gap-4">
                      <input
                        type="url"
                        name="brandingInfo.socialMedia.googleBusiness"
                        value={formData.brandingInfo?.socialMedia?.googleBusiness}
                        onChange={handleInputChange}
                        placeholder="Google Business Profile URL"
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Branding Images */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Store Images</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Logo
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                            className="hidden"
                            id="store-logo"
                            disabled={uploadingLogo}
                          />
                          <label
                            htmlFor="store-logo"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                          >
                            {uploadingLogo ? (
                              <div className="animate-spin h-4 w-4 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                            ) : (
                              <Upload size={16} />
                            )}
                            Upload Logo
                          </label>
                          {formData.brandingInfo?.logoUrl && (
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
                            onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                            className="hidden"
                            id="store-banner"
                            disabled={uploadingBanner}
                          />
                          <label
                            htmlFor="store-banner"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer disabled:opacity-50"
                          >
                            {uploadingBanner ? (
                              <div className="animate-spin h-4 w-4 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                            ) : (
                              <Upload size={16} />
                            )}
                            Upload Banner
                          </label>
                          {formData.brandingInfo?.bannerUrl && (
                            <div className="flex items-center gap-2">
                              <img
                                src={formData.brandingInfo.bannerUrl}
                                alt="Store Banner"
                                className="w-16 h-10 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => window.open(formData.brandingInfo.bannerUrl, '_blank')}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commission Settings */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Commission & Settlement</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Commission Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Commission (%)
                      </label>
                      <input
                        type="number"
                        name="commissionPercentage"
                        value={formData.commissionPercentage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                        max="50"
                        onKeyDown={(e) => {
                        if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                           }
                           }}
                      />
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Create Merchant</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddMerchant;