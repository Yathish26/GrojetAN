import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function AppControls() {
  const [notificationText, setNotificationText] = useState('');
  const [selectedApps, setSelectedApps] = useState([]);
  const [pushToken, setPushToken] = useState('');
  const [notificationResults, setNotificationResults] = useState(null);

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

    // Validate token format
    if (!pushToken.startsWith('ExponentPushToken[') || !pushToken.endsWith(']')) {
      toast.error('Invalid token format. Token must start with "ExponentPushToken[" and end with "]"');
      return;
    }

    try {
      const response = await fetch('/admin/notifications/send-notification', {
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

      const result = await response.json();

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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">App Controls</h1>
            <p className="text-gray-600">Manage app-wide settings and notifications</p>
          </div>
        </div>

        {/* Push Notifications Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Push Notifications</h2>
          <div className="space-y-4">
            {/* Notification Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Text
              </label>
              <textarea
                value={notificationText}
                onChange={(e) => setNotificationText(e.target.value)}
                placeholder="Enter the notification message..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
            </div>

            {/* Push Token for Testing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Push Token (for testing)
              </label>
              <input
                type="text"
                value={pushToken}
                onChange={(e) => setPushToken(e.target.value)}
                placeholder="ExponentPushToken[your_token_here]"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Copy the complete token from the merchant app alert (includes "ExponentPushToken[" and "]")
              </p>
            </div>

            {/* App Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to Apps
              </label>
              <div className="flex flex-wrap gap-4">
                {['Customer App', 'Merchant App', 'Delivery Agent App'].map((app) => (
                  <label key={app} className="flex items-center cursor-pointer">
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
            <div className="flex justify-end">
              <button
                onClick={handleSendNotification}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>

        {/* Notification Results */}
        {notificationResults && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Notification Results</h2>
              <button
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                Clear Results
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Request Summary</h3>
                <p className="text-sm text-gray-600">
                  <strong>Message:</strong> {notificationResults.message}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> <span className="text-green-600 font-medium">Success</span>
                </p>
              </div>

              {notificationResults.data && notificationResults.data.data && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Delivery Results</h3>
                  <div className="space-y-3">
                    {notificationResults.data.data.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          result.status === 'ok'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-medium ${
                            result.status === 'ok' ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.status === 'ok' ? '✅ Delivered' : '❌ Failed'}
                          </span>
                          <span className="text-xs text-gray-500">
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
                          <div className="mt-2 text-xs text-red-600">
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

        {/* Placeholder for future controls */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Controls</h2>
          <p className="text-gray-600">More app control features coming soon...</p>
        </div>
      </div>
    </Layout>
  );
}
