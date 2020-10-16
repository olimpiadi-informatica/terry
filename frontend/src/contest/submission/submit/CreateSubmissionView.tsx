import React from "react";
import { Trans } from "@lingui/macro";
import { TaskData, UserTaskData } from "src/types/contest";
import { Submit } from "./Submit";

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
