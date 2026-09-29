"use client";

import dynamic from "next/dynamic";

const StoresMap = dynamic(() => import("./StoresMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: "var(--map-h, 600px)" }}
      className="bg-stone-100 rounded-xl flex items-center justify-center"
    >
      <p className="text-stone-500">Загрузка карты...</p>
    </div>
  ),
});

export default StoresMap;