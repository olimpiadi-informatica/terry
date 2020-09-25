import { useState } from "react";

/**
 * ```
 * const [dep, trigger] = useTriggerUpdate();
 *
 * useEffect(() => {
 *   // ...
 * }, [dep]);
 *
 * // call trigger() to trigger the useEffect update
 * ```
 */
export default function useTriggerUpdate() {
  const [count, setCount] = useState(0);
  return [count, () => setCount(count + 1)] as const;
}
