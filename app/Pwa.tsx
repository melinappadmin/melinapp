"use client";

import { useEffect } from "react";

export default function Pwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    async function removeLegacyWorker() {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("melin-")).map((key) => caches.delete(key)));
      }
    }

    removeLegacyWorker().catch(() => undefined);
  }, []);

  return null;
}
