import React from "react";
import { Trans } from "@lingui/macro";
import { Route } from "react-router-dom";
import { TaskData, UserTaskData } from "src/types/contest";
import { useStatement } from "src/contest/hooks/useStatement";
import { CreateSubmissionView } from "src/contest/submission/submit/CreateSubmissionView";
import { SubmissionReportView } from "src/contest/submission/SubmissionReportView";
import { SubmissionListView } from "src/contest/submission/SubmissionListView";
import { useSubmissionList } from "src/contest/hooks/useSubmissionList";
import { Loading } from "src/components/Loading";
import { TaskCommands } from "./TaskCommands";
import { TaskStatementView } from "./TaskStatementView";
import { LastSubmission } from "./LastSubmission";

type Props = {
  task: TaskData;
  userTask: UserTaskData;
};

export function TaskView({ task, userTask }: Props) {
  const statement = useStatement(task.statement_path);
  const [submissions] = useSubmissionList(task.name);

  const renderTaskStatement = () => {
    if (statement.isLoading()) {
      return <Loading />;
    }
    if (statement.isError()) {
      return (
        <p>
          <Trans>Failed to load task statement. Try reloading the page.</Trans>
        </p>
      );
    }
    return <TaskStatementView task={task} source={statement.value()} />;
  };
  return (
    <>
      <h1>{task.title}</h1>
      <TaskCommands task={task} userTask={userTask} submissions={submissions} />

      <Route
        path="/task/:taskName/submit/:inputId"
        render={({ match }) => <CreateSubmissionView inputId={match.params.inputId} task={task} userTask={userTask} />}
      />
      <Route path="/task/:taskName/submissions" render={() => <SubmissionListView task={task} />} />
      <Route
        path="/task/:taskName/submission/:submissionId"
        render={({ match }) => <SubmissionReportView submissionId={match.params.submissionId} task={task} />}
      />

      {submissions.isReady() && <LastSubmission task={task} submissions={submissions.value().items} />}

      <hr />

      {renderTaskStatement()}
    </>
  );
}
