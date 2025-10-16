import React from "react";
import { useParams } from "react-router-dom";
import { Trans } from "@lingui/macro";
import { Loading } from "src/components/Loading";
import { TaskView } from "src/contest/task/TaskView";
import { useStatus } from "./ContestContext";

export function RenderTask() {
  const status = useStatus();
  const { taskName } = useParams() as { taskName: string };

  if (status.isLoading()) return <Loading />;
  if (status.isError()) return <Trans>Error loading contest</Trans>;

  const { contest } = status.value();
  const task = contest.tasks?.find((t) => t.name === taskName);
  if (!task) {
    return <Trans>Task not found</Trans>;
  }
  const userTask = status.value().user?.tasks[taskName] || {
    name: taskName,
    score: 0,
    current_input: null,
  };
  return <TaskView task={task} userTask={userTask} />;
}
