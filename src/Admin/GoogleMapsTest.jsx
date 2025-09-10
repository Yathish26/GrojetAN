import React, { useState } from 'react';
import { GoogleMap, DrawingManager, AddressSearch } from '../Components/GoogleMapComponents';
import Layout from '../Components/Layout';

export default function GoogleMapsTest() {
  const [coordinates, setCoordinates] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handlePolygonComplete = (coords) => {
    console.log('Polygon completed:', coords);
    setCoordinates(coords);
  };

  const handlePlaceSelect = (place) => {
    console.log('Place selected:', place);
    setSelectedLocation(place);
  };

  return (
    <Layout title="Google Maps Test">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Google Maps Integration Test</h1>

          <div className="space-y-4">
            <AddressSearch
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search for a location..."
            />

            <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
              <GoogleMap
                center={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
                zoom={selectedLocation ? 15 : 12}
              >
                <DrawingManager
                  onPolygonComplete={handlePolygonComplete}
                />
              </GoogleMap>
            </div>

            {coordinates.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Captured Coordinates:</h3>
                <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                  {JSON.stringify(coordinates, null, 2)}
                </pre>
              </div>
            )}

            {selectedLocation && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Selected Location:</h3>
                <p><strong>Address:</strong> {selectedLocation.address}</p>
                <p><strong>Coordinates:</strong> {selectedLocation.lat}, {selectedLocation.lng}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
