"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/client";

function MapLoading() {
  const t = useT();
  return (
    <div style={{ height: "var(--map-h, 600px)" }} className="bg-stone-100 rounded-xl flex items-center justify-center">
      <p className="text-stone-500">{t.map.loading}</p>
    </div>
  );
}

const StoresMap = dynamic(() => import("./StoresMap"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export default StoresMap;
