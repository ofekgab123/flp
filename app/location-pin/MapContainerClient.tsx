"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import type { LatLngTuple } from "leaflet";

function fixLeafletIcons() {
  if (typeof window === "undefined") return;
  const L = require("leaflet");
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

const MapContainerLeaflet = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

import { MapClickHandler } from "./MapView";
import { MapCenterUpdater } from "./MapCenterUpdater";

type MapContainerClientProps = {
  center: LatLngTuple;
  zoom?: number;
  position: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  isLoading?: boolean;
};

export function MapContainerClient({
  center,
  zoom = 15,
  position,
  onLocationSelect,
  isLoading = false,
}: MapContainerClientProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  return (
    <div className="relative h-full w-full min-h-[200px]">
      {isLoading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/70">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      <MapContainerLeaflet
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        <MapCenterUpdater center={[center[0], center[1]]} zoom={zoom} />
        {position && (
          <Marker position={[position.lat, position.lng]}>
            <Popup>נקודה נבחרת</Popup>
          </Marker>
        )}
      </MapContainerLeaflet>
    </div>
  );
}
