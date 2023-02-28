import {
  faDownload,
  faTimes,
  faUpload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trans } from "@lingui/macro";
import React from "react";
import { Link } from "react-router-dom";
import { useActions, useToken } from "src/contest/ContestContext";
import { client } from "src/TerryClient";
import { InputData, TaskData } from "src/types/contest";
import { notifyError } from "src/utils";
import { useInputExpirationState } from "./useInputExpirationState";

export function CurrentInputCommands({
  currentInput,
  task,
}: {
  currentInput: InputData;
  task: TaskData;
}) {
  const token = useToken();
  const { reloadContest } = useActions();

  if (!token) { throw new window.Error("You have to be logged in to see CurrentInputCommands"); }

  const abandonInput = () => {
    const data = new FormData();

    data.append("token", token);
    data.append("input_id", currentInput.id);

    client.api
      .post("/abandon_input", data)
      .then(() => {
        reloadContest();
      })
      .catch((response) => {
        notifyError(response);
      });
  };

  const { isValid, expiration } = useInputExpirationState(currentInput);

  return (
    <>
      {expiration?.hasExpired && (
        <>
          {" "}
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => abandonInput()}
          >
            <FontAwesomeIcon icon={faTimes} />
            {" "}
            <Trans>Abandon this expired input</Trans>
          </button>
          {" "}
          <a
            role="button"
            className="btn btn-outline-primary ml-4"
            href={client.filesBaseURI + currentInput.path}
            download
          >
            <FontAwesomeIcon icon={faDownload} />
            {" "}
            <Trans>Download expired input</Trans>
          </a>
        </>
      )}
      {isValid && (
        <>
          {" "}
          <a
            role="button"
            className="btn btn-primary"
            href={client.filesBaseURI + currentInput.path}
            download
          >
            <FontAwesomeIcon icon={faDownload} />
            {" "}
            <Trans>Download input</Trans>
          </a>
          {" "}
          <Link
            to={`/task/${task.name}/submit/${currentInput.id}`}
            role="button"
            className="btn btn-success"
          >
            <FontAwesomeIcon icon={faUpload} />
            {" "}
            <Trans>Upload solution</Trans>
          </Link>
        </>
      )}
      {expiration?.willExpireSoon && (
        <>
          {" "}
          <button
            className="btn btn-outline-secondary ml-4"
            type="button"
            onClick={() => abandonInput()}
          >
            <FontAwesomeIcon icon={faTimes} />
            {" "}
            <Trans>Abandon this input now</Trans>
          </button>
        </>
      )}
    </>
  );
}
