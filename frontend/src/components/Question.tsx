import { Trans, t } from "@lingui/macro";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { Question as QuestionT } from "src/types/contest";
import { useSendAnswer } from "src/hooks/useCommunication";
import { Link } from "react-router-dom";
import { RelativeDate } from "./RelativeDate";
import { Markdown } from "./Markdown";

type Props = {
    question: QuestionT,
    serverTime: () => DateTime,
    canAnswer: boolean
};

export function Question({ question, serverTime, canAnswer } : Props) {
  const [answer, setAnswer] = useState("");
  const date = DateTime.fromSQL(question.date, { zone: "utc" });
  const answerDate = question.answer && DateTime.fromSQL(question.answer.date, { zone: "utc" });
  const color = question.answer ? "primary" : "dark";
  const sendAnswer = useSendAnswer();

  const renderAnswerForm = () => (
    <>
      <form onSubmit={(e) => { e.preventDefault(); sendAnswer(question.id, answer); }}>
        <div className="form-group">
          <textarea
            className="form-control"
            placeholder={t`Answer with Markdown`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>
        <hr />
        <h3><Trans>Preview</Trans></h3>
        <Markdown source={answer} />
        <hr />
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faPaperPlane} />
          {" "}
          <Trans>Answer</Trans>
        </button>
      </form>
    </>
  );

  return (
    <div className={`alert alert-${color}`} key={question.id}>
      <span className="float-right">
        {canAnswer && (
          <>
            <code>
              id
              {question.id}
            </code>
            {" — "}
            <Link to={`?token=${question.creator}`}><code>{question.creator}</code></Link>
            {" — "}
          </>
        )}
        <RelativeDate clock={() => serverTime()} date={date} />
      </span>
      {question.content}
      <hr />
      {question.answer && answerDate && (
        <>
          <span className="float-right">
            <RelativeDate clock={() => serverTime()} date={answerDate} />
          </span>
          <Markdown source={question.answer.content} />
        </>
      )}
      {
        !question.answer && !canAnswer && (
          <small><em><Trans>Not answered yet.</Trans></em></small>
        )
      }
      { !question.answer && canAnswer && renderAnswerForm() }
    </div>
  );
}
