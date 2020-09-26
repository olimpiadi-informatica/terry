import * as React from "react";
import { Trans } from "@lingui/macro";
import { ValidationCaseInfo, Alert } from "./useUpload.hook";

type Props = {
  cases: ValidationCaseInfo[];
  alerts: Alert[];
  renderCase: (c: ValidationCaseInfo, i: number) => React.ReactNode;
  renderCaseSummary: (c: ValidationCaseInfo, i: number) => React.ReactNode;
};

export default function ResultView({
  cases, alerts, renderCase, renderCaseSummary,
}: Props) {
  return (
    <>
      <ul className="list-unstyled">
        {alerts.map((a: Alert) => (
          <li key={a.message}>
            <div className={`alert alert-${a.severity}`} role="alert">
              <samp>{a.code}</samp>
              {" "}
              <strong>{a.severity.toUpperCase()}</strong>
              :
              {" "}
              {a.message}
            </div>
          </li>
        ))}
      </ul>
      <dl className="terry-file-view">
        <dt>
          <Trans>Details</Trans>
          :
        </dt>
        <dd>
          <ul className="list-inline mb-0">
            {cases.map((c: ValidationCaseInfo, i: number) => (
              // eslint-disable-next-line react/no-array-index-key
              <li className="list-inline-item" key={i}>
                {renderCaseSummary(c, i + 1)}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
      <div className="result-detail">
        <ul className="list-group">
          {cases.map((c: ValidationCaseInfo, i: number) => renderCase(c, i + 1))}
        </ul>
      </div>
    </>
  );
}
