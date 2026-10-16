"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "../i18n/navigation";

export type MapPoint = { id: string; latitude: number; longitude: number; name: string };

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// Keeps every point in view; a single point gets a fixed zoom.
function Fit({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [32, 32] });
    }
  }, [map, points]);
  return null;
}

// A Leaflet map with a marker per point. With links, a marker's popup links
// to the page of the location. Drawn in the browser only (Leaflet needs it).
export default function LocationMap({
  points,
  label,
  linked = true,
  className = "h-96",
}: {
  points: MapPoint[];
  label: string;
  linked?: boolean;
  className?: string;
}) {
  return (
    <MapContainer
      center={[48, 10]}
      zoom={4}
      scrollWheelZoom={false}
      aria-label={label}
      className={`z-0 w-full rounded-lg ring-1 ring-line ${className}`}
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      <Fit points={points} />
      {points.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.latitude, point.longitude]}
          radius={8}
          // Leaflet adds the class when it creates the marker; through
          // pathOptions it would be set too late and ignored.
          className="location-marker"
        >
          <Popup>
            {linked ? (
              <Link href={`/locations/${point.id}`} className="font-medium underline">
                {point.name}
              </Link>
            ) : (
              <strong>{point.name}</strong>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
