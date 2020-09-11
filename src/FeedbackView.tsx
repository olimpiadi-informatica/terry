import * as React from 'react';
import ResultView from './ResultView'
import { DateView } from './datetime.views';
import { DateTime } from 'luxon';
import ScoreView from './ScoreView';
import { TestCase } from './domain';
import { WithTranslation } from 'react-i18next';

type Props = {
  submission: any
  userState?: any
  model: any
} & WithTranslation

export default class FeedbackView extends React.Component<Props> {
  render() {
    const { t } = this.props;

    const ops = {
      renderCase: (c: TestCase, id: number) => this.renderCase(c, id),
      renderCaseSummary: (c: TestCase, id: number) => this.renderCaseSummary(c, id),
    };

    const submissionData = this.props.submission.data;
    const score = submissionData.score;
    const max_score = this.props.userState.getTask(submissionData.task).data.max_score;

    return <div className="modal-body">
      <dl className="terry-file-view">
        <dt>{t("submission.feedback.date")}:</dt>
        <dd><DateView {...this.props} clock={() => this.props.model.serverTime()} date={DateTime.fromISO(submissionData.date)} /></dd>
        <dt style={{ 'marginTop': '0.75rem' }}>{t("submission.feedback.score")}:</dt>
        <dd>
          <ScoreView score={score} max={max_score} size={1} />
        </dd>
      </dl>
      <ResultView result={submissionData.feedback} {...this.props} {...ops} />
    </div>;
  }

  getColor(c: TestCase) {
    return c.correct ? "success" : "danger";
  }

  renderCaseSummary(c: TestCase, id: number) {
    return <a href={"#case-" + id} className={"badge badge-" + this.getColor(c)}>{id}</a>
  }

  renderCase(c: TestCase, id: number) {
    const { t } = this.props;
    return <li id={"case-" + id} key={id} className={"list-group-item list-group-item-" + this.getColor(c)}>
      <span>
        Case #<samp>{id}</samp>: <b>{c.correct ? t("submission.correct") : t("submission.wrong")}</b>
        <br />
        <pre>{c.message}</pre>
      </span>
    </li>;
  }
}
