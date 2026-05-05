import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

const mapStyle = { width: "100%", height: "70vh"};

const darkMap = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a1a" }] },
];

export default function MapView({ spots, onMapClick }) {
  const [active, setActive] = useState(null);

  const center = { lat: 36.7783, lng: -119.4179 };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
      <GoogleMap
        mapContainerStyle={mapStyle}
        center={center}
        zoom={6}
        options={{ styles: darkMap, disableDefaultUI: true, zoomControl: true }}
        onClick={(e) => onMapClick && onMapClick(e.latLng.lat(), e.latLng.lng())}
      >
        {spots.map((spot) =>
          spot.lat && spot.lng ? (
            <Marker
              key={spot.id}
              position={{ lat: spot.lat, lng: spot.lng }}
              onClick={() => setActive(spot)}
            />
          ) : null
        )}
        {active && (
          <InfoWindow
            position={{ lat: active.lat, lng: active.lng }}
            onCloseClick={() => setActive(null)}
          >
            <div style={{ background: "#111", color: "#f97316", padding: 8, borderRadius: 8 }}>
              <strong>{active.name}</strong>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{active.city}, {active.state}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{active.notes}</div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}