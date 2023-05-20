import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { client } from "src/TerryClient";
import { Modal } from "src/components/Modal";
import "./Submit.css";
import { Loadable } from "src/Loadable";
import { notifyError } from "src/utils";
import { useActions } from "src/contest/ContestContext";
import {
  UploadedSource, UploadedOutput, TaskData, InputData,
} from "src/types/contest";
import { useSubmissionList } from "src/contest/hooks/useSubmissionList";
import { useInputExpirationState } from "src/contest/task/useInputExpirationState";
import { CurrentInputExpiration } from "src/contest/task/CurrentInputExpiration";
import { SourceSelector } from "./SourceSelector";
import { OutputSelector } from "./OutputSelector";

type Props = {
  task: TaskData;
  currentInput: InputData;
};

export function Submit({ task, currentInput }: Props) {
  const [source, setSource] = useState<UploadedSource | null>(null);
  const [output, setOutput] = useState<UploadedOutput | null>(null);
  const [submission, setSubmission] = useState<Loadable<unknown> | null>(null);
  const reloadSubmissionList = useSubmissionList(task.name)[1];
  const { reloadContest } = useActions();
  const navigate = useNavigate();

  const submit = () => {
    if (!source || !output) throw new Error("Cannot submit without both source and output");

    const data = new FormData();

    data.append("input_id", currentInput?.id);
    data.append("source_id", source.id);
    data.append("output_id", output.id);

    setSubmission(Loadable.loading());
    client.api
      .post("/submit", data)
      .then((response) => {
        const { id } = response.data;
        navigate(`/task/${task.name}/submission/${id}`);
        reloadContest();
        reloadSubmissionList();
      })
      .catch((response) => {
        notifyError(response);
        setSubmission(Loadable.error(response));
      });
  };

  const { isValid } = useInputExpirationState(currentInput);

  const canSubmit = () => isValid && source != null && output != null;

  return (
    <Modal contentLabel="Submission creation" returnUrl={`/task/${task.name}`}>
      <form
        className="submissionForm"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="modal-header">
          <h5 className="modal-title">
            <Trans>Submission for input</Trans>
            {" "}
            <strong>{currentInput.id.slice(0, 6)}</strong>
          </h5>
          <Link to={`/task/${task.name}`} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <SourceSelector inputId={currentInput.id} setSource={setSource} />
          </div>
          <div className="input-group">
            <OutputSelector inputId={currentInput.id} setOutput={setOutput} />
          </div>
        </div>
        <div className="modal-footer">
          <CurrentInputExpiration currentInput={currentInput} />
          {submission && submission.isLoading() && <Trans>Processing...</Trans>}
          <Link to={`/task/${task.name}`} role="button" className="btn btn-danger">
            <FontAwesomeIcon icon={faTimes} />
            {" "}
            <Trans>Cancel</Trans>
          </Link>
          <button type="submit" className="btn btn-success" disabled={!canSubmit()}>
            <FontAwesomeIcon icon={faPaperPlane} />
            {" "}
            <Trans>Submit</Trans>
          </button>
        </div>
      </form>
    </Modal>
  );
}
