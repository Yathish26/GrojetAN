import React, { useState } from 'react';
import { Shield, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRegistrationAuth({ onAuthSuccess, onGoBack }) {
  const [step, setStep] = useState(1); // 1 = PIN, 2 = OTP
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      toast.error('Please enter the PIN');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ pin: pin.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'PIN verification failed');
      }
      
      toast.success(data.message);
      setOtpSent(true);
      setStep(2);
      
    } catch (error) {
      console.error('PIN verification error:', error);
      toast.error(error.message || 'PIN verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ otp: otp.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      toast.success(data.message);
      
      // Store the auth token for registration
      localStorage.setItem('adminRegAuthToken', data.authToken);
      
      // Call the success callback to show the registration form
      onAuthSuccess();
      
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ pin })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }
      
      toast.success('OTP resent successfully');
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Admin Registration Authorization
          </h1>
          <p className="text-gray-600">
            {step === 1 
              ? 'Enter the authorization PIN to proceed' 
              : 'Enter the OTP sent to the authorized email'
            }
          </p>
        </div>

        {/* Authorization Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {step === 1 ? (
            // PIN Step
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyRound className="w-4 h-4 inline mr-1" />
                  Authorization PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg tracking-widest"
                  placeholder="Enter 6-digit PIN"
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !pin.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Verify PIN
                  </>
                )}
              </button>
            </form>
          ) : (
            // OTP Step
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <Mail className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-800">
                  OTP has been sent to <strong>Authorized Mail</strong>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Verify OTP
                  </>
                )}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  Didn't receive OTP? Resend
                </button>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setOtpSent(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  ← Back to PIN
                </button>
              </div>
            </form>
          )}
          
          {/* Back Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onGoBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Management
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This two-factor authentication ensures only authorized personnel can create admin accounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
