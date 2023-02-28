import { useEffect } from "react";
import { useTriggerUpdate } from "./useTriggerUpdate";

export function useAutoRefresh(rate: number | null) {
  const [update, trigger] = useTriggerUpdate();
  useEffect(() => {
    if (rate === null) return undefined;
    const timer = setInterval(() => trigger(), rate);
    return () => clearInterval(timer);
  }, [rate, trigger, update]);
}
