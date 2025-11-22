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

    // Trigger Google Maps loading if not already loaded
    if (!window.googleMapsLoaded && window.loadGoogleMaps) {
      console.log('Triggering Google Maps load from component...');
      window.loadGoogleMaps();
    }

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
          center: center || { lat: 12.9141, lng: 74.8560 }, // Mangalore
          zoom,
          // Enable smooth zooming and better controls
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER
          },
          gestureHandling: 'greedy',
          scrollwheel: true,
          disableDoubleClickZoom: false,
          // Smooth animations
          animation: window.google.maps.Animation.DROP,
          // Better performance
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: window.google.maps.ControlPosition.TOP_RIGHT
          },
          // Style options for better UX
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ],
          // Smooth zoom transitions and performance
          tilt: 0,
          heading: 0,
          minZoom: 8,
          maxZoom: 20,
          ...props
        });

        console.log('Map created successfully:', newMap);
        setMap(newMap);
        setIsMapReady(true);

        // Call onLoad callback if provided
        if (onLoad) {
          onLoad(newMap);
        }

        // Add click listener if provided
        if (onMapClick) {
          newMap.addListener('click', onMapClick);
        }

      } catch (error) {
        console.error('Error creating Google Map:', error);
        setShowRetry(true);
        toast.error('Failed to load map. Please check your internet connection and API key.');
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
      <div
        ref={ref}
        style={{
          ...style,
          transition: 'transform 0.3s ease-out',
          willChange: 'transform'
        }}
      />
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
                  Status: ${zone.isActive ? 'Active' : 'Inactive'}<br>
                  Boundary Points: ${zone.boundaries?.coordinates?.[0]?.length || 0}
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
      className={`w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
        isLoading ? 'bg-gray-100 cursor-not-allowed' : ''
      }`}
    />
  );
};

// Backend integration utilities

export const Marker = ({
  position,
  title = '',
  icon = null,
  rotation = 0,
  infoContent = null,
  onClick = null,
  map = null
}) => {
  const markerRef = useRef(null);
  const overlayRef = useRef(null);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (!map || !window.google || !window.google.maps) return;

    // Clean up previous markers/overlays
    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }

    // If custom icon is provided, use custom overlay (rotatable if rotation is valid)
    if (icon) {
      // Create custom overlay for rotatable marker
      class RotatableMarker extends window.google.maps.OverlayView {
        constructor(position, icon, rotation, title, onClick) {
          super();
          this.position = position;
          this.icon = icon;
          this.rotation = rotation;
          this.title = title;
          this.onClick = onClick;
          this.div = null;
        }

        onAdd() {
          this.div = document.createElement('div');
          this.div.style.position = 'absolute';
          this.div.style.cursor = 'pointer';
          this.div.title = this.title;

          const img = document.createElement('img');
          img.src = this.icon.url;
          img.style.width = `${this.icon.scaledSize.width}px`;
          img.style.height = `${this.icon.scaledSize.height}px`;
          img.style.transform = `rotate(${this.rotation}deg)`;
          img.style.transformOrigin = 'center center';

          this.div.appendChild(img);
          this.getPanes().overlayMouseTarget.appendChild(this.div);

          // Add click listener
          this.div.addEventListener('click', () => {
            if (this.onClick) {
              this.onClick();
            }
          });
        }

        draw() {
          const overlayProjection = this.getProjection();
          if (!overlayProjection) return; // Projection not ready yet

          const position = overlayProjection.fromLatLngToDivPixel(this.position);
          if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
            return; // Position not available yet
          }

          const anchorX = this.icon && this.icon.anchor && typeof this.icon.anchor.x === 'number'
            ? this.icon.anchor.x
            : (this.icon && this.icon.scaledSize && typeof this.icon.scaledSize.width === 'number'
              ? this.icon.scaledSize.width / 2
              : 0);

          const anchorY = this.icon && this.icon.anchor && typeof this.icon.anchor.y === 'number'
            ? this.icon.anchor.y
            : (this.icon && this.icon.scaledSize && typeof this.icon.scaledSize.height === 'number'
              ? this.icon.scaledSize.height / 2
              : 0);

          if (this.div) {
            this.div.style.left = `${position.x - anchorX}px`;
            this.div.style.top = `${position.y - anchorY}px`;
          }
        }

        onRemove() {
          if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }

        setRotation(rotation) {
          this.rotation = rotation;
          if (this.div && this.div.firstChild && typeof rotation === 'number' && !isNaN(rotation)) {
            this.div.firstChild.style.transform = `rotate(${rotation}deg)`;
            console.log('🔄 Rotated marker to:', rotation, 'degrees');
          }
        }

        setPosition(position) {
          this.position = position;
          // Try to redraw if projection is available
          if (this.getProjection()) {
            this.draw();
          }
        }
      }

      const rotatableMarker = new RotatableMarker(position, icon, rotation, title, () => {
        if (onClick) onClick();
        if (infoWindowRef.current && infoContent) {
          infoWindowRef.current.setPosition(position);
          infoWindowRef.current.open(map);
        }
      });
      rotatableMarker.setMap(map);
      overlayRef.current = rotatableMarker;

      // Create info window if content provided
      if (infoContent) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });
        infoWindowRef.current = infoWindow;
      }

    } else {
      // Use regular Google Maps marker for non-rotated markers
      const marker = new window.google.maps.Marker({
        position,
        map,
        title,
        icon: icon || {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z" fill="#dc2626" stroke="white" stroke-width="2"/>
              <circle cx="20" cy="12" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 32)
        }
      });

      markerRef.current = marker;

      // Create info window if content provided
      if (infoContent) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent
        });
        infoWindowRef.current = infoWindow;

        // Add click listener to marker
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          if (onClick) onClick(marker);
        });
      }
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
        overlayRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };
  }, [map, position, title, icon, rotation, infoContent, onClick]);

  // Handle rotation updates for rotatable markers
  useEffect(() => {
    console.log('🔄 Marker rotation update:', rotation, 'overlay exists:', !!overlayRef.current, 'type:', typeof rotation);
    if (overlayRef.current && typeof rotation === 'number' && !isNaN(rotation)) {
      overlayRef.current.setRotation(rotation);
      console.log('✅ Applied rotation:', rotation, 'degrees');
    } else {
      console.log('❌ Cannot apply rotation - overlay missing or invalid rotation');
    }
  }, [rotation]);

  // Handle position updates for rotatable markers
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setPosition(position);
    }
  }, [position]);

  return null; // This component doesn't render anything visible
};export const googleMapsApi = {
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
