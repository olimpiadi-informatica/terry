import { DateTime } from "luxon";
import React from "react";
import { Markdown } from "./Markdown";
import { RelativeDate } from "./RelativeDate";

type Props = {
    title: string;
    content: string;
    severity: string;
    date: DateTime;
}

export function Announcement({
  title, content, severity, date,
}: Props) {
  return (
    <div className={`alert alert-${severity}`}>
      <span className="float-right"><RelativeDate clock={() => DateTime.fromJSDate(new Date())} date={date} /></span>
      <h5 className="alert-heading">
        {title}
      </h5>
      <hr />
      <Markdown source={content} />
    </div>
  );
}
