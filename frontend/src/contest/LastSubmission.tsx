import React from "react";
import { Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { DateComponent } from "../datetime.views";
import { UserTaskData, TaskData, useServerTime } from "./ContestContext";
import Loadable from "../admin/Loadable";

type Props = {
  task: TaskData;
  userTask: UserTaskData;
};

export default function LastSubmission({ task, userTask }: Props) {
  const serverTime = useServerTime();
  const subs = Loadable.loading();

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

  const items = subs.value();
  return null;
//   if (items.length === 0) {
//     return null;
//   } else {
//     const submission = items[items.length - 1];
//     return (
//       <div className="terry-submission-list-button">
//         <strong>
//           <Trans>Last submission:</Trans>
//         </strong>{" "}
//         <DateComponent clock={() => serverTime()} date={DateTime.fromISO(submission.date)} /> (
//         <Link to={"/task/" + task.name + "/submissions"}>
//           <Trans>view all submissions</Trans>
//         </Link>
//         )
//       </div>
//     );
//   }
}
