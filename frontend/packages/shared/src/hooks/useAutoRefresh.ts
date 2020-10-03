import { useEffect } from "react";
import { useTriggerUpdate } from "./useTriggerUpdate";

export function useAutoRefresh(rate: number) {
  const [update, trigger] = useTriggerUpdate();
  useEffect(() => {
    const timer = setInterval(() => trigger(), rate);
    return () => clearInterval(timer);
  }, [rate, trigger, update]);
}