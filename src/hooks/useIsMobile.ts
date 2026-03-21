"use client";

import { useSyncExternalStore } from "react";

const MD_MEDIA_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MD_MEDIA_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot() {
  return !window.matchMedia(MD_MEDIA_QUERY).matches;
}

function getServerSnapshot() {
  return true;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
