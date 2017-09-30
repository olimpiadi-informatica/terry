import React, { Component } from 'react';
import ModalView from './ModalView';
import DateView from './DateView';
import ResultView from './ResultView';
import { Link } from 'react-router-dom';
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
    if (this.submission.isLoading()) return <em>{t("loading")}</em>;
    if (!this.submission.isLoaded()) return <em>{t("error")}</em>;

    const submission = this.submission.data;
    const score = submission.score;
    const max_score = this.model.contest.getTask(submission.task).data.max_score;
    const color = colorFromScore(score, max_score);
    return (
        <div>
          <div className="modal-body">
            <dl className="row">
              <dt className="col-2">{t("submission.feedback.date")}:</dt>
              <dd className="col-10"><DateView date={ submission.date }/></dd>
              <dt className="col-2">{t("submission.feedback.score")}:</dt>
              <dd className="col-10"><span className={"badge badge-" + color}>{score}/{max_score}</span></dd>
            </dl>
            <ResultView model={this.model} result={submission.feedback} feedback />
          </div>
          <div className="modal-footer">
            <Link to={"/" + submission.task} role="button" className="btn btn-primary">
              <span aria-hidden="true" className="fa fa-times" /> {t("close")}
            </Link>
          </div>
        </div>
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