import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function AppControls() {
  const [notificationText, setNotificationText] = useState('');
  const [selectedApps, setSelectedApps] = useState([]);
  const [pushToken, setPushToken] = useState('');

  const handleAppSelection = (app) => {
    setSelectedApps(prev =>
      prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]
    );
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

    try {
      const response = await fetch('/admin/notifications/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: notificationText,
          appType: selectedApps.join(', '), // or handle multiple
          pushToken: pushToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Notification sent to ${selectedApps.join(', ')}: "${notificationText}"`);
        setNotificationText('');
        setSelectedApps([]);
        setPushToken('');
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
                placeholder="Enter the Expo push token from the merchant app"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* App Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to Apps
              </label>
              <div className="flex flex-wrap gap-4">
                {['Customer App', 'Merchant App', 'Delivery Agent App'].map((app) => (
                  <label key={app} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedApps.includes(app)}
                      onChange={() => handleAppSelection(app)}
                      className="mr-2 text-green-600 focus:ring-green-500"
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

        {/* Placeholder for future controls */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Other Controls</h2>
          <p className="text-gray-600">More app control features coming soon...</p>
        </div>
      </div>
    </Layout>
  );
}
