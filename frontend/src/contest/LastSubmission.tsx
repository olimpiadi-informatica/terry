import React from "react";
import { Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { DateComponent } from "src/datetime.views";
import { TaskData, useServerTime } from "./ContestContext";
import { Submission } from "./hooks/useSubmission";

type Props = {
  task: TaskData;
  submissions: Submission[];
};

export function LastSubmission({ task, submissions }: Props) {
  const serverTime = useServerTime();

  if (submissions.length === 0) {
    return null;
  }
  const submission = submissions[submissions.length - 1];
  return (
    <div className="terry-submission-list-button mt-2">
      <strong>
        <Trans>Last submission:</Trans>
      </strong>
      {" "}
      <DateComponent clock={() => serverTime()} date={DateTime.fromISO(submission.date)} />
      {" "}
      (
      <Link to={`/task/${task.name}/submissions`}>
        <Trans>view all submissions</Trans>
      </Link>
      )
    </div>
  );
}
