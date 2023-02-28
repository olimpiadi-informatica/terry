import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import React, { useState } from "react";
import { Error } from "src/components/Error";
import { useActions, useToken } from "src/contest/ContestContext";
import { Loadable } from "src/Loadable";
import { client } from "src/TerryClient";
import {
  InputData,
  SubmissionList,
  TaskData,
  UserTaskData,
} from "src/types/contest";
import { notifyError } from "src/utils";
import { CurrentInputCommands } from "./CurrentInputCommands";

type Props = {
  task: TaskData;
  userTask: UserTaskData;
  submissions: Loadable<SubmissionList>;
};

export function TaskCommands({ task, userTask, submissions }: Props) {
  const [input, setInput] = useState<Loadable<InputData> | null>(null);
  const token = useToken();
  const { reloadContest } = useActions();
  if (!token) throw new window.Error("You have to be logged in to see the Task Commands");

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

    return button(
      submissions.isReady() && submissions.value().items.length > 0,
    );
  };

  if (userTask.current_input) {
    const currentInput = userTask.current_input;
    return <CurrentInputCommands currentInput={currentInput} task={task} />;
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
    if (input.isError()) return <Error cause={input.error()} />;
  }
  return renderGenerateInputButton();
}
