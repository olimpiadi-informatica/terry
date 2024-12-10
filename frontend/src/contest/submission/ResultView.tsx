import React from "react";
import { Trans } from "@lingui/macro";
import { Alert, Subtask } from "src/types/contest";

type Props<T> = {
  cases: T[];
  alerts: Alert[];
  subtasks?: Subtask[];
  renderCase: (c: T, i: number) => React.ReactNode;
  renderCaseSummary: (c: T, i: number) => React.ReactNode;
};

export function ResultView<T>({
  cases, alerts, subtasks, renderCase, renderCaseSummary,
}: Props<T>) {
  let summary = subtasks ? (
    <>
      <table>
        <tbody>
          {subtasks.map((s: Subtask, i: number) => (
            <tr>
              <td>
                Subtask {i + 1} ({s.score}/{s.max_score})
              </td>
              <td>
                <ul className="list-inline mb-0">
                  {s.testcases.map((i: number, _: number) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <li className="list-inline-item" key={i}>
                      {renderCaseSummary(cases[i], i + 1)}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  ) : (
    <>
      <ul className="list-inline mb-0">
        {cases.map((c: T, i: number) => (
          // eslint-disable-next-line react/no-array-index-key
          <li className="list-inline-item" key={i}>
            {renderCaseSummary(c, i + 1)}
          </li>
        ))}
      </ul>
    </>
  );

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
          {summary}
        </dd>
      </dl>
      <div className="result-detail">
        <ul className="list-group">{cases.map((c: T, i: number) => renderCase(c, i + 1))}</ul>
      </div>
    </>
  );
}
