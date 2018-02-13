import React, { Component } from 'react';
import ResultView from './ResultView'
import DateView from './DateView';
import { DateTime } from 'luxon';
import {colorFromScore, translateComponent} from "../utils";
import ScoreView from './ScoreView';

class FeedbackView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.submission = this.model.contest.getSubmission(props.submissionId);
  }

  render() {
    const { t } = this.props;

    const ops = {
      renderCase: (c, id) => this.renderCase(c, id),
      renderCaseSummary: (c, id) => this.renderCaseSummary(c, id),
    };

    const submission = this.submission.data;
    const score = submission.score;
    const max_score = this.model.contest.getTask(submission.task).data.max_score;
    const color = colorFromScore(score, max_score);

    return <div className="modal-body">
      <dl className="terry-file-view">
        <dt>{t("submission.feedback.date")}:</dt>
        <dd><DateView delta={this.model.timeDelta} date={ DateTime.fromISO(submission.date) }/></dd>
        <dt style={{'margin-top': '0.75rem'}}>{t("submission.feedback.score")}:</dt>
        <dd>
          <ScoreView score={score} max={max_score} size={1} />
        </dd>
      </dl>
      <ResultView {...this.props} {...ops}/>
    </div>;
  }

  getColor(c) {
    return c.correct ? "success" : "danger";
  }

  renderCaseSummary(c, id) {
    return <a href={"#case-" + id} className={"badge badge-" + this.getColor(c)}>{id}</a>
  }

  renderCase(c, id) {
    const { t } = this.props;
    return <li id={"case-" + id} key={id} className={"list-group-item list-group-item-" + this.getColor(c)}>
      <span>Case #<samp>{id}</samp>: <b>{c.correct ? t("submission.correct") : t("submission.wrong")}</b><br/><em>{c.message}</em></span>
    </li>;
  }
}

export default translateComponent(FeedbackView);
