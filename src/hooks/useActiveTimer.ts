import { useEffect, useState } from "react";
import type { ActiveTimer } from "../lib/types";

const storageKey = "timepast.activeTimer";

export function useActiveTimer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (activeTimer) localStorage.setItem(storageKey, JSON.stringify(activeTimer));
    else localStorage.removeItem(storageKey);
  }, [activeTimer]);

  return [activeTimer, setActiveTimer] as const;
}
