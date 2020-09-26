import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { client } from "src/TerryClient";
import { ModalView } from "src/Modal";
import "./Submit.css";
import { Loadable } from "src/Loadable";
import { notifyError } from "src/utils";
import { SourceSelector, UploadedSource } from "./SourceSelector";
import { TaskData, useActions } from "./ContestContext";
import { OutputSelector, UploadedOutput } from "./OutputSelector";

type Props = {
  inputId: string;
  task: TaskData;
};

export function Submit({ inputId, task }: Props) {
  const [source, setSource] = useState<UploadedSource | null>(null);
  const [output, setOutput] = useState<UploadedOutput | null>(null);
  const [submission, setSubmission] = useState<Loadable<unknown> | null>(null);
  const { reloadContest } = useActions();
  const history = useHistory();

  const submit = () => {
    if (!source || !output) throw new Error("Cannot submit without both source and output");

    const data = new FormData();

    data.append("input_id", inputId);
    data.append("source_id", source.id);
    data.append("output_id", output.id);

    setSubmission(Loadable.loading());
    client.api
      .post("/submit", data)
      .then((response) => {
        const { id } = response.data;
        history.push(`/task/${task.name}/submission/${id}`);
        reloadContest();
      })
      .catch((response) => {
        notifyError(response);
        setSubmission(Loadable.error(response));
      });
  };

  const canSubmit = () => source != null && output != null;

  return (
    <ModalView contentLabel="Submission creation" returnUrl={`/task/${task.name}`}>
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
            <strong>{inputId.slice(0, 6)}</strong>
          </h5>
          <Link to={`/task/${task.name}`} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <SourceSelector inputId={inputId} setSource={setSource} />
          </div>
          <div className="input-group">
            <OutputSelector inputId={inputId} setOutput={setOutput} />
          </div>
        </div>
        <div className="modal-footer">
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
    </ModalView>
  );
}
