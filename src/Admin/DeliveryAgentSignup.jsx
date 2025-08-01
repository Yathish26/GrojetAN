import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  Upload,
  Eye,
  EyeOff,
  Camera,
  FileText,
  CircleCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryAgentSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male'
    },
    
    // Address
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: ''
    },
    
    // Emergency Contact
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    
    // Account Information
    password: '',
    confirmPassword: '',
    
    // Vehicle Information
    vehicleInfo: {
      vehicleType: '',
      vehicleNumber: '',
      rcBook: null,
      insurance: null,
      puc: null
    },
    
    // Documents
    documents: {
      aadharFront: null,
      aadharBack: null,
      panCard: null,
      drivingLicense: null,
      profilePhoto: null,
      bankAccount: {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: ''
      }
    },
    
    // Work Information
    workInfo: {
      preferredAreas: [],
      availabilityHours: {
        start: '09:00',
        end: '18:00'
      },
      workingDays: [],
      expectedSalary: '',
      experience: ''
    },
    
    // Terms and Conditions
    agreedToTerms: false,
    agreedToPrivacy: false
  });

  const steps = [
    { id: 1, title: 'Personal Info', icon: User },
    { id: 2, title: 'Account Setup', icon: Mail },
    { id: 3, title: 'Vehicle Details', icon: Truck },
    { id: 4, title: 'Documents', icon: FileText },
    { id: 5, title: 'Preferences', icon: MapPin }
  ];

  const vehicleTypes = [
    'bike',
    'bicycle', 
    'scooter',
    'car'
  ];

  const availableZones = [
    'Downtown',
    'North Side',
    'South Side',
    'East End',
    'West End',
    'Suburbs',
    'Business District',
    'University Area'
  ];

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = async (documentType, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    // Set uploading state for this document
    setUploadingDoc(prev => ({ ...prev, [documentType]: true }));

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Image upload failed');
      }

      // Handle vehicle documents vs regular documents
      if (['rcBook', 'insurance', 'puc'].includes(documentType)) {
        setFormData(prev => ({
          ...prev,
          vehicleInfo: {
            ...prev.vehicleInfo,
            [documentType]: data.imageUrl,
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [documentType]: data.imageUrl,
          }
        }));
      }
      toast.success(`${documentType} uploaded successfully!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleZoneToggle = (zone) => {
    setFormData(prev => ({
      ...prev,
      workInfo: {
        ...prev.workInfo,
        preferredAreas: prev.workInfo.preferredAreas.includes(zone)
          ? prev.workInfo.preferredAreas.filter(z => z !== zone)
          : [...prev.workInfo.preferredAreas, zone]
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.personalInfo.firstName && formData.personalInfo.lastName && 
               formData.personalInfo.email && formData.personalInfo.phone && 
               formData.personalInfo.dateOfBirth;
      case 2:
        return formData.password && formData.confirmPassword &&
               formData.password === formData.confirmPassword &&
               formData.password.length >= 6;
      case 3:
        return formData.vehicleInfo.vehicleType && formData.vehicleInfo.vehicleNumber;
      case 4:
        const bank = formData.documents.bankAccount;
        return formData.documents.aadharFront && formData.documents.aadharBack &&
               formData.documents.panCard && bank.accountNumber && bank.ifscCode &&
               bank.bankName && bank.accountHolderName;
      case 5:
        return formData.agreedToTerms && formData.agreedToPrivacy;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast.error('Please complete all required fields and accept terms');
      return;
    }

    setLoading(true);
    try {
      // Prepare the data to match backend expectations
      const submitData = {
        personalInfo: {
          firstName: formData.personalInfo.firstName,
          lastName: formData.personalInfo.lastName,
          email: formData.personalInfo.email,
          phone: formData.personalInfo.phone,
          dateOfBirth: formData.personalInfo.dateOfBirth,
          gender: formData.personalInfo.gender
        },
        address: {
          street: formData.address.street,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: formData.address.zipCode,
          landmark: formData.address.landmark || ''
        },
        emergencyContact: {
          name: formData.emergencyContact.name,
          phone: formData.emergencyContact.phone,
          relationship: formData.emergencyContact.relationship
        },
        vehicleInfo: {
          vehicleType: formData.vehicleInfo.vehicleType,
          vehicleNumber: formData.vehicleInfo.vehicleNumber,
          rcBook: formData.vehicleInfo.rcBook || '',
          insurance: formData.vehicleInfo.insurance || '',
          puc: formData.vehicleInfo.puc || ''
        },
        documents: {
          aadharFront: formData.documents.aadharFront || '',
          aadharBack: formData.documents.aadharBack || '',
          panCard: formData.documents.panCard || '',
          drivingLicense: formData.documents.drivingLicense || '',
          bankAccount: {
            accountNumber: formData.documents.bankAccount.accountNumber,
            ifscCode: formData.documents.bankAccount.ifscCode,
            bankName: formData.documents.bankAccount.bankName,
            accountHolderName: formData.documents.bankAccount.accountHolderName
          }
        },
        workInfo: {
          preferredAreas: formData.workInfo.preferredAreas || [],
          availabilityHours: {
            start: formData.workInfo.availabilityHours.start,
            end: formData.workInfo.availabilityHours.end
          },
          workingDays: (formData.workInfo.workingDays || []).map(day => day.toLowerCase()),
          expectedSalary: parseInt(formData.workInfo.expectedSalary) || 0,
          experience: formData.workInfo.experience || ''
        },
        password: formData.password
      };

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      const data = await response.json();
      toast.success('Application submitted successfully! You will be notified once reviewed.');
      
      // Reset form
      setFormData({
        personalInfo: { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'male' },
        address: { street: '', city: '', state: '', zipCode: '', landmark: '' },
        emergencyContact: { name: '', phone: '', relationship: '' },
        password: '', confirmPassword: '',
        vehicleInfo: { vehicleType: '', vehicleNumber: '', rcBook: null, insurance: null, puc: null },
        documents: { 
          aadharFront: null, aadharBack: null, panCard: null, drivingLicense: null, profilePhoto: null,
          bankAccount: { accountNumber: '', ifscCode: '', bankName: '', accountHolderName: '' }
        },
        workInfo: { 
          preferredAreas: [], availabilityHours: { start: '09:00', end: '18:00' }, 
          workingDays: [], expectedSalary: '', experience: '' 
        },
        agreedToTerms: false, agreedToPrivacy: false
      });
      setCurrentStep(1);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join as Delivery Agent</h1>
          <p className="text-gray-600">Complete your application to start delivering with Grojet</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isActive
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}>
                      {isCompleted ? <CircleCheck className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`text-sm mt-2 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                      }`}>
                      {step.title}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.personalInfo.firstName}
                    onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.personalInfo.lastName}
                    onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.personalInfo.email}
                    onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.personalInfo.phone}
                    onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.personalInfo.dateOfBirth}
                    onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    required
                    value={formData.personalInfo.gender}
                    onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={formData.address.landmark}
                      onChange={(e) => handleInputChange('address', 'landmark', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Account Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Account Setup</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange(null, 'password', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange(null, 'confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select</option>
                      <option value="parent">Parent</option>
                      <option value="spouse">Spouse</option>
                      <option value="sibling">Sibling</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Vehicle Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.vehicleInfo.vehicleType}
                    onChange={(e) => handleInputChange('vehicleInfo', 'vehicleType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Vehicle Type</option>
                    {vehicleTypes.map(type => (
                      <option key={type} value={type} className="capitalize">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleInfo.vehicleNumber}
                    onChange={(e) => handleInputChange('vehicleInfo', 'vehicleNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., KA01AB1234"
                  />
                </div>
              </div>

              {/* Vehicle Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Vehicle Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { key: 'rcBook', label: 'RC Book', required: true },
                    { key: 'insurance', label: 'Insurance', required: true },
                    { key: 'puc', label: 'PUC Certificate', required: false }
                  ].map(doc => (
                    <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </span>
                        {formData.vehicleInfo[doc.key] && (
                          <CircleCheck className="w-5 h-5 text-green-500" />
                        )}
                      </div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {uploadingDoc[doc.key] ? (
                          <div className="flex flex-col items-center justify-center h-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            <span className="text-blue-600 text-sm">Uploading...</span>
                          </div>
                        ) : typeof formData.vehicleInfo[doc.key] === 'string' && formData.vehicleInfo[doc.key].startsWith('http') ? (
                          <div>
                            <img
                              src={formData.vehicleInfo[doc.key]}
                              alt={doc.label}
                              className="h-20 mx-auto mb-2 object-contain"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(doc.key, e.target.files[0])}
                              className="hidden"
                              id={`file-${doc.key}`}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`file-${doc.key}`).click()}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Replace File
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Click to upload or drag and drop
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(doc.key, e.target.files[0])}
                              className="hidden"
                              id={`file-${doc.key}`}
                            />
                            <label
                              htmlFor={`file-${doc.key}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                            >
                              Choose File
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Document Upload</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: 'aadharFront', label: 'Aadhar Front', required: true },
                  { key: 'aadharBack', label: 'Aadhar Back', required: true },
                  { key: 'panCard', label: 'PAN Card', required: false },
                  { key: 'drivingLicense', label: 'Driving License', required: true },
                  { key: 'vehicleRC', label: 'Vehicle RC', required: false },
                  { key: 'profilePhoto', label: 'Profile Photo', required: false }
                ].map(doc => (
                  <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800">
                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                      </span>
                      {formData.documents[doc.key] && (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      {uploadingDoc[doc.key] ? (
                        <div className="flex flex-col items-center justify-center h-20">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <span className="text-blue-600 text-sm">Uploading...</span>
                        </div>
                      ) : typeof formData.documents[doc.key] === 'string' && formData.documents[doc.key].startsWith('http') ? (
                        <div>
                          <img
                            src={formData.documents[doc.key]}
                            alt={doc.label}
                            className="h-20 mx-auto mb-2 object-contain"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(doc.key, e.target.files[0])}
                            className="hidden"
                            id={`file-${doc.key}`}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`file-${doc.key}`).click()}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Replace File
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Click to upload or drag and drop
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(doc.key, e.target.files[0])}
                            className="hidden"
                            id={`file-${doc.key}`}
                          />
                          <label
                            htmlFor={`file-${doc.key}`}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
                          >
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Bank Details Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Bank Account Details <span className="text-red-500">*</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.documents.bankAccount.accountHolderName}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          bankAccount: {
                            ...prev.documents.bankAccount,
                            accountHolderName: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={formData.documents.bankAccount.bankName}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          bankAccount: {
                            ...prev.documents.bankAccount,
                            bankName: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={formData.documents.bankAccount.accountNumber}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          bankAccount: {
                            ...prev.documents.bankAccount,
                            accountNumber: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={formData.documents.bankAccount.ifscCode}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        documents: {
                          ...prev.documents,
                          bankAccount: {
                            ...prev.documents.bankAccount,
                            ifscCode: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Preferences & Terms */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Work Preferences</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Delivery Areas
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableZones.map(zone => (
                      <label key={zone} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.workInfo.preferredAreas.includes(zone)}
                          onChange={() => handleZoneToggle(zone)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700">{zone}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Working Hours - Start
                    </label>
                    <input
                      type="time"
                      value={formData.workInfo.availabilityHours.start}
                      onChange={(e) => handleInputChange('workInfo', 'availabilityHours', {
                        ...formData.workInfo.availabilityHours,
                        start: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Working Hours - End
                    </label>
                    <input
                      type="time"
                      value={formData.workInfo.availabilityHours.end}
                      onChange={(e) => handleInputChange('workInfo', 'availabilityHours', {
                        ...formData.workInfo.availabilityHours,
                        end: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Salary (per month)
                    </label>
                    <input
                      type="number"
                      value={formData.workInfo.expectedSalary}
                      onChange={(e) => handleInputChange('workInfo', 'expectedSalary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="0"
                      placeholder="e.g., 25000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Experience (years)
                    </label>
                    <input
                      type="number"
                      value={formData.workInfo.experience}
                      onChange={(e) => handleInputChange('workInfo', 'experience', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="0"
                      max="20"
                      step="0.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <label key={day} className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={formData.workInfo.workingDays.includes(day.toLowerCase())}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const dayLower = day.toLowerCase();
                            setFormData(prev => ({
                              ...prev,
                              workInfo: {
                                ...prev.workInfo,
                                workingDays: checked
                                  ? [...prev.workInfo.workingDays, dayLower]
                                  : prev.workInfo.workingDays.filter(d => d !== dayLower)
                              }
                            }));
                          }}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-700">{day.substring(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800">Terms and Conditions</h3>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreedToTerms}
                        onChange={(e) => handleInputChange(null, 'agreedToTerms', e.target.checked)}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the <a href="#" className="text-blue-600 hover:text-blue-700">Terms and Conditions</a> *
                      </span>
                    </label>

                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.agreedToPrivacy}
                        onChange={(e) => handleInputChange(null, 'agreedToPrivacy', e.target.checked)}
                        className="mt-1 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a> *
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
