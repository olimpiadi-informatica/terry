import * as React from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import ValidationView from "./ValidationView";
import FileView from "./FileView";
import ModalView from "./ModalView";
import "./SubmissionView.css";
import PromiseView from "./PromiseView";
import { Submission } from "./user.models";
import { Trans } from "@lingui/macro";

type Props = {
  submission: Submission;
} & RouteComponentProps<any>;

export default class SubmissionView extends React.Component<Props> {
  componentDidMount() {
    this.props.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.submission.popObserver(this);
  }

  renderSourceAlert(alert: any, i: number) {
    return (
      <div key={i} className={"alert alert-" + alert.severity}>
        {alert.message}
      </div>
    );
  }

  renderSourceSelector() {
    if (!this.props.submission.source) {
      return (
        <div key="absent" className="custom-file mb-3 col-4">
          <input
            ref="source"
            name="source"
            type="file"
            id="source-file"
            className="custom-file-input"
            onChange={(_e) => this.props.submission.setSource((this.refs.source as any).files[0])}
          />
          <label className="custom-file-label" htmlFor="source-file">
            <Trans>Source file...</Trans>
          </label>
        </div>
      );
    } else {
      const source = this.props.submission.source;
      return (
        <div key="present" className="card card-outline-primary w-100 mb-3">
          <div className="card-header terry-submission-object-card">
            <h5 className="modal-subtitle">
              <Trans>Source file info</Trans>
            </h5>
            <button
              key="present"
              className="terry-submission-object-drop btn btn-primary"
              onClick={() => this.props.submission.resetSource()}
            >
              <FontAwesomeIcon icon={faTrash} /> <Trans>Change source</Trans>
            </button>
          </div>
          <div className="card-body">
            <FileView {...this.props} file={source.file} />
            <PromiseView
              promise={this.props.submission.source.uploadPromise}
              renderFulfilled={(uploadedSource) => (
                <React.Fragment>
                  {uploadedSource.data.validation.alerts.map((a: any, i: number) => this.renderSourceAlert(a, i))}
                </React.Fragment>
              )}
              renderRejected={() => (
                <p>
                  <Trans>Error</Trans>
                </p>
              )}
              renderPending={() => (
                <p>
                  <Trans>Processing...</Trans>
                </p>
              )}
            />
          </div>
        </div>
      );
    }
  }

  renderOutputSelector() {
    if (!this.props.submission.output) {
      return (
        <div key="absent" className="custom-file col-4">
          <input
            ref="output"
            name="output"
            type="file"
            id="output-file"
            className="custom-file-input"
            onChange={() => this.props.submission.setOutput((this.refs.output as any).files[0])}
          />
          <label className="custom-file-label" htmlFor="output-file">
            File di output...
          </label>
        </div>
      );
    } else {
      const output = this.props.submission.output;
      return (
        <div key="present" className="card card-outline-primary w-100">
          <div className="card-header terry-submission-object-card">
            <h5 className="modal-subtitle">
              <Trans>Output file info</Trans>
            </h5>
            <button
              key="present"
              className="btn btn-primary terry-submission-object-drop"
              onClick={() => this.props.submission.resetOutput()}
            >
              <FontAwesomeIcon icon={faTrash} /> <Trans>Change output</Trans>
            </button>
          </div>
          <div className="card-body">
            <FileView {...this.props} file={output.file} />
            <PromiseView
              promise={this.props.submission.output.uploadPromise}
              renderFulfilled={(uploadedOutput) => (
                <ValidationView {...this.props} result={uploadedOutput.data.validation} />
              )}
              renderRejected={() => (
                <p>
                  <Trans>Error</Trans>
                </p>
              )}
              renderPending={() => (
                <p>
                  <Trans>Processing...</Trans>
                </p>
              )}
            />
          </div>
        </div>
      );
    }
  }

  submit() {
    return this.props.submission.submit().delegate.then((submission: any) => {
      console.error(submission);
      const taskName = submission.data.task;
      const id = submission.data.id;
      this.props.history.push("/task/" + taskName + "/submission/" + id);
    });
  }

  render() {
    return (
      <ModalView contentLabel="Submission creation" returnUrl={"/task/" + this.props.submission.input.task}>
        <form
          className="submissionForm"
          ref="form"
          onSubmit={(e) => {
            e.preventDefault();
            this.submit();
          }}
          // FIXME: after typescript switch, the following was shown to be wrong
          // disabled={!this.props.submission.canSubmit()}
        >
          <div className="modal-header">
            <h5 className="modal-title">
              <Trans>Submission for input</Trans> <strong>{this.props.submission.input.id.slice(0, 6)}</strong>
            </h5>
            <Link to={"/task/" + this.props.submission.input.task} role="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </Link>
          </div>
          <div className="modal-body">
            <div className="input-group">{this.renderSourceSelector()}</div>
            <div className="input-group">{this.renderOutputSelector()}</div>
          </div>
          <div className="modal-footer">
            {this.props.submission.isSubmitted() ? <Trans>Processing...</Trans> : null}
            <Link to={"/task/" + this.props.submission.input.task} role="button" className="btn btn-danger">
              <FontAwesomeIcon icon={faTimes} /> <Trans>Cancel</Trans>
            </Link>
            <button type="submit" className="btn btn-success" disabled={!this.props.submission.canSubmit()}>
              <FontAwesomeIcon icon={faPaperPlane} /> <Trans>Submit</Trans>
            </button>
          </div>
        </form>
      </ModalView>
    );
  }
}
