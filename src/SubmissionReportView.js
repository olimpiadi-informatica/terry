import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import ModalView from './ModalView';
import DateView from './DateView';
import { DateTime } from 'luxon';
import FeedbackView from './FeedbackView';
import {colorFromScore, translateComponent} from "./utils";

class SubmissionReportView extends Component {
  getSubmission() {
    return this.props.model.getSubmission(this.props.submissionId);
  }

  componentWillMount() {
    this.getSubmission().load();
  }

  componentDidMount() {
    this.getSubmission().pushObserver(this);
  }

  componentWillUnmount() {
    this.getSubmission().popObserver(this);
  }

  renderFeedback() {
    const { t } = this.props;
    if (this.getSubmission().isLoading()) return <div className="modal-body">{t("loading")}</div>;
    if (!this.getSubmission().isLoaded()) return <div className="modal-body">{t("error")}</div>;

    const submission = this.getSubmission().data;
    const score = submission.score;
    const max_score = this.props.userState.getTask(submission.task).data.max_score;
    const color = colorFromScore(score, max_score);
    return (
      <React.Fragment>
        <FeedbackView {...this.props} result={submission.feedback} submissionId={this.props.submissionId} />

        <div className="modal-footer">
          <Link to={"/" + submission.task} role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes}/> {t("close")}
          </Link>
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { t } = this.props;
    return (
      <ModalView contentLabel="Submission creation" returnUrl={"/" + this.taskName}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t("submission.feedback.title")} <strong>{ this.props.submissionId }</strong>
          </h5>
          <Link to={"/" + this.taskName} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        { this.renderFeedback() }
      </ModalView>
    );
  }
}

export default translateComponent(SubmissionReportView);
