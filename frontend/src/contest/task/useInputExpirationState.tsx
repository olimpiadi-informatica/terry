import { InputData } from "src/types/contest";
import { useServerTime } from "src/contest/ContestContext";
import { useAutoRefresh } from "src/hooks/useAutoRefresh";
import { DateTime } from "luxon";

export function useInputExpirationState(currentInput: InputData) {
  const serverTime = useServerTime();
  const now = serverTime();

  const date = currentInput.expiry_date === null
    ? null
    : DateTime.fromISO(currentInput.expiry_date, { zone: "utc" });

  const hasExpired = date !== null && date <= now;
  const willExpireSoon = date !== null && date > now && date < now.plus({ minutes: 2 });

  useAutoRefresh(date && !hasExpired ? 30000 : null);

  return {
    isValid: date === null || !hasExpired,
    expiration: date && {
      date,
      hasExpired,
      willExpireSoon,
    },
  };
}
