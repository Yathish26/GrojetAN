import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Smartphone, 
  Eye, 
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  CircleCheck,
  Info,
  Truck,
  DollarSign,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    general: {
      appName: 'Grojet Admin',
      appVersion: '1.0.0',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      currency: 'INR'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      orderAlerts: true,
      deliveryAlerts: true,
      lowStockAlerts: true,
      newUserAlerts: false
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordExpiry: 90,
      twoFactorRequired: false
    },
    delivery: {
      defaultDeliveryFee: 50,
      freeDeliveryThreshold: 500,
      maxDeliveryRadius: 10,
      avgDeliveryTime: 30,
      peakHourMultiplier: 1.5
    },
    payment: {
      allowCOD: true,
      allowOnlinePayment: true,
      autoRefundEnabled: true,
      refundProcessingDays: 7
    },
    faq: {
      website: [],
      mobileApp: [],
      merchantApp: [],
      deliveryAgentApp: []
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      autoBackup: true,
      backupRetention: 30
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

  const [activeTab, setActiveTab] = useState('general');
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
    fetchSettings();
    fetchTerms();
    fetchPrivacy();
    fetchSupport();
    fetchFaq();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/settings`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings({...settings, ...data.settings});
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/terms`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
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
      
      if (response.ok) {
        const data = await response.json();
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

      if (response.ok) {
        const data = await response.json();
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
      
      if (response.ok) {
        const data = await response.json();
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

      if (!response.ok) {
        throw new Error('Failed to save terms');
      }

      const data = await response.json();
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

      if (!response.ok) {
        throw new Error('Failed to save privacy policy');
      }

      const data = await response.json();
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

      if (!response.ok) {
        throw new Error('Failed to save support settings');
      }

      const data = await response.json();
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
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'payment', label: 'Payment', icon: DollarSign },
    { id: 'faq', label: 'FAQ Management', icon: Info },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
    { id: 'support', label: 'Support & Contact', icon: Smartphone }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
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
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
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
            {activeTab === 'general' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    General Settings
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Application Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.appName}
                        onChange={(e) => updateSetting('general', 'appName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Format
                      </label>
                      <select
                        value={settings.general.dateFormat}
                        onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification Settings
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="15"
                        max="480"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="3"
                        max="10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Expiry (days)
                      </label>
                      <input
                        type="number"
                        value={settings.security.passwordExpiry}
                        onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="30"
                        max="365"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Require 2FA for all admin accounts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorRequired}
                        onChange={(e) => updateSetting('security', 'twoFactorRequired', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Settings */}
            {activeTab === 'delivery' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Settings
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.delivery.defaultDeliveryFee}
                        onChange={(e) => updateSetting('delivery', 'defaultDeliveryFee', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Free Delivery Threshold (₹)
                      </label>
                      <input
                        type="number"
                        value={settings.delivery.freeDeliveryThreshold}
                        onChange={(e) => updateSetting('delivery', 'freeDeliveryThreshold', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Delivery Radius (km)
                      </label>
                      <input
                        type="number"
                        value={settings.delivery.maxDeliveryRadius}
                        onChange={(e) => updateSetting('delivery', 'maxDeliveryRadius', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="1"
                        max="50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Average Delivery Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.delivery.avgDeliveryTime}
                        onChange={(e) => updateSetting('delivery', 'avgDeliveryTime', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="10"
                        max="120"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment Settings
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {Object.entries(settings.payment).filter(([key]) => typeof settings.payment[key] === 'boolean').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {getPaymentDescription(key)}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSetting('payment', key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Refund Processing Days
                      </label>
                      <input
                        type="number"
                        value={settings.payment.refundProcessingDays}
                        onChange={(e) => updateSetting('payment', 'refundProcessingDays', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="1"
                        max="30"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ Management */}
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
                  <div className="border border-gray-200 rounded-lg p-6">
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
                  <div className="border border-gray-200 rounded-lg p-6">
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
                  <div className="border border-gray-200 rounded-lg p-6">
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
                  <div className="border border-gray-200 rounded-lg p-6">
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

            {/* System Settings */}
            {activeTab === 'system' && (
              <div>
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    System Settings
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-800">Maintenance Mode</h3>
                        <p className="text-sm text-gray-600">Put the system in maintenance mode</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.maintenanceMode}
                          onChange={(e) => updateSetting('system', 'maintenanceMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-800">Debug Mode</h3>
                        <p className="text-sm text-gray-600">Enable detailed error logging</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.debugMode}
                          onChange={(e) => updateSetting('system', 'debugMode', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-800">Auto Backup</h3>
                        <p className="text-sm text-gray-600">Automatically backup data daily</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.system.autoBackup}
                          onChange={(e) => updateSetting('system', 'autoBackup', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Backup Retention (days)
                    </label>
                    <input
                      type="number"
                      value={settings.system.backupRetention}
                      onChange={(e) => updateSetting('system', 'backupRetention', parseInt(e.target.value))}
                      className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      min="7"
                      max="365"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
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
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-800">Website Terms</h3>
                      <button
                        onClick={() => setTermsEdit({ ...termsEdit, website: !termsEdit.website })}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                      >
                        {termsEdit.website ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {termsEdit.website ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg">
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
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setTermsEdit({ ...termsEdit, website: false })}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
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
                  <div className="border border-gray-200 rounded-lg p-4">
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
                          onChange={(e) => updateSetting('support', 'app', { ...settings.support.app, number: e.target.value })}
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
                          value={settings.support.merchant.number}
                          onChange={(e) => updateSetting('support', 'merchant', { ...settings.support.merchant, number: e.target.value })}
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
                          onChange={(e) => updateSetting('support', 'delivery', { ...settings.support.delivery, number: e.target.value })}
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
        <div key={faq.id} className="border border-gray-200 rounded-lg p-4">
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
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter question"
          />
          <textarea
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

function getNotificationDescription(key) {
  const descriptions = {
    emailNotifications: 'Receive email notifications for important events',
    pushNotifications: 'Receive browser push notifications',
    orderAlerts: 'Get notified when new orders are placed',
    deliveryAlerts: 'Get notified about delivery status changes',
    lowStockAlerts: 'Get notified when product stock is low',
    newUserAlerts: 'Get notified when new users register'
  };
  return descriptions[key] || '';
}

function getPaymentDescription(key) {
  const descriptions = {
    allowCOD: 'Allow customers to pay cash on delivery',
    allowOnlinePayment: 'Allow customers to pay online',
    autoRefundEnabled: 'Automatically process refunds',
  };
  return descriptions[key] || '';
}
