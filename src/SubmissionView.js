import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import faTrash from '@fortawesome/fontawesome-free-solid/faTrash'
import faPaperPlane from '@fortawesome/fontawesome-free-solid/faPaperPlane'
import ValidationView from './ValidationView';
import FileView from './FileView';
import ModalView from './ModalView';
import { translateComponent } from "./utils";
import "./SubmissionView.css";
import PromiseView from './PromiseView';

class SubmissionView extends Component {
  componentDidMount() {
    this.props.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.submission.popObserver(this);
  }

  renderSourceAlert(alert, i) {
    return (
      <div key={i} className={"alert alert-" + alert.severity}>
        {alert.message}
      </div>
    );
  }

  renderSourceSelector() {
    const { t } = this.props;
    if (!this.props.submission.hasSource()) {
      return (
        <div key="absent" className="custom-file mb-3 col-4">
          <input ref="source" name="source" type="file" id="source-file" className="custom-file-input" onChange={(e) => this.props.submission.setSource(this.refs.source.files[0])} />
          <label className="custom-file-label" htmlFor="source-file">File sorgente...</label>
        </div>
      );
    } else {
      const source = this.props.submission.getSource();
      return (
        <div key="present" className="card card-outline-primary w-100 mb-3">
          <div className="card-header terry-submission-object-card">
            <h5 className="modal-subtitle">{t("submission.submit.source info")}</h5>
            <button key="present" className="terry-submission-object-drop btn btn-primary" onClick={() => this.props.submission.resetSource()}>
              <FontAwesomeIcon icon={faTrash} /> {t("submission.submit.change source")}
            </button>
          </div>
          <div className="card-body">
            <FileView file={source.file} />
            <PromiseView promise={this.props.submission.getSource().uploadPromise}
              renderFulfilled={(uploadedSource) => <React.Fragment>
                {uploadedSource.data.validation.alerts.map((a, i) => this.renderSourceAlert(a, i))}
              </React.Fragment>}
              renderRejected={() => <p>{t("error")}</p>}
              renderPending={() => <p>{t("submission.submit.processing")}</p>}
            />
          </div>
        </div>
      );
    }
  }

  renderOutputUploadForm() {
    return (
      <div key="absent" className="custom-file col-4">
        <input ref="output" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.props.submission.setOutput(this.refs.output.files[0])} />
        <label className="custom-file-label" htmlFor="output-file">File di output...</label>
      </div>
    );
  }

  renderOutputInfo() {
    const { t } = this.props;
    const output = this.props.submission.getOutput();

    return (
      <div key="present" className="card card-outline-primary w-100">
        <div className="card-header terry-submission-object-card">
          <h5 className="modal-subtitle">{t("submission.submit.output info")}</h5>
          <button key="present" className="btn btn-primary terry-submission-object-drop" onClick={() => this.props.submission.resetOutput()}>
            <FontAwesomeIcon icon={faTrash} /> {t("submission.submit.change output")}
          </button>
        </div>
        <div className="card-body">
          <FileView file={output.file} />
          <PromiseView promise={this.props.submission.getOutput().uploadPromise}
            renderFulfilled={(uploadedOutput) => <ValidationView {...this.props} result={uploadedOutput.data.validation} />}
            renderRejected={() => <p>{t("error")}</p>}
            renderPending={() => <p>{t("submission.submit.processing")}</p>}
          />
        </div>
      </div>
    );
  }

  renderOutputSelector() {
    if (!this.props.submission.hasOutput()) {
      return this.renderOutputUploadForm();
    } else {
      return this.renderOutputInfo();
    }
  }

  submit() {
    return this.props.submission.submit().delegate.then((submission) => {
      console.error(submission);
      const taskName = submission.data.task;
      const id = submission.data.id;
      this.props.history.push("/" + taskName + "/submission/" + id);
    });
  }

  render() {
    const { t } = this.props;
    return (
      <ModalView contentLabel="Submission creation" returnUrl={"/" + this.props.submission.input.task}>
        <form
          className="submissionForm" ref="form" onSubmit={(e) => { e.preventDefault(); this.submit() }}
          disabled={!this.props.submission.canSubmit()}
        >
          <div className="modal-header">
            <h5 className="modal-title">
              {t("submission.submit.title")} <strong>{this.props.submission.input.id.slice(0, 6)}</strong>
            </h5>
            <Link to={"/" + this.props.submission.input.task} role="button" className="close" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </Link>
          </div>
          <div className="modal-body">
            <div className="input-group">{this.renderSourceSelector()}</div>
            <div className="input-group">{this.renderOutputSelector()}</div>
          </div>
          <div className="modal-footer">
            {this.props.submission.isSubmitted() ? t("submission.submit.processing") : null}
            <Link to={"/" + this.props.submission.input.task} role="button" className="btn btn-danger">
              <FontAwesomeIcon icon={faTimes} /> {t("cancel")}
            </Link>
            <button type="submit" className="btn btn-success" disabled={!this.props.submission.canSubmit()}>
              <FontAwesomeIcon icon={faPaperPlane} /> {t("submission.submit.submit")}
            </button>
          </div>
        </form>
      </ModalView>
    );
  }
}

export default translateComponent(SubmissionView);
