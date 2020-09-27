import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import ReactTooltip from "react-tooltip";
import { Trans, t } from "@lingui/macro";
import { DateComponent } from "src/datetime.views";
import { client } from "src/TerryClient";
import { ModalView } from "src/Modal";
import { colorFromScore } from "src/utils";
import "./SubmissionListView.css";
import { i18n } from "src/i18n";
import { Loading } from "src/Loading";
import { ScoreView } from "src/contest/ScoreView";
import { useServerTime } from "src/contest/ContestContext";
import { useSubmissionList } from "src/contest/hooks/useSubmissionList";
import { Submission, SubmissionList, TaskData } from "src/contest/types";

type Props = {
  task: TaskData;
};

export function SubmissionListView({ task }: Props) {
  const [submissions] = useSubmissionList(task.name);
  const serverTime = useServerTime();

  const renderSubmission = (submission: Submission) => {
    const cut = (s: string) => s.slice(s.lastIndexOf("/") + 1);
    const inputBasename = cut(submission.input.path);
    const outputBasename = cut(submission.output.path);
    const sourceBasename = cut(submission.source.path);
    return (
      <tr key={submission.id}>
        <td>
          <DateComponent clock={() => serverTime()} date={DateTime.fromISO(submission.date, { zone: "utc" })} />
          <br />
          <Link to={`/task/${submission.task}/submission/${submission.id}`}>
            <Trans>view details</Trans>
          </Link>
        </td>
        <td>
          <ReactTooltip id={`input-${submission.id}`} place="top" type="dark" effect="solid">
            {inputBasename}
          </ReactTooltip>
          <ReactTooltip id={`source-${submission.id}`} place="top" type="dark" effect="solid">
            {sourceBasename}
          </ReactTooltip>
          <ReactTooltip id={`output-${submission.id}`} place="top" type="dark" effect="solid">
            {outputBasename}
          </ReactTooltip>

          <div className="btn-group bordered-group" role="group" aria-label="Download submission data">
            <a
              role="button"
              className="btn btn-light"
              aria-label={inputBasename}
              href={client.filesBaseURI + submission.input.path}
              download
              data-tip
              data-for={`input-${submission.id}`}
            >
              <FontAwesomeIcon icon={faDownload} />
              {" "}
              <span className="hidden-md-down">
                <Trans>Input file</Trans>
              </span>
            </a>

            <a
              role="button"
              className="btn btn-light"
              aria-label={sourceBasename}
              href={client.filesBaseURI + submission.source.path}
              download
              data-tip
              data-for={`source-${submission.id}`}
            >
              <FontAwesomeIcon icon={faDownload} />
              {" "}
              <span className="hidden-md-down">
                <Trans>Source file</Trans>
              </span>
            </a>

            <a
              role="button"
              className="btn btn-light"
              aria-label={outputBasename}
              href={client.filesBaseURI + submission.output.path}
              download
              data-tip
              data-for={`output-${submission.id}`}
            >
              <FontAwesomeIcon icon={faDownload} />
              {" "}
              <span className="hidden-md-down">
                <Trans>Output file</Trans>
              </span>
            </a>
          </div>
        </td>
        <td className={`alert-${colorFromScore(submission.score, task.max_score)}`}>
          <ScoreView score={submission.score} max={task.max_score} size={1} />
        </td>
      </tr>
    );
  };

  const renderBody = (list: SubmissionList) => {
    if (list.items.length === 0) {
      return (
        <div className="modal-body">
          <em>
            <Trans>You have not submitted yet.</Trans>
          </em>
        </div>
      );
    }

    return (
      <div className="modal-body no-padding">
        <table className="table terry-table">
          <thead>
            <tr>
              <th>
                <Trans>Date</Trans>
              </th>
              <th>
                <Trans>Download</Trans>
              </th>
              <th>
                <Trans>Score</Trans>
              </th>
            </tr>
          </thead>
          <tbody>{list.items.map(renderSubmission).reverse()}</tbody>
        </table>
      </div>
    );
  };

  return (
    <ModalView contentLabel={i18n._(t`Submission`)} returnUrl={`/task/${task.name}`}>
      <div className="modal-header">
        <h5 className="modal-title">
          <Trans>Submission for</Trans>
          {" "}
          <strong className="text-uppercase">{task.name}</strong>
        </h5>
        <Link to={`/task/${task.name}`} role="button" className="close" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </Link>
      </div>
      {submissions.isLoading() && <Loading />}
      {submissions.isError() && <Trans>Error</Trans>}
      {submissions.isReady() && renderBody(submissions.value())}
      <div className="modal-footer">
        <Link to={`/task/${task.name}`} role="button" className="btn btn-primary">
          <FontAwesomeIcon icon={faTimes} />
          {" "}
          <Trans>Close</Trans>
        </Link>
      </div>
    </ModalView>
  );
}
