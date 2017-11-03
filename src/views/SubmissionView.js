import React, { Component } from 'react';
import ValidationView from './ValidationView';
import FileView from './FileView';
import { Link } from 'react-router-dom';
import ModalView from './ModalView';
import {translateComponent} from "../utils";
import './SubmissionView.css'

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

  renderSourceStatus(output) {
    const { t } = this.props;
    if(!output.isUploaded()) return <p>{t("submission.submit.processing")}</p>;

    return (
      <div className="alert alert-success">
        {t("submission.submit.source ok")}
      </div>
    );
  }

  renderSourceSelector() {
    const { t } = this.props;
    if(!this.submission.hasSource()) {
      return (
        <label className="custom-file">
          <input key="absent" ref="source" name="source" type="file" id="source-file" className="custom-file-input" onChange={(e) => this.submission.setSource(this.refs.source.files[0]) } />
          <span className="custom-file-control" id="source-file-span" />
        </label>
      );
    } else {
      const source = this.submission.getSource();
      return (
        <div key="present" className="card card-outline-primary">
          <div className="card-header">
            <h5 className="modal-subtitle pull-left">{t("submission.submit.source info")}</h5>
            <button key="present" className="btn btn-primary pull-right" role="button" onClick={ () => this.submission.resetSource() }>
              <span aria-hidden="true" className="fa fa-trash" /> {t("submission.submit.change source")}
            </button>
          </div>
          <div className="card-block">
            <FileView file={source.file} />
            { this.renderSourceStatus(source) }
          </div>
        </div>
      );
    }
  }

  renderOutputUploadForm() {
    return (
      <label className="custom-file">
        <input key="absent" ref="output" name="output" type="file" id="output-file" className="custom-file-input" onChange={() => this.submission.setOutput(this.refs.output.files[0])} />
        <span className="custom-file-control" id="output-file-span" />
      </label>
    );
  }

  renderOutputValidation(output) {
    const { t } = this.props;
    if(output.hasErrored()) return <p>{output.error}</p>;
    if(!output.isUploaded()) return <p>{t("submission.submit.processing")}</p>;

    return (
      <ValidationView model={this.model} result={output.data.validation} />
    );
  }

  renderOutputInfo() {
    const { t } = this.props;
    const output = this.submission.getOutput();

    return (
      <div key="present" className="card card-outline-primary">
        <div className="card-header">
          <h5 className="modal-subtitle pull-left">{t("submission.submit.output info")}</h5>
          <button key="present" className="btn btn-primary pull-right" role="button" onClick={ () => this.submission.resetOutput() }>
            <span aria-hidden="true" className="fa fa-trash" /> {t("submission.submit.change output")}
          </button>
        </div>
        <div className="card-block">
          <FileView file={output.file} />
          { this.renderOutputValidation(output) }
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

  renderSubmissionForm() {
    const { t } = this.props;
    if(this.submission.isSubmitting()) return <p>{t("submission.submit.processing")}</p>;

    return (
      <div>
        <div className="modal-body submission-modal-body">
          <form className="submissionForm" ref="form" onSubmit={(e) => { e.preventDefault() }}>
            <div className="form-group">{ this.renderSourceSelector() }</div>
            <div className="form-group">{ this.renderOutputSelector() }</div>
          </form>
        </div>
        <div className="modal-footer">
          <Link to={"/" + this.submission.input.task} role="button" className="btn btn-danger">
            <span aria-hidden="true" className="fa fa-times" /> {t("cancel")}
          </Link>
          <button role="button" className="btn btn-success"
                  disabled={ !this.submission.canSubmit() }
                  onClick={() => { this.submission.submit().then(() => {
                    const taskName = this.submission.data.task;
                    const id = this.submission.data.id;
                    this.props.history.push("/" + taskName + "/submission/" + id);
                  })}}>
            <span aria-hidden="true" className="fa fa-paper-plane" /> {t("submission.submit.submit")}
          </button>
        </div>
      </div>
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
          <h5 className="modal-title submission-modal-title">
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
