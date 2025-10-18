"use client";
import { useEffect, useRef } from "react";

export default function useShake({
  onShake,
  threshold = 18,
  cooldown = 800,
} = {}) {
  const last = useRef({ x: null, y: null, z: null, t: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cooling = false;

    function handleMotion(e) {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;

      const { x, y, z } = acc;
      const { x: lx, y: ly, z: lz } = last.current;

      if (lx === null || ly === null || lz === null) {
        last.current = { x, y, z, t: Date.now() };
        return;
      }

      const delta = Math.abs(x - lx) + Math.abs(y - ly) + Math.abs(z - lz);

      if (!cooling && delta > threshold) {
        cooling = true;
        onShake?.();
        setTimeout(() => (cooling = false), cooldown);
      }

      last.current = { x, y, z, t: Date.now() };
    }

    window.addEventListener("devicemotion", handleMotion, { passive: true });
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [onShake, threshold, cooldown]);
}
