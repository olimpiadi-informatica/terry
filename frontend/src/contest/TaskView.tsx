import * as React from "react";
import { Link, Route, RouteComponentProps } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faDownload, faUpload } from "@fortawesome/free-solid-svg-icons";
import client from "../TerryClient";
import { DateComponent } from "../datetime.views";
import { DateTime } from "luxon";
import CreateSubmissionView from "./CreateSubmissionView";
import SubmissionListView from "./SubmissionListView";
import SubmissionReportView from "./SubmissionReportView";
import PromiseView from "../PromiseView";
import TaskStatementView from "./TaskStatementView";
import { Trans } from "@lingui/macro";

type Props = {
  userState: any;
  taskName: string;
  model: any;
} & RouteComponentProps<any>;

export default class TaskView extends React.Component<Props> {
  getTask() {
    return this.props.userState.getTask(this.props.taskName);
  }

  getTaskState() {
    return this.props.userState.getTaskState(this.props.taskName);
  }

  componentDidMount() {
    this.props.model.pushObserver(this);
    this.componentDidUpdate();
  }

  componentDidUpdate() {
    this.getTaskState().pushObserver(this);
    this.getTask().pushObserver(this);
  }

  componentWillUpdate() {
    this.getTaskState().popObserver(this);
    this.getTask().popObserver(this);
  }

  componentWillUnmount() {
    this.componentWillUpdate();
    this.props.model.popObserver(this);
  }

  renderGenerateInputButton() {
    const button = (already: boolean) => (
      <button className="btn btn-success" onClick={() => this.getTaskState().generateInput()}>
        <FontAwesomeIcon icon={faPlus} /> {already ? <Trans>Request new input</Trans> : <Trans>Request input</Trans>}
      </button>
    );

    // either "generate input" or "generate a new input", in case some input has already been generated
    // (we use PromiseView just because we need the list of submissions to be ready...)
    return (
      <PromiseView
        promise={this.getTaskState().submissionListPromise}
        renderPending={() => button(false)}
        renderFulfilled={(list) => button(list.items.length > 0)}
        renderRejected={(_error) => button(false)}
      />
    );
  }

  renderCommands() {
    if (this.getTaskState().hasCurrentInput()) {
      const currentInput = this.getTaskState().getCurrentInput();
      return (
        <React.Fragment>
          <a role="button" className="btn btn-primary" href={client.filesBaseURI + currentInput.path} download>
            <FontAwesomeIcon icon={faDownload} /> <Trans>Download input</Trans>
          </a>{" "}
          <Link
            to={"/task/" + this.getTask().name + "/submit/" + currentInput.id}
            role="button"
            className="btn btn-success"
          >
            <FontAwesomeIcon icon={faUpload} /> <Trans>Upload solution</Trans>
          </Link>
        </React.Fragment>
      );
    } else {
      if (this.getTaskState().isGeneratingInput()) {
        return (
          <PromiseView
            promise={this.getTaskState().inputGenerationPromise}
            renderPending={() => (
              <button disabled={true} className="btn btn-success">
                <FontAwesomeIcon icon={faPlus} /> <Trans>Requesting...</Trans>
              </button>
            )}
            renderRejected={() => (
              <button disabled={true} className="btn btn-success">
                <FontAwesomeIcon icon={faPlus} /> <Trans>Error</Trans>
              </button>
            )}
            renderFulfilled={() => this.renderGenerateInputButton()}
          />
        );
      } else {
        return this.renderGenerateInputButton();
      }
    }
  }

  renderTaskStatement() {
    return (
      <PromiseView
        promise={this.getTask().statementPromise}
        renderFulfilled={(statement) => <TaskStatementView task={this.getTask()} source={statement} />}
        renderPending={() => (
          <p>
            <Trans>Loading...</Trans>
          </p>
        )}
        renderRejected={() => (
          <p>
            <Trans>Failed to load task statement. Try reloading the page.</Trans>
          </p>
        )}
      />
    );
  }

  returnLastSubmissionInfo(list: any) {
    const items = list.items;
    if (items.length === 0) {
      return null;
    } else {
      const submission = items[items.length - 1];
      return (
        <div className="terry-submission-list-button">
          <strong>
            <Trans>Last submission:</Trans>
          </strong>{" "}
          <DateComponent
            {...this.props}
            clock={() => this.props.model.serverTime()}
            date={DateTime.fromISO(submission.date)}
          />{" "}
          (
          <Link to={"/task/" + this.getTask().name + "/submissions"}>
            <Trans>view all submissions</Trans>
          </Link>
          )
        </div>
      );
    }
  }

  renderSubmissionListButton() {
    return (
      <PromiseView
        promise={this.getTaskState().submissionListPromise}
        renderPending={() => null}
        renderFulfilled={(list) => this.returnLastSubmissionInfo(list)}
        renderRejected={(_error) => (
          <div className="terry-submission-list-button">
            <em>
              <Trans>Loading submission list failed, reload page.</Trans>
            </em>
          </div>
        )}
      />
    );
  }

  render() {
    return (
      <React.Fragment>
        <h1>{this.getTask().data.title}</h1>
        {this.renderCommands()}

        <Route
          path="/task/:taskName/submit/:inputId"
          render={({ match }) => (
            <CreateSubmissionView {...this.props} inputId={match.params.inputId} taskName={match.params.taskName} />
          )}
        ></Route>
        <Route
          path="/task/:taskName/submissions"
          render={({ match }) => <SubmissionListView {...this.props} taskName={match.params.taskName} />}
        />
        <Route
          path="/task/:taskName/submission/:submissionId"
          render={({ match }) => (
            <SubmissionReportView
              {...this.props}
              submissionId={match.params.submissionId}
              taskName={match.params.taskName}
            />
          )}
        />

        {this.renderSubmissionListButton()}

        <hr />

        {this.renderTaskStatement()}
      </React.Fragment>
    );
  }
}
