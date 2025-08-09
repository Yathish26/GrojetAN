import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
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
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.msg || 'Login failed');
      }

      if (data.success) {
        toast.success(`Welcome back, ${data.admin?.name || 'Admin'}!`);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while logging in');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials handler
  const fillDemoCredentials = () => {
    setFormData({
      email: 'superadmin@grojet.com',
      password: 'SuperAdmin@123'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-300 flex items-center justify-center p-4">
      <div className="bg-white p-8 shadow-xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-fit h-fit flex items-center justify-center mb-4">
            <img draggable="false" className='w-24 h-24 object-contain' src="/grojet.png" alt="Grojet" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Portal</h1>
          <p className="text-gray-500 text-center">
            Delivery management system
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4  mb-6 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Access ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="ID"
                value={formData.email}
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
                className="block w-full pl-10 pr-3 py-3 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent  shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Access Admin Panel</span>
              </>
            )}
          </button>
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