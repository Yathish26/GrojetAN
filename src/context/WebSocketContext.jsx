import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [agentLocations, setAgentLocations] = useState({});
  const socketRef = useRef(null);
  const cleanupIntervalRef = useRef(null);

  // Compute bearing between two points (degrees from North)
  const computeBearing = (lat1, lng1, lat2, lng2) => {
    try {
      if (
        typeof lat1 !== 'number' || typeof lng1 !== 'number' ||
        typeof lat2 !== 'number' || typeof lng2 !== 'number'
      ) return null;

      const toRad = (deg) => (deg * Math.PI) / 180;
      const toDeg = (rad) => (rad * 180) / Math.PI;

      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δλ = toRad(lng2 - lng1);

      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      let θ = toDeg(Math.atan2(y, x));
      // Normalize to 0-360
      θ = (θ + 360) % 360;
      return isNaN(θ) ? null : θ;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // Initialize WebSocket connection
    const initWebSocket = async () => {
      try {
        // Get admin token from localStorage (assuming it's stored there)
        const adminToken = localStorage.getItem('adminToken');

        if (!adminToken) {
          console.log('🔒 [WS] No admin token found, skipping WebSocket connection');
          return;
        }

        console.log('🔌 [WS] Connecting to WebSocket server...');

        // Connect to the server
        socketRef.current = io(import.meta.env.VITE_SERVER, {
          auth: {
            token: adminToken,
            type: 'admin'
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          timeout: 20000
        });

        socketRef.current.on('connect', () => {
          console.log('✅ [WS] Connected to WebSocket server');
          setIsConnected(true);

          // Join admin room (send adminId/token if available)
          try {
            const adminToken = localStorage.getItem('adminToken');
            const adminId = localStorage.getItem('adminId');
            socketRef.current.emit('join-admin', { adminId, token: adminToken });
          } catch (e) {
            socketRef.current.emit('join-admin');
          }
        });

        socketRef.current.on('disconnect', () => {
          console.log('❌ [WS] Disconnected from WebSocket server');
          setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('🚨 [WS] Connection error:', error);
          setIsConnected(false);
        });

        // Listen for agent location updates
        socketRef.current.on('agent-location-update', (data) => {
          console.log('📍 [WS] Agent location update received:', data);
          console.log('🎯 [WS] Heading received:', data.heading, 'Type:', typeof data.heading);
          setAgentLocations(prev => {
            const updated = { ...prev };
            const prevEntry = prev[data.agentId];

            // Coerce heading to number when possible
            let incomingHeading = (typeof data.heading === 'number') ? data.heading : Number(data.heading);
            if (isNaN(incomingHeading) || incomingHeading < 0) incomingHeading = null;

            // If heading missing/invalid, compute from movement if previous point exists
            let finalHeading = incomingHeading;
            if ((finalHeading === null || finalHeading === undefined) && prevEntry) {
              const computed = computeBearing(
                prevEntry.latitude,
                prevEntry.longitude,
                data.latitude,
                data.longitude
              );
              if (computed !== null) finalHeading = computed;
            }

            // Normalize to 0-360 if numeric
            if (typeof finalHeading === 'number') {
              finalHeading = ((finalHeading % 360) + 360) % 360;
            }

            updated[data.agentId] = {
              latitude: data.latitude,
              longitude: data.longitude,
              timestamp: data.timestamp,
              accuracy: data.accuracy,
              speed: data.speed,
              heading: finalHeading
            };
            return updated;
          });
        });

        // Listen for agent offline events
        socketRef.current.on('agent-offline', (data) => {
          console.log('🔴 [WS] Agent went offline:', data.agentId);
          setAgentLocations(prev => {
            const updated = { ...prev };
            delete updated[data.agentId];
            return updated;
          });
        });

        // Clean up stale location entries every 30 seconds
        const cleanupInterval = setInterval(() => {
          setAgentLocations(prev => {
            const now = new Date();
            const updated = { ...prev };
            let cleaned = false;
            
            Object.keys(updated).forEach(agentId => {
              const entry = updated[agentId];
              if (entry.timestamp && (now - new Date(entry.timestamp)) > 300000) { // 5 minutes
                delete updated[agentId];
                cleaned = true;
                console.log('🧹 [WS] Cleaned up stale location for agent:', agentId);
              }
            });
            
            return cleaned ? updated : prev;
          });
        }, 30000); // Check every 30 seconds

        // Store cleanup interval reference
        cleanupIntervalRef.current = cleanupInterval;

      } catch (error) {
        console.error('🚨 [WS] Failed to initialize WebSocket:', error);
      }
    };

    initWebSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 [WS] Disconnecting WebSocket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, []);

  const value = {
    isConnected,
    agentLocations,
    socket: socketRef.current
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};