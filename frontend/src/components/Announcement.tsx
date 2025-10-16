import { DateTime } from "luxon";
import React from "react";
import { t } from "@lingui/macro";
import { Markdown } from "./Markdown";
import { RelativeDate } from "./RelativeDate";

const getTranslatedSeverity = (severity: string) => {
  switch (severity) {
  case "danger":
    return t`Danger`;
  case "warning":
    return t`Warning`;
  case "info":
    return t`Info`;
  default:
    return severity;
  }
};

type Props = {
  title: string;
  content: string;
  severity: string;
  date: DateTime;
};

export function Announcement({
  title, content, severity, date,
}: Props) {
  return (
    <div className={`alert alert-${severity}`}>
      <span className="float-right">
        <RelativeDate
          clock={() => DateTime.fromJSDate(new Date())}
          date={date}
        />
      </span>
      <h5 className="alert-heading">
        {title}
        {" "}
        <small>
          (
          {getTranslatedSeverity(severity)}
          )
        </small>
      </h5>
      <hr />
      <Markdown source={content} />
    </div>
  );
}
