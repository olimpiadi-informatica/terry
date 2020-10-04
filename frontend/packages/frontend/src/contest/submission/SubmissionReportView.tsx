import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { Modal } from "@terry/shared/_/components/Modal";
import { Loading } from "@terry/shared/_/components/Loading";
import { TaskData } from "@terry/shared/_/types/contest";
import { useSubmission } from "src/contest/hooks/useSubmission";
import { FeedbackView } from "./FeedbackView";

type Props = {
  submissionId: string;
  task: TaskData;
};

export function SubmissionReportView({ submissionId, task }: Props) {
  const submission = useSubmission(submissionId);

  const returnUrl = `/task/${task.name}`;
  return (
    <Modal contentLabel="Submission creation" returnUrl={returnUrl}>
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
    </Modal>
  );
}
