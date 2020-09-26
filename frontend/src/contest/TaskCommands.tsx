import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { Link } from "react-router-dom";
import { TaskData, UserTaskData } from "./ContestContext";
import client from "../TerryClient";

type Props = {
  task: TaskData;
  userTask: UserTaskData;
};

export default function TaskCommands({ task, userTask }: Props) {
  const [generating, setGenerating] = useState(false);

  const generateInput = () => {
    // TODO: generate input
    setGenerating(true);
  };

  const renderGenerateInputButton = () => {
    const button = (already: boolean) => (
      <button className="btn btn-success" type="button" onClick={() => generateInput()}>
        <FontAwesomeIcon icon={faPlus} />
        {" "}
        {already ? <Trans>Request new input</Trans> : <Trans>Request input</Trans>}
      </button>
    );

    // TODO: pass subs.length > 0
    return button(false);
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
  if (generating) {
    return (
      <button disabled className="btn btn-success" type="button">
        <FontAwesomeIcon icon={faPlus} />
        {" "}
        <Trans>Requesting...</Trans>
      </button>
    );
  }
  // TODO: show error
  return renderGenerateInputButton();
}
