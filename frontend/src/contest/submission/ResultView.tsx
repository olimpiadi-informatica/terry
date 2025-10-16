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
  cases,
  alerts,
  subtasks,
  renderCase,
  renderCaseSummary,
}: Props<T>) {
  const renderGridWithSubtasks = (
    subtasksToRender: Subtask[],
    casesToRender: T[],
  ) => (
    <table>
      <tbody>
        {subtasksToRender.map((s: Subtask, subtaskIndex: number) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={`subtask-${s.score}-${subtaskIndex}`}>
            <td>
              Group
              {subtaskIndex + 1}
              {" ("}
              {s.score}
              {" /"}
              {s.max_score}
              )
            </td>
            <td>
              <ul className="list-inline mb-0">
                {s.testcases.map((caseIndex: number) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li className="list-inline-item" key={`case-${caseIndex}`}>
                    {renderCaseSummary(casesToRender[caseIndex], caseIndex + 1)}
                  </li>
                ))}
                {s.labels
                  && s.labels.map((label: string, labelIndex: number) => (
                    <li
                      className="list-inline-item"
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${label}-${labelIndex}`}
                    >
                      <div className="badge badge-warning">{label}</div>
                    </li>
                  ))}
              </ul>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderGridWithoutSubtasks = (casesToRender: T[]) => (
    <ul className="list-inline mb-0">
      {casesToRender.map((c: T, caseIndex: number) => (
        // eslint-disable-next-line react/no-array-index-key
        <li className="list-inline-item" key={`case-summary-${caseIndex}`}>
          {renderCaseSummary(c, caseIndex + 1)}
        </li>
      ))}
    </ul>
  );

  const summary = subtasks
    ? renderGridWithSubtasks(subtasks, cases)
    : renderGridWithoutSubtasks(cases);

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
        <dd>{summary}</dd>
      </dl>
      <div className="result-detail">
        <ul className="list-group">
          {cases.map((c: T, i: number) => (
            // eslint-disable-next-line react/no-array-index-key
            <React.Fragment key={`case-detail-${i}`}>
              {renderCase(c, i + 1)}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </>
  );
}

ResultView.defaultProps = {
  subtasks: undefined,
};
