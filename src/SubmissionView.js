import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import faTrash from '@fortawesome/fontawesome-free-solid/faTrash'
import faPaperPlane from '@fortawesome/fontawesome-free-solid/faPaperPlane'
import ValidationView from './ValidationView';
import FileView from './FileView';
import ModalView from './ModalView';
import {translateComponent} from "./utils";
import "./SubmissionView.css";
import PromiseView from './PromiseView';

class SubmissionView extends Component {
  constructor(props) {
    super(props);

    this.model = props.model;
    this.submission = props.submission;
  }

  componentDidMount() {
    this.submission.pushObserver(this);
  }

  componentWillUnmount() {
    this.submission.popObserver(this);
  }

  renderSourceAlert(alert, i) {
    return (
      <div key={i} className={"alert alert-" + alert.severity}>
        { alert.message }
      </div>
    );
  }

  renderSourceSelector() {
    const { t } = this.props;
    if(!this.submission.hasSource()) {
      return (
        <div key="absent" className="custom-file mb-3 col-4">
          <input ref="source" name="source" type="file" id="source-file" className="custom-file-input" onChange={(e) => this.submission.setSource(this.refs.source.files[0]) } />
          <label className="custom-file-label" htmlFor="source-file">File sorgente...</label>
        </div>
      );
    } else {
      const source = this.submission.getSource();
      return (
        <div key="present" className="card card-outline-primary w-100 mb-3">
          <div className="card-header terry-submission-object-card">
            <h5 className="modal-subtitle">{t("submission.submit.source info")}</h5>
            <button role="button" key="present" className="terry-submission-object-drop btn btn-primary" onClick={ () => this.submission.resetSource() }>
              <FontAwesomeIcon icon={faTrash}/> {t("submission.submit.change source")}
            </button>
          </div>
          <div className="card-body">
            <FileView file={source.file} />
            <PromiseView promise={this.submission.getSource().uploadPromise}
              renderFulfilled={(uploadedSource) => <React.Fragment>
                { uploadedSource.data.validation.alerts.map((a, i) => this.renderSourceAlert(a, i)) }
              </React.Fragment>}
              renderRejected={(error) => <p>{error}</p>}
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
        <input ref="output" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.submission.setOutput(this.refs.output.files[0])} />
        <label className="custom-file-label" htmlFor="output-file">File di output...</label>
      </div>
    );
  }

  renderOutputInfo() {
    const { t } = this.props;
    const output = this.submission.getOutput();

    return (
      <div key="present" className="card card-outline-primary w-100">
        <div className="card-header terry-submission-object-card">
          <h5 className="modal-subtitle">{t("submission.submit.output info")}</h5>
          <button role="button" key="present" className="btn btn-primary terry-submission-object-drop" onClick={ () => this.submission.resetOutput() }>
            <FontAwesomeIcon icon={faTrash}/> {t("submission.submit.change output")}
          </button>
        </div>
        <div className="card-body">
          <FileView file={output.file} />
          <PromiseView promise={this.submission.getOutput().uploadPromise}
            renderFulfilled={(uploadedOutput) => <ValidationView {...this.props} result={uploadedOutput.data.validation} />}
            renderRejected={(error) => <p>{error}</p>}
            renderPending={() => <p>{t("submission.submit.processing")}</p>}
          />
        </div>
      </div>
    );
  }

  renderOutputSelector() {
    if(!this.submission.hasOutput()) {
      return this.renderOutputUploadForm();
    } else {
      return this.renderOutputInfo();
    }
  }

  submit() {
    return this.submission.submit().then(() => {
      const taskName = this.submission.data.task;
      const id = this.submission.data.id;
      this.props.history.push("/" + taskName + "/submission/" + id);
    });
  }

  renderSubmissionForm() {
    const { t } = this.props;
    if(this.submission.isSubmitting()) return (
      <div className="modal-body">
        {t("submission.submit.processing")}
      </div>
    );

    return (
      <React.Fragment>
        <div className="modal-body">
          <form className="submissionForm" ref="form" onSubmit={(e) => { e.preventDefault() }}>
            <div className="input-group">{ this.renderSourceSelector() }</div>
            <div className="input-group">{ this.renderOutputSelector() }</div>
          </form>
        </div>
        <div className="modal-footer">
          <Link to={"/" + this.submission.input.task} role="button" className="btn btn-danger">
            <FontAwesomeIcon icon={faTimes}/> {t("cancel")}
          </Link>
          <button 
            role="button" className="btn btn-success"
            disabled={ !this.submission.canSubmit() }
            onClick={() => this.submit() }
          >
            <FontAwesomeIcon icon={faPaperPlane}/> {t("submission.submit.submit")}
          </button>
        </div>
      </React.Fragment>
    );
  }

  renderDialog() {
    if(!this.submission.isSubmitted()) {
      return this.renderSubmissionForm();
    }
  }

  render() {
    const { t } = this.props;
    return (
      <ModalView contentLabel="Submission creation" returnUrl={"/" + this.submission.input.task}>
        <div className="modal-header">
          <h5 className="modal-title">
            {t("submission.submit.title")} <strong>{ this.submission.input.id.slice(0, 6) }</strong>
          </h5>
          <Link to={"/" + this.submission.input.task} role="button" className="close" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </Link>
        </div>

        { this.renderDialog() }
      </ModalView>
    );
  }
}

export default translateComponent(SubmissionView);
