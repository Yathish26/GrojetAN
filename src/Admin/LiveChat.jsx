import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import { Send, MessageCircle, User, Bot } from 'lucide-react';
import io from 'socket.io-client';

const LiveChat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome to Grojet Live Chat Support! How can we help you today?",
      sender: 'support',
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
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
      } catch (err) {
        console.error('Failed to fetch current user', err);
        setRedirecting(true);
        navigate('/login', { replace: true });
      } finally {
        setCheckingUser(false);
      }
    };
    fetchCurrentUser();
  }, [navigate]);

  // Initialize WebSocket connection when component mounts and currentUser is available
  useEffect(() => {
    if (!currentUser) return;
    console.log('💬 [LiveChat] Initializing WebSocket connection...');

    // Connect to WebSocket server
    socketRef.current = io(import.meta.env.VITE_SERVER, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ [LiveChat] Connected to WebSocket server');
      setIsConnected(true);

      // Use currentUser ID for admin ID
      const adminId = currentUser._id || currentUser.id || 'admin-user';
      console.log('💬 [LiveChat] Joining support chat with adminId:', adminId);

      // Join support chat room
      socketRef.current.emit('join-support-chat', {
        userId: adminId,
        userType: 'admin'
      });

      console.log('💬 [LiveChat] Joined support chat room');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ [LiveChat] Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('🚨 [LiveChat] Connection error:', error);
      setIsConnected(false);
    });

    // Listen for support chat messages
    const handleSupportMessage = (message) => {
      console.log('🔔 LiveChat received support chat message:', message);

      // Don't add our own messages again (they're already added locally)
      const currentAdminId = currentUser._id || currentUser.id || 'admin-user';
      if (message.fromId === currentAdminId && message.fromType === 'admin') {
        return; // Skip our own messages
      }

      const newMsg = {
        id: message.id || Date.now().toString(),
        text: message.message,
        sender: message.fromType === 'admin' ? 'support' : 'customer',
        timestamp: new Date(message.timestamp || Date.now()),
        userId: message.fromId,
        userType: message.fromType
      };
      console.log('🔔 Adding message to LiveChat:', newMsg);
      setMessages(prev => [...prev, newMsg]);
    };

    // Listen for typing indicators
    const handleTyping = (data) => {
      if (data.userType === 'delivery-agent') {
        setIsTyping(data.isTyping);
      }
    };

    socketRef.current.on('support-chat-message', handleSupportMessage);
    socketRef.current.on('support-chat-typing', handleTyping);

    // Cleanup function to disconnect when component unmounts
    return () => {
      console.log('💬 [LiveChat] Cleaning up WebSocket connection...');
      if (socketRef.current) {
        socketRef.current.off('support-chat-message', handleSupportMessage);
        socketRef.current.off('support-chat-typing', handleTyping);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [currentUser]); // Depend on currentUser to re-run when user data is available

  const handleSendMessage = () => {
    if (newMessage.trim() && socketRef.current && isConnected && currentUser) {
      // Use currentUser ID for admin ID
      const adminId = currentUser._id || currentUser.id || 'admin-user';

      // Send message via WebSocket
      socketRef.current.emit('support-chat-message', {
        fromId: adminId,
        fromType: 'admin',
        message: newMessage.trim(),
        timestamp: new Date(),
      });

      // Add to local messages
      const message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (checkingUser) {
    return (
      <Layout title="Live Chat (Beta)">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Live Chat (Beta)">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Live Chat (Beta)">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="bg-green-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Live Chat Support</h2>
                  <p className="text-green-100 text-sm">Beta Feature - Real-time customer assistance</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-300' : 'bg-red-300'}`}></div>
                <span className="text-sm text-green-100">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'support' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'support'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'support' ? (
                      <Bot size={16} className="text-green-600" />
                    ) : (
                      <User size={16} className="text-blue-600" />
                    )}
                    <span className={`text-xs ${message.sender === 'customer' ? 'text-green-500' : 'text-white'}`}>
                      {message.sender === 'customer' ? 'Delivery Agent' : 'Admin Support'}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'customer' ? 'text-green-600 text-left' : 'text-gray-200 text-right'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-blue-600" />
                    <span className="text-xs text-gray-500">Delivery Agent is typing...</span>
                  </div>
                  <div className="flex space-x-1 mt-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isTyping}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This is a beta feature. Messages are simulated for demonstration purposes.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveChat;