import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';
import {
  MapPin, Truck, Navigation, RefreshCw,
  CircleCheck, Clock, Star, Phone, ArrowLeft, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWebSocket } from '../context/WebSocketContext';
import Layout from '../Components/Layout';

const RidersZone = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin', 'operations', 'delivery_manager'];
  const navigate = useNavigate();

  // Use WebSocket for real-time location updates
  const { agentLocations, isConnected } = useWebSocket();

  const fetchCurrentUser = useCallback(async () => {
    try {
      setCheckingUser(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
      if (response.status === 401) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
      const data = await response.json();
      if (data.tokenValid === false) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
      if (response.ok && data.admin) {
        setCurrentUser(data.admin);
      } else {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  const isAuthorized = currentUser && allowedRoles.includes(currentUser.role);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SERVER}/admin/delivery-agents/riders-zone/agents`,
        { credentials: 'include' }
      );

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (data.success) {
        setAgents(data.agents);
      } else {
        toast.error('Failed to load delivery agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load delivery agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchAgents();
    }
  }, [isAuthorized]);

  const sendAlert = async (agentId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/send-alert/${agentId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Alert sent to the agent');
      } else {
        toast.error(data.message || 'Failed to send alert');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    }
  };

  const getVehicleIcon = (vehicleType) => {
    return <img src="/assets/bikerider.png" alt="Bike" className="w-6 h-6 object-contain" />;
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? '#10B981' : '#6B7280';
  };

  const getStatusText = (isOnline) => {
    return isOnline ? 'Online' : 'Offline';
  };

  const getAgentLabel = (agentId) => {
    const agent = agents.find(a => a.agentId === agentId);
    if (!agent) return agentId;
    return agent.name || agentId;
  };

  const calculateCenter = () => {
    const liveLocations = Object.values(agentLocations);

    if (liveLocations.length === 0) {
      // Default center (can be changed to your city coordinates)
      return { lat: 12.9141, lng: 74.8560 }; // Mangalore coordinates as default
    }

    const avgLat = liveLocations.reduce((sum, location) => sum + location.latitude, 0) / liveLocations.length;
    const avgLng = liveLocations.reduce((sum, location) => sum + location.longitude, 0) / liveLocations.length;

    return { lat: avgLat, lng: avgLng };
  };
  const [mapCenter] = useState(calculateCenter);

  const AgentInfoWindow = ({ agent }) => (
    <div className="bg-white p-4 rounded-lg shadow-lg border max-w-xs">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{getVehicleIcon(agent.vehicleInfo?.vehicleType)}</div>
        <div>
          <h3 className="font-semibold text-gray-900">{agent.name}</h3>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getStatusColor(agent.status?.isOnline) }}
            />
            <span className="text-sm text-gray-600">{getStatusText(agent.status?.isOnline)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-500" />
          <span>{agent.personalInfo?.phone}</span>
        </div>

        <div className="flex items-center gap-2">
          <Star size={14} className="text-yellow-500" />
          <span>{agent.status?.rating?.toFixed(1) || 'N/A'} rating</span>
        </div>

        <div className="flex items-center gap-2">
          <Truck size={14} className="text-blue-500" />
          <span>{agent.status?.totalDeliveries || 0} deliveries</span>
        </div>

        {agent.status?.deliveryZone && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-green-500" />
            <span>{agent.status.deliveryZone.name}</span>
          </div>
        )}

        {agent.status?.currentLocation?.lastUpdated && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
            Last updated: {new Date(agent.status.currentLocation.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );

  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Riders Zone">
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 transition-colors border border-gray-200 rounded-md"
              >
                <ArrowLeft className="text-gray-600" size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Riders Zone</h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  Track and monitor delivery agents on the map
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={fetchAgents}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 rounded-md"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <Truck className="w-6 h-6" />
              Delivery Agents Overview
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 shadow-sm border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Agents</p>
                    <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                  </div>
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gray-50 shadow-sm border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Online Now</p>
                    <p className="text-2xl font-bold text-green-600">
                      {agents.filter(agent => agent.isOnline).length}
                    </p>
                  </div>
                  <CircleCheck className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gray-50 shadow-sm border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Offline</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {agents.filter(agent => !agent.status?.isOnline).length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-600" />
                </div>
              </div>

              <div className="bg-gray-50 shadow-sm border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Zones</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Set(agents.map(agent => agent.status?.deliveryZone?._id).filter(Boolean)).size}
                    </p>
                  </div>
                  <MapPin className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Map and Sidebar */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="flex" style={{ height: '70vh' }}>
            {/* Map Container */}
            <div className="flex-1 bg-white">
              <div className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading delivery agents...</p>
                    </div>
                  </div>
                ) : (
                  <GoogleMap
                    center={mapCenter}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    {Object.entries(agentLocations).map(([agentId, location]) => {
                      const agentLabel = getAgentLabel(agentId);
                      const infoHtml = `
                        <div style="padding: 8px 10px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px;">
                          <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">${agentLabel}</div>
                          <div style="line-height: 1.4; color: #374151;">
                            <div><strong>Lat:</strong> ${location.latitude?.toFixed(6) ?? 'N/A'}</div>
                            <div><strong>Lng:</strong> ${location.longitude?.toFixed(6) ?? 'N/A'}</div>
                            <div><strong>Accuracy:</strong> ${location.accuracy ? `${location.accuracy.toFixed(1)}m` : 'N/A'}</div>
                            <div><strong>Heading:</strong> ${typeof location.heading === 'number' ? `${location.heading.toFixed(1)}°` : 'N/A'}</div>
                            <div><strong>Time:</strong> ${location.timestamp ? new Date(location.timestamp).toLocaleString() : 'N/A'}</div>
                          </div>
                        </div>
                      `;
                      return (
                        <Marker
                          key={agentId}
                          position={{
                            lat: location.latitude,
                            lng: location.longitude
                          }}
                          title={`${agentLabel} - Live`}
                          icon={{
                            url: '/assets/bikerider.png',
                            scaledSize: { width: 40, height: 40 }
                          }}
                          rotation={location.heading}
                          infoContent={infoHtml}
                        />
                      );
                    })}
                  </GoogleMap>
                )}
              </div>
            </div>

            {/* Sidebar: Live Location Logs */}
            <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Live Location Logs</h2>
                <p className="text-sm text-gray-600">
                  Real-time location pings from delivery agents
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.keys(agentLocations).length === 0 && (
                  <div className="text-gray-400 text-center py-8">No live location logs yet...</div>
                )}
                {Object.entries(agentLocations).map(([agentId, location]) => {
                  const {
                    latitude,
                    longitude,
                    accuracy,
                    heading,
                    timestamp
                  } = location || {};

                  const agentLabel = getAgentLabel(agentId);
                  const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

                  return (
                    <div key={agentId} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">
                          📍 {agentLabel}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Live
                          </span>
                          <Bell
                            size={16}
                            className="text-green-500 cursor-pointer hover:text-green-600"
                            onClick={() => sendAlert(agentId)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <div>
                          <span className="font-medium">Lat:</span> {latitude?.toFixed(6) || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Lng:</span> {longitude?.toFixed(6) || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Accuracy:</span> {accuracy ? `${accuracy.toFixed(1)}m` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Heading:</span> {heading ? `${heading.toFixed(1)}°` : 'N/A'}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {formattedTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Agent Details</h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <AgentInfoWindow agent={selectedAgent} />
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default RidersZone;