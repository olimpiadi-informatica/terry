import * as React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import ModalView from "../Modal";
import { FeedbackView } from "./FeedbackView";
import { TaskData } from "./ContestContext";
import { useSubmission } from "./hooks/useSubmission";
import Loading from "../Loading";

type Props = {
  submissionId: string;
  task: TaskData;
};

export function SubmissionReportView({ submissionId, task }: Props) {
  const submission = useSubmission(submissionId);

  const returnUrl = `/task/${task.name}`;
  return (
    <ModalView contentLabel="Submission creation" returnUrl={returnUrl}>
      <div className="modal-header">
        <h5 className="modal-title">
          <Trans>Submission</Trans>
          {" "}
          <strong>{submissionId}</strong>
        </h5>
        <Link to={returnUrl} role="button" className="close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </Link>
      </div>
      <div className="modal-body">
        {submission.isLoading() && <Loading />}
        {submission.isError() && <Trans>Error</Trans>}
        {submission.isReady() && <FeedbackView submission={submission.value()} task={task} />}
      </div>
      <div className="modal-footer">
        <Link to={returnUrl} role="button" className="btn btn-primary">
          <FontAwesomeIcon icon={faTimes} />
          {" "}
          <Trans>Close</Trans>
        </Link>
      </div>
    </ModalView>
  );
}
