import { Trans, t } from "@lingui/macro";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { Question as QuestionT } from "src/types/contest";
import { Link } from "react-router-dom";
import { RelativeDate } from "./RelativeDate";
import { Markdown } from "./Markdown";

type Props = {
  question: QuestionT;
  serverTime: () => DateTime;
  sendAnswer?: (id: number, answer: string) => Promise<void>;
};

export function Question({ question, serverTime, sendAnswer }: Props) {
  const [answer, setAnswer] = useState("");
  const date = DateTime.fromISO(question.date, { zone: "utc" });
  const answerDate = question.answer_date
    && DateTime.fromISO(question.answer_date, { zone: "utc" });
  const color = question.answer ? "primary" : "dark";

  const renderAnswerForm = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendAnswer?.(question.id, answer);
      }}
    >
      <div className="form-group">
        <textarea
          className="form-control"
          placeholder={t`Answer with Markdown`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>
      <hr />
      <h3>
        <Trans>Preview</Trans>
      </h3>
      <Markdown source={answer} />
      <hr />
      <button type="submit" className="btn btn-primary">
        <FontAwesomeIcon icon={faPaperPlane} />
        {" "}
        <Trans>Answer</Trans>
      </button>
    </form>
  );

  return (
    <div className={`alert alert-${color}`} key={question.id}>
      <span className="float-right">
        {sendAnswer && (
          <>
            <code>
              id
              {question.id}
            </code>
            {" — "}
            <Link to={`?token=${question.creator}`}>
              <code>{question.creator}</code>
            </Link>
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
          <Markdown source={question.answer} />
        </>
      )}
      {!question.answer && !sendAnswer && (
        <small>
          <em>
            <Trans>Not answered yet.</Trans>
          </em>
        </small>
      )}
      {!question.answer && sendAnswer && renderAnswerForm()}
    </div>
  );
}

Question.defaultProps = {
  sendAnswer: null,
};
