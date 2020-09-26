import * as React from "react";
import { DateTime } from "luxon";
import { Trans } from "@lingui/macro";
import ResultView from "./ResultView";
import { DateComponent } from "../datetime.views";
import ScoreView from "./ScoreView";
import { TestCase } from "../domain";

type Props = {
  submission: any;
  userState?: any;
  model: any;
};

export default class FeedbackView extends React.Component<Props> {
  render() {
    const ops = {
      renderCase: (c: TestCase, id: number) => this.renderCase(c, id),
      renderCaseSummary: (c: TestCase, id: number) => this.renderCaseSummary(c, id),
    };

    const submissionData = this.props.submission.data;
    const { score } = submissionData;
    const { max_score } = this.props.userState.getTask(submissionData.task).data;

    return (
      <div className="modal-body">
        <dl className="terry-file-view">
          <dt>
            <Trans>Date</Trans>
            :
          </dt>
          <dd>
            <DateComponent
              {...this.props}
              clock={() => this.props.model.serverTime()}
              date={DateTime.fromISO(submissionData.date)}
            />
          </dd>
          <dt style={{ marginTop: "0.75rem" }}>
            <Trans>Score</Trans>
            :
          </dt>
          <dd>
            <ScoreView score={score} max={max_score} size={1} />
          </dd>
        </dl>
        <ResultView result={submissionData.feedback} {...this.props} {...ops} />
      </div>
    );
  }

  getColor(c: TestCase) {
    return c.correct ? "success" : "danger";
  }

  renderCaseSummary(c: TestCase, id: number) {
    return (
      <a href={`#case-${id}`} className={`badge badge-${this.getColor(c)}`}>
        {id}
      </a>
    );
  }

  renderCase(c: TestCase, id: number) {
    return (
      <li id={`case-${id}`} key={id} className={`list-group-item list-group-item-${this.getColor(c)}`}>
        <span>
          Case #
          <samp>{id}</samp>
          :
          {" "}
          <b>{c.correct ? <Trans>correct</Trans> : <Trans>wrong</Trans>}</b>
          <br />
          <pre>{c.message}</pre>
        </span>
      </li>
    );
  }
}
