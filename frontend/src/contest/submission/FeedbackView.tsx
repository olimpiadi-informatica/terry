import React from "react";
import { DateTime } from "luxon";
import { Trans } from "@lingui/macro";
import { DateComponent } from "src/datetime.views";
import { ScoreView } from "src/contest/ScoreView";
import { FeedbackCaseInfo, Submission } from "src/contest/hooks/useSubmission";
import { useServerTime, TaskData } from "src/contest/ContestContext";
import { ResultView } from "./ResultView";
import "./GridList.css";

type Props = {
  task: TaskData;
  submission: Submission;
};

export function FeedbackView({ submission, task }: Props) {
  const serverTime = useServerTime();

  const getColor = (c: FeedbackCaseInfo) => (c.correct ? "success" : "danger");

  const renderCaseSummary = (c: FeedbackCaseInfo, id: number) => (
    <a href={`#case-${id}`} className={`badge badge-${getColor(c)}`}>
      {id}
    </a>
  );

  const renderCase = (c: FeedbackCaseInfo, id: number) => (
    <li id={`case-${id}`} key={id} className={`list-group-item list-group-item-${getColor(c)}`}>
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

  return (
    <>
      <dl className="terry-grid-list">
        <dt>
          <Trans>Date</Trans>
          :
        </dt>
        <dd>
          <DateComponent clock={() => serverTime()} date={DateTime.fromISO(submission.date)} />
        </dd>
        <dt style={{ marginTop: "0.75rem" }}>
          <Trans>Score</Trans>
          :
        </dt>
        <dd>
          <ScoreView score={submission.score} max={task.max_score} size={1} />
        </dd>
      </dl>
      <ResultView
        cases={submission.feedback.cases}
        alerts={submission.feedback.alerts}
        renderCase={renderCase}
        renderCaseSummary={renderCaseSummary}
      />
    </>
  );
}
