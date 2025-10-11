import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Store, Loader2, Map, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';

// Lightweight overlay to render a zone polygon on a GoogleMap
const ZonePolygon = ({ map, zone }) => {
  useEffect(() => {
    if (!map || !zone || !zone.boundaries?.coordinates?.[0] || !window.google || !window.google.maps) return;

    // Convert GeoJSON [lng, lat] to {lat, lng}
    const path = zone.boundaries.coordinates[0].map(([lng, lat]) => ({ lat, lng }));

    const polygon = new window.google.maps.Polygon({
      paths: path,
      fillColor: '#10B981', // green for active zones
      fillOpacity: 0.25,
      strokeColor: '#10B981',
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

    // Optional info on click
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="max-width:220px">
          <div style="font-weight:600;margin-bottom:4px">${zone.name || 'Zone'}</div>
          <div>Status: Active</div>
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

const MarketMap = ({ zones, merchants }) => {
  const [map, setMap] = useState(null);

  // Calculate bounds to fit all zones and merchants
  const calculateBounds = useCallback(() => {
    if (!window.google?.maps) return null;

    const bounds = new window.google.maps.LatLngBounds();

    // Add zone boundaries to bounds
    zones.forEach(zone => {
      if (zone.boundaries?.coordinates?.[0]) {
        zone.boundaries.coordinates[0].forEach(([lng, lat]) => {
          bounds.extend({ lat, lng });
        });
      }
    });

    // Add merchant coordinates to bounds
    merchants.forEach(merchant => {
      if (merchant.coordinates) {
        bounds.extend(merchant.coordinates);
      }
    });

    return bounds;
  }, [zones, merchants]);

  // Fit map to bounds when data changes
  useEffect(() => {
    if (map && (zones.length > 0 || merchants.length > 0)) {
      const bounds = calculateBounds();
      if (bounds && !bounds.isEmpty()) {
        map.fitBounds(bounds, 50); // 50px padding
      }
    }
  }, [map, zones, merchants, calculateBounds]);

  const center = zones.length > 0 || merchants.length > 0
    ? calculateBounds()?.getCenter()?.toJSON() || { lat: 12.9716, lng: 77.5946 }
    : { lat: 12.9716, lng: 77.5946 };

  return (
    <GoogleMap
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      onLoad={setMap}
    >
      {/* Render Zone Polygons */}
      {zones.map((zone) => (
        <ZonePolygon key={zone._id} zone={zone} />
      ))}

      {/* Render Merchant Markers */}
      {merchants.map((merchant) => (
        <Marker
          key={merchant.id}
          position={merchant.coordinates}
          title={`${merchant.name} (${merchant.merchantId})`}
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2563eb"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 32)
          }}
        />
      ))}
    </GoogleMap>
  );
};

const MarketArea = () => {
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState({ zones: [], merchants: [] });
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/zones/market-area`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        console.log('Market area data:', data);
        setMarketData(data.data || []);
      } else {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          navigate('/login', { replace: true });
          return;
        }
        const errorData = await response.json();
        console.error('Failed to fetch market data:', errorData);
        toast.error('Failed to fetch market area data');
      }
    } catch (error) {
      console.error('Error fetching market data:', error);
      toast.error('Error loading market area data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMapData = async () => {
    try {
      setMapLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/zones/market-map`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        setMapData(data);
      } else {
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          navigate('/login', { replace: true });
          return;
        }
        toast.error('Failed to fetch map data');
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Error loading map data');
    } finally {
      setMapLoading(false);
    }
  };

  const handleShowMap = () => {
    setShowMap(true);
    if (mapData.zones.length === 0 && mapData.merchants.length === 0) {
      fetchMapData();
    }
  };

  if (loading) {
    return (
      <Layout title="Market Area">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading market area data...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Market Area">
      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <MapPin className="mr-2 sm:mr-3 text-green-600" size={24} />
                <span className="hidden sm:inline">Market Area Overview</span>
                <span className="sm:hidden">Market Area</span>
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Delivery zones and merchant distribution across your market area</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <div className="text-sm text-gray-500">Total Zones</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{marketData.length}</div>
              </div>
              <button
                onClick={handleShowMap}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Map className="w-4 h-4 sm:w-5 sm:h-5" />
                Market Map
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4">
              <div className="text-sm text-blue-600 font-medium">Total Merchants</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-700">
                {marketData.reduce((sum, zone) => sum + zone.merchantCount, 0)}
              </div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4">
              <div className="text-sm text-green-600 font-medium">Active Zones</div>
              <div className="text-xl sm:text-2xl font-bold text-green-700">
                {marketData.filter(zone => zone.merchantCount > 0).length}
              </div>
            </div>
            <div className="bg-orange-50 p-3 sm:p-4">
              <div className="text-sm text-orange-600 font-medium">Empty Zones</div>
              <div className="text-xl sm:text-2xl font-bold text-orange-700">
                {marketData.filter(zone => zone.merchantCount === 0).length}
              </div>
            </div>
          </div>
        </div>

        {/* Zone Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {marketData.map((zone) => (
            <div
              key={zone.id}
              className="bg-white shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="p-1.5 sm:p-2 bg-green-50 flex-shrink-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{zone.name}</h3>
                    {zone.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{zone.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {zone.merchantCount} Merchant{zone.merchantCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {zone.merchantCount === 0 && (
                  <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    Empty zone
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {marketData.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Delivery Zones Found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Create delivery zones to see market area data</p>
          </div>
        )}
      </div>

      {/* Market Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white shadow-xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Market Map</h2>
              <button
                onClick={() => setShowMap(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex-1 p-2 sm:p-4 min-h-0">
              {mapLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600 mb-2" />
                  <span className="text-gray-600 text-sm sm:text-base">Loading map data...</span>
                </div>
              ) : (
                <div className="h-full w-full">
                  <MarketMap zones={mapData.zones} merchants={mapData.merchants} />
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t bg-gray-50">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 opacity-25 border border-green-500 rounded-sm"></div>
                  <span>Delivery Zones ({mapData.zones.length})</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full"></div>
                  <span>Merchants ({mapData.merchants.length})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MarketArea;