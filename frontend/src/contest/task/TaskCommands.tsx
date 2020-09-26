import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { client } from "src/TerryClient";
import { Loadable } from "src/Loadable";
import { notifyError } from "src/utils";
import { useToken, useActions } from "src/contest/ContestContext";
import {
  SubmissionList, TaskData, UserTaskData, InputData,
} from "src/contest/types";

type Props = {
  task: TaskData;
  userTask: UserTaskData;
  submissions: Loadable<SubmissionList>;
};

export function TaskCommands({ task, userTask, submissions }: Props) {
  const [input, setInput] = useState<Loadable<InputData> | null>(null);
  const token = useToken();
  const { reloadContest } = useActions();
  if (!token) throw new Error("You have to be logged in to see the Task Commands");

  const generateInput = () => {
    const data = new FormData();

    data.append("token", token);
    data.append("task", task.name);

    setInput(Loadable.loading());

    client.api
      .post("/generate_input", data)
      .then((response) => {
        setInput(Loadable.of(response.data));
        reloadContest();
      })
      .catch((response) => {
        notifyError(response);
        setInput(Loadable.error(response));
      });
  };

  const renderGenerateInputButton = () => {
    const button = (already: boolean) => (
      <button className="btn btn-success" type="button" onClick={() => generateInput()}>
        <FontAwesomeIcon icon={faPlus} />
        {" "}
        {already ? <Trans>Request new input</Trans> : <Trans>Request input</Trans>}
      </button>
    );

    return button(submissions.isReady() && submissions.value().items.length > 0);
  };

  if (userTask.current_input) {
    const currentInput = userTask.current_input;
    return (
      <>
        <a role="button" className="btn btn-primary" href={client.filesBaseURI + currentInput.path} download>
          <FontAwesomeIcon icon={faDownload} />
          {" "}
          <Trans>Download input</Trans>
        </a>
        {" "}
        <Link to={`/task/${task.name}/submit/${currentInput.id}`} role="button" className="btn btn-success">
          <FontAwesomeIcon icon={faUpload} />
          {" "}
          <Trans>Upload solution</Trans>
        </Link>
      </>
    );
  }
  if (input) {
    if (input.isLoading()) {
      return (
        <button disabled className="btn btn-success" type="button">
          <FontAwesomeIcon icon={faPlus} />
          {" "}
          <Trans>Requesting...</Trans>
        </button>
      );
    }
    if (input.isError()) {
      return <Trans>Error</Trans>;
    }
  }
  return renderGenerateInputButton();
}
