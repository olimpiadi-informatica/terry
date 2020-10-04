import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { client } from "@terry/shared/_/TerryClient";
import { Modal } from "@terry/shared/_/components/Modal";
import "./Submit.css";
import { Loadable } from "@terry/shared/_/Loadable";
import { notifyError } from "@terry/shared/_/utils";
import { useActions } from "src/contest/ContestContext";
import { UploadedSource, UploadedOutput, TaskData } from "src/contest/types";
import { useSubmissionList } from "src/contest/hooks/useSubmissionList";
import { SourceSelector } from "./SourceSelector";
import { OutputSelector } from "./OutputSelector";

type Props = {
  inputId: string;
  task: TaskData;
};

export function Submit({ inputId, task }: Props) {
  const [source, setSource] = useState<UploadedSource | null>(null);
  const [output, setOutput] = useState<UploadedOutput | null>(null);
  const [submission, setSubmission] = useState<Loadable<unknown> | null>(null);
  const reloadSubmissionList = useSubmissionList(task.name)[1];
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
        reloadSubmissionList();
      })
      .catch((response) => {
        notifyError(response);
        setSubmission(Loadable.error(response));
      });
  };

  const canSubmit = () => source != null && output != null;

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
    </Modal>
  );
}
