import React from "react";
import { Trans } from "@lingui/macro";
import { Submit } from "./Submit";
import { TaskData, UserTaskData } from "./ContestContext";

type Props = {
  inputId: string;
  task: TaskData;
  userTask: UserTaskData;
};

export function CreateSubmissionView({ inputId, task, userTask }: Props) {
  if (userTask.current_input === null || userTask.current_input.id !== inputId) {
    return (
      <p>
        <Trans>Cannot submit for this input.</Trans>
      </p>
    );
  }

  return <Submit inputId={inputId} task={task} />;
}
