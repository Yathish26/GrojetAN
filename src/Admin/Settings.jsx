import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Smartphone, 
  Info,
  FileText,
  Download,
  Save,
  Globe,
  Truck,
  MapPin,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    faq: {
      website: [],
      mobileApp: [],
      merchantApp: [],
      deliveryAgentApp: []
    },
    support: {
      app: {
        link: '',
        email: '',
        number: ''
      },
      merchant: {
        link: '',
        email: '',
        number: ''
      },
      delivery: {
        link: '',
        email: '',
        number: ''
      },
      whatsappLink: ''
    },
    terms: {
      website: {
        content: '',
        lastUpdated: null
      },
      mobileApp: {
        content: '',
        lastUpdated: null
      },
      merchantApp: {
        content: '',
        lastUpdated: null
      },
      deliveryAgentApp: {
        content: '',
        lastUpdated: null
      }
    },
    privacy: {
      website: {
        content: '',
        lastUpdated: null
      },
      mobileApp: {
        content: '',
        lastUpdated: null
      },
      merchantApp: {
        content: '',
        lastUpdated: null
      },
      deliveryAgentApp: {
        content: '',
        lastUpdated: null
      }
    }
  });

  const [activeTab, setActiveTab] = useState('faq');
  const [saving, setSaving] = useState(false);
  const [termsEdit, setTermsEdit] = useState({
    website: false,
    mobileApp: false,
    merchantApp: false,
    deliveryAgentApp: false
  });
  const [privacyEdit, setPrivacyEdit] = useState({
    website: false,
    mobileApp: false,
    merchantApp: false,
    deliveryAgentApp: false
  });

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
  ];

  useEffect(() => {
    fetchTerms();
    fetchPrivacy();
    fetchSupport();
    fetchFaq();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/terms`, {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
        }
        setSettings(prev => ({
          ...prev,
          terms: data.terms || {
            website: { content: '', lastUpdated: null },
            mobileApp: { content: '', lastUpdated: null },
            merchantApp: { content: '', lastUpdated: null },
            deliveryAgentApp: { content: '', lastUpdated: null }
          }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch terms:', err);
    }
  };

  const fetchPrivacy = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/privacy`, {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
        }
        setSettings(prev => ({
          ...prev,
          privacy: data.privacy || {
            website: { content: '', lastUpdated: null },
            mobileApp: { content: '', lastUpdated: null },
            merchantApp: { content: '', lastUpdated: null },
            deliveryAgentApp: { content: '', lastUpdated: null }
          }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch privacy:', err);
    }
  };

  const fetchSupport = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/support`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
        }
        setSettings(prev => ({
          ...prev,
          support: data.support || {
            app: { link: '', email: '', number: '' },
            merchant: { link: '', email: '', number: '' },
            delivery: { link: '', email: '', number: '' },
            whatsappLink: ''
          }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch support settings:', err);
    }
  };

  const fetchFaq = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/faq`, {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
            navigate('/login', { replace: true });
            return;
        }
        setSettings(prev => ({
          ...prev,
          faq: data.faq || {
            website: [],
            mobileApp: [],
            merchantApp: [],
            deliveryAgentApp: []
          }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch FAQ:', err);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => {
      if (section === 'support' && typeof value === 'object' && value !== null) {
        // Handle nested support objects
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [key]: value
          }
        };
      } else {
        // Handle regular updates
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [key]: value
          }
        };
      }
    });
  };

  const handleSaveTerms = async (appType) => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/terms/${appType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: settings.terms[appType].content
        })
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save terms');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
      }
      setSettings(prev => ({
        ...prev,
        terms: {
          ...prev.terms,
          [appType]: {
            ...prev.terms[appType],
            lastUpdated: data.lastUpdated
          }
        }
      }));
      setTermsEdit(prev => ({ ...prev, [appType]: false }));
      toast.success(`${appType} terms saved successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to save terms');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async (appType) => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/privacy/${appType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: settings.privacy[appType].content
        })
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save privacy policy');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
      }
      setSettings(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          [appType]: {
            ...prev.privacy[appType],
            lastUpdated: data.lastUpdated
          }
        }
      }));
      setPrivacyEdit(prev => ({ ...prev, [appType]: false }));
      toast.success(`${appType} privacy policy saved successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to save privacy policy');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSupport = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/support/support`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings.support)
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save support settings');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
      }
      setSettings(prev => ({
        ...prev,
        support: data.support
      }));
      toast.success('Support settings saved successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to save support settings');
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grojet-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  };

  const tabs = [
    { id: 'faq', label: 'FAQ Management', icon: Info },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'support', label: 'Support & Contact', icon: Smartphone }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
          <p className="text-gray-600">Configure your admin panel preferences and system behavior</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportSettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-none hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-none text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* General Settings */}

            {activeTab === 'faq' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    FAQ Management
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage frequently asked questions for different applications
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Website FAQ */}
                  <div className="border border-gray-200 rounded-none p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Website FAQ
                    </h3>
                    <FaqManager
                      faqs={settings.faq.website}
                      onUpdate={(faqs) => setSettings(prev => ({
                        ...prev,
                        faq: { ...prev.faq, website: faqs }
                      }))}
                      appType="website"
                    />
                  </div>

                  {/* Mobile App FAQ */}
                  <div className="border border-gray-200 rounded-none p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      Mobile App FAQ
                    </h3>
                    <FaqManager
                      faqs={settings.faq.mobileApp}
                      onUpdate={(faqs) => setSettings(prev => ({
                        ...prev,
                        faq: { ...prev.faq, mobileApp: faqs }
                      }))}
                      appType="mobileApp"
                    />
                  </div>

                  {/* Merchant App FAQ */}
                  <div className="border border-gray-200 rounded-none p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-purple-600" />
                      Merchant App FAQ
                    </h3>
                    <FaqManager
                      faqs={settings.faq.merchantApp}
                      onUpdate={(faqs) => setSettings(prev => ({
                        ...prev,
                        faq: { ...prev.faq, merchantApp: faqs }
                      }))}
                      appType="merchantApp"
                    />
                  </div>

                  {/* Delivery Agent App FAQ */}
                  <div className="border border-gray-200 rounded-none p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      Delivery Agent App FAQ
                    </h3>
                    <FaqManager
                      faqs={settings.faq.deliveryAgentApp}
                      onUpdate={(faqs) => setSettings(prev => ({
                        ...prev,
                        faq: { ...prev.faq, deliveryAgentApp: faqs }
                      }))}
                      appType="deliveryAgentApp"
                    />
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'terms' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Terms & Conditions
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage terms and conditions for different applications
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Website Terms */}
                  <div className="border border-gray-200 rounded-none p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Website Terms</h3>
                      <button
                        onClick={() => setTermsEdit({ ...termsEdit, website: !termsEdit.website })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-none hover:bg-green-200"
                      >
                        {termsEdit.website ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {termsEdit.website ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-none">
                          <ReactQuill
                            value={settings.terms.website.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              terms: {
                                ...prev.terms,
                                website: { ...prev.terms.website, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter website terms and conditions..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTerms('website')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-none hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setTermsEdit({ ...termsEdit, website: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-none hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.terms.website.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.terms.website.content }} />
                        ) : (
                          'No terms set for website'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.terms.website.lastUpdated || 'Never'}
                    </div>
                  </div>

                  {/* Mobile App Terms */}
                  <div className="border border-gray-200 rounded-none p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Mobile App Terms</h3>
                      <button
                        onClick={() => setTermsEdit({ ...termsEdit, mobileApp: !termsEdit.mobileApp })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {termsEdit.mobileApp ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {termsEdit.mobileApp ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.terms.mobileApp.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              terms: {
                                ...prev.terms,
                                mobileApp: { ...prev.terms.mobileApp, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter mobile app terms and conditions..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTerms('mobileApp')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setTermsEdit({ ...termsEdit, mobileApp: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.terms.mobileApp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.terms.mobileApp.content }} />
                        ) : (
                          'No terms set for mobile app'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.terms.mobileApp.lastUpdated || 'Never'}
                    </div>
                  </div>

                  {/* Merchant App Terms */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Merchant App Terms</h3>
                      <button
                        onClick={() => setTermsEdit({ ...termsEdit, merchantApp: !termsEdit.merchantApp })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {termsEdit.merchantApp ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {termsEdit.merchantApp ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.terms.merchantApp.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              terms: {
                                ...prev.terms,
                                merchantApp: { ...prev.terms.merchantApp, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter merchant app terms and conditions..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTerms('merchantApp')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setTermsEdit({ ...termsEdit, merchantApp: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.terms.merchantApp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.terms.merchantApp.content }} />
                        ) : (
                          'No terms set for merchant app'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.terms.merchantApp.lastUpdated || 'Never'}
                    </div>
                  </div>

                  {/* Delivery Agent App Terms */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Delivery Agent App Terms</h3>
                      <button
                        onClick={() => setTermsEdit({ ...termsEdit, deliveryAgentApp: !termsEdit.deliveryAgentApp })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {termsEdit.deliveryAgentApp ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {termsEdit.deliveryAgentApp ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.terms.deliveryAgentApp.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              terms: {
                                ...prev.terms,
                                deliveryAgentApp: { ...prev.terms.deliveryAgentApp, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter delivery agent app terms and conditions..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTerms('deliveryAgentApp')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setTermsEdit({ ...termsEdit, deliveryAgentApp: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.terms.deliveryAgentApp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.terms.deliveryAgentApp.content }} />
                        ) : (
                          'No terms set for delivery agent app'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.terms.deliveryAgentApp.lastUpdated || 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Policy */}
            {activeTab === 'privacy' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy Policy
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage privacy policies for different applications
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Website Privacy */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Website Privacy Policy</h3>
                      <button
                        onClick={() => setPrivacyEdit({ ...privacyEdit, website: !privacyEdit.website })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {privacyEdit.website ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {privacyEdit.website ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.privacy.website.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                website: { ...prev.privacy.website, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter website privacy policy..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePrivacy('website')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setPrivacyEdit({ ...privacyEdit, website: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.privacy.website.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.privacy.website.content }} />
                        ) : (
                          'No privacy policy set for website'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.privacy.website.lastUpdated || 'Never'}
                    </div>
                  </div>

                  {/* Mobile App Privacy */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Mobile App Privacy Policy</h3>
                      <button
                        onClick={() => setPrivacyEdit({ ...privacyEdit, mobileApp: !privacyEdit.mobileApp })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {privacyEdit.mobileApp ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {privacyEdit.mobileApp ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.privacy.mobileApp.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                mobileApp: { ...prev.privacy.mobileApp, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter mobile app privacy policy..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePrivacy('mobileApp')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setPrivacyEdit({ ...privacyEdit, mobileApp: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.privacy.mobileApp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.privacy.mobileApp.content }} />
                        ) : (
                          'No privacy policy set for mobile app'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.privacy.mobileApp.lastUpdated || 'Never'}
                    </div>
                  </div>

                  {/* Merchant App Privacy */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Merchant App Privacy Policy</h3>
                      <button
                        onClick={() => setPrivacyEdit({ ...privacyEdit, merchantApp: !privacyEdit.merchantApp })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {privacyEdit.merchantApp ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {privacyEdit.merchantApp ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.privacy.merchantApp.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                merchantApp: { ...prev.privacy.merchantApp, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter merchant app privacy policy..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePrivacy('merchantApp')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setPrivacyEdit({ ...privacyEdit, merchantApp: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.privacy.merchantApp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.privacy.merchantApp.content }} />
                        ) : (
                          'No privacy policy set for merchant app'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.privacy.merchantApp.lastUpdated || 'Never'}
                    </div>
                  </div>

                  {/* Delivery Agent App Privacy */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Delivery Agent App Privacy Policy</h3>
                      <button
                        onClick={() => setPrivacyEdit({ ...privacyEdit, deliveryAgentApp: !privacyEdit.deliveryAgentApp })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {privacyEdit.deliveryAgentApp ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {privacyEdit.deliveryAgentApp ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
                          <ReactQuill
                            value={settings.privacy.deliveryAgentApp.content}
                            onChange={(content) => setSettings(prev => ({
                              ...prev,
                              privacy: {
                                ...prev.privacy,
                                deliveryAgentApp: { ...prev.privacy.deliveryAgentApp, content }
                              }
                            }))}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Enter delivery agent app privacy policy..."
                            style={{ minHeight: '200px' }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePrivacy('deliveryAgentApp')}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setPrivacyEdit({ ...privacyEdit, deliveryAgentApp: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        {settings.privacy.deliveryAgentApp.content ? (
                          <div dangerouslySetInnerHTML={{ __html: settings.privacy.deliveryAgentApp.content }} />
                        ) : (
                          'No privacy policy set for delivery agent app'
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Last updated: {settings.privacy.deliveryAgentApp.lastUpdated || 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Support & Contact Settings */}
            {activeTab === 'support' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    Support & Contact Information
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Configure support links, email, phone numbers, and WhatsApp contact</p>
                </div>

                <div className="p-6 space-y-8">
                  {/* App Support Section */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      App Support
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link
                        </label>
                        <input
                          type="url"
                          value={settings.support.app.link}
                          onChange={(e) => updateSetting('support', 'app', { ...settings.support.app, link: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://support.grojet.com/app"
                        />
                        <p className="text-xs text-gray-500 mt-1">Support portal link for app users</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.support.app.email}
                          onChange={(e) => updateSetting('support', 'app', { ...settings.support.app, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="app.support@grojet.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email for app user support</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number
                        </label>
                        <input
                          type="tel"
                          value={settings.support.app.number}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^0-9+]/g, '');
                            updateSetting('support', 'app', { ...settings.support.app, number: sanitizedValue });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+91 9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Phone number for app user support</p>
                      </div>
                    </div>
                  </div>

                  {/* Merchant Support Section */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      Merchant Support
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link
                        </label>
                        <input
                          type="url"
                          value={settings.support.merchant.link}
                          onChange={(e) => updateSetting('support', 'merchant', { ...settings.support.merchant, link: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://support.grojet.com/merchant"
                        />
                        <p className="text-xs text-gray-500 mt-1">Support portal link for merchants</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.support.merchant.email}
                          onChange={(e) => updateSetting('support', 'merchant', { ...settings.support.merchant, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="merchant.support@grojet.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email for merchant support</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={settings.support.merchant.number}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^0-9+]/g, '');
                            updateSetting('support', 'merchant', { ...settings.support.merchant, number: sanitizedValue });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+91 9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Phone number for merchant support</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Support Section */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      Delivery Support
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Link
                        </label>
                        <input
                          type="url"
                          value={settings.support.delivery.link}
                          onChange={(e) => updateSetting('support', 'delivery', { ...settings.support.delivery, link: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="https://support.grojet.com/delivery"
                        />
                        <p className="text-xs text-gray-500 mt-1">Support portal link for delivery agents</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.support.delivery.email}
                          onChange={(e) => updateSetting('support', 'delivery', { ...settings.support.delivery, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="delivery.support@grojet.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email for delivery agent support</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number
                        </label>
                        <input
                          type="tel"
                          value={settings.support.delivery.number}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value.replace(/[^0-9+]/g, '');
                            updateSetting('support', 'delivery', { ...settings.support.delivery, number: sanitizedValue });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="+91 9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-1">Phone number for delivery agent support</p>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Support Link
                    </label>
                    <input
                      type="url"
                      value={settings.support.whatsappLink}
                      onChange={(e) => updateSetting('support', 'whatsappLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://wa.me/919876543210"
                    />
                    <p className="text-xs text-gray-500 mt-1">Direct WhatsApp link for instant support</p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveSupport}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Support Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqManager({ faqs, onUpdate, appType }) {
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingQuestion, setEditingQuestion] = useState('');
  const [editingAnswer, setEditingAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }

    const newFaq = {
      id: Date.now(),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      createdAt: new Date().toISOString()
    };

    onUpdate([...faqs, newFaq]);
    setNewQuestion('');
    setNewAnswer('');
    toast.success('FAQ added successfully');
  };

  const handleEditFaq = (index) => {
    const faq = faqs[index];
    setEditingQuestion(faq.question);
    setEditingAnswer(faq.answer);
    setEditingIndex(index);
  };

  const handleSaveEdit = (index) => {
    if (!editingQuestion.trim() || !editingAnswer.trim()) {
      toast.error('Please fill in both question and answer');
      return;
    }

    const updatedFaqs = [...faqs];
    updatedFaqs[index] = {
      ...updatedFaqs[index],
      question: editingQuestion.trim(),
      answer: editingAnswer.trim(),
      updatedAt: new Date().toISOString()
    };
    onUpdate(updatedFaqs);
    setEditingIndex(-1);
    setEditingQuestion('');
    setEditingAnswer('');
    toast.success('FAQ updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setEditingQuestion('');
    setEditingAnswer('');
  };

  const handleDeleteFaq = (index) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    onUpdate(updatedFaqs);
    toast.success('FAQ deleted successfully');
  };

  const handleSaveFaqs = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/faq/${appType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ faqs })
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to save FAQs');
      }

      toast.success(`${appType} FAQs saved successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to save FAQs');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing FAQs */}
      {faqs.map((faq, index) => (
        <div key={faq.id || `faq-${index}`} className="border border-gray-200 rounded-lg p-4">
          {editingIndex === index ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editingQuestion}
                onChange={(e) => setEditingQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Question"
              />
              <textarea
                value={editingAnswer}
                onChange={(e) => setEditingAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows="3"
                placeholder="Answer"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(index)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 mb-2">{faq.question}</h4>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditFaq(index)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(index)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New FAQ */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Add New FAQ</h4>
        <div className="space-y-3">
          <input
            type="text"
            maxLength={100}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter question"
          />
          <textarea
          maxLength={500}
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows="3"
            placeholder="Enter answer"
          />
          <button
            onClick={handleAddFaq}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add FAQ
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSaveFaqs}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save FAQs'}
        </button>
      </div>
    </div>
  );
}
