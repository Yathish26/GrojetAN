import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout.jsx';
import { CheckSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { VERSION } from '../../version.js';

export default function AutoAssign() {
  const [loading, setLoading] = useState(false);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [agents, setAgents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Reusable fetch functions
  const fetchAutoAssignStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/app-controls`, {
        method: 'GET',
        headers: {
          'x-admin-version': VERSION,
        },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAutoAssignEnabled(data.data.autoAssignEnabled?.value ?? true);
        if (data.data.autoAssignEnabled?.updatedBy) {
          setLastUpdatedBy(data.data.autoAssignEnabled.updatedBy);
        }
        if (data.data.autoAssignEnabled?.updatedAt) {
          setLastUpdatedAt(new Date(data.data.autoAssignEnabled.updatedAt));
        }
      } else {
        toast.error('Failed to fetch auto-assign status');
      }
    } catch (error) {
      console.error('Error fetching auto-assign status:', error);
      toast.error('Failed to fetch auto-assign status');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/auto-assign/agents`, {
        method: 'GET',
        headers: {
          'x-admin-version': VERSION,
        },
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAgents(data.data);
      } else {
        toast.error('Failed to fetch delivery agents');
      }
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
      toast.error('Failed to fetch delivery agents');
    }
  };

  // Combined initial fetch
  useEffect(() => {
    fetchAutoAssignStatus();
    fetchAgents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAutoAssignStatus(), fetchAgents()]);
      toast.success('Refreshed');
    } catch (err) {
      // errors handled in individual functions
    } finally {
      setRefreshing(false);
    }
  };

  const toggleGlobalAutoAssign = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/auto-assign/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: !autoAssignEnabled }),
      });

      const data = await response.json();

      if (data.success) {
        setAutoAssignEnabled(!autoAssignEnabled);
        toast.success(`Auto-assign ${!autoAssignEnabled ? 'enabled' : 'disabled'} globally`);
        
        // Update the admin info if returned
        if (data.data?.autoAssignEnabled) {
          if (data.data.autoAssignEnabled.updatedBy) {
            setLastUpdatedBy(data.data.autoAssignEnabled.updatedBy);
          }
          if (data.data.autoAssignEnabled.updatedAt) {
            setLastUpdatedAt(new Date(data.data.autoAssignEnabled.updatedAt));
          }
        }
      } else {
        toast.error(data.message || 'Failed to update auto-assign settings');
      }
    } catch (error) {
      console.error('Error updating auto-assign:', error);
      toast.error('Failed to update auto-assign settings');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout title="Auto Assign">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Auto Assign">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckSquare className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Auto Assignment</h1>
              <p className="text-gray-600">Control automatic order assignment</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Auto Assign</h3>
              <p className="text-sm text-gray-600">
                {autoAssignEnabled ? 'Orders will be automatically assigned to agents' : 'Orders will not be automatically assigned'}
              </p>
            </div>
            <button
              onClick={toggleGlobalAutoAssign}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                autoAssignEnabled ? 'bg-blue-600' : 'bg-gray-200'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoAssignEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Status: <span className={`font-medium ${autoAssignEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {autoAssignEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </p>
            {lastUpdatedBy && lastUpdatedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Last updated by {lastUpdatedBy.name || lastUpdatedBy.email || 'Unknown Admin'} on {lastUpdatedAt.toLocaleString()}
              </p>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Agents with Auto Assign Enabled</h3>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className="w-4 h-4" />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {agents.length === 0 ? (
              <p className="text-sm text-gray-500">No agents currently have auto-assign enabled.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {agents.map(agent => (
                  <li key={agent._id} className="py-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{agent.personalInfo?.firstName} {agent.personalInfo?.lastName}</span>
                      <span className="text-xs text-gray-500">{agent.personalInfo?.phone}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      agent.status?.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${agent.status?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {agent.status?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}