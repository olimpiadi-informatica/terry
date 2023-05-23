import React from "react";
import { Select } from "@lingui/macro";
import { ValidationCaseInfo, UploadedOutput } from "src/types/contest";
import { ResultView } from "./ResultView";

type Props = {
  output: UploadedOutput;
};

export function ValidationView({ output }: Props) {
  const getColor = (c: ValidationCaseInfo) => {
    switch (c.status) {
    case "parsed":
      return "info";
    case "missing":
      return "secondary";
    default:
      return "danger";
    }
  };

  const renderCaseSummary = (c: ValidationCaseInfo, id: number) => (
    <a href={`#case-${id}`} className={`badge badge-${getColor(c)}`}>
      {id}
    </a>
  );

  const renderCase = (c: ValidationCaseInfo, id: number) => (
    <li id={`case-${id}`} key={id} className={`list-group-item list-group-item-${getColor(c)}`}>
      <span>
        Case #
        <samp>{id}</samp>
        :
        {" "}
        <b>
          <Select value={c.status} _parsed_="parsed" _missing_="missing" _invalid_="invalid" other="?" />
        </b>
        <br />
        {"message" in c && <em>{c.message}</em>}
      </span>
    </li>
  );

  return (
    <ResultView
      alerts={output.validation.alerts}
      cases={output.validation.cases}
      renderCase={renderCase}
      renderCaseSummary={renderCaseSummary}
    />
  );
}
