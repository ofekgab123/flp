"use client";

import { useMapEvents } from "react-leaflet";

type MapClickHandlerProps = {
  onLocationSelect: (lat: number, lng: number) => void;
};

export function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
