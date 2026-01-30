"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapCenterUpdaterProps = {
  center: [number, number];
  zoom?: number;
};

export function MapCenterUpdater({
  center,
  zoom = 15,
}: MapCenterUpdaterProps) {
  const map = useMap();
  const latLng: [number, number] = [center[0], center[1]];

  useEffect(() => {
    map.flyTo(latLng, zoom, { duration: 1.5 });
  }, [map, center[0], center[1], zoom]);

  return null;
}
