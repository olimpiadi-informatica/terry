import React from "react";
import { t } from "@lingui/macro";
import { TaskData, UserTaskData } from "src/types/contest";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";
import { Submit } from "./Submit";

type Props = {
  inputId: string;
  task: TaskData;
  userTask: UserTaskData;
};

export function CreateSubmissionView({ inputId, task, userTask }: Props) {
  const currentInput = userTask.current_input;
  if (currentInput === null || currentInput.id !== inputId) {
    toast.error(t({ message: "Cannot submit for this input." }));
    return <Navigate to={`/task/${task.name}`} />;
  }

  return <Submit task={task} currentInput={currentInput} />;
}
