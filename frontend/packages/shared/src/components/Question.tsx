import { Trans } from "@lingui/macro";
import { DateTime } from "luxon";
import React from "react";
import ReactMarkdown from "react-markdown";
import { Question as QuestionT } from "../types/contest";
import { AbsoluteDate } from "./AbsoluteDate";

type Props = {
    question: QuestionT,
    serverTime: () => DateTime
};

export function Question({ question, serverTime } : Props) {
  const date = DateTime.fromSQL(question.date, { zone: "utc" });
  const answerDate = question.answer && DateTime.fromSQL(question.answer.date, { zone: "utc" });
  const color = question.answer ? "primary" : "dark";
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
        !question.answer && (
          <small><em><Trans>Not answered yet.</Trans></em></small>
        )
      }
    </div>
  );
}
