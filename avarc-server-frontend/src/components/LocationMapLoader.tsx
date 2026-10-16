"use client";

import dynamic from "next/dynamic";

// Leaflet touches the window when it is loaded, so the map is not rendered
// on the server.
export const LocationMapLoader = dynamic(() => import("./LocationMap"), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse rounded-lg bg-hover" aria-hidden="true" />,
});
