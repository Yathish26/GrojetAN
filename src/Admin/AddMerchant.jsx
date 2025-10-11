import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Eye, EyeOff, Save, User,
  Building, Phone, Mail, MapPin, CreditCard, FileText,
  Camera, Store, DollarSign, Calendar, Shield, Search, Navigation, CheckCircle,
  CircleCheck
} from 'lucide-react';
import Layout from '../Components/Layout';
import { AddressSearch } from '../Components/GoogleMapComponents';
import toast from 'react-hot-toast';

const AddMerchant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Business Info
    merchantId: '',
    legalName: '',
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
    settlementCycle: 'weekly',

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
    const hasRequiredFields = formData.merchantId && formData.legalName && formData.displayName &&
                             formData.fullName && formData.mobile && formData.email && formData.password;
    return hasRequiredFields && isLocationValid();
  };

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
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
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
      formDataUpload.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload`, {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setFormData(prev => ({
          ...prev,
          brandingInfo: {
            ...prev.brandingInfo,
            [fieldName]: data.url
          }
        }));
        toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully!`);
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
                  {/* Merchant ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="merchantId"
                      value={formData.merchantId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., M001"
                      required
                    />
                  </div>

                  {/* Legal Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legal Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="legalName"
                      value={formData.legalName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display/Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
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
                        maxLength={10}
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
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* IFSC Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
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

                    {/* Account Holder Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Holder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
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
                      <input
                        type="text"
                        name="storeAddress.state"
                        value={formData.storeAddress.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="storeAddress.pincode"
                        value={formData.storeAddress.pincode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="6-digit pincode"
                        required
                      />
                    </div>

                    {/* Landmark */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Landmark
                      </label>
                      <input
                        type="text"
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
                      <option value="Meats">Meats</option>
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
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                            disabled={uploadingLogo}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                          {uploadingLogo && (
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                              Uploading logo...
                            </div>
                          )}
                          {formData.brandingInfo?.logoUrl && (
                            <div className="flex items-center space-x-2">
                              <img
                                src={formData.brandingInfo.logoUrl}
                                alt="Logo preview"
                                className="w-16 h-16 object-cover border"
                              />
                              <span className="text-sm text-gray-600">Logo uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Banner
                        </label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                            disabled={uploadingBanner}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                          />
                          {uploadingBanner && (
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                              Uploading banner...
                            </div>
                          )}
                          {formData.brandingInfo?.bannerUrl && (
                            <div className="flex items-center space-x-2">
                              <img
                                src={formData.brandingInfo.bannerUrl}
                                alt="Banner preview"
                                className="w-24 h-16 object-cover border"
                              />
                              <span className="text-sm text-gray-600">Banner uploaded</span>
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
                      />
                    </div>

                    {/* Settlement Cycle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Settlement Cycle
                      </label>
                      <select
                        name="settlementCycle"
                        value={formData.settlementCycle}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
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