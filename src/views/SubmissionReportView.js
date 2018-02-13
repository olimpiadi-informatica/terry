import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import ModalView from './ModalView';
import DateView from './DateView';
import { DateTime } from 'luxon';
import FeedbackView from './FeedbackView';
import {colorFromScore, translateComponent} from "../utils";

class SubmissionReportView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.taskName = props.taskName;
    this.submissionId = props.submissionId;
    this.submission = this.model.contest.getSubmission(this.submissionId);
  }

  componentWillMount() {
    this.submission.load();
  }

  componentDidMount() {
    this.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.submission.popObserver(this);
  }

  renderFeedback() {
    const { t } = this.props;
    if (this.submission.isLoading()) return <div className="modal-body">{t("loading")}</div>;
    if (!this.submission.isLoaded()) return <div className="modal-body">{t("error")}</div>;

    const submission = this.submission.data;
    const score = submission.score;
    const max_score = this.model.contest.getTask(submission.task).data.max_score;
    const color = colorFromScore(score, max_score);
    return (
      <React.Fragment>
        <div className="modal-body">
          <dl className="terry-file-view">
            <dt>{t("submission.feedback.date")}:</dt>
            <dd><DateView delta={this.model.timeDelta} date={ DateTime.fromISO(submission.date) }/></dd>
            <dt>{t("submission.feedback.score")}:</dt>
            <dd><span className={"badge badge-" + color}>{score}/{max_score}</span></dd>
            <dt>Dettagli:</dt><dd><FeedbackView model={this.model} result={submission.feedback} /></dd>
          </dl>
        </div>
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
            {t("submission.feedback.title")} <strong>{ this.submissionId }</strong>
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
