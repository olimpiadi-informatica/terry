import { DateTime } from "luxon";
import React from "react";
import ReactMarkdown from "react-markdown";
import { useContest } from "./ContestContext";
import { HomeInfo } from "./help/HomeInfo";

export function ContestHome() {
  const contest = useContest().value();

  const startTime = contest.contest.start_time ? DateTime.fromISO(contest.contest.start_time, { zone: "utc" }) : null;

  return (
    <>
      <h1>{contest.contest.name}</h1>
      <ReactMarkdown source={contest.contest.description} />
      <hr />
      <HomeInfo hasStarted={contest.contest.has_started} startTime={startTime} />
    </>
  );
}
