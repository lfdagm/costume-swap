"use client";

import { useEffect } from "react";

// Counts one visit per browser session. Nothing is shown to visitors.
export function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("counted")) return;
      sessionStorage.setItem("counted", "1");
      let id = localStorage.getItem("visitor-id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("visitor-id", id);
      }
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Storage blocked (e.g. strict private mode): just don't count.
    }
  }, []);

  return null;
}
