import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Search,
  Eye,
  X,
  CircleCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import ChipInput from '../Components/ChipInput';

export default function DeliveryZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    boundaries: {
      type: 'Polygon',
      coordinates: []
    },
    isActive: true,
    deliveryFee: '',
    minimumOrderValue: '',
    estimatedDeliveryTime: '',
    maxDeliveryDistance: '',
    peakHourMultiplier: 1.2,
    coverage: {
      pinCodes: [],
      areas: [],
      landmarks: []
    },
    restrictions: {
      cashOnDelivery: true,
      maxOrderValue: '',
      blockedItems: []
    }
  });

  useEffect(() => {
    fetchZones();
  }, []);

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
      setZones(data.zones || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !createForm.name ||
      !createForm.boundaries.coordinates.length ||
      !createForm.estimatedDeliveryTime ||
      !createForm.maxDeliveryDistance ||
      !createForm.deliveryFee
    ) {
      toast.error('Please fill all required fields including boundaries');
      return;
    }

    // Prepare payload
    const payload = {
      ...createForm,
      deliveryFee: parseFloat(createForm.deliveryFee),
      minimumOrderValue: createForm.minimumOrderValue ? parseFloat(createForm.minimumOrderValue) : 0,
      estimatedDeliveryTime: parseInt(createForm.estimatedDeliveryTime),
      maxDeliveryDistance: parseFloat(createForm.maxDeliveryDistance),
      peakHourMultiplier: createForm.peakHourMultiplier ? parseFloat(createForm.peakHourMultiplier) : 1.2,
      boundaries: {
        type: 'Polygon',
        coordinates: createForm.boundaries.coordinates
      },
      coverage: {
        pinCodes: createForm.coverage.pinCodes,
        areas: createForm.coverage.areas,
        landmarks: createForm.coverage.landmarks
      },
      restrictions: {
        cashOnDelivery: !!createForm.restrictions.cashOnDelivery,
        maxOrderValue: createForm.restrictions.maxOrderValue ? parseFloat(createForm.restrictions.maxOrderValue) : undefined,
        blockedItems: createForm.restrictions.blockedItems
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
      setZones([...zones, data.zone]);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        description: '',
        boundaries: { type: 'Polygon', coordinates: [] },
        isActive: true,
        deliveryFee: '',
        minimumOrderValue: '',
        estimatedDeliveryTime: '',
        maxDeliveryDistance: '',
        peakHourMultiplier: 1.2,
        coverage: { pinCodes: [], areas: [], landmarks: [] },
        restrictions: { cashOnDelivery: true, maxOrderValue: '', blockedItems: [] }
      });
      toast.success('Delivery zone created successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteZone = async (zoneId) => {
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

      setZones(zones.filter(zone => zone._id !== zoneId));
      toast.success('Zone deleted successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateZone = async (zoneId, updates) => {
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
        throw new Error('Failed to update zone');
      }

      const data = await response.json();
      setZones(zones.map(zone =>
        zone._id === zoneId ? data.zone : zone
      ));
      toast.success('Zone updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleZoneStatus = async (zoneId, currentStatus) => {
    const newStatus = !currentStatus;
    await handleUpdateZone(zoneId, { isActive: newStatus });
  };

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && zone.isActive) ||
      (statusFilter === 'inactive' && !zone.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Delivery Zones</h1>
          <p className="text-gray-600">Manage delivery zones and coverage areas</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white  hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Zone
        </button>
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
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${zone.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">₹{zone.deliveryFee || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Est. Time</span>
                  <span className="font-medium">{zone.estimatedDeliveryTime || 0} min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Max Distance</span>
                  <span className="font-medium">{zone.maxDeliveryDistance || 0} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Coverage Points</span>
                  <span className="font-medium">
                    {Array.isArray(zone.boundaries?.coordinates) && zone.boundaries.coordinates[0]
                      ? zone.boundaries.coordinates[0].length
                      : 0} points
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Pin Codes</span>
                  <span className="font-medium">{zone.coverage?.pinCodes?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Areas</span>
                  <span className="font-medium">{zone.coverage?.areas?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Landmarks</span>
                  <span className="font-medium">{zone.coverage?.landmarks?.length || 0}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                    {/* Edit and delete can be implemented similarly */}
                    <button
                      onClick={() => setEditingZone(zone)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Zone"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={createForm.deliveryFee}
                    onChange={(e) => setCreateForm({ ...createForm, deliveryFee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Boundaries (GeoJSON Polygon Coordinates) *
                  </label>
                  <textarea
                    required
                    value={JSON.stringify(createForm.boundaries.coordinates)}
                    onChange={e => {
                      let val = [];
                      try {
                        val = JSON.parse(e.target.value);
                      } catch {
                        toast.error('Invalid JSON for boundaries');
                      }
                      setCreateForm({
                        ...createForm,
                        boundaries: {
                          ...createForm.boundaries,
                          coordinates: val
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
                    rows="3"
                    placeholder='Example: [[[77.5,12.9],[77.6,12.9],[77.6,13.0],[77.5,13.0],[77.5,12.9]]]'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery Time (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    value={createForm.estimatedDeliveryTime}
                    onChange={e => setCreateForm({ ...createForm, estimatedDeliveryTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Delivery Distance (km) *
                  </label>
                  <input
                    type="number"
                    required
                    value={createForm.maxDeliveryDistance}
                    onChange={e => setCreateForm({ ...createForm, maxDeliveryDistance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0.1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={createForm.minimumOrderValue}
                    onChange={e => setCreateForm({ ...createForm, minimumOrderValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peak Hour Multiplier
                  </label>
                  <input
                    type="number"
                    value={createForm.peakHourMultiplier}
                    onChange={e => setCreateForm({ ...createForm, peakHourMultiplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300  focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div>
                  <ChipInput
                    label="Pin Codes"
                    values={createForm.coverage.pinCodes}
                    setValues={vals =>
                      setCreateForm({
                        ...createForm,
                        coverage: { ...createForm.coverage, pinCodes: vals }
                      })
                    }
                  />
                  <ChipInput
                    label="Areas"
                    values={createForm.coverage.areas}
                    setValues={vals =>
                      setCreateForm({
                        ...createForm,
                        coverage: { ...createForm.coverage, areas: vals }
                      })
                    }
                  />
                  <ChipInput
                    label="Landmarks"
                    values={createForm.coverage.landmarks}
                    setValues={vals =>
                      setCreateForm({
                        ...createForm,
                        coverage: { ...createForm.coverage, landmarks: vals }
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                    Cash On Delivery Allowed
                  </label>
                  <input
                    type="checkbox"
                    checked={createForm.restrictions.cashOnDelivery}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        restrictions: {
                          ...createForm.restrictions,
                          cashOnDelivery: e.target.checked
                        }
                      })
                    }
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">
                    Max Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={createForm.restrictions.maxOrderValue}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        restrictions: {
                          ...createForm.restrictions,
                          maxOrderValue: e.target.value
                        }
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 "
                    min="0"
                    step="0.01"
                  />
                  <ChipInput
                    label="Blocked Items"
                    values={createForm.restrictions.blockedItems}
                    setValues={vals =>
                      setCreateForm({
                        ...createForm,
                        restrictions: { ...createForm.restrictions, blockedItems: vals }
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
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
    </div>
  );
}