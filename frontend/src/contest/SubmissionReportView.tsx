import * as React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ModalView from "../Modal";
import FeedbackView from "./FeedbackView";
import PromiseView from "../PromiseView";
import ObservablePromise from "../ObservablePromise";
import { Model } from "./user.models";
import { Trans } from "@lingui/macro";

type Props = {
  model: Model;
  submissionId: string;
  taskName: string;
};

export default class SubmissionReportView extends React.Component<Props> {
  submissionPromise: ObservablePromise;

  constructor(props: Props) {
    super(props);
    this.submissionPromise = this.props.model.getSubmissionPromise(this.props.submissionId);
  }

  getSubmissionPromise() {
    return this.submissionPromise;
  }

  render() {
    const returnUrl = "/task/" + this.props.taskName;
    return (
      <ModalView contentLabel="Submission creation" returnUrl={returnUrl}>
        <div className="modal-header">
          <h5 className="modal-title">
            <Trans>Submission</Trans> <strong>{this.props.submissionId}</strong>
          </h5>
          <Link to={returnUrl} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <PromiseView
          promise={this.getSubmissionPromise()}
          renderFulfilled={(submission) => (
            <React.Fragment>
              <FeedbackView {...this.props} submission={submission} />
              <div className="modal-footer">
                <Link to={returnUrl} role="button" className="btn btn-primary">
                  <FontAwesomeIcon icon={faTimes} /> <Trans>Close</Trans>
                </Link>
              </div>
            </React.Fragment>
          )}
          renderPending={() => (
            <div className="modal-body">
              <Trans>Loading...</Trans>
            </div>
          )}
          renderRejected={() => (
            <div className="modal-body">
              <Trans>Close</Trans>
            </div>
          )}
        />
      </ModalView>
    );
  }
}
