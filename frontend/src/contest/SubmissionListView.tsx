import * as React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faTimes } from "@fortawesome/free-solid-svg-icons";
import { DateView } from "../datetime.views";
import { DateTime } from "luxon";
import client from "../TerryClient";
import ModalView from "../ModalView";
import ReactTooltip from "react-tooltip";
import { colorFromScore } from "../utils";
import "./SubmissionListView.css";
import ScoreView from "./ScoreView";
import PromiseView from "../PromiseView";
import { Trans, t } from "@lingui/macro";
import { i18n } from "../i18n";

type Props = {
  userState: any;
  taskName: string;
  model: any;
};

export default class SubmissionListView extends React.Component<Props> {
  getTask() {
    return this.props.userState.getTask(this.props.taskName);
  }

  getListPromise() {
    return this.props.userState.getTaskState(this.props.taskName).submissionListPromise;
  }

  renderSubmissionList(list: any) {
    const submissionList = [];

    for (let submission of list.items) {
      let cut = (s: string) => s.slice(s.lastIndexOf("/") + 1);
      submission.input.basename = cut(submission.input.path);
      submission.output.basename = cut(submission.output.path);
      submission.source.basename = cut(submission.source.path);

      submissionList.push(
        <tr key={submission.id}>
          <td>
            <DateView
              {...this.props}
              clock={() => this.props.model.serverTime()}
              date={DateTime.fromISO(submission.date)}
            />
            <br />
            <Link to={"/task/" + submission.task + "/submission/" + submission.id}>
              <Trans>view details</Trans>
            </Link>
          </td>
          <td>
            <ReactTooltip id={"input-" + submission.id} place="top" type="dark" effect="solid">
              {submission.input.basename}
            </ReactTooltip>
            <ReactTooltip id={"source-" + submission.id} place="top" type="dark" effect="solid">
              {submission.source.basename}
            </ReactTooltip>
            <ReactTooltip id={"output-" + submission.id} place="top" type="dark" effect="solid">
              {submission.output.basename}
            </ReactTooltip>

            <div className="btn-group bordered-group" role="group" aria-label="Download submission data">
              <a
                role="button"
                className="btn btn-light"
                aria-label={submission.input.basename}
                href={client.filesBaseURI + submission.input.path}
                download
                data-tip
                data-for={"input-" + submission.id}
              >
                <FontAwesomeIcon icon={faDownload} />{" "}
                <span className="hidden-md-down">
                  <Trans>Input file</Trans>
                </span>
              </a>

              <a
                role="button"
                className="btn btn-light"
                aria-label={submission.source.basename}
                href={client.filesBaseURI + submission.source.path}
                download
                data-tip
                data-for={"source-" + submission.id}
              >
                <FontAwesomeIcon icon={faDownload} />{" "}
                <span className="hidden-md-down">
                  <Trans>Source file</Trans>
                </span>
              </a>

              <a
                role="button"
                className="btn btn-light"
                aria-label={submission.output.basename}
                href={client.filesBaseURI + submission.output.path}
                download
                data-tip
                data-for={"output-" + submission.id}
              >
                <FontAwesomeIcon icon={faDownload} />{" "}
                <span className="hidden-md-down">
                  <Trans>Output file</Trans>
                </span>
              </a>
            </div>
          </td>
          <td className={"alert-" + colorFromScore(submission.score, this.getTask().data.max_score)}>
            <ScoreView score={submission.score} max={this.getTask().data.max_score} size={1} />
          </td>
        </tr>
      );
    }

    return submissionList.reverse();
  }

  renderBody(list: any) {
    if (list.items.length === 0)
      return (
        <div className="modal-body">
          <em>
            <Trans>You have not submitted yet.</Trans>
          </em>
        </div>
      );

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
          <tbody>{this.renderSubmissionList(list)}</tbody>
        </table>
      </div>
    );
  }

  render() {
    const taskName = this.props.taskName;
    return (
      <ModalView contentLabel={i18n._(t`Submission`)} returnUrl={"/task/" + this.props.taskName}>
        <div className="modal-header">
          <h5 className="modal-title">
            <Trans>Submission for</Trans> <strong className="text-uppercase">{taskName}</strong>
          </h5>
          <Link to={"/task/" + this.props.taskName} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>
        <PromiseView
          promise={this.getListPromise()}
          renderPending={() => (
            <div className="modal-body">
              <em>
                <Trans>Loading...</Trans>
              </em>
            </div>
          )}
          renderRejected={() => i18n._(t`Error`)}
          renderFulfilled={(list) => this.renderBody(list)}
        />
        <div className="modal-footer">
          <Link to={"/task/" + this.props.taskName} role="button" className="btn btn-primary">
            <FontAwesomeIcon icon={faTimes} /> <Trans>Close</Trans>
          </Link>
        </div>
      </ModalView>
    );
  }
}
