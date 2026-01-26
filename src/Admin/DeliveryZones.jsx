import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Search,
  Eye,
  X,
  CircleCheck,
  Map,
  Ban
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import { GoogleMap, DrawingManager, AddressSearch, googleMapsApi, Marker } from '../Components/GoogleMapComponents';

// Lightweight overlay to render a zone polygon on a GoogleMap
const ZonePolygon = ({ map, zone }) => {
  useEffect(() => {
    if (!map || !zone || !zone.boundaries?.coordinates?.[0] || !window.google || !window.google.maps) return;

    // Convert GeoJSON [lng, lat] to {lat, lng}
    const path = zone.boundaries.coordinates[0].map(([lng, lat]) => ({ lat, lng }));

    const polygon = new window.google.maps.Polygon({
      paths: path,
      fillColor: zone.isActive ? '#10B981' : '#EF4444', // green/red
      fillOpacity: 0.25,
      strokeColor: zone.isActive ? '#10B981' : '#EF4444',
      strokeWeight: 2,
      clickable: true,
      map
    });

    // Label marker (black text) at first vertex
    let labelMarker = null;
    try {
      if (path[0]) {
        labelMarker = new window.google.maps.Marker({
          position: path[0],
          map,
          label: {
            text: String(zone.name || ''),
            color: 'black',
            fontSize: '12px',
            fontWeight: '700'
          },
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }
        });
      }
    } catch {}

    // Fit bounds to polygon
    try {
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 50);
      }
    } catch {}

    // Optional info on click
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="max-width:220px">
          <div style="font-weight:600;margin-bottom:4px">${zone.name || 'Zone'}</div>
          <div>Status: ${zone.isActive ? 'Active' : 'Inactive'}</div>
          <div>Xpress: ${zone.supportsXpress ? 'Yes' : 'No'}</div>
          <div>Merchant: ${zone.supportsMerchant ? 'Yes' : 'No'}</div>
          <div>Boundary Points: ${zone.boundaries?.coordinates?.[0]?.length || 0}</div>
        </div>
      `
    });
    const clickListener = polygon.addListener('click', (evt) => {
      infoWindow.setPosition(evt.latLng);
      infoWindow.open({ map });
    });

    return () => {
      try { window.google.maps.event.removeListener(clickListener); } catch {}
      try { infoWindow.close(); } catch {}
      try { polygon.setMap(null); } catch {}
      try { if (labelMarker) labelMarker.setMap(null); } catch {}
    };
  }, [map, zone]);

  return null;
};

// Overlay to render all zones with labels and fit bounds to include all polygons
const AllZonesPolygons = ({ map, zones = [] }) => {
  useEffect(() => {
    if (!map || !Array.isArray(zones) || !window.google?.maps) return;
    const overlays = [];
    const bounds = new window.google.maps.LatLngBounds();

    try {
      zones.forEach(zone => {
        const ring = zone?.boundaries?.coordinates?.[0];
        if (!ring || ring.length < 3) return;
        const path = ring.map(([lng, lat]) => ({ lat, lng }));

        const polygon = new window.google.maps.Polygon({
          paths: path,
          fillColor: zone.isActive ? '#10B981' : '#EF4444',
          fillOpacity: 0.2,
          strokeColor: zone.isActive ? '#10B981' : '#EF4444',
          strokeWeight: 2,
          map
        });

        // Extend bounds
        path.forEach(p => bounds.extend(p));

        // Label marker in black
        let marker = null;
        try {
          marker = new window.google.maps.Marker({
            position: path[0],
            map,
            label: { text: String(zone.name || ''), color: 'black', fontSize: '12px', fontWeight: '700' },
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }
          });
        } catch {}

        overlays.push({ polygon, marker });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 60);
      }
    } catch (e) {
      // noop
    }

    return () => {
      overlays.forEach(({ polygon, marker }) => {
        try { polygon?.setMap(null); } catch {}
        try { marker?.setMap(null); } catch {}
      });
    };
  }, [map, zones]);

  return null;
};

// Editable polygon overlay used in Edit Map modal
const EditablePolygon = ({ map, zone, onEdit }) => {
  useEffect(() => {
    if (!map || !zone?.boundaries?.coordinates?.[0] || !window.google?.maps) return;

    const path = zone.boundaries.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
    const polygon = new window.google.maps.Polygon({
      paths: path,
      fillColor: zone.isActive ? '#10B981' : '#EF4444',
      fillOpacity: 0.2,
      strokeColor: zone.isActive ? '#10B981' : '#EF4444',
      strokeWeight: 2,
      clickable: true,
      editable: true,
      draggable: true,
      map
    });

    const pushUpdate = () => {
      const coords = [];
      const p = polygon.getPath();
      for (let i = 0; i < p.getLength(); i++) {
        const pt = p.getAt(i);
        coords.push([pt.lng(), pt.lat()]);
      }
      if (coords.length > 0) coords.push(coords[0]);
      onEdit && onEdit(coords);
    };

    const listeners = [
      window.google.maps.event.addListener(polygon.getPath(), 'set_at', pushUpdate),
      window.google.maps.event.addListener(polygon.getPath(), 'insert_at', pushUpdate),
      window.google.maps.event.addListener(polygon.getPath(), 'remove_at', pushUpdate),
      window.google.maps.event.addListener(polygon, 'dragend', pushUpdate)
    ];

    // Fit bounds once when shown
    try {
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      if (!bounds.isEmpty()) map.fitBounds(bounds, 50);
    } catch {}

    return () => {
      try { listeners.forEach(l => window.google.maps.event.removeListener(l)); } catch {}
      try { polygon.setMap(null); } catch {}
    };
  }, [map, zone, onEdit]);

  return null;
};

// Render all zones on a single map and fit bounds to include all polygons (with black labels)
const AllZonesView = ({ map, zones }) => {
  useEffect(() => {
    if (!map || !Array.isArray(zones) || zones.length === 0 || !window.google?.maps) return;

  const overlayRefs = [];
    const globalBounds = new window.google.maps.LatLngBounds();

    try {
      zones.forEach((zone) => {
        const ring = zone?.boundaries?.coordinates?.[0];
        if (!Array.isArray(ring) || ring.length < 3) return;

        const path = ring.map(([lng, lat]) => ({ lat, lng }));
        path.forEach(p => globalBounds.extend(p));

        const polygon = new window.google.maps.Polygon({
          paths: path,
          fillColor: zone.isActive ? '#10B981' : '#EF4444',
          fillOpacity: 0.22,
          strokeColor: zone.isActive ? '#10B981' : '#EF4444',
          strokeWeight: 2,
          clickable: true,
          map
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="max-width:220px">
              <div style="font-weight:600;margin-bottom:4px">${zone.name || 'Zone'}</div>
              <div>Status: ${zone.isActive ? 'Active' : 'Inactive'}</div>
              <div>Xpress: ${zone.supportsXpress ? 'Yes' : 'No'}</div>
              <div>Merchant: ${zone.supportsMerchant ? 'Yes' : 'No'}</div>
              <div>Boundary Points: ${zone.boundaries?.coordinates?.[0]?.length || 0}</div>
            </div>
          `
        });

        const clickListener = polygon.addListener('click', (evt) => {
          infoWindow.setPosition(evt.latLng);
          infoWindow.open({ map });
        });

        // Black label marker for zone name at first vertex
        let marker = null;
        try {
          if (path[0]) {
            marker = new window.google.maps.Marker({
              position: path[0],
              map,
              label: { text: String(zone.name || ''), color: 'black', fontSize: '12px', fontWeight: '700' },
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 }
            });
          }
        } catch {}

        overlayRefs.push({ polygon, infoWindow, clickListener, marker });
      });

      // Fit once to include all polygons
      if (!globalBounds.isEmpty()) {
        map.fitBounds(globalBounds, 60);
      }
    } catch (e) {
      // no-op
    }

    return () => {
      overlayRefs.forEach(({ polygon, infoWindow, clickListener, marker }) => {
        try { if (clickListener) window.google.maps.event.removeListener(clickListener); } catch {}
        try { if (infoWindow) infoWindow.close(); } catch {}
        try { if (polygon) polygon.setMap(null); } catch {}
        try { if (marker) marker.setMap(null); } catch {}
      });
    };
  }, [map, zones]);

  return null;
};

export default function DeliveryZones() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  // Google Maps state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState([]);
  const [zoneStats, setZoneStats] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showViewMapModal, setShowViewMapModal] = useState(false);
  const [viewZone, setViewZone] = useState(null);
  const [showAllZonesModal, setShowAllZonesModal] = useState(false);

  // Edit Zone state
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin'];
  const [editForm, setEditForm] = useState(null);
  const [editCoordinates, setEditCoordinates] = useState([]);
  const [editZoneStats, setEditZoneStats] = useState(null);
  const [showEditMapModal, setShowEditMapModal] = useState(false);
  const [editSelectedLocation, setEditSelectedLocation] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    boundaries: {
      type: 'Polygon',
      coordinates: []
    },
    isActive: true,
    supportsXpress: false,
    supportsMerchant: false
  });

  // Initialize edit form when a zone is selected for editing
  useEffect(() => {
    if (editingZone) {
      const coords = editingZone.boundaries?.coordinates?.[0] || [];
      setEditForm({
        _id: editingZone._id,
        name: editingZone.name || '',
        description: editingZone.description || '',
        isActive: !!editingZone.isActive,
        supportsXpress: !!editingZone.supportsXpress,
        supportsMerchant: !!editingZone.supportsMerchant,
        boundaries: {
          type: 'Polygon',
          coordinates: editingZone.boundaries?.coordinates || []
        }
      });
      setEditCoordinates(coords);
      setEditSelectedLocation(null);
      setEditZoneStats(null);
      setShowEditModal(true);
    } else {
      setShowEditModal(false);
      setEditForm(null);
      setEditCoordinates([]);
      setEditZoneStats(null);
      setShowEditMapModal(false);
    }
  }, [editingZone]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch delivery zones');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setZones(data.zones || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    if (!isAuthorized) return;
    e.preventDefault();

    // Validation
    if (
      !createForm.name ||
      !createForm.boundaries.coordinates.length
    ) {
      toast.error('Please fill all required fields including boundaries');
      return;
    }

    // Prepare payload
    const payload = {
      name: createForm.name,
      description: createForm.description,
      isActive: createForm.isActive,
      supportsXpress: createForm.supportsXpress,
      supportsMerchant: createForm.supportsMerchant,
      boundaries: {
        type: 'Polygon',
        coordinates: createForm.boundaries.coordinates
      }
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create zone');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setZones([...zones, data.zone]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        boundaries: { type: 'Polygon', coordinates: [] },
        isActive: true,
        supportsXpress: false,
        supportsMerchant: false
      });
      toast.success('Delivery zone created successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!isAuthorized || currentUser?.role !== 'super_admin') {
      toast.error('Only Super Admins can delete delivery zones');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this delivery zone? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones/${zoneId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete zone');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setZones(zones.filter(zone => zone._id !== zoneId));
      toast.success('Zone deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateZone = async (zoneId, updates) => {
    if (!isAuthorized) {
      toast.error('You do not have permission to update delivery zones');
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update zone');
      }

      const data = await response.json();
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }
      setZones(zones.map(zone =>
        zone._id === zoneId ? data.zone : zone
      ));
      toast.success('Zone updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleZoneStatus = async (zoneId, currentStatus) => {
    if (!isAuthorized || currentUser?.role !== 'super_admin') {
      toast.error('Only Super Admins can change zone status');
      return;
    }
    const newStatus = !currentStatus;
    await handleUpdateZone(zoneId, { isActive: newStatus });
  };

  // Google Maps handlers
  const handlePolygonComplete = async (coordinates) => {
    setMapCoordinates(coordinates);
    setCreateForm({
      ...createForm,
      boundaries: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    });

    // Calculate zone statistics using backend
    try {
      const stats = await googleMapsApi.getZoneStats(coordinates);
      setZoneStats(stats);
      toast.success(`Zone drawn successfully! Area: ${stats.area.approximateSquareKm.toFixed(2)} km²`);
    } catch (error) {
      toast.success('Zone boundary drawn successfully!');
    }

    setShowMapModal(false);
  };

  const handlePolygonEdit = async (coordinates) => {
    setMapCoordinates(coordinates);
    setCreateForm({
      ...createForm,
      boundaries: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    });

    // Recalculate zone statistics
    try {
      const stats = await googleMapsApi.getZoneStats(coordinates);
      setZoneStats(stats);
    } catch (error) {
      // Silently fail for edits
    }
  };

  // Edit Map handlers
  const handleEditPolygonComplete = async (coordinates) => {
    setEditCoordinates(coordinates);
    setEditForm(prev => ({
      ...prev,
      boundaries: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    }));
    try {
      const stats = await googleMapsApi.getZoneStats(coordinates);
      setEditZoneStats(stats);
      toast.success('Updated boundary for editing');
    } catch (e) {
      // noop
    }
    setShowEditMapModal(false);
  };

  const handleEditPolygonEdit = async (coordinates) => {
    setEditCoordinates(coordinates);
    setEditForm(prev => ({
      ...prev,
      boundaries: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    }));
    try {
      const stats = await googleMapsApi.getZoneStats(coordinates);
      setEditZoneStats(stats);
    } catch {}
  };

  const handlePlaceSelect = (place) => {
    setSelectedLocation(place);
    toast.success(`Location selected: ${place.address}`);
  };

  const openMapDrawer = () => {
    setShowMapModal(true);
  };

  const handleViewMap = (zone) => {
    setViewZone(zone);
    setShowViewMapModal(true);
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && zone.isActive) ||
      (statusFilter === 'inactive' && !zone.isActive);

    return matchesSearch && matchesStatus;
  });

  const fetchCurrentUser = useCallback(async () => {
    try {
      const local = localStorage.getItem('adminUser');
      if (local) {
        setCurrentUser(JSON.parse(local));
      } else {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
        const data = await response.json();
        if (data.tokenValid === false) {
          window.location.replace('/login');
          return;
        }
        if (response.ok && data.admin) {
          setCurrentUser(data.admin);
          localStorage.setItem('adminUser', JSON.stringify(data.admin));
        }
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
    } finally {
      setCheckingUser(false);
    }
  }, []);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);

  useEffect(() => {
    if (isAuthorized) {
      fetchZones();
    }
  }, [isAuthorized]);

  // Guard states
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Ban className='w-16 h-16 text-red-500 mb-2'/>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins and Super Admins can view delivery zones.</p>
      </div>
    );
  }

  return (
    <Layout title="Delivery Zones">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delivery Zones</h1>
          <p className="text-gray-600">Manage delivery zones and coverage areas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllZonesModal(true)}
            className="flex items-center cursor-pointer gap-2 px-3 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Map className="w-4 h-4" />
            Zones Map
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-green-600 text-white  hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Zone
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white  shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">{filteredZones.length} zones</span>
          </div>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredZones.map((zone) => (
          <div key={zone._id} className="bg-white  shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{zone.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${zone.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${zone.supportsXpress
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {zone.supportsXpress ? 'Xpress' : 'Standard'}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${zone.supportsMerchant
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {zone.supportsMerchant ? 'Merchant' : 'No Merchant'}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Boundary Points</span>
                  <span className="font-medium">
                    {Array.isArray(zone.boundaries?.coordinates) && zone.boundaries.coordinates[0]
                      ? zone.boundaries.coordinates[0].length
                      : 0} points
                  </span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => toggleZoneStatus(zone._id, zone.isActive)}
                        className={`p-1 rounded ${zone.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                          }`}
                        title={zone.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {zone.isActive ? <X className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
                      </button>
                    )}
                    {/* Edit and delete can be implemented similarly */}
                    <button
                      onClick={() => setEditingZone(zone)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Zone"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {currentUser?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDeleteZone(zone._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Zone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleViewMap(zone)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredZones.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Delivery Zones Found</h3>
          <p className="text-gray-600 mb-4">
            {zones.length === 0
              ? "Get started by creating your first delivery zone."
              : "No zones match your current filters."
            }
          </p>
          {zones.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2  hover:bg-green-700 transition-colors"
            >
              Create First Zone
            </button>
          )}
        </div>
      )}

      {/* Create Zone Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white  shadow-xl max-w-2xl w-full max-h-3/4 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Delivery Zone</h2>
            </div>
            <form onSubmit={handleCreateZone} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Name *
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Downtown Area"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Brief description of the delivery zone"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Boundaries *
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {mapCoordinates.length > 0
                            ? `${mapCoordinates.length} points selected`
                            : 'No boundaries selected'
                          }
                        </span>
                        {zoneStats && (
                          <div className="text-sm text-blue-600 font-medium">
                            Area: {zoneStats.area.approximateSquareKm.toFixed(2)} km²
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={openMapDrawer}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Map className="w-4 h-4" />
                        Draw on Map
                      </button>
                    </div>

                    {/* Zone Statistics */}
                    {zoneStats && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Zone Statistics</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Area:</span>
                            <span className="ml-2 font-medium text-blue-700">
                              {zoneStats.area.approximateSquareKm.toFixed(2)} km²
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Points:</span>
                            <span className="ml-2 font-medium text-blue-700">
                              {zoneStats.points}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Coordinates Preview */}
                    {mapCoordinates.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 max-h-20 overflow-y-auto">
                        <div className="text-gray-800 font-medium mb-1">GeoJSON Coordinates:</div>
                        {JSON.stringify(mapCoordinates, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={createForm.isActive}
                      onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Active Zone
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="supportsXpress"
                      checked={createForm.supportsXpress}
                      onChange={(e) => setCreateForm({ ...createForm, supportsXpress: e.target.checked })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="supportsXpress" className="text-sm text-gray-700">
                      Supports Xpress
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="supportsMerchant"
                      checked={createForm.supportsMerchant}
                      onChange={(e) => setCreateForm({ ...createForm, supportsMerchant: e.target.checked })}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="supportsMerchant" className="text-sm text-gray-700">
                      Supports Merchant
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300  hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white  hover:bg-green-700 transition-colors"
                >
                  Create Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full h-[80vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Draw Delivery Zone</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 h-full flex flex-col">
              {/* Search and Controls */}
              <div className="mb-4 space-y-3">
                <AddressSearch
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Search for a location to center the map..."
                />

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <span><strong>Instructions:</strong></span>
                    <span>1. Click polygon tool → 2. Draw zone → 3. Double-click to finish</span>
                  </div>
                  {zoneStats && (
                    <div className="text-right">
                      <div>Area: {zoneStats.area.approximateSquareKm.toFixed(2)} km²</div>
                      <div>Points: {zoneStats.points}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Container */}
              <div className="flex-1 relative">
                <GoogleMap
                  center={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
                  zoom={selectedLocation ? 15 : 12}
                >
                  <DrawingManager
                    onPolygonComplete={handlePolygonComplete}
                    onPolygonEdit={handlePolygonEdit}
                    existingZones={zones}
                  />
                  {selectedLocation && (
                    <Marker
                      position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                      title={selectedLocation.address}
                      infoContent={`
                        <div style="max-width: 250px;">
                          <strong>Searched Location</strong><br/>
                          ${selectedLocation.address}<br/>
                          <small>Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}</small>
                        </div>
                      `}
                    />
                  )}
                </GoogleMap>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {mapCoordinates.length > 0 && (
                    <span>Zone boundary: {mapCoordinates.length} points defined</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMapCoordinates([]);
                      setZoneStats(null);
                      setSelectedLocation(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Zone Map Modal */}
      {showViewMapModal && viewZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full h-[75vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">View Zone Map</h3>
                <p className="text-sm text-gray-600">{viewZone.name}</p>
              </div>
              <button onClick={() => setShowViewMapModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <GoogleMap
                center={(() => {
                  const c = viewZone?.boundaries?.coordinates?.[0]?.[0];
                  return c ? { lat: c[1], lng: c[0] } : { lat: 12.9716, lng: 77.5946 };
                })()}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <ZonePolygon zone={viewZone} />
              </GoogleMap>
            </div>
          </div>
        </div>
      )}

      {/* All Zones Map Modal */}
      {showAllZonesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">All Zones Map</h3>
              <button onClick={() => setShowAllZonesModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <GoogleMap
                center={{ lat: 12.9716, lng: 77.5946 }}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
              >
                <AllZonesView zones={zones} />
              </GoogleMap>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white shadow-xl max-w-2xl w-full max-h-3/4 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Edit Zone</h2>
              <button onClick={() => setEditingZone(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const payload = {
                  name: editForm.name,
                  description: editForm.description,
                  supportsXpress: editForm.supportsXpress,
                  supportsMerchant: editForm.supportsMerchant,
                  boundaries: {
                    type: 'Polygon',
                    coordinates: editForm.boundaries?.coordinates || []
                  }
                };

                // Only include isActive if user is super_admin
                if (currentUser?.role === 'super_admin') {
                  payload.isActive = editForm.isActive;
                }

                try {
                  await handleUpdateZone(editForm._id, payload);
                  setEditingZone(null);
                } catch {}
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name *</label>
                  <input
                    type="text"
                    maxLength={200}
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone Boundaries *</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">
                          {editCoordinates.length > 0 ? `${editCoordinates.length} points selected` : 'Using existing boundary'}
                        </span>
                        {editZoneStats && (
                          <div className="text-sm text-blue-600 font-medium">
                            Area: {editZoneStats.area.approximateSquareKm.toFixed(2)} km²
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEditMapModal(true)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                      >
                        <Map className="w-4 h-4" />
                        Edit on Map
                      </button>
                    </div>
                    {editCoordinates.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 max-h-20 overflow-y-auto">
                        <div className="text-gray-800 font-medium mb-1">GeoJSON Coordinates:</div>
                        {JSON.stringify(editCoordinates, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
                {currentUser?.role === 'super_admin' && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActiveEdit"
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor="isActiveEdit" className="text-sm text-gray-700">Active Zone</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="supportsXpressEdit"
                        checked={editForm.supportsXpress}
                        onChange={(e) => setEditForm({ ...editForm, supportsXpress: e.target.checked })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="supportsXpressEdit" className="text-sm text-gray-700">Supports Xpress</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="supportsMerchantEdit"
                        checked={editForm.supportsMerchant}
                        onChange={(e) => setEditForm({ ...editForm, supportsMerchant: e.target.checked })}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="supportsMerchantEdit" className="text-sm text-gray-700">Supports Merchant</label>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingZone(null)} className="px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Map Modal */}
      {showEditMapModal && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full h-[80vh]">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Edit Zone Boundary</h3>
              <button onClick={() => setShowEditMapModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 h-full flex flex-col">
              <div className="mb-4 space-y-3">
                <AddressSearch
                  onPlaceSelect={(place) => setEditSelectedLocation(place)}
                  placeholder="Search for a location to center the map..."
                />
              </div>
              <div className="flex-1 relative">
                <GoogleMap
                  center={editSelectedLocation ? { lat: editSelectedLocation.lat, lng: editSelectedLocation.lng } : (() => {
                    const c = editForm?.boundaries?.coordinates?.[0]?.[0];
                    return c ? { lat: c[1], lng: c[0] } : { lat: 12.9716, lng: 77.5946 };
                  })()}
                  zoom={editSelectedLocation ? 15 : 12}
                >
                    {/* Existing editable polygon overlay for current zone */}
                    {Array.isArray(editForm?.boundaries?.coordinates?.[0]) && editForm.boundaries.coordinates[0].length >= 3 && (
                      <EditablePolygon
                        zone={{
                          ...editForm,
                          boundaries: { type: 'Polygon', coordinates: [editForm.boundaries.coordinates[0]] },
                          isActive: editForm.isActive
                        }}
                        onEdit={handleEditPolygonEdit}
                      />
                    )}
                    {/* Allow drawing a new polygon if needed; remove the temporary polygon immediately after completion to avoid duplicates */}
                    <DrawingManager
                      onPolygonComplete={handleEditPolygonComplete}
                      onPolygonEdit={handleEditPolygonEdit}
                      existingZones={[]}
                      removePolygonAfterComplete
                    />
                    {editSelectedLocation && (
                      <Marker
                        position={{ lat: editSelectedLocation.lat, lng: editSelectedLocation.lng }}
                        title={editSelectedLocation.address}
                        infoContent={`
                          <div style="max-width: 250px;">
                            <strong>Searched Location (Edit)</strong><br/>
                            ${editSelectedLocation.address}<br/>
                            <small>Lat: ${editSelectedLocation.lat.toFixed(6)}, Lng: ${editSelectedLocation.lng.toFixed(6)}</small>
                          </div>
                        `}
                      />
                    )}
                </GoogleMap>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {editCoordinates.length > 0 && (<span>Edited boundary: {editCoordinates.length} points defined</span>)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditCoordinates([]); setEditZoneStats(null); setEditSelectedLocation(null); }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowEditMapModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </Layout>
  );
}