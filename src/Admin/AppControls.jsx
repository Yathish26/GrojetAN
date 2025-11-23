import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function AppControls() {
  const navigate = useNavigate();
  const [notificationText, setNotificationText] = useState('');
  const [selectedApps, setSelectedApps] = useState([]);
  const [pushToken, setPushToken] = useState('');
  const [notificationResults, setNotificationResults] = useState(null);

  // New states for app controls
  const [taxPercentageOnDeliveryFee, setTaxPercentageOnDeliveryFee] = useState(18);
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [smallCartFee, setSmallCartFee] = useState(40);
  const [smallCartThreshold, setSmallCartThreshold] = useState(499);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(499);
  const [cashOnDeliveryEnabled, setCashOnDeliveryEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalValues, setOriginalValues] = useState({});

  // Fetch app controls on component mount
  useEffect(() => {
    fetchAppControls();
  }, []);

  const fetchAppControls = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/app-controls`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const result = await response.json();
      if (result.success) {
        const data = result.data;
        setTaxPercentageOnDeliveryFee(data.taxPercentageOnDeliveryFee || 18);
        setDeliveryFee(data.deliveryFee || 40);
        setSmallCartFee(data.smallCartFee || 40);
        setSmallCartThreshold(data.smallCartThreshold || 499);
        setFreeDeliveryThreshold(data.freeDeliveryThreshold || 499);
        setCashOnDeliveryEnabled(data.cashOnDeliveryEnabled !== undefined ? data.cashOnDeliveryEnabled : true);
        
        // Store original values for cancel functionality
        setOriginalValues({
          taxPercentageOnDeliveryFee: data.taxPercentageOnDeliveryFee || 18,
          deliveryFee: data.deliveryFee || 40,
          smallCartFee: data.smallCartFee || 40,
          smallCartThreshold: data.smallCartThreshold || 499,
          freeDeliveryThreshold: data.freeDeliveryThreshold || 499,
          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled !== undefined ? data.cashOnDeliveryEnabled : true,
        });
      }
    } catch (error) {
      console.error('Error fetching app controls:', error);
      toast.error('Failed to load app controls');
    }
  };

  const handleEdit = () => {
    // Store current values as original before editing
    setOriginalValues({
      taxPercentageOnDeliveryFee,
      deliveryFee,
      smallCartFee,
      smallCartThreshold,
      freeDeliveryThreshold,
      cashOnDeliveryEnabled,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Restore original values
    setTaxPercentageOnDeliveryFee(originalValues.taxPercentageOnDeliveryFee);
    setDeliveryFee(originalValues.deliveryFee);
    setSmallCartFee(originalValues.smallCartFee);
    setSmallCartThreshold(originalValues.smallCartThreshold);
    setFreeDeliveryThreshold(originalValues.freeDeliveryThreshold);
    setCashOnDeliveryEnabled(originalValues.cashOnDeliveryEnabled);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const success = await handleUpdateAppControls();
    if (success) {
      setIsEditing(false);
    }
  };

  const handleUpdateAppControls = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/app-controls`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          taxPercentageOnDeliveryFee: parseFloat(taxPercentageOnDeliveryFee),
          deliveryFee: parseFloat(deliveryFee),
          smallCartFee: parseFloat(smallCartFee),
          smallCartThreshold: parseFloat(smallCartThreshold),
          freeDeliveryThreshold: parseFloat(freeDeliveryThreshold),
          cashOnDeliveryEnabled: cashOnDeliveryEnabled,
        }),
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast.success('App controls updated successfully');
        // Update original values after successful save
        setOriginalValues({
          taxPercentageOnDeliveryFee: parseFloat(taxPercentageOnDeliveryFee),
          deliveryFee: parseFloat(deliveryFee),
          smallCartFee: parseFloat(smallCartFee),
          smallCartThreshold: parseFloat(smallCartThreshold),
          freeDeliveryThreshold: parseFloat(freeDeliveryThreshold),
          cashOnDeliveryEnabled: cashOnDeliveryEnabled,
        });
        return true;
      } else {
        toast.error(result.message || 'Failed to update app controls');
        return false;
      }
    } catch (error) {
      console.error('Error updating app controls:', error);
      toast.error('Failed to update app controls');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setNotificationResults(null);
    setNotificationText('');
    setSelectedApps([]);
    setPushToken('');
  };

  const handleSendNotification = async () => {
    if (!notificationText.trim()) {
      toast.error('Please enter notification text');
      return;
    }
    if (selectedApps.length === 0) {
      toast.error('Please select at least one app to send to');
      return;
    }
    if (!pushToken.trim()) {
      toast.error('Please enter push token for testing');
      return;
    }

    // Validate token format - allow both Expo and FCM tokens
    const isExpoToken = pushToken.startsWith('ExponentPushToken[') && pushToken.endsWith(']');
    const isFCMToken = pushToken.length > 100 && /^[a-zA-Z0-9_:-]+$/.test(pushToken); // FCM tokens are long alphanumeric strings with possible colons
    
    if (!isExpoToken && !isFCMToken) {
      toast.error('Invalid token format. Token must be a valid Expo push token or FCM registration token');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/notifications/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: notificationText,
          appType: selectedApps.join(', '), // or handle multiple
          pushToken: pushToken,
        }),
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const result = await response.json();
      if (result.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

      if (result.success) {
        setNotificationResults(result);
        toast.success(`Notification request sent to ${selectedApps.join(', ')}`);
        // Don't clear the form immediately, let user see results
      } else {
        toast.error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  return (
    <Layout title="App Controls">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">App Controls</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage app-wide settings and notifications</p>
          </div>
        </div>

        {/* Push Notifications Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Push Notifications</h2>
          <div className="space-y-4">
            {/* Notification Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Text
              </label>
              <textarea
              maxLength={500}
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Enter the notification message..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
              />
            </div>

            {/* Push Token for Testing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Push Token (for testing)
              </label>
              <input
                type="text"
                maxLength={200}
                value={pushToken}
                onChange={(e) => setPushToken(e.target.value)}
                placeholder="ExponentPushToken[your_token_here] or FCM token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter Expo push token (starts with "ExponentPushToken[") or Android FCM registration token.
                <br />
                <strong>Note:</strong> FCM tokens must match the selected app's Firebase project to avoid sender ID mismatch errors.
              </p>
            </div>

            {/* App Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to Apps
              </label>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                {['Customer App', 'Merchant App', 'Delivery Agent App'].map((app) => (
                  <label key={app} className="flex items-center cursor-pointer p-2 sm:p-0 border sm:border-0 border-gray-200 rounded-lg sm:rounded-none">
                    <input
                      type="checkbox"
                      checked={selectedApps.includes(app)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setSelectedApps(prev =>
                          isChecked
                            ? [...prev, app]
                            : prev.filter(a => a !== app)
                        );
                      }}
                      className="mr-2 text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{app}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSendNotification}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>

        {/* Notification Results */}
        {notificationResults && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Notification Results</h2>
              <button
                onClick={clearResults}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Results
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Request Summary</h3>
                <p className="text-sm text-gray-600">
                  <strong>Message:</strong> {notificationResults.message}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> <span className="text-green-600 font-medium">Success</span>
                </p>
              </div>

              {notificationResults.data && notificationResults.data.data && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Delivery Results</h3>
                  <div className="space-y-3">
                    {notificationResults.data.data.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 sm:p-4 rounded-lg border ${
                          result.status === 'ok'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className={`font-medium text-sm sm:text-base ${
                            result.status === 'ok' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.status === 'ok' ? '✅ Delivered' : '❌ Failed'}
                          </span>
                          <span className="text-xs text-gray-500 break-all">
                            Token: {result.details?.expoPushToken || 'N/A'}
                          </span>
                        </div>

                        {result.message && (
                          <p className={`text-sm ${
                            result.status === 'ok' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {result.message}
                          </p>
                        )}

                        {result.details && result.details.error && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <strong>Error:</strong> {result.details.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* App Controls Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Checkout Controls</h2>
          <div className="space-y-4">
            {/* Tax Percentage on Delivery Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Percentage on Delivery Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxPercentageOnDeliveryFee}
                onChange={(e) => setTaxPercentageOnDeliveryFee(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                This percentage will be applied as tax on the delivery fee.
              </p>
            </div>

            {/* Delivery Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Base delivery fee amount.
              </p>
            </div>

            {/* Small Cart Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Small Cart Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={smallCartFee}
                onChange={(e) => setSmallCartFee(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Delivery fee for carts below the threshold.
              </p>
            </div>

            {/* Small Cart Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Small Cart Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={smallCartThreshold}
                onChange={(e) => setSmallCartThreshold(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum cart value for small cart fee.
              </p>
            </div>

            {/* Free Delivery Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum cart value for free delivery.
              </p>
            </div>

            {/* Cash on Delivery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash on Delivery
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isEditing && setCashOnDeliveryEnabled(!cashOnDeliveryEnabled)}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    cashOnDeliveryEnabled ? 'bg-green-600' : 'bg-gray-200'
                  } ${!isEditing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      cashOnDeliveryEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-700">
                  {cashOnDeliveryEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Allow customers to pay with cash on delivery.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Edit Controls
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
