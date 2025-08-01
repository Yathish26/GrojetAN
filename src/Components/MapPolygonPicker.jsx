import { MapContainer, TileLayer } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';

export default function MapPolygonPicker({ value, onChange }) {
  return (
    <MapContainer
      center={[12.9716, 77.5946]} // Center on Bangalore by default
      zoom={13}
      style={{ height: 400, width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <EditControl
        position="topright"
        draw={{
          rectangle: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
          polygon: true
        }}
        edit={{
          remove: true
        }}
        onCreated={e => {
          if (e.layerType === 'polygon') {
            // Leaflet uses [lat, lng], convert to [lng, lat] for GeoJSON
            const latlngs = e.layer.getLatLngs()[0];
            const coordinates = [
              latlngs.map(({ lat, lng }) => [lng, lat])
            ];
            onChange(coordinates);
          }
        }}
        onDeleted={() => {
          onChange([]);
        }}
      />
    </MapContainer>
  );
}