import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Eye, EyeOff, Save, User,
  Building, Phone, Mail, MapPin, CreditCard, FileText,
  Camera, Store, DollarSign, Calendar, Shield
} from 'lucide-react';
import Layout from '../Components/Layout';
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
    businessType: 'sole_proprietor',
    description: '',
    website: '',
    establishedYear: '',

    // Owner Info
    fullName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    password: '',
    governmentIdType: 'pan',
    governmentId: '',
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
    accountType: 'business',

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
    deliveryType: 'platform_delivery',
    deliveryRadius: 10,
    minimumOrderValue: 0,
    deliveryCharges: 0,
    freeDeliveryAbove: 500,

    // Branding Info
    tagline: '',
    storeDescription: '',
    storeLogoUrl: '',
    storeBannerUrl: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: ''
    },

    // Commission
    commissionPercentage: 10,
    settlementCycle: 'weekly',
    minimumSettlement: 1000,

    // Store Status
    storeStatus: 'closed',

    // Documents (Text inputs)
    documents: {
      panCard: '',
      aadhaarNumber: '',
      gstinNumber: '',
      shopEstablishmentLicense: '',
      fssaiLicense: '',
      bankAccountNumber: '',
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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

  

  const validateStep = (step) => {
    switch (step) {
      case 1: // Business & Owner Info
        if (!formData.merchantId || !formData.legalName || !formData.displayName ||
            !formData.fullName || !formData.mobile || !formData.email || !formData.password ||
            !formData.governmentIdType) {
          toast.error('Please fill all required fields in Business & Owner Information');
          return false;
        }
        break;
      case 2: // Banking & Documents
        if (!formData.accountNumber || !formData.ifscCode || !formData.bankName ||
            !formData.accountHolderName) {
          toast.error('Please fill all required banking details');
          return false;
        }
        break;
      case 3: // Operational Info
        if (!formData.storeAddress.street || !formData.storeAddress.city ||
            !formData.storeAddress.state || !formData.storeAddress.pincode) {
          toast.error('Please fill all store address details');
          return false;
        }
        break;
      case 4: // Branding & Review
        // No required fields in step 4, but ensure user can review
        break;
      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (currentStep < totalSteps) return; // Prevent submission if not on the last step

    if (!validateStep(currentStep)) return;

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

  const renderTextInput = (label, fieldName, placeholder = "", required = false, type = "text") => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={formData.documents[fieldName] || ''}
        onChange={(e) => {
          setFormData(prev => ({
            ...prev,
            documents: {
              ...prev.documents,
              [fieldName]: e.target.value
            }
          }));
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        required={required}
      />
    </div>
  );

  const steps = [
    { id: 1, name: 'Business & Owner Info', icon: Building },
    { id: 2, name: 'Banking & Documents', icon: CreditCard },
    { id: 3, name: 'Store & Operations', icon: Store },
    { id: 4, name: 'Branding & Review', icon: Camera }
  ];

  return (
    <Layout title="Add New Merchant">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/merchants')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Merchant</h1>
              <p className="text-gray-600">Create a new merchant account with complete details</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                <step.icon size={20} />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Step 1: Business & Owner Info */}
            {currentStep === 1 && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Business Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="sole_proprietor">Sole Proprietor</option>
                      <option value="partnership">Partnership</option>
                      <option value="pvt_ltd">Private Limited</option>
                      <option value="llp">LLP</option>
                      <option value="trust">Trust</option>
                      <option value="society">Society</option>
                      <option value="other">Other</option>
                    </select>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

                    {/* Government ID Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Government ID Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="governmentIdType"
                        value={formData.governmentIdType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      >
                        <option value="pan">PAN Card</option>
                        <option value="aadhaar">Aadhaar Card</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="voter_id">Voter ID</option>
                      </select>
                    </div>

                    {/* Government ID Document */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Government ID Document
                      </label>
                      <input
                        type="text"
                        name="governmentId"
                        value={formData.governmentId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter ID number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Banking & Documents */}
            {currentStep === 2 && (
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., SBIN0001234"
                        required
                      />
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Document Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderTextInput('PAN Card Number', 'panCard', 'Enter PAN card number', true)}
                    {renderTextInput('Aadhaar Number', 'aadhaarNumber', 'Enter 12-digit Aadhaar number', true)}
                    {renderTextInput('GSTIN Number', 'gstinNumber', 'Enter GSTIN number')}
                    {renderTextInput('Shop Establishment License', 'shopEstablishmentLicense', 'Enter license number')}
                    {renderTextInput('FSSAI License Number', 'fssaiLicense', 'Enter FSSAI license number')}
                    {renderTextInput('Bank Account Number', 'bankAccountNumber', 'Enter account number for verification', true)}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Store & Operations */}
            {currentStep === 3 && (
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Product Categories */}
                <div className="border-b pb-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Product Categories</h4>

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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="platform_delivery">Platform Delivery</option>
                        <option value="self_delivery">Self Delivery</option>
                        <option value="both">Both</option>
                      </select>
                    </div>

                    {/* Delivery Radius */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Radius (km)
                      </label>
                      <input
                        type="number"
                        name="deliveryRadius"
                        value={formData.deliveryRadius}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                        max="50"
                      />
                    </div>

                    {/* Minimum Order Value */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order Value (₹)
                      </label>
                      <input
                        type="number"
                        name="minimumOrderValue"
                        value={formData.minimumOrderValue}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                      />
                    </div>

                    {/* Free Delivery Above */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Free Delivery Above (₹)
                      </label>
                      <input
                        type="number"
                        name="freeDeliveryAbove"
                        value={formData.freeDeliveryAbove}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Store Status */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Store Status</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Store Status
                      </label>
                      <select
                        name="storeStatus"
                        value={formData.storeStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="closed">Closed</option>
                        <option value="open">Open</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        This can be changed later by the merchant
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Branding & Review */}
            {currentStep === 4 && (
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Brief description about your store"
                      />
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Social Media Links</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="url"
                        name="socialMedia.facebook"
                        value={formData.socialMedia.facebook}
                        onChange={handleInputChange}
                        placeholder="Facebook URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="url"
                        name="socialMedia.instagram"
                        value={formData.socialMedia.instagram}
                        onChange={handleInputChange}
                        placeholder="Instagram URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Branding Images */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Store Images</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Logo URL
                        </label>
                        <input
                          type="url"
                          name="storeLogoUrl"
                          value={formData.storeLogoUrl || ''}
                          onChange={handleInputChange}
                          placeholder="https://example.com/logo.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Banner URL
                        </label>
                        <input
                          type="url"
                          name="storeBannerUrl"
                          value={formData.storeBannerUrl || ''}
                          onChange={handleInputChange}
                          placeholder="https://example.com/banner.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Minimum Settlement */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Settlement (₹)
                      </label>
                      <input
                        type="number"
                        name="minimumSettlement"
                        value={formData.minimumSettlement}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
              )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AddMerchant;