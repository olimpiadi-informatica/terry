import React from "react";
import { Route } from "react-router-dom";
import { Error } from "src/components/Error";
import { Loading } from "src/components/Loading";
import { useStatement } from "src/contest/hooks/useStatement";
import { useSubmissionList } from "src/contest/hooks/useSubmissionList";
import { SubmissionListView } from "src/contest/submission/SubmissionListView";
import { SubmissionReportView } from "src/contest/submission/SubmissionReportView";
import { CreateSubmissionView } from "src/contest/submission/submit/CreateSubmissionView";
import { CurrentInputExpiration } from "src/contest/task/CurrentInputExpiration";
import { TaskData, UserTaskData } from "src/types/contest";
import { LastSubmission } from "./LastSubmission";
import { TaskCommands } from "./TaskCommands";
import { TaskStatement } from "./TaskStatement";

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
      return <Error cause={statement.error()} />;
    }
    return <TaskStatement task={task} source={statement.value()} />;
  };
  return (
    <>
      <h1>{task.title}</h1>
      <div className="mb-2">
        <TaskCommands task={task} userTask={userTask} submissions={submissions} />
        {userTask.current_input && (
          <CurrentInputExpiration currentInput={userTask.current_input} />
        )}
      </div>
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

      <hr className="mt-1" />

      {renderTaskStatement()}
    </>
  );
}
