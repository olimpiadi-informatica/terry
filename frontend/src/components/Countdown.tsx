import React from "react";
import { DateTime } from "luxon";
import { useAutoRefresh } from "src/hooks/useAutoRefresh";

type CountdownProps = {
  end: DateTime;
  clock: () => DateTime;
  afterEnd: () => React.ReactNode;
};

export function Countdown({ end, clock, afterEnd }: CountdownProps) {
  useAutoRefresh(1000);
  const ended = end.diff(clock()).as("milliseconds") < 0;

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{ended ? afterEnd() : end.diff(clock()).toFormat("hh:mm:ss")}</>;
}
