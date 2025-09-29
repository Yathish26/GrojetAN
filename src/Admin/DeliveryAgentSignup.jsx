import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Truck,
  Eye,
  EyeOff,
  CircleCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  ArrowLeft as BackIcon,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeliveryAgentSignup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [availableZones, setAvailableZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
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
      rcBook: false,
      insurance: false
    },
    
    // Documents
    documents: {
      aadharFront: false,
      aadharBack: false,
      panCard: false,
      drivingLicense: false,
      profilePhoto: false,
      documentsLink: '',
      bankAccount: {
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: ''
      }
    },
    
    // Work Information
    workInfo: {
      expectedSalary: '',
      experience: '',
      assignedZone: ''
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

  // Fetch delivery zones on component mount
  useEffect(() => {
    const fetchDeliveryZones = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableZones(data.zones || []);
        } else {
          console.error('Failed to fetch delivery zones');
          // Fallback to empty array
          setAvailableZones([]);
        }
      } catch (error) {
        console.error('Error fetching delivery zones:', error);
        setAvailableZones([]);
      } finally {
        setZonesLoading(false);
      }
    };

    fetchDeliveryZones();
  }, []);

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

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.personalInfo.firstName && 
               formData.personalInfo.email && formData.personalInfo.phone && 
               formData.personalInfo.dateOfBirth;
      case 2:
        return formData.password && formData.confirmPassword &&
               formData.password === formData.confirmPassword &&
               formData.password.length >= 6 &&
               formData.emergencyContact.name && formData.emergencyContact.phone &&
               formData.emergencyContact.relationship;
      case 3:
        return formData.vehicleInfo.vehicleType && formData.vehicleInfo.vehicleNumber &&
               formData.vehicleInfo.rcBook && formData.vehicleInfo.insurance;
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
          gender: formData.personalInfo.gender,
          profilePhoto: formData.personalInfo.profilePhoto || ''
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
          rcBook: formData.vehicleInfo.rcBook,
          insurance: formData.vehicleInfo.insurance
        },
        documents: {
          aadharFront: formData.documents.aadharFront,
          aadharBack: formData.documents.aadharBack,
          panCard: formData.documents.panCard,
          drivingLicense: formData.documents.drivingLicense,
          documentsLink: formData.documents.documentsLink,
          bankAccount: {
            accountNumber: formData.documents.bankAccount.accountNumber,
            ifscCode: formData.documents.bankAccount.ifscCode,
            bankName: formData.documents.bankAccount.bankName,
            accountHolderName: formData.documents.bankAccount.accountHolderName
          }
        },
        workInfo: {
          expectedSalary: parseInt(formData.workInfo.expectedSalary) || 0,
          experience: formData.workInfo.experience || '',
          assignedZone: formData.workInfo.assignedZone || null
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
        vehicleInfo: { vehicleType: '', vehicleNumber: '', rcBook: false, insurance: false },
        documents: { 
          aadharFront: false, aadharBack: false, panCard: false, drivingLicense: false, profilePhoto: false, documentsLink: '',
          bankAccount: { accountNumber: '', ifscCode: '', bankName: '', accountHolderName: '' }
        },
        workInfo: { 
          expectedSalary: '', experience: '', assignedZone: '' 
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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/delivery-agents')}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BackIcon className="w-5 h-5" />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Join as Delivery Agent</h1>
            <p className="text-gray-600">Complete your application to start delivering with Grojet</p>
          </div>
          
          <div className="w-32"></div> {/* Spacer for centering */}
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
                    Last Name
                  </label>
                  <input
                    type="text"
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
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact.name}
                      onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.emergencyContact.phone}
                      onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <select
                      required
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="rcBook"
                      checked={formData.vehicleInfo.rcBook}
                      onChange={(e) => handleInputChange('vehicleInfo', 'rcBook', e.target.checked)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="rcBook" className="text-sm font-medium text-gray-700">
                      RC Book <span className="text-red-500">*</span>
                    </label>
                    {formData.vehicleInfo.rcBook && (
                      <CircleCheck className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="insurance"
                      checked={formData.vehicleInfo.insurance}
                      onChange={(e) => handleInputChange('vehicleInfo', 'insurance', e.target.checked)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="insurance" className="text-sm font-medium text-gray-700">
                      Insurance <span className="text-red-500">*</span>
                    </label>
                    {formData.vehicleInfo.insurance && (
                      <CircleCheck className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Document Upload</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Document Verification</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="aadharFront"
                        checked={formData.documents.aadharFront}
                        onChange={(e) => handleInputChange('documents', 'aadharFront', e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="aadharFront" className="text-sm font-medium text-gray-700">
                        Aadhar Front <span className="text-red-500">*</span>
                      </label>
                      {formData.documents.aadharFront && (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="aadharBack"
                        checked={formData.documents.aadharBack}
                        onChange={(e) => handleInputChange('documents', 'aadharBack', e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="aadharBack" className="text-sm font-medium text-gray-700">
                        Aadhar Back <span className="text-red-500">*</span>
                      </label>
                      {formData.documents.aadharBack && (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="panCard"
                        checked={formData.documents.panCard}
                        onChange={(e) => handleInputChange('documents', 'panCard', e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="panCard" className="text-sm font-medium text-gray-700">
                        PAN Card
                      </label>
                      {formData.documents.panCard && (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="drivingLicense"
                        checked={formData.documents.drivingLicense}
                        onChange={(e) => handleInputChange('documents', 'drivingLicense', e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="drivingLicense" className="text-sm font-medium text-gray-700">
                        Driving License <span className="text-red-500">*</span>
                      </label>
                      {formData.documents.drivingLicense && (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="profilePhoto"
                        checked={formData.documents.profilePhoto}
                        onChange={(e) => handleInputChange('documents', 'profilePhoto', e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="profilePhoto" className="text-sm font-medium text-gray-700">
                        Profile Photo
                      </label>
                      {formData.documents.profilePhoto && (
                        <CircleCheck className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">Documents Link</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Drive / Document Link
                    </label>
                    <input
                      type="url"
                      value={formData.documents.documentsLink}
                      onChange={(e) => handleInputChange('documents', 'documentsLink', e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the link to your documents folder (Google Drive, Dropbox, etc.)
                    </p>
                  </div>
                </div>
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
                    <select
                      required
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Zone
                  </label>
                  <select
                    value={formData.workInfo.assignedZone}
                    onChange={(e) => handleInputChange('workInfo', 'assignedZone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={zonesLoading}
                  >
                    <option value="">
                      {zonesLoading ? 'Loading zones...' : 'Select a zone'}
                    </option>
                    {availableZones.map((zone) => (
                      <option key={zone._id} value={zone._id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                  {!zonesLoading && availableZones.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No delivery zones available</p>
                  )}
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
