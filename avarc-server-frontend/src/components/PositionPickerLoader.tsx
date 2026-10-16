"use client";

import dynamic from "next/dynamic";

export const PositionPickerLoader = dynamic(() => import("./PositionPicker"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-lg bg-hover" aria-hidden="true" />,
});
