import { Trans } from "@lingui/macro";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DateTime } from "luxon";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Question as QuestionT } from "../types/contest";
import { AbsoluteDate } from "./AbsoluteDate";
import { useSendAnswer } from "../hooks/useCommunication";

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
          <textarea className="form-control" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
        <hr />
        <h3>Preview</h3>
        <ReactMarkdown source={answer} />
        <hr />
        <button type="submit" className="btn btn-primary">
          <FontAwesomeIcon icon={faPaperPlane} />
          {" "}
          Answer
        </button>
      </form>
    </>
  );

  return (
    <div className={`alert alert-${color}`} key={question.id}>
      <span className="float-right"><AbsoluteDate clock={() => serverTime()} date={date} /></span>
      {question.content}
      <hr />
      {question.answer && answerDate && (
        <>
          <span className="float-right"><AbsoluteDate clock={() => serverTime()} date={answerDate} /></span>
          <ReactMarkdown source={question.answer.content} />
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
