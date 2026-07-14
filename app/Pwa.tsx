"use client";

import { useEffect } from "react";

export default function Pwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => undefined);
  }, []);

  return null;
}
