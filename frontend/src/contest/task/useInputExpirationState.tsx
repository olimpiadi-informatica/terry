import { InputData } from "src/types/contest";
import { useServerTime } from "src/contest/ContestContext";
import { useAutoRefresh } from "src/hooks/useAutoRefresh";
import { DateTime } from "luxon";
import { useMemo } from "react";

export function useInputExpirationState(currentInput: InputData | null) {
  const serverTime = useServerTime();
  const now = serverTime();

  const date = !currentInput || currentInput.expiry_date === null
    ? null
    : DateTime.fromISO(currentInput.expiry_date, { zone: "utc" });

  const hasExpired = date !== null && date <= now;
  const willExpireSoon = date !== null && date > now && date < now.plus({ minutes: 3 });

  const refreshRate = useMemo(() => {
    if (!date || hasExpired) return null;
    if (date.diff(now).as("minutes") <= 1) return 1000;
    return 30000;
  }, [date, hasExpired, now]);

  useAutoRefresh(refreshRate);

  return {
    isValid: date === null || !hasExpired,
    expiration: date && {
      date,
      hasExpired,
      willExpireSoon,
    },
  };
}
