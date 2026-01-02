import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function EmailSender() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [sendResult, setSendResult] = useState(null);

  const allowedRoles = ['super_admin', 'admin'];

  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const local = localStorage.getItem('adminUser');
        if (local) {
          setCurrentUser(JSON.parse(local));
        } else {
          const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
          const data = await response.json();
          if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
          }
          if (response.ok && data.admin) {
            setCurrentUser(data.admin);
            localStorage.setItem('adminUser', JSON.stringify(data.admin));
          }
        }
      } catch (err) {
        console.error('Failed to fetch current user', err);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.to.trim()) {
      toast.error('Recipient email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.to.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return false;
    }

    if (!formData.body.trim()) {
      toast.error('Email body is required');
      return false;
    }

    return true;
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSendResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to.trim(),
          subject: formData.subject.trim(),
          body: formData.body.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSendResult({
          success: true,
          messageId: data.messageId,
          recipient: data.recipient
        });
        toast.success('Email sent successfully!');
        // Clear form on success
        setFormData({
          to: '',
          subject: '',
          body: ''
        });
      } else {
        setSendResult({
          success: false,
          error: data.message || 'Failed to send email'
        });
        toast.error(data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({
        success: false,
        error: 'Network error occurred'
      });
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSES = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/email/test`);
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('SES test successful!');
        setSendResult({
          success: true,
          messageId: data.messageId,
          recipient: data.testEmail,
          isTest: true
        });
      } else {
        toast.error('SES test failed');
        setSendResult({
          success: false,
          error: data.error || 'SES test failed'
        });
      }
    } catch (error) {
      console.error('SES test error:', error);
      toast.error('SES test failed');
      setSendResult({
        success: false,
        error: 'Network error during SES test'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout title="Email Sender">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Email Sender">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Email Sender">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Email Sender</h1>
          <p className="text-gray-600 mt-1">Send emails using AWS SES from info@grojetdelivery.com</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Send Email</h2>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  id="to"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="recipient@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                  Message Body *
                </label>
                <textarea
                  id="body"
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {loading ? 'Sending...' : 'Send Email'}
                </button>

                <button
                  type="button"
                  onClick={handleTestSES}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test SES
                </button>
              </div>
            </form>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-6 w-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Send Results</h2>
            </div>

            {sendResult ? (
              <div className={`p-4 rounded-lg ${sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-start gap-3">
                  {sendResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-medium ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {sendResult.success ? 'Email Sent Successfully!' : 'Email Send Failed'}
                    </h3>
                    {sendResult.isTest && (
                      <p className="text-sm text-gray-600 mt-1">This was a test email sent to your configured test email address.</p>
                    )}
                    {sendResult.messageId && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Message ID:</strong> {sendResult.messageId}
                      </p>
                    )}
                    {sendResult.recipient && (
                      <p className="text-sm text-gray-600">
                        <strong>Recipient:</strong> {sendResult.recipient}
                      </p>
                    )}
                    {sendResult.error && (
                      <p className="text-sm text-red-700 mt-1">
                        <strong>Error:</strong> {sendResult.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Send an email to see the results here</p>
              </div>
            )}

            {/* Sender Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Sender Information</h4>
              <p className="text-sm text-blue-700">
                <strong>From:</strong> info@grojetdelivery.com
              </p>
              <p className="text-sm text-blue-700">
                <strong>Service:</strong> AWS SES (ap-south-1)
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}