import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { useState } from "react";

const darkMap = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d44" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a1a" }] },
];

export default function MapView({ spots, onMapClick, isPinMode = false, pinnedLocation = null, focusSpot = null }) {
  const [active, setActive] = useState(null);
  const center = spots.length > 0 && spots[0].lat ? { lat: spots[0].lat, lng: spots[0].lng } : { lat: 36.7783, lng: -119.4179 };

  const mapStyle = {
    width: "100%",
    height: isPinMode ? "650px" : "70vh",
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
      <GoogleMap
        mapContainerStyle={mapStyle}
        center={focusSpot && focusSpot.lat && focusSpot.lat !== 0 ? { lat: focusSpot.lat, lng: focusSpot.lng } : pinnedLocation && isPinMode ? pinnedLocation : center}
        zoom={focusSpot && focusSpot.lat && focusSpot.lat !== 0 ? 15 : isPinMode ? 5 : 5}
        options={{
          styles: darkMap,
          disableDefaultUI: true,
          zoomControl: true,
          cursor: isPinMode ? "crosshair" : "default",
        }}
        onClick={(e) => onMapClick && onMapClick(e.latLng.lat(), e.latLng.lng())}
      >
        {/* Show dropped pin in add mode */}
        {isPinMode && pinnedLocation && (
          <Marker
            position={pinnedLocation}
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
              fillColor: "#f97316",
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 1.5,
            }}
          />
        )}
        {/* Show all spots in browse mode */}
        {!isPinMode && spots.map((spot) =>
          spot.lat && spot.lng && spot.lat !== 0 ? (
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
              {active.lat && active.lat !== 0 && (
  <a
    href={`https://www.google.com/maps/dir/?api=1&destination=${active.lat},${active.lng}`}
    target="_blank"
    rel="noreferrer"
    style={{ 
      display: "block", marginTop: 8, color: "#22c55e", 
      fontSize: 11, fontWeight: 700, textDecoration: "none" 
    }}
  >
    🗺️ Get Directions
  </a>
)}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}