import { DateTime } from "luxon";
import React from "react";
import ReactMarkdown from "react-markdown";
import { AbsoluteDateComponent } from "src/terry-frontend/datetime.views";

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
      <span className="float-right"><AbsoluteDateComponent clock={() => DateTime.fromJSDate(new Date())} date={date} /></span>
      <h5 className="alert-heading">
        {title}
      </h5>
      <hr />
      <ReactMarkdown source={content} />
    </div>
  );
}
