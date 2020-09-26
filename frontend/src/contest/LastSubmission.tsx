import React from "react";
import { Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { DateComponent } from "../datetime.views";
import { TaskData, useServerTime } from "./ContestContext";
import useSubmissionList from "./useSubmissionList.hook";

type Props = {
  task: TaskData;
};

export default function LastSubmission({ task }: Props) {
  const serverTime = useServerTime();
  const subs = useSubmissionList(task.name);

  if (subs.isError()) {
    return (
      <div className="terry-submission-list-button">
        <em>
          <Trans>Loading submission list failed, reload page.</Trans>
        </em>
      </div>
    );
  }
  if (subs.isLoading()) return null;

  const { items } = subs.value();
  if (items.length === 0) {
    return null;
  }
  const submission = items[items.length - 1];
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
