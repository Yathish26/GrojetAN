import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  Paperclip,
  X,
  Settings,
  Shield
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
    body: '',
    from: 'info@grojetdelivery.com'
  });
  const [attachments, setAttachments] = useState([]);
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit per file
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (too large, max 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Some files were not added: ${invalidFiles.join(', ')}`);
    }

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      toast.success(`Added ${validFiles.length} file(s)`);
    }

    // Clear the input
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      const formDataToSend = new FormData();
      formDataToSend.append('to', formData.to.trim());
      formDataToSend.append('subject', formData.subject.trim());
      formDataToSend.append('body', formData.body.trim());
      formDataToSend.append('from', formData.from);

      // Add attachments
      attachments.forEach((file, index) => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch(`${import.meta.env.VITE_SERVER}/email/send`, {
        method: 'POST',
        body: formDataToSend
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
          body: '',
          from: 'info@grojetdelivery.com'
        });
        setAttachments([]);
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
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Email Sender">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">Only Admins and Super Admins can access email sender.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Email Sender">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Email Sender</h1>
                  <p className="mt-1 text-sm text-gray-500">Send emails using AWS SES with attachment support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Service</p>
                    <p className="text-lg font-bold text-white">AWS SES</p>
                  </div>
                  <Mail className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Region</p>
                    <p className="text-lg font-bold text-white">ap-south-1</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                    <span className="text-blue-700 font-bold text-sm">IN</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Attachments</p>
                    <p className="text-lg font-bold text-white">Supported</p>
                  </div>
                  <Paperclip className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Email Form */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  Send Email
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleSendEmail} className="space-y-6">
                  <div>
                    <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-2">
                      Sender Email *
                    </label>
                    <select
                      id="from"
                      name="from"
                      value={formData.from}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    >
                      <option value="info@grojetdelivery.com">info@grojetdelivery.com</option>
                      <option value="support@grojetdelivery.com">support@grojetdelivery.com</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      id="to"
                      name="to"
                      value={formData.to}
                      onChange={handleInputChange}
                      placeholder="recipient@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Email subject"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                      Message Body *
                    </label>
                    <textarea
                      id="body"
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      placeholder="Type your message here..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments (Optional)
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          id="attachments"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="attachments"
                          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors border border-gray-300"
                        >
                          <Paperclip className="h-5 w-5" />
                          Choose Files
                        </label>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            Max 10MB per file • PDF, DOC, Images, ZIP supported • Max 5 files
                          </p>
                        </div>
                      </div>

                      {/* Display selected attachments */}
                      {attachments.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-700">Selected Files ({attachments.length}):</p>
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Paperclip className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(file.size)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="ml-3 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <Loader className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <Send className="h-5 w-5 mr-2" />
                      )}
                      {loading ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  Send Results
                </h2>
              </div>
              <div className="p-6">
                {sendResult ? (
                  <div className={`p-4 rounded-lg border ${sendResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3">
                      {sendResult.success ? (
                        <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${sendResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {sendResult.success ? 'Email Sent Successfully!' : 'Email Send Failed'}
                        </h3>
                        {sendResult.isTest && (
                          <p className="text-sm text-gray-600 mt-2">This was a test email sent to your configured test email address.</p>
                        )}
                        {sendResult.messageId && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm text-gray-600">
                              <strong className="text-gray-800">Message ID:</strong>
                            </p>
                            <p className="text-xs font-mono text-gray-700 mt-1 break-all">{sendResult.messageId}</p>
                          </div>
                        )}
                        {sendResult.recipient && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong className="text-gray-800">Recipient:</strong> {sendResult.recipient}
                          </p>
                        )}
                        {sendResult.attachmentsCount !== undefined && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong className="text-gray-800">Attachments:</strong> {sendResult.attachmentsCount}
                          </p>
                        )}
                        {sendResult.error && (
                          <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                            <p className="text-sm text-red-700">
                              <strong className="text-red-800">Error:</strong> {sendResult.error}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Ready to Send</h3>
                    <p className="text-gray-600">Fill out the form and send an email to see the results here</p>
                  </div>
                )}

                {/* Sender Info */}
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Sender Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-blue-700">
                      <strong className="text-blue-800">From:</strong> info@grojetdelivery.com
                    </p>
                    <p className="text-blue-700">
                      <strong className="text-blue-800">Service:</strong> AWS SES (ap-south-1)
                    </p>
                    <p className="text-blue-700">
                      <strong className="text-blue-800">Attachments:</strong> Up to 5 files, 10MB each
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}