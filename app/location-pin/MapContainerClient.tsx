"use client";

import { useCallback, useEffect, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type MapContainerClientProps = {
  center: [number, number];
  zoom?: number;
  position: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  isLoading?: boolean;
};

const mapContainerStyle = { width: "100%", height: "100%" };

/** Google Maps JS API (client key; restrict by HTTP referrer in Cloud Console). */
const GOOGLE_MAPS_API_KEY = "AIzaSyApUhkvnyJe4bPKIv8BquWpaIbMcjgcZQM";

export function MapContainerClient({
  center,
  zoom = 15,
  position,
  onLocationSelect,
  isLoading = false,
}: MapContainerClientProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: "he",
    region: "IL",
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const [lat, lng] = center;
    map.panTo({ lat, lng });
    map.setZoom(zoom);
  }, [center[0], center[1], zoom]);

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onLocationSelect(e.latLng.lat(), e.latLng.lng());
      }
    },
    [onLocationSelect]
  );

  const centerLatLng = { lat: center[0], lng: center[1] };

  if (loadError) {
    return (
      <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-slate-100 p-4 text-center text-sm text-red-600">
        <p>לא ניתן לטעון את Google Maps. בדקו את המפתח והרשאות ה-API.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative flex h-full min-h-[200px] w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-[200px]">
      {isLoading && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-white/70">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={centerLatLng}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleClick}
        options={{
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {position && (
          <Marker position={{ lat: position.lat, lng: position.lng }} />
        )}
      </GoogleMap>
    </div>
  );
}
