import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Save,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminRegistrationAuth from './AdminRegistrationAuth.jsx';

export default function AdminRegister() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '', // admin, super_admin, delivery_manager, inventory_manager
    department: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roles = [
    { value: 'admin', label: 'Admin', description: 'General admin access' },
    { value: 'super_admin', label: 'Super Admin', description: 'Full system access' },
    { value: 'delivery_manager', label: 'Delivery Manager', description: 'Delivery operations only' },
    { value: 'inventory_manager', label: 'Inventory Manager', description: 'Product & inventory management' }
  ];

  // Check authorization status on component mount
  useEffect(() => {
    const checkAuthorization = () => {
      const authToken = localStorage.getItem('adminRegAuthToken');
      if (authToken) {
        // Optionally verify the token with backend
        setIsAuthorized(true);
      }
      setCheckingAuth(false);
    };

    checkAuthorization();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthorized(true);
  };

  const handleGoBack = () => {
    navigate('/admin-management');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }

    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Check if still authorized
    const authToken = localStorage.getItem('adminRegAuthToken');
    if (!authToken) {
      toast.error('Authorization expired. Please verify PIN and OTP again.');
      setIsAuthorized(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Include auth token
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          role: formData.role,
          department: formData.department.trim(),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Authorization expired or invalid.');
        } else if (response.status === 401) {
          throw new Error('You are not logged in. Please login first.');
        }
        throw new Error(data.message || 'Failed to register admin');
      }

      toast.success('Admin registered successfully!');

      // Clear auth token after successful registration
      localStorage.removeItem('adminRegAuthToken');

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'admin',
        department: '',
      });

      // Navigate to admin management page
      setTimeout(() => {
        navigate('/admin-management');
      }, 1500);

    } catch (err) {
      console.error('Registration error:', err);
      if (err.message.includes('Authorization expired')) {
        setIsAuthorized(false);
        localStorage.removeItem('adminRegAuthToken');
      }
      toast.error(err.message || 'Failed to register admin');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authorization
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Show authorization component if not authorized
  if (!isAuthorized) {
    return (
      <AdminRegistrationAuth
        onAuthSuccess={handleAuthSuccess}
        onGoBack={handleGoBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Register New Admin</h1>
            <p className="text-gray-600">Create a new admin account with specific roles</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('adminRegAuthToken');
              navigate('/admin-management');
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Management
          </button>
        </div>

        {/* Registration Form */}
        <div className="bg-white  shadow-sm border border-gray-200 p-8">
          {/* Important Notice */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 ">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Authorization Verified</h3>
                <p className="text-sm text-green-700 mt-1">
                  You have successfully completed PIN and OTP verification. You can now create a new admin account.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Operations, IT, Customer Service"
                  />
                </div>
              </div>
            </div>

            {/* Security Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter password"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Role & Permissions</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Admin Role *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => (
                    <div
                      key={role.value}
                      className={`border  p-4 cursor-pointer transition-colors ${formData.role === role.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                      onClick={() => handleRoleChange(role.value)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={() => handleRoleChange(role.value)}
                          className="text-green-600 focus:ring-green-500"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{role.label}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white  hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Admin...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register Admin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
