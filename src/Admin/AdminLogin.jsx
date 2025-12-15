import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, Shield, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    otp: ''
  });
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isOtpStep) {
        // First step: Login with ID and password to get OTP
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: formData.id,
            password: formData.password
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.msg || 'Login failed');
        }

        if (data.success) {
          toast.success('OTP sent to your registered email!');
          setIsOtpStep(true);
        }
      } else {
        // Second step: Verify OTP
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/verify-login-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.id, // ID is email
            otp: formData.otp
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.msg || 'OTP verification failed');
        }

        if (data.success) {
          toast.success(`Welcome back, ${data.admin?.name || 'Admin'}!`);
          localStorage.setItem('adminUser', JSON.stringify(data.admin));
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!formData.id) {
      setError('Please provide your ID to resend OTP');
      return;
    }
    setResendLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/resend-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');
      toast.success(data.message || 'OTP resent to your email');
      // disable resend for 30 seconds to prevent abuse
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 30000);
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#d30a02] to-white flex items-center justify-center p-4">
      <div className="bg-white p-8 shadow-xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-fit h-fit flex items-center justify-center mb-4">
            <img draggable="false" className='w-24 h-auto object-contain' src="/grojet.png" alt="Grojet" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isOtpStep ? 'Verify OTP' : 'Panel Center'}
          </h1>
          <p className="text-gray-500 text-center">
            {isOtpStep 
              ? 'Enter the OTP sent to your email to complete login' 
              : 'Your City Your Store but at your Hand !'
            }
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 mb-6 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!isOtpStep ? (
            <>
              <div className="space-y-1">
                <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                  Access ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    maxLength={100}
                    id="id"
                    name="id"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your ID"
                    value={formData.id}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Passcode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  id="otp"
                  name="otp"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-center text-lg font-mono tracking-widest"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Check your email for the 6-digit OTP code
              </p>
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDisabled || resendLoading}
                  className={`text-sm underline text-gray-600 hover:text-gray-800 disabled:opacity-60`}
                >
                  {resendLoading ? 'Resending...' : (resendDisabled ? 'Resend available shortly' : 'Resend OTP')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpStep(false);
                    setFormData(prev => ({ ...prev, otp: '' }));
                    setError(null);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Back to login
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 transition-colors cursor-pointer font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>{isOtpStep ? 'Verifying...' : 'Sending OTP...'}</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>{isOtpStep ? 'Verify & Login' : 'Send OTP'}</span>
              </>
            )}
          </button>

          {/* Back to login moved inside OTP block alongside resend */}
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Secure Admin Access
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}