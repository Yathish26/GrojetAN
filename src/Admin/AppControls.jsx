import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import { VERSION } from '../../version';

export default function AppControls() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [selectedApps, setSelectedApps] = useState([]);
  const [pushToken, setPushToken] = useState('');
  const [notificationResults, setNotificationResults] = useState(null);

  // Bulk notifications states
  const [bulkNotificationText, setBulkNotificationText] = useState('');
  const [bulkNotificationTitle, setBulkNotificationTitle] = useState('');
  const [bulkSelectedApps, setBulkSelectedApps] = useState([]);
  const [bulkNotificationResults, setBulkNotificationResults] = useState(null);
  const [bulkNotificationLoading, setBulkNotificationLoading] = useState(false);
  const [sendToClosedStores, setSendToClosedStores] = useState(false);

  // Customer bulk notifications states
  const [customerBulkNotificationText, setCustomerBulkNotificationText] = useState('');
  const [customerBulkNotificationTitle, setCustomerBulkNotificationTitle] = useState('');
  const [customerBulkNotificationResults, setCustomerBulkNotificationResults] = useState(null);
  const [customerBulkNotificationLoading, setCustomerBulkNotificationLoading] = useState(false);
  const [customerBulkNotificationProgress, setCustomerBulkNotificationProgress] = useState(null);
  const [customerBulkNotificationScreen, setCustomerBulkNotificationScreen] = useState('Homescreen');

  // New states for app controls
  const [taxPercentageOnDeliveryFee, setTaxPercentageOnDeliveryFee] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [smallCartFee, setSmallCartFee] = useState(null);
  const [smallCartThreshold, setSmallCartThreshold] = useState(null);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(null);
  const [cashOnDeliveryEnabled, setCashOnDeliveryEnabled] = useState(null);
  const [groceryUpiEnabled, setGroceryUpiEnabled] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalValues, setOriginalValues] = useState({});
  const [controlsLoaded, setControlsLoaded] = useState(false);

  // Xpress controls states
  const [xpressGstPercentage, setXpressGstPercentage] = useState(null);
  const [xpressCodEnabled, setXpressCodEnabled] = useState(null);
  const [xpressUpiEnabled, setXpressUpiEnabled] = useState(null);
  const [xpressMaxDistanceKm, setXpressMaxDistanceKm] = useState(null);
  const [xpressBaseDistanceKm, setXpressBaseDistanceKm] = useState(null);
  const [xpressBasePrice, setXpressBasePrice] = useState(null);
  const [xpressPerKmRate, setXpressPerKmRate] = useState(null);

  // Xpress editing states
  const [isEditingXpress, setIsEditingXpress] = useState(false);
  const [xpressOriginalValues, setXpressOriginalValues] = useState({});
  const [xpressLoading, setXpressLoading] = useState(false);

  // Xpress update logs states
  const [xpressUpdateLogs, setXpressUpdateLogs] = useState({
    xpressGstPercentage: { updatedBy: null, updatedAt: null },
    xpressCodEnabled: { updatedBy: null, updatedAt: null },
    xpressUpiEnabled: { updatedBy: null, updatedAt: null },
    xpressMaxDistanceKm: { updatedBy: null, updatedAt: null },
    xpressBaseDistanceKm: { updatedBy: null, updatedAt: null },
    xpressBasePrice: { updatedBy: null, updatedAt: null },
    xpressPerKmRate: { updatedBy: null, updatedAt: null },
  });

  // Update logs states
  const [updateLogs, setUpdateLogs] = useState({
    taxPercentageOnDeliveryFee: { updatedBy: null, updatedAt: null },
    deliveryFee: { updatedBy: null, updatedAt: null },
    smallCartFee: { updatedBy: null, updatedAt: null },
    smallCartThreshold: { updatedBy: null, updatedAt: null },
    freeDeliveryThreshold: { updatedBy: null, updatedAt: null },
    cashOnDeliveryEnabled: { updatedBy: null, updatedAt: null },
    groceryUpiEnabled: { updatedBy: null, updatedAt: null },
  });

  // 🔐 Auth check (Always fetch from server)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setCheckingUser(true);
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
          headers: {
            'x-admin-version': VERSION,
          },
          credentials: 'include'
        });
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

  // Fetch app controls on component mount
  useEffect(() => {
    if (currentUser) {
      fetchAppControls();
    }
  }, [currentUser]);

  const fetchAppControls = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/app-controls`, {
        method: 'GET',
        headers: {
          'x-admin-version': VERSION,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const result = await response.json();
      if (result.success) {
        const data = result.data;
        setTaxPercentageOnDeliveryFee(data.taxPercentageOnDeliveryFee?.value ?? 18);
        setDeliveryFee(data.deliveryFee?.value ?? 40);
        setSmallCartFee(data.smallCartFee?.value ?? 40);
        setSmallCartThreshold(data.smallCartThreshold?.value ?? 499);
        setFreeDeliveryThreshold(data.freeDeliveryThreshold?.value ?? 499);
        setCashOnDeliveryEnabled(data.cashOnDeliveryEnabled?.value ?? true);
        setGroceryUpiEnabled(data.groceryUpiEnabled?.value ?? true);
        
        // Set Xpress controls
        setXpressGstPercentage(data.xpressGstPercentage?.value ?? 18);
        setXpressCodEnabled(data.xpressCodEnabled?.value ?? true);
        setXpressUpiEnabled(data.xpressUpiEnabled?.value ?? true);
        setXpressMaxDistanceKm(data.xpressMaxDistanceKm?.value ?? 10);
        setXpressBaseDistanceKm(data.xpressBaseDistanceKm?.value ?? 3);
        setXpressBasePrice(data.xpressBasePrice?.value ?? 60);
        setXpressPerKmRate(data.xpressPerKmRate?.value ?? 6);
        
        // Set Xpress update logs
        setXpressUpdateLogs({
          xpressGstPercentage: {
            updatedBy: data.xpressGstPercentage?.updatedBy,
            updatedAt: data.xpressGstPercentage?.updatedAt
          },
          xpressCodEnabled: {
            updatedBy: data.xpressCodEnabled?.updatedBy,
            updatedAt: data.xpressCodEnabled?.updatedAt
          },
          xpressUpiEnabled: {
            updatedBy: data.xpressUpiEnabled?.updatedBy,
            updatedAt: data.xpressUpiEnabled?.updatedAt
          },
          xpressBaseDistanceKm: {
            updatedBy: data.xpressBaseDistanceKm?.updatedBy,
            updatedAt: data.xpressBaseDistanceKm?.updatedAt
          },
          xpressMaxDistanceKm: {
            updatedBy: data.xpressMaxDistanceKm?.updatedBy,
            updatedAt: data.xpressMaxDistanceKm?.updatedAt
          },
          xpressBasePrice: {
            updatedBy: data.xpressBasePrice?.updatedBy,
            updatedAt: data.xpressBasePrice?.updatedAt
          },
          xpressPerKmRate: {
            updatedBy: data.xpressPerKmRate?.updatedBy,
            updatedAt: data.xpressPerKmRate?.updatedAt
          },
        });
        
        // Set update logs for merchant controls
        setUpdateLogs({
          taxPercentageOnDeliveryFee: {
            updatedBy: data.taxPercentageOnDeliveryFee?.updatedBy,
            updatedAt: data.taxPercentageOnDeliveryFee?.updatedAt
          },
          deliveryFee: {
            updatedBy: data.deliveryFee?.updatedBy,
            updatedAt: data.deliveryFee?.updatedAt
          },
          smallCartFee: {
            updatedBy: data.smallCartFee?.updatedBy,
            updatedAt: data.smallCartFee?.updatedAt
          },
          smallCartThreshold: {
            updatedBy: data.smallCartThreshold?.updatedBy,
            updatedAt: data.smallCartThreshold?.updatedAt
          },
          freeDeliveryThreshold: {
            updatedBy: data.freeDeliveryThreshold?.updatedBy,
            updatedAt: data.freeDeliveryThreshold?.updatedAt
          },
          cashOnDeliveryEnabled: {
            updatedBy: data.cashOnDeliveryEnabled?.updatedBy,
            updatedAt: data.cashOnDeliveryEnabled?.updatedAt
          },
          groceryUpiEnabled: {
            updatedBy: data.groceryUpiEnabled?.updatedBy,
            updatedAt: data.groceryUpiEnabled?.updatedAt
          },
        });
        
        // Store original values for cancel functionality
        setOriginalValues({
          taxPercentageOnDeliveryFee: data.taxPercentageOnDeliveryFee?.value ?? 18,
          deliveryFee: data.deliveryFee?.value ?? 40,
          smallCartFee: data.smallCartFee?.value ?? 40,
          smallCartThreshold: data.smallCartThreshold?.value ?? 499,
          freeDeliveryThreshold: data.freeDeliveryThreshold?.value ?? 499,
          cashOnDeliveryEnabled: data.cashOnDeliveryEnabled?.value ?? true,
          groceryUpiEnabled: data.groceryUpiEnabled?.value ?? true,
        });
        
        // Store Xpress original values for cancel functionality
        setXpressOriginalValues({
          xpressGstPercentage: data.xpressGstPercentage?.value ?? 18,
          xpressCodEnabled: data.xpressCodEnabled?.value ?? true,
          xpressMaxDistanceKm: data.xpressMaxDistanceKm?.value ?? 10,
          xpressBaseDistanceKm: data.xpressBaseDistanceKm?.value ?? 3,
          xpressBasePrice: data.xpressBasePrice?.value ?? 60,
          xpressPerKmRate: data.xpressPerKmRate?.value ?? 6,
        });
        
        setControlsLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching app controls:', error);
      toast.error('Failed to load app controls');
    }
  };

  // Show loading while checking auth or loading controls
  if (checkingUser || redirecting || !controlsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Show unauthorized if no user
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">⚙️</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Unauthorized</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const formatUpdateLog = (log) => {
    if (!log || !log.updatedAt) return 'Never updated';
    const date = new Date(log.updatedAt);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    const formattedDate = `${day}/${month}/${year} ${formattedTime}`;
    const adminName = log.updatedBy ? (log.updatedBy.name || log.updatedBy.email || 'Admin') : 'Unknown Admin';
    return `Last updated by ${adminName} on ${formattedDate}`;
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
      groceryUpiEnabled,
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
    setGroceryUpiEnabled(originalValues.groceryUpiEnabled);
    setIsEditing(false);
  };

  // Xpress functions
  const handleXpressEdit = () => {
    // Store current values as original before editing
    setXpressOriginalValues({
      xpressGstPercentage,
      xpressCodEnabled,
      xpressUpiEnabled,
      xpressMaxDistanceKm,
      xpressBaseDistanceKm,
      xpressBasePrice,
      xpressPerKmRate,
    });
    setIsEditingXpress(true);
  };

  const handleXpressCancel = () => {
    // Restore original values
    setXpressGstPercentage(xpressOriginalValues.xpressGstPercentage);
    setXpressCodEnabled(xpressOriginalValues.xpressCodEnabled);
    setXpressUpiEnabled(xpressOriginalValues.xpressUpiEnabled);
    setXpressMaxDistanceKm(xpressOriginalValues.xpressMaxDistanceKm);
    setXpressBaseDistanceKm(xpressOriginalValues.xpressBaseDistanceKm);
    setXpressBasePrice(xpressOriginalValues.xpressBasePrice);
    setXpressPerKmRate(xpressOriginalValues.xpressPerKmRate);
    setIsEditingXpress(false);
  };

  const handleXpressSave = async () => {
    const success = await handleUpdateXpressControls();
    if (success) {
      setIsEditingXpress(false);
    }
  };

  const handleUpdateXpressControls = async () => {
    setXpressLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/xpress-controls`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify({
          xpressGstPercentage: parseFloat(xpressGstPercentage),
          xpressCodEnabled: xpressCodEnabled,
          xpressUpiEnabled: xpressUpiEnabled,
          xpressMaxDistanceKm: parseFloat(xpressMaxDistanceKm),
          xpressBaseDistanceKm: parseFloat(xpressBaseDistanceKm),
          xpressBasePrice: parseFloat(xpressBasePrice),
          xpressPerKmRate: parseFloat(xpressPerKmRate),
        }),
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return false;
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Xpress controls updated successfully');
        // Update original values after successful save
        setXpressOriginalValues({
          xpressGstPercentage: parseFloat(xpressGstPercentage),
          xpressCodEnabled: xpressCodEnabled,
          xpressUpiEnabled: xpressUpiEnabled,
          xpressMaxDistanceKm: parseFloat(xpressMaxDistanceKm),
          xpressBaseDistanceKm: parseFloat(xpressBaseDistanceKm),
          xpressBasePrice: parseFloat(xpressBasePrice),
          xpressPerKmRate: parseFloat(xpressPerKmRate),
        });
        // Update update logs with the returned data
        const data = result.data;
        setXpressUpdateLogs({
          xpressGstPercentage: {
            updatedBy: data.xpressGstPercentage?.updatedBy,
            updatedAt: data.xpressGstPercentage?.updatedAt
          },
          xpressCodEnabled: {
            updatedBy: data.xpressCodEnabled?.updatedBy,
            updatedAt: data.xpressCodEnabled?.updatedAt
          },
          xpressUpiEnabled: {
            updatedBy: data.xpressUpiEnabled?.updatedBy,
            updatedAt: data.xpressUpiEnabled?.updatedAt
          },
          xpressBaseDistanceKm: {
            updatedBy: data.xpressBaseDistanceKm?.updatedBy,
            updatedAt: data.xpressBaseDistanceKm?.updatedAt
          },
          xpressMaxDistanceKm: {
            updatedBy: data.xpressMaxDistanceKm?.updatedBy,
            updatedAt: data.xpressMaxDistanceKm?.updatedAt
          },
          xpressBasePrice: {
            updatedBy: data.xpressBasePrice?.updatedBy,
            updatedAt: data.xpressBasePrice?.updatedAt
          },
          xpressPerKmRate: {
            updatedBy: data.xpressPerKmRate?.updatedBy,
            updatedAt: data.xpressPerKmRate?.updatedAt
          },
        });
        // Refetch to ensure state reflects server values
        fetchAppControls();
        return true;
      } else {
        toast.error(result.message || 'Failed to update Xpress controls');
        return false;
      }
    } catch (error) {
      console.error('Error updating Xpress controls:', error);
      toast.error('Failed to update Xpress controls');
      return false;
    } finally {
      setXpressLoading(false);
    }
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
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify({
          taxPercentageOnDeliveryFee: parseFloat(taxPercentageOnDeliveryFee),
          deliveryFee: parseFloat(deliveryFee),
          smallCartFee: parseFloat(smallCartFee),
          smallCartThreshold: parseFloat(smallCartThreshold),
          freeDeliveryThreshold: parseFloat(freeDeliveryThreshold),
          cashOnDeliveryEnabled: cashOnDeliveryEnabled,
          groceryUpiEnabled: groceryUpiEnabled,
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
          groceryUpiEnabled: groceryUpiEnabled,
        });
        // Update update logs with the returned data
        const data = result.data;
        setUpdateLogs({
          taxPercentageOnDeliveryFee: {
            updatedBy: data.taxPercentageOnDeliveryFee?.updatedBy,
            updatedAt: data.taxPercentageOnDeliveryFee?.updatedAt
          },
          deliveryFee: {
            updatedBy: data.deliveryFee?.updatedBy,
            updatedAt: data.deliveryFee?.updatedAt
          },
          smallCartFee: {
            updatedBy: data.smallCartFee?.updatedBy,
            updatedAt: data.smallCartFee?.updatedAt
          },
          smallCartThreshold: {
            updatedBy: data.smallCartThreshold?.updatedBy,
            updatedAt: data.smallCartThreshold?.updatedAt
          },
          freeDeliveryThreshold: {
            updatedBy: data.freeDeliveryThreshold?.updatedBy,
            updatedAt: data.freeDeliveryThreshold?.updatedAt
          },
          cashOnDeliveryEnabled: {
            updatedBy: data.cashOnDeliveryEnabled?.updatedBy,
            updatedAt: data.cashOnDeliveryEnabled?.updatedAt
          },
          groceryUpiEnabled: {
            updatedBy: data.groceryUpiEnabled?.updatedBy,
            updatedAt: data.groceryUpiEnabled?.updatedAt
          },
        });
        // Refetch to ensure state reflects server values
        fetchAppControls();
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
    setNotificationTitle('');
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
      if (notificationTitle && notificationTitle.length > 150) {
        toast.error('Title cannot exceed 150 characters');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/notifications/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: notificationTitle,
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

  const handleSendBulkNotification = async () => {
    if (!bulkNotificationText.trim()) {
      toast.error('Please enter notification text');
      return;
    }
    if (bulkSelectedApps.length === 0 && !sendToClosedStores) {
      toast.error('Please select at least one app to send to or check "Merchants with Closed Stores"');
      return;
    }

    setBulkNotificationLoading(true);
    try {
      let response;
      let endpoint;
      let requestBody;

      if (bulkNotificationTitle && bulkNotificationTitle.length > 150) {
        toast.error('Title cannot exceed 150 characters');
        setBulkNotificationLoading(false);
        return;
      }

      if (sendToClosedStores) {
        // Send to merchants with closed stores
        endpoint = `${import.meta.env.VITE_SERVER}/admin/notifications/send-closed-stores-notification`;
        requestBody = {
          title: bulkNotificationTitle,
          message: bulkNotificationText,
        };
      } else {
        // Send regular bulk notification
        endpoint = `${import.meta.env.VITE_SERVER}/admin/notifications/send-bulk-notification`;
        requestBody = {
          title: bulkNotificationTitle,
          message: bulkNotificationText,
          appType: bulkSelectedApps.join(', '),
        };
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
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
        setBulkNotificationResults(result);
        const targetDescription = sendToClosedStores 
          ? 'merchants with closed stores' 
          : bulkSelectedApps.join(', ');
        toast.success(`Bulk notification sent to ${targetDescription}`);
      } else {
        toast.error(result.message || 'Failed to send bulk notification');
      }
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      toast.error('Failed to send bulk notification');
    } finally {
      setBulkNotificationLoading(false);
    }
  };

  const clearBulkResults = () => {
    setBulkNotificationResults(null);
    setBulkNotificationText('');
    setBulkNotificationTitle('');
    setBulkSelectedApps([]);
    setSendToClosedStores(false);
  };

  const handleSendCustomerBulkNotification = async () => {
    if (!customerBulkNotificationText.trim()) {
      toast.error('Please enter notification text');
      return;
    }

    setCustomerBulkNotificationLoading(true);
    setCustomerBulkNotificationProgress(null);
    setCustomerBulkNotificationResults(null);

    try {
      if (customerBulkNotificationTitle && customerBulkNotificationTitle.length > 150) {
        toast.error('Title cannot exceed 150 characters');
        setCustomerBulkNotificationLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/notifications/send-customer-bulk-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-version': VERSION,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: customerBulkNotificationTitle,
          message: customerBulkNotificationText,
          screen: customerBulkNotificationScreen,
        }),
      });


      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line.trim());

              if (data.type === 'progress') {
                setCustomerBulkNotificationProgress(data);
              } else if (data.type === 'complete') {
                setCustomerBulkNotificationResults(data);
                setCustomerBulkNotificationProgress(null);
                toast.success(`Bulk notification completed! Sent to ${data.data.totalSent} devices`);
              } else if (data.type === 'error') {
                toast.error(data.message || 'Failed to send bulk notification');
                setCustomerBulkNotificationProgress(null);
              }
            } catch (parseError) {
              console.error('Error parsing progress data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending customer bulk notification:', error);
      toast.error('Failed to send bulk notification');
      setCustomerBulkNotificationProgress(null);
    } finally {
      setCustomerBulkNotificationLoading(false);
    }
  };

  const clearCustomerBulkResults = () => {
    setCustomerBulkNotificationResults(null);
    setCustomerBulkNotificationProgress(null);
    setCustomerBulkNotificationTitle('');
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
            {/* Notification Title (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title (optional)
              </label>
              <input
                maxLength={150}
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Short title (appears on the device)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>

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

        {/* Bulk Notifications Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Bulk Notifications</h2>
          <div className="space-y-4">
            {/* Notification Title (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title (optional)
              </label>
              <input
                maxLength={150}
                value={bulkNotificationTitle}
                onChange={(e) => setBulkNotificationTitle(e.target.value)}
                placeholder="Short title for the bulk message"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>

            {/* Notification Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Text
              </label>
              <textarea
                maxLength={500}
                value={bulkNotificationText}
                onChange={(e) => setBulkNotificationText(e.target.value)}
                placeholder="Enter the notification message..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
              />
            </div>

            {/* App Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to Apps
              </label>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                {['Merchant App'].map((app) => (
                  <label key={app} className="flex items-center cursor-pointer p-2 sm:p-0 border sm:border-0 border-gray-200 rounded-lg sm:rounded-none">
                    <input
                      type="checkbox"
                      checked={bulkSelectedApps.includes(app)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setBulkSelectedApps(prev =>
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
                <label className="flex items-center cursor-pointer p-2 sm:p-0 border sm:border-0 border-gray-200 rounded-lg sm:rounded-none">
                  <input
                    type="checkbox"
                    checked={sendToClosedStores}
                    onChange={(e) => setSendToClosedStores(e.target.checked)}
                    className="mr-2 text-green-600 focus:ring-green-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">Merchants with Closed Stores</span>
                </label>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSendBulkNotification}
                disabled={bulkNotificationLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {bulkNotificationLoading ? 'Sending...' : sendToClosedStores ? 'Send to Closed Stores' : 'Send Bulk Notification'}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Notification Results */}
        {bulkNotificationResults && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Bulk Notification Results</h2>
              <button
                onClick={clearBulkResults}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Results
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Request Summary</h3>
                <p className="text-sm text-gray-600">
                  <strong>Message:</strong> {bulkNotificationResults.message}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> <span className="text-green-600 font-medium">Success</span>
                </p>
                {bulkNotificationResults.data && bulkNotificationResults.data.totalSent && (
                  <p className="text-sm text-gray-600">
                    <strong>Total Sent:</strong> {bulkNotificationResults.data.totalSent}
                  </p>
                )}
              </div>

              {bulkNotificationResults.data && bulkNotificationResults.data.results && bulkNotificationResults.data.results.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Delivery Results</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bulkNotificationResults.data.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 sm:p-4 rounded-lg border ${
                          result.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className={`font-medium text-sm sm:text-base ${
                            result.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.success ? '✅ Delivered' : '❌ Failed'}
                          </span>
                        </div>

                        {result.error && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <strong>Error:</strong> {result.error}
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

        {/* Customer Bulk Notifications Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Bulk Notifications to Customer App</h2>
          <div className="space-y-4">
            {/* Notification Title (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Title (optional)
              </label>
              <input
                maxLength={150}
                value={customerBulkNotificationTitle}
                onChange={(e) => setCustomerBulkNotificationTitle(e.target.value)}
                placeholder="Short title for customer notifications"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Notification Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Text
              </label>
              <textarea
                maxLength={500}
                value={customerBulkNotificationText}
                onChange={(e) => setCustomerBulkNotificationText(e.target.value)}
                placeholder="Enter the notification message for customers..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
              />
            </div>

            {/* Navigate to Screen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Navigate to Screen (on click)
              </label>
              <select
                value={customerBulkNotificationScreen}
                onChange={(e) => setCustomerBulkNotificationScreen(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="Homescreen">Homescreen</option>
                <option value="Stores">Stores</option>
                <option value="Xpress">Xpress Screen</option>
                <option value="Orders">Orders</option>
                <option value="Profile">Profile</option>
                <option value="Search">Search</option>
                <option value="Cart">Cart</option>
                <option value="Wishlist">Wishlist</option>
              </select>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSendCustomerBulkNotification}
                disabled={customerBulkNotificationLoading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {customerBulkNotificationLoading ? 'Sending...' : 'Send to All Customers'}
              </button>
            </div>

            {/* Progress Display */}
            {customerBulkNotificationProgress && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-800">Sending Progress</h3>
                  <span className="text-sm text-blue-600">
                    {customerBulkNotificationProgress.processed} / {customerBulkNotificationProgress.totalDevices}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${customerBulkNotificationProgress.totalDevices > 0
                        ? (customerBulkNotificationProgress.processed / customerBulkNotificationProgress.totalDevices) * 100
                        : 0}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-blue-600">
                  <span>Success: {customerBulkNotificationProgress.successCount}</span>
                  <span>Failed: {customerBulkNotificationProgress.failureCount}</span>
                  <span>Total Users: {customerBulkNotificationProgress.totalUsers}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Bulk Notification Results */}
        {customerBulkNotificationResults && (
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Customer Bulk Notification Results</h2>
              <button
                onClick={clearCustomerBulkResults}
                className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Results
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Request Summary</h3>
                <p className="text-sm text-gray-600">
                  <strong>Message:</strong> {customerBulkNotificationResults.message}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Status:</strong> <span className="text-green-600 font-medium">Success</span>
                </p>
                {customerBulkNotificationResults.data && customerBulkNotificationResults.data.totalSent && (
                  <p className="text-sm text-gray-600">
                    <strong>Total Sent:</strong> {customerBulkNotificationResults.data.totalSent}
                  </p>
                )}
              </div>

              {customerBulkNotificationResults.data && customerBulkNotificationResults.data.results && customerBulkNotificationResults.data.results.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Delivery Results</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {customerBulkNotificationResults.data.results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 sm:p-4 rounded-lg border ${
                          result.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <span className={`font-medium text-sm sm:text-base ${
                            result.success ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {result.success ? '✅ Delivered' : '❌ Failed'}
                          </span>
                        </div>

                        {result.error && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <strong>Error:</strong> {result.error}
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
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Checkout Controls (Merchant)</h2>
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
                onChange={(e) => setTaxPercentageOnDeliveryFee(parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                This percentage will be applied as tax on the delivery fee.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.taxPercentageOnDeliveryFee)}
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
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Base delivery fee amount.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.deliveryFee)}
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
                onChange={(e) => setSmallCartFee(parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Delivery fee for carts below the threshold.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.smallCartFee)}
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
                onChange={(e) => setSmallCartThreshold(parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum cart value for small cart fee.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.smallCartThreshold)}
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
                onChange={(e) => setFreeDeliveryThreshold(parseFloat(e.target.value) || 0)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditing ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum cart value for free delivery.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.freeDeliveryThreshold)}
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
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.cashOnDeliveryEnabled)}
              </p>
            </div>

            {/* Grocery UPI Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grocery UPI Payment
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isEditing && setGroceryUpiEnabled(!groceryUpiEnabled)}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    groceryUpiEnabled ? 'bg-green-600' : 'bg-gray-200'
                  } ${!isEditing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      groceryUpiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-700">
                  {groceryUpiEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Allow customers to pay for grocery orders using UPI/Cards/Net Banking.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(updateLogs.groceryUpiEnabled)}
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

        {/* Xpress Controls Panel */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Xpress Delivery Controls</h2>
              <p className="text-gray-600 text-sm">Manage Xpress delivery settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Xpress GST Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={xpressGstPercentage}
                onChange={(e) => setXpressGstPercentage(parseFloat(e.target.value) || 0)}
                disabled={!isEditingXpress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditingXpress ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                GST percentage applied to Xpress delivery charges.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressGstPercentage)}
              </p>
            </div>

            {/* Xpress COD Enabled */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash on Delivery
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isEditingXpress && setXpressCodEnabled(!xpressCodEnabled)}
                  disabled={!isEditingXpress}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    xpressCodEnabled ? 'bg-green-600' : 'bg-gray-200'
                  } ${!isEditingXpress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      xpressCodEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-700">
                  {xpressCodEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Allow cash on delivery for Xpress orders.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressCodEnabled)}
              </p>
            </div>

            {/* Xpress UPI Enabled */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI Payment
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isEditingXpress && setXpressUpiEnabled(!xpressUpiEnabled)}
                  disabled={!isEditingXpress}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    xpressUpiEnabled ? 'bg-green-600' : 'bg-gray-200'
                  } ${!isEditingXpress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      xpressUpiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="ml-3 text-sm text-gray-700">
                  {xpressUpiEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Allow UPI/Card payments for Xpress orders.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressUpiEnabled)}
              </p>
            </div>

            {/* Xpress Max Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Distance (km)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                step="0.1"
                value={xpressMaxDistanceKm}
                onChange={(e) => setXpressMaxDistanceKm(parseFloat(e.target.value) || 0)}
                disabled={!isEditingXpress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditingXpress ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum distance allowed for Xpress deliveries from pickup location.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressMaxDistanceKm)}
              </p>
            </div>

            {/* Xpress Base Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Distance Covered (km)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={xpressBaseDistanceKm}
                onChange={(e) => setXpressBaseDistanceKm(parseFloat(e.target.value) || 0)}
                disabled={!isEditingXpress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditingXpress ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Distance included in the base price (e.g., 0-3 km slab).
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressBaseDistanceKm)}
              </p>
            </div>

            {/* Xpress Base Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price for Base Distance (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={xpressBasePrice}
                onChange={(e) => setXpressBasePrice(parseFloat(e.target.value) || 0)}
                disabled={!isEditingXpress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditingXpress ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Charge applied for trips within the base distance slab.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressBasePrice)}
              </p>
            </div>

            {/* Xpress Additional Per Km Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Rate per km (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={xpressPerKmRate}
                onChange={(e) => setXpressPerKmRate(parseFloat(e.target.value) || 0)}
                disabled={!isEditingXpress}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${
                  !isEditingXpress ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Applied for every km beyond the base distance.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {formatUpdateLog(xpressUpdateLogs.xpressPerKmRate)}
              </p>
            </div>
          </div>

          {/* Xpress Action Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            {!isEditingXpress ? (
              <button
                onClick={handleXpressEdit}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Edit Xpress Controls
              </button>
            ) : (
              <>
                <button
                  onClick={handleXpressCancel}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleXpressSave}
                  disabled={xpressLoading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm font-medium"
                >
                  {xpressLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
