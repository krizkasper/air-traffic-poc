import { useRef } from "react";
import { Marker, type Map } from "maplibre-gl";

type LocateButtonProps = {
  map: Map | null;
};

export function LocateButton({ map }: LocateButtonProps) {
  const userMarkerRef = useRef<Marker | null>(null);

  const handleClick = () => {
    if (!map) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const lngLat: [number, number] = [longitude, latitude];

        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(lngLat);
        } else {
          userMarkerRef.current = new Marker({ color: "#3fb6ff" })
            .setLngLat(lngLat)
            .addTo(map);
        }

        map.flyTo({
          center: lngLat,
          zoom: 14,
          essential: true,
        });
      },
      (error) => {
        console.error("Geolocation failed:", error);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <button
      className="px-4 py-2 bg-blue-950/40 text-white text-sm font-medium backdrop-blur-md border border-white/20 rounded shadow-lg hover:bg-blue-950/60 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      Locate Me
    </button>
  );
}
