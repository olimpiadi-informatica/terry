import { DateTime } from "luxon";
import React from "react";
import { Markdown } from "src/components/Markdown";
import { useStatus } from "./ContestContext";
import { HomeInfo } from "./help/HomeInfo";

export function ContestHome() {
  const status = useStatus().value();

  const startTime = DateTime.fromISO(status.contest.time.start, {
    zone: "utc",
  });

  return (
    <>
      <h1>{status.contest.name}</h1>
      <Markdown source={status.contest.description} />
      <hr />
      <HomeInfo hasStarted={status.contest.has_started} startTime={startTime} />
    </>
  );
}
