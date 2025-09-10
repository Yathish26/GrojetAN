import React, { useRef, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';

export const GoogleMap = ({
  children,
  center,
  zoom = 12,
  onLoad,
  onMapClick,
  style = { height: '400px', width: '100%', minHeight: '300px' },
  ...props
}) => {
  const ref = useRef();
  const [map, setMap] = useState();
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const loadingTimerRef = useRef(null);

  const retryLoadGoogleMaps = () => {
    console.log('Retrying Google Maps load...');
    setLoadingTime(0);
    setShowRetry(false);

    // Force reload Google Maps
    if (window.forceLoadGoogleMaps) {
      window.forceLoadGoogleMaps();
    }

    // Reset the loading state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    let timeoutId;
  let loadingInterval;
    let canceled = false;

    // Simple connectivity check using a reliable endpoint
    const checkConnectivity = () => {
      return fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors'
      })
      .then(() => {
        console.log('Network connectivity confirmed');
        return true;
      })
      .catch((error) => {
        console.warn('Network connectivity check failed:', error.message);
        return true; // Still proceed even if check fails
      });
    };

    const createMapIfReady = () => {
      if (canceled || map) return; // Already created or unmounted

      const ready = window.googleMapsLoaded && window.google && window.google.maps && ref.current;
      if (!ready) {
        // Poll until ready
        setTimeout(createMapIfReady, 100);
        return;
      }

      console.log('Google Maps is ready, creating map once...');
      setIsLoaded(true);
      try {
        const newMap = new window.google.maps.Map(ref.current, {
          center: center || { lat: 12.9716, lng: 77.5946 }, // Bangalore
          zoom,
          ...props
        });

        // Add click listener if provided
        if (onMapClick) {
          newMap.addListener('click', (event) => {
            onMapClick({
              lat: event.latLng.lat(),
              lng: event.latLng.lng()
            });
          });
        }

        setMap(newMap);
  mapRef.current = newMap;
        setIsMapReady(true);
        if (onLoad) onLoad(newMap);
        console.log('Google Maps created successfully');

        // Ensure map renders correctly in modals/hidden containers by observing size changes
        try {
          const targetEl = ref.current;
          if (targetEl && 'ResizeObserver' in window) {
            const initialCenter = newMap.getCenter();
            const ro = new ResizeObserver(() => {
              if (window.google && window.google.maps) {
                window.google.maps.event.trigger(newMap, 'resize');
                if (initialCenter) newMap.setCenter(initialCenter);
              }
            });
            ro.observe(targetEl);

            // Disconnect on unmount
            const disconnect = () => ro.disconnect();
            // Attach to map instance for cleanup
            newMap.__resizeObserverCleanup = disconnect;
          }
        } catch (e) {
          console.warn('ResizeObserver setup failed:', e);
        }
      } catch (error) {
        console.error('Error creating Google Map:', error);
        toast.error('Failed to load Google Maps');
      }
    };

    // Start checking immediately with connectivity check
    checkConnectivity().then(() => {
      createMapIfReady();
    });

    // Update loading time every second until map is ready
    loadingInterval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    loadingTimerRef.current = loadingInterval;

    // Fallback: if not loaded in 5s, show retry
    timeoutId = setTimeout(() => {
      if (!isMapReady && !map) {
        if (!window.googleMapsLoaded) {
          console.log('Fallback: Google Maps still not loaded after 5s');
        }
        setShowRetry(true);
      }
    }, 5000);

    return () => {
      canceled = true;
      clearTimeout(timeoutId);
      clearInterval(loadingInterval);
      // Cleanup resize observer if attached
      const m = mapRef.current;
      if (m && m.__resizeObserverCleanup) {
        try { m.__resizeObserverCleanup(); } catch {}
      }
    };
  // Intentionally exclude center/zoom/props to avoid re-creating the map on each change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop the loading timer when the map is ready to avoid periodic re-renders
  useEffect(() => {
    if (isMapReady && loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, [isMapReady]);

  // Update center and zoom without recreating the map
  useEffect(() => {
    if (!map) return;
    try {
      const prev = map.__lastView || {};
      if (center) {
        const sameCenter = prev.center && Math.abs(prev.center.lat - center.lat) < 1e-7 && Math.abs(prev.center.lng - center.lng) < 1e-7;
        if (!sameCenter) {
          map.panTo(center);
          prev.center = { lat: center.lat, lng: center.lng };
        }
      }
      if (zoom != null && prev.zoom !== zoom) {
        map.setZoom(zoom);
        prev.zoom = zoom;
      }
      map.__lastView = prev;
    } catch (e) {
      console.warn('Failed to update map view:', e);
    }
  }, [map, center, zoom]);

  // Always render the map container so ref.current is available; overlay a loader until ready
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={ref} style={style} />
      {!isMapReady && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg"
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 mb-1">Loading Google Maps...</p>
            <p className="text-sm text-gray-500">{loadingTime}s</p>
            {loadingTime > 3 && (
              <p className="text-xs text-gray-400 mt-2">
                Taking longer than usual. Please check your internet connection.
              </p>
            )}
            {showRetry && (
              <button
                onClick={retryLoadGoogleMaps}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                style={{ pointerEvents: 'auto' }}
              >
                Retry Loading
              </button>
            )}
          </div>
        </div>
      )}
      {useMemo(() => {
        if (!isMapReady) return null;
        return React.Children.map(children, (child) =>
          React.isValidElement(child) ? React.cloneElement(child, { map }) : child
        );
      }, [isMapReady, map, children])}
    </div>
  );
};

export const DrawingManager = ({
  map,
  onPolygonComplete,
  existingZones,
  onPolygonEdit,
  removePolygonAfterComplete = false
}) => {
  const drawingManagerRef = useRef();
  const listenersRef = useRef({ polygonComplete: null });
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onPolygonComplete);
  const onEditRef = useRef(onPolygonEdit);

  useEffect(() => {
    onCompleteRef.current = onPolygonComplete;
  }, [onPolygonComplete]);
  useEffect(() => {
    onEditRef.current = onPolygonEdit;
  }, [onPolygonEdit]);

  useEffect(() => {
  // If map not passed, try to infer from the closest map in the page (rare edge case)
  const activeMap = map;

  const setupDrawingManager = () => {
    if (!activeMap || !window.google || !window.google.maps || !window.google.maps.drawing) return;
    // Dispose previous if any
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }
    if (listenersRef.current.polygonComplete) {
      window.google.maps.event.removeListener(listenersRef.current.polygonComplete);
      listenersRef.current.polygonComplete = null;
    }

    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON]
      },
      polygonOptions: {
        fillColor: '#00FF00',
        fillOpacity: 0.3,
        strokeColor: '#00FF00',
        strokeWeight: 2,
        clickable: true,
        editable: true,
        draggable: true,
        zIndex: 1
      }
    });

    drawingManager.setMap(activeMap);
    drawingManagerRef.current = drawingManager;

  listenersRef.current.polygonComplete = window.google.maps.event.addListener(
      drawingManager,
      'polygoncomplete',
      (polygon) => {
        const path = polygon.getPath();
        const coordinates = [];

        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coordinates.push([point.lng(), point.lat()]);
        }
        coordinates.push(coordinates[0]); // Close polygon

        // Add edit listeners
    if (onEditRef.current) {
          const updateCoords = () => {
            const updatedCoords = [];
            for (let i = 0; i < polygon.getPath().getLength(); i++) {
              const point = polygon.getPath().getAt(i);
              updatedCoords.push([point.lng(), point.lat()]);
            }
            updatedCoords.push(updatedCoords[0]);
      onEditRef.current && onEditRef.current(updatedCoords);
          };
          window.google.maps.event.addListener(polygon.getPath(), 'set_at', updateCoords);
          window.google.maps.event.addListener(polygon.getPath(), 'insert_at', updateCoords);
          window.google.maps.event.addListener(polygon.getPath(), 'remove_at', updateCoords);
        }

        onCompleteRef.current && onCompleteRef.current(coordinates);
        if (removePolygonAfterComplete) {
          try { polygon.setMap(null); } catch {}
        }
        drawingManager.setDrawingMode(null);
      }
    );
  };

  try {
    if (window.googleMapsLoaded && activeMap && window.google && window.google.maps && window.google.maps.drawing) {
      setupDrawingManager();
    } else if (activeMap) {
      // Wait for Google Maps to load
      intervalRef.current = setInterval(() => {
        if (window.googleMapsLoaded && window.google && window.google.maps && window.google.maps.drawing) {
          clearInterval(intervalRef.current);
          setupDrawingManager();
        }
      }, 100);
    }
  } catch (error) {
    console.error('Error creating DrawingManager:', error);
    toast.error('Failed to initialize drawing tools');
  }

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (listenersRef.current.polygonComplete) {
      try { window.google.maps.event.removeListener(listenersRef.current.polygonComplete); } catch {}
      listenersRef.current.polygonComplete = null;
    }
    if (drawingManagerRef.current) {
      try { drawingManagerRef.current.setMap(null); } catch {}
      drawingManagerRef.current = null;
    }
  };
  }, [map]);

  // Display existing zones
  useEffect(() => {
    const overlayRefs = [];
    const drawZones = () => {
      if (!map || !existingZones) return;
      try {
        existingZones.forEach((zone) => {
          if (zone.boundaries?.coordinates?.[0]) {
            const coords = zone.boundaries.coordinates[0].map(coord => ({
              lat: coord[1], lng: coord[0]
            }));

            const polygon = new window.google.maps.Polygon({
              paths: coords,
              fillColor: zone.isActive ? '#00FF00' : '#FF0000',
              fillOpacity: 0.3,
              strokeColor: zone.isActive ? '#00FF00' : '#FF0000',
              strokeWeight: 2,
              map: map
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="max-width: 200px;">
                  <strong>${zone.name}</strong><br>
                  Delivery Fee: ₹${zone.deliveryFee}<br>
                  Est. Time: ${zone.estimatedDeliveryTime} min<br>
                  Max Distance: ${zone.maxDeliveryDistance} km
                </div>
              `
            });

            const clickListener = polygon.addListener('click', (event) => {
              infoWindow.setPosition(event.latLng);
              infoWindow.open(map);
            });

            const marker = new window.google.maps.Marker({
              position: coords[0],
              map: map,
              label: {
                text: zone.name,
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 0,
              }
            });

            overlayRefs.push({ polygon, marker, infoWindow, clickListener });
          }
        });
      } catch (error) {
        console.error('Error displaying existing zones:', error);
      }
    };

    let waitInterval;
    if (map && existingZones && window.googleMapsLoaded && window.google && window.google.maps) {
      drawZones();
    } else if (map && existingZones) {
      waitInterval = setInterval(() => {
        if (window.googleMapsLoaded && window.google && window.google.maps) {
          clearInterval(waitInterval);
          drawZones();
        }
      }, 100);
    }

    return () => {
      if (waitInterval) clearInterval(waitInterval);
      overlayRefs.forEach(({ polygon, marker, infoWindow, clickListener }) => {
        try { if (clickListener) window.google.maps.event.removeListener(clickListener); } catch {}
        try { if (infoWindow) infoWindow.close(); } catch {}
        try { if (polygon) polygon.setMap(null); } catch {}
        try { if (marker) marker.setMap(null); } catch {}
      });
    };
  }, [map, existingZones]);

  return null;
};

// Utility component for address search using Places Autocomplete
export const AddressSearch = ({ onPlaceSelect, placeholder = "Search for a location..." }) => {
  const inputRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [autocomplete, setAutocomplete] = useState(null);
  const autocompleteListenersRef = useRef([]);

  useEffect(() => {
    if (window.googleMapsLoaded && window.google && window.google.maps && window.google.maps.places && inputRef.current) {
      try {
        // Create Autocomplete instead of SearchBox
        const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'place_id'],
          types: ['establishment', 'geocode']
        });

        const listener = autocompleteInstance.addListener('place_changed', () => {
          try {
            const place = autocompleteInstance.getPlace();
            if (place.geometry && place.geometry.location) {
              if (onPlaceSelect) {
                onPlaceSelect({
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                  address: place.formatted_address,
                  placeId: place.place_id
                });
              }
            } else {
              console.warn('Place has no geometry');
            }
          } catch (error) {
            console.error('Error handling place_changed event:', error);
          }
        });

        setAutocomplete(autocompleteInstance);
        autocompleteListenersRef.current.push(listener);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Autocomplete:', error);
        setIsLoading(false);
      }
    } else if (!window.googleMapsLoaded) {
      // Wait for Google Maps to load
      const checkInterval = setInterval(() => {
        if (window.googleMapsLoaded && window.google && window.google.maps && window.google.maps.places && inputRef.current) {
          clearInterval(checkInterval);
          try {
            const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
              fields: ['formatted_address', 'geometry', 'place_id'],
              types: ['establishment', 'geocode']
            });

            const listener = autocompleteInstance.addListener('place_changed', () => {
              try {
                const place = autocompleteInstance.getPlace();
                if (place.geometry && place.geometry.location) {
                  if (onPlaceSelect) {
                    onPlaceSelect({
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                      address: place.formatted_address,
                      placeId: place.place_id
                    });
                  }
                } else {
                  console.warn('Place has no geometry');
                }
              } catch (error) {
                console.error('Error handling place_changed event:', error);
              }
            });

            setAutocomplete(autocompleteInstance);
            autocompleteListenersRef.current.push(listener);
            setIsLoading(false);
          } catch (error) {
            console.error('Error initializing Autocomplete:', error);
            setIsLoading(false);
          }
        }
      }, 100);

      return () => clearInterval(checkInterval);
    } else {
      setIsLoading(false);
    }

    return () => {
      try {
        autocompleteListenersRef.current.forEach(l => window.google?.maps?.event?.removeListener(l));
      } catch {}
      autocompleteListenersRef.current = [];
    };
  }, [onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={isLoading ? "Loading search..." : placeholder}
      disabled={isLoading}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  );
};

// Backend integration utilities
export const googleMapsApi = {
  // Geocode an address using backend
  async geocodeAddress(address) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/maps/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ address })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.data;
    } catch (error) {
      toast.error('Failed to geocode address');
      throw error;
    }
  },

  // Reverse geocode coordinates
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/maps/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ lat, lng })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.data;
    } catch (error) {
      toast.error('Failed to reverse geocode');
      throw error;
    }
  },

  // Calculate distance
  async calculateDistance(origin, destination, mode = 'driving') {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/maps/distance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ origin, destination, mode })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.data;
    } catch (error) {
      toast.error('Failed to calculate distance');
      throw error;
    }
  },

  // Validate if point is in delivery zone
  async validatePoint(point) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/maps/validate-point`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ point })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.data;
    } catch (error) {
      toast.error('Failed to validate point');
      throw error;
    }
  },

  // Get zone statistics
  async getZoneStats(coordinates) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/maps/zone-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ coordinates })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.data;
    } catch (error) {
      toast.error('Failed to calculate zone stats');
      throw error;
    }
  }
};
