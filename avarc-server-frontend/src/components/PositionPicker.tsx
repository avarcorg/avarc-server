"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { mapAttribution } from "../lib/mapAttribution";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function Clicks({ onPick }: { onPick: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

// Moves the view when the position is typed into the fields.
function Follow({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 10));
  }, [map, latitude, longitude]);
  return null;
}

// A map to place a point on: a click sets the position, which the form's
// fields show and can change by hand. Drawn in the browser only.
export default function PositionPicker({
  latitude,
  longitude,
  onPick,
  label,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (latitude: number, longitude: number) => void;
  label: string;
}) {
  const t = useTranslations("Map");
  const products = useTranslations("Products");
  return (
    <MapContainer
      center={latitude !== null && longitude !== null ? [latitude, longitude] : [48, 10]}
      zoom={latitude !== null ? 12 : 4}
      scrollWheelZoom={false}
      aria-label={label}
      className="z-0 h-72 w-full cursor-crosshair rounded-lg ring-1 ring-line"
    >
      <TileLayer url={TILES} attribution={mapAttribution(products("openStreetMap"), t("contributors"))} maxZoom={19} />
      <Clicks onPick={onPick} />
      {latitude !== null && longitude !== null && (
        <>
          <Follow latitude={latitude} longitude={longitude} />
          <CircleMarker center={[latitude, longitude]} radius={8} className="location-marker" />
        </>
      )}
    </MapContainer>
  );
}
