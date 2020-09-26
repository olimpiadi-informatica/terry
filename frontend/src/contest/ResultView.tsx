import * as React from "react";
import { Trans } from "@lingui/macro";
import { Alert } from "./hooks/useUpload";

type Props<T> = {
  cases: T[];
  alerts: Alert[];
  renderCase: (c: T, i: number) => React.ReactNode;
  renderCaseSummary: (c: T, i: number) => React.ReactNode;
};

export function ResultView<T>({
  cases, alerts, renderCase, renderCaseSummary,
}: Props<T>) {
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
      <dl className="terry-grid-list">
        <dt>
          <Trans>Details</Trans>
          :
        </dt>
        <dd>
          <ul className="list-inline mb-0">
            {cases.map((c: T, i: number) => (
              // eslint-disable-next-line react/no-array-index-key
              <li className="list-inline-item" key={i}>
                {renderCaseSummary(c, i + 1)}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
      <div className="result-detail">
        <ul className="list-group">{cases.map((c: T, i: number) => renderCase(c, i + 1))}</ul>
      </div>
    </>
  );
}
