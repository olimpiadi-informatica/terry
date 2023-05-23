import React, { useCallback } from "react";
import { Route, Routes, useParams } from "react-router-dom";
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

function CreateSubmission({
  task,
  userTask,
}: {
  task: TaskData;
  userTask: UserTaskData;
}) {
  const { inputId } = useParams();
  return (
    <CreateSubmissionView
      task={task}
      userTask={userTask}
      inputId={inputId ?? "?"}
    />
  );
}

function SubmissionReport({ task }: { task: TaskData }) {
  const { submissionId } = useParams();
  return (
    <SubmissionReportView submissionId={submissionId ?? "?"} task={task} />
  );
}

export function TaskView({ task, userTask }: Props) {
  const statement = useStatement(task.statement_path);
  const [submissions] = useSubmissionList(task.name);

  const renderTaskStatement = useCallback(() => {
    if (statement.isLoading()) {
      return <Loading />;
    }
    if (statement.isError()) {
      return <Error cause={statement.error()} />;
    }
    return <TaskStatement task={task} source={statement.value()} />;
  }, [statement, task]);

  return (
    <>
      <h1>{task.title}</h1>
      <div className="mb-2">
        <TaskCommands
          task={task}
          userTask={userTask}
          submissions={submissions}
        />
        {userTask.current_input && (
          <CurrentInputExpiration currentInput={userTask.current_input} />
        )}
      </div>
      <Routes>
        <Route
          path="/submit/:inputId"
          element={<CreateSubmission task={task} userTask={userTask} />}
        />
        <Route path="/submissions" element={<SubmissionListView task={task} />} />
        <Route
          path="/submission/:submissionId"
          element={<SubmissionReport task={task} />}
        />
      </Routes>

      {submissions.isReady() && (
        <LastSubmission task={task} submissions={submissions.value().items} />
      )}

      <hr className="mt-1" />

      {renderTaskStatement()}
    </>
  );
}
