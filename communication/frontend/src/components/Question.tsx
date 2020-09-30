import { DateTime } from "luxon";
import React from "react";
import ReactMarkdown from "react-markdown";
import { AbsoluteDateComponent } from "src/terry-frontend/datetime.views";
import { Question as QuestionT } from "src/terry-frontend/types";

type Props = {
    question: QuestionT
}

export function Question({ question }:Props) {
  const color = question.answer ? "primary" : "dark";
  const time = () => DateTime.fromJSDate(new Date());

  return (
    <div className={`alert alert-${color}`} key={question.id}>
      <span className="float-right"><AbsoluteDateComponent clock={() => time()} date={DateTime.fromSQL(question.date, { zone: "utc" })} /></span>
      {question.content}
      <hr />
      {question.answer && (
        <>
          <span className="float-right"><AbsoluteDateComponent clock={() => time()} date={DateTime.fromSQL(question.answer.date, { zone: "utc" })} /></span>
          <ReactMarkdown source={question.answer.content} />
        </>
      )}
      {
        !question.answer && (
          <small><em>Not answered yet.</em></small>
        )
        // TODO: answer form
      }
    </div>
  );
}
