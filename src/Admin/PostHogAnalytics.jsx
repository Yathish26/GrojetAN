import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ExternalLink, Settings, Info, RefreshCw } from 'lucide-react';
import Layout from '../Components/Layout';

const STORAGE_KEY = 'posthog_dashboard_url';

export default function PostHogAnalytics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [iframeUrl, setIframeUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Load saved dashboard URL on mount
  useEffect(() => {
    const envUrl = import.meta.env.VITE_POSTHOG_DASHBOARD_URL;
    const savedUrl = localStorage.getItem(STORAGE_KEY) || envUrl || '';
    setIframeUrl(savedUrl);
    setInputUrl(savedUrl);
  }, []);

  // Auth check
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setCheckingUser(true);
        const response = await fetch(
          `${import.meta.env.VITE_SERVER}/admin/auth/profile`,
          { credentials: 'include' }
        );
        if (!response.ok) {
          navigate('/login', { replace: true });
          return;
        }
        const data = await response.json();
        if (data.admin) {
          setCurrentUser(data.admin);
        } else {
          navigate('/login', { replace: true });
        }
      } catch {
        navigate('/login', { replace: true });
      } finally {
        setCheckingUser(false);
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  const handleSaveUrl = () => {
    const trimmed = inputUrl.trim();
    setIframeUrl(trimmed);
    localStorage.setItem(STORAGE_KEY, trimmed);
    setShowSetup(false);
    setIframeKey((k) => k + 1); // force iframe reload
  };

  if (checkingUser) {
    return (
      <Layout title="PostHog Analytics">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
        </div>
      </Layout>
    );
  }

  if (!currentUser) return null;

  return (
    <Layout title="PostHog Analytics">
      <div className="p-4 sm:p-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PostHog Analytics</h1>
              <p className="text-sm text-gray-500">
                Live customer behaviour &amp; funnel data from GrojetE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              title="Reload"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
            <button
              onClick={() => setShowSetup((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Configure
            </button>
            <a
              href={`${import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
            >
              <ExternalLink className="h-4 w-4" />
              Open PostHog
            </a>
          </div>
        </div>

        {/* Configure panel */}
        {showSetup && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3 mb-4">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">How to get your PostHog dashboard embed URL:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Log in to <strong>posthog.com</strong></li>
                  <li>Go to <strong>Dashboards</strong> → open any dashboard</li>
                  <li>Click the <strong>Share</strong> button (top-right)</li>
                  <li>Enable <strong>"Share externally"</strong></li>
                  <li>Copy the <strong>Embed URL</strong> and paste it below</li>
                </ol>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://us.posthog.com/shared/..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={handleSaveUrl}
                className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        {iframeUrl ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <iframe
              key={iframeKey}
              src={iframeUrl}
              title="PostHog Dashboard"
              className="w-full"
              style={{ height: 'calc(100vh - 220px)', minHeight: '600px', border: 'none' }}
              allowFullScreen
            />
          </div>
        ) : (
          /* Empty state — walk the admin through setup */
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
            <div className="mx-auto w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              No dashboard configured yet
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              GrojetE is already sending events to PostHog. Embed a shared
              dashboard here so you can see the funnel data without leaving the
              admin panel.
            </p>

            <div className="inline-flex flex-col items-start bg-gray-50 rounded-xl p-5 text-left text-sm text-gray-700 mb-6 gap-2 max-w-md">
              <p className="font-semibold text-gray-800">Events being tracked in GrojetE:</p>
              <ul className="space-y-1 list-disc ml-4">
                <li><code className="bg-gray-100 px-1 rounded">user_logged_in</code> — customer signs in</li>
                <li><code className="bg-gray-100 px-1 rounded">user_registered</code> — new customer signs up</li>
                <li><code className="bg-gray-100 px-1 rounded">xpress_booking_started</code> — opens booking form</li>
                <li><code className="bg-gray-100 px-1 rounded">xpress_step_completed</code> — advances through each step</li>
                <li><code className="bg-gray-100 px-1 rounded">xpress_order_confirmed</code> — order placed successfully</li>
              </ul>
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
              >
                <Settings className="h-4 w-4" />
                Configure Dashboard
              </button>
              <a
                href={`${import.meta.env.VITE_POSTHOG_HOST || 'https://us.posthog.com'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ExternalLink className="h-4 w-4" />
                Open PostHog
              </a>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
